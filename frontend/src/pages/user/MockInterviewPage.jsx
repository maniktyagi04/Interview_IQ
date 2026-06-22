import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Send, Clock, CheckCircle2, AlertCircle, ArrowRight, MessageSquare, Award, Sparkles } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

export default function MockInterviewPage() {
  const { interviewId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [interviewData, setInterviewData] = useState(location.state?.interviewData || null);
  
  // Wizard state variables
  const [currentIdx, setCurrentIdx] = useState(0);
  const [step, setStep] = useState('MAIN_QUESTION'); // 'MAIN_QUESTION' | 'GENERATING_FOLLOWUP' | 'FOLLOWUP' | 'SUBMITTING_FOLLOWUP' | 'QUESTION_EVALUATION'
  
  const [mainAnswer, setMainAnswer] = useState('');
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState('');
  const [activeAnswerId, setActiveAnswerId] = useState('');
  const [questionScores, setQuestionScores] = useState(null); // { score, technicalScore, depthScore, communicationScore, confidenceScore, feedback }
  
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Fetch interview details if state is not available (e.g. page refresh)
  useEffect(() => {
    if (!interviewData) {
      const fetchInterview = async () => {
        try {
          // If we had a detail route for pending interviews, we could call it here.
          // Since we can retrieve domain/difficulty from query, we'll try to fallback.
          const res = await api.get(`/interviews/reports/detail/${interviewId}`);
          setInterviewData({
            domain: res.data.domain,
            difficulty: res.data.difficulty,
            questions: res.data.answers.map(a => a.question),
          });
        } catch (err) {
          setError('Failed to load interview context. Please restart.');
        }
      };
      fetchInterview();
    }
  }, [interviewId, interviewData]);

  if (!interviewData || !interviewData.questions) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Preparing interview session...</p>
        </div>
      </UserLayout>
    );
  }

  const questions = interviewData.questions;
  const total = questions.length;
  const currentQuestion = questions[currentIdx];

  // 1. Submit main question answer and retrieve contextual follow-up
  const handleGenerateFollowUp = async () => {
    if (!mainAnswer.trim()) {
      setError('Please provide an answer to the main question.');
      return;
    }
    setError('');
    setStep('GENERATING_FOLLOWUP');
    try {
      const res = await api.post(`/interviews/${interviewId}/questions/${currentQuestion.id}/answer`, {
        answer: mainAnswer,
      });
      setActiveAnswerId(res.data.answerId);
      setFollowUpQuestion(res.data.followUpQuestion);
      setStep('FOLLOWUP');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate follow-up question. Please retry.');
      setStep('MAIN_QUESTION');
    }
  };

  // 2. Submit follow-up response and get step performance evaluation
  const handleSubmitFollowUp = async () => {
    if (!followUpAnswer.trim()) {
      setError('Please provide an answer to the follow-up question.');
      return;
    }
    setError('');
    setStep('SUBMITTING_FOLLOWUP');
    try {
      const res = await api.post(`/interviews/${interviewId}/answers/${activeAnswerId}/followup`, {
        followUpAnswer,
      });
      setQuestionScores(res.data.evaluation);
      setStep('QUESTION_EVALUATION');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit follow-up response. Please retry.');
      setStep('FOLLOWUP');
    }
  };

  // 3. Progress to the next question or final submission
  const handleNext = () => {
    if (currentIdx + 1 < total) {
      setCurrentIdx(currentIdx + 1);
      setMainAnswer('');
      setFollowUpAnswer('');
      setFollowUpQuestion('');
      setActiveAnswerId('');
      setQuestionScores(null);
      setStep('MAIN_QUESTION');
    } else {
      handleFinalSubmission();
    }
  };

  // 4. Compile final aggregated interview report
  const handleFinalSubmission = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/interviews/${interviewId}/submit-interactive`);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to complete interview submission.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <UserLayout>
        <div className="max-w-lg mx-auto text-center py-20">
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold font-display text-white mb-3">Interview Completed!</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your interactive answers and AI evaluations have been aggregated. A detailed report is compiled and submitted to the admin for review. Once approved, it will appear in your reports.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/reports')}
              className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              View My Reports
            </button>
            <button
              onClick={() => navigate('/interview/setup')}
              className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-semibold text-sm hover:bg-white/8 transition-all"
            >
              Take Another Interview
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  // Progress computation
  const percentComplete = Math.round((currentIdx / total) * 100);

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">{interviewData.domain}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
                interviewData.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                interviewData.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
                'bg-red-500/10 border-red-500/25 text-red-400'
              }`}>
                {interviewData.difficulty}
              </span>
              <span className="text-sm text-slate-500">Question {currentIdx + 1} of {total}</span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold font-display text-white">{currentIdx}<span className="text-slate-600 text-lg">/{total}</span></div>
            <div className="text-xs text-slate-500">completed</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${percentComplete}%` }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Wizard Interface Card */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md">
          {/* Main Question details */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-400">
              <Sparkles className="w-3.5 h-3.5" />
              Primary Challenge
            </div>
            <h2 className="text-xl font-bold text-white leading-snug">{currentQuestion.title}</h2>
            <p className="text-slate-400 text-sm leading-relaxed">{currentQuestion.description}</p>
          </div>

          <hr className="border-white/5" />

          {/* Flow Steps */}
          {step === 'MAIN_QUESTION' && (
            <div className="space-y-4">
              <label htmlFor="mainAnswer" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Answer</label>
              <textarea
                id="mainAnswer"
                value={mainAnswer}
                onChange={(e) => setMainAnswer(e.target.value)}
                placeholder="Describe your solution in detail. Mention framework methodologies, real-world examples, and trade-offs..."
                rows={6}
                className="w-full p-4 bg-white/3 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 resize-none transition-all"
              />
              <button
                onClick={handleGenerateFollowUp}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-95 transition-opacity"
              >
                Generate AI Follow-up
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {step === 'GENERATING_FOLLOWUP' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                <MessageSquare className="w-5 h-5 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-white">AI is evaluating your answer...</h3>
                <p className="text-slate-500 text-xs mt-1">Formulating a customized contextual follow-up question</p>
              </div>
            </div>
          )}

          {step === 'FOLLOWUP' && (
            <div className="space-y-5 animate-fade-in">
              {/* Previous Answer context summary */}
              <div className="p-4 bg-white/2 rounded-xl border border-white/5 text-xs text-slate-400 italic">
                <span className="font-bold text-slate-300 not-italic block mb-1">Your Initial Answer:</span>
                "{mainAnswer.length > 200 ? mainAnswer.substring(0, 200) + '...' : mainAnswer}"
              </div>

              {/* Contextual Follow-up question bubble */}
              <div className="bg-violet-600/10 border border-violet-500/20 p-5 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-400 uppercase tracking-wider">
                  <MessageSquare className="w-3.5 h-3.5" />
                  AI Follow-up Question
                </div>
                <p className="text-sm font-semibold text-white leading-relaxed">{followUpQuestion}</p>
              </div>

              <div className="space-y-4">
                <label htmlFor="followUpAnswer" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Follow-up Answer</label>
                <textarea
                  id="followUpAnswer"
                  value={followUpAnswer}
                  onChange={(e) => setFollowUpAnswer(e.target.value)}
                  placeholder="Address the follow-up scenario. Provide core explanations, architectures, or handle the edge cases described..."
                  rows={5}
                  className="w-full p-4 bg-white/3 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 resize-none transition-all"
                />
                <button
                  onClick={handleSubmitFollowUp}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-95 transition-opacity"
                >
                  Submit Response
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 'SUBMITTING_FOLLOWUP' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="relative w-12 h-12 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-violet-500/20 border-t-violet-500 animate-spin" />
                <Award className="w-5 h-5 text-violet-400 animate-pulse" />
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-white">Aggregating Q&A scoring metrics...</h3>
                <p className="text-slate-500 text-xs mt-1">Analyzing accuracy, depth, and confidence</p>
              </div>
            </div>
          )}

          {step === 'QUESTION_EVALUATION' && questionScores && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-xl">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-sm">Response Evaluated successfully!</span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Excellent. The AI evaluated your combined response metrics. You can review the score elements below:
                </p>
              </div>

              {/* Performance Scores Matrix */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white/3 border border-white/5 rounded-xl text-center">
                  <div className="text-2xl font-bold font-display text-white">{questionScores.technicalScore}/10</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mt-1">Technical</div>
                </div>
                <div className="p-4 bg-white/3 border border-white/5 rounded-xl text-center">
                  <div className="text-2xl font-bold font-display text-white">{questionScores.depthScore}/10</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mt-1">Depth</div>
                </div>
                <div className="p-4 bg-white/3 border border-white/5 rounded-xl text-center">
                  <div className="text-2xl font-bold font-display text-white">{questionScores.communicationScore}/10</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mt-1">Comms</div>
                </div>
                <div className="p-4 bg-white/3 border border-white/5 rounded-xl text-center">
                  <div className="text-2xl font-bold font-display text-white">{questionScores.confidenceScore}/10</div>
                  <div className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider mt-1">Confidence</div>
                </div>
              </div>

              {/* AI Feedback */}
              <div className="bg-white/2 border border-white/5 p-5 rounded-xl space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Evaluation Feedback</span>
                <p className="text-sm text-slate-300 leading-relaxed">{questionScores.feedback}</p>
              </div>

              {/* Action buttons */}
              <button
                onClick={handleNext}
                disabled={submitting}
                className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-bold hover:opacity-95 transition-opacity"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Compiling Interview Report...
                  </>
                ) : (
                  <>
                    {currentIdx + 1 < total ? 'Continue to Next Question' : 'Compile Final Interview Report'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </UserLayout>
  );
}
