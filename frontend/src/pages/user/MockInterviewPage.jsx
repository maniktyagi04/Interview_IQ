import React, { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

export default function MockInterviewPage() {
  const { interviewId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [interviewData, setInterviewData] = useState(location.state?.interviewData || null);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Initialize empty answers once questions are loaded
  useEffect(() => {
    if (interviewData?.questions) {
      const initial = {};
      interviewData.questions.forEach((q) => {
        initial[q.id] = '';
      });
      setAnswers(initial);
    }
  }, [interviewData]);

  const handleSubmit = async () => {
    // Validate all answered
    const unanswered = Object.values(answers).filter((a) => !a.trim());
    if (unanswered.length > 0) {
      setError(`Please answer all ${interviewData.questions.length} questions before submitting.`);
      return;
    }

    setError('');
    setSubmitting(true);
    try {
      const answersArray = Object.entries(answers).map(([questionId, answer]) => ({
        questionId,
        answer,
      }));

      await api.post('/interviews/submit', {
        interviewId,
        answers: answersArray,
      });

      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Submission failed. Please try again.');
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
          <h1 className="text-2xl font-bold font-display text-white mb-3">Interview Submitted!</h1>
          <p className="text-slate-400 text-sm mb-8 leading-relaxed">
            Your answers are being evaluated by AI. A report will be generated and submitted to the admin for review. Once approved, it will appear in your reports dashboard.
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
              Start Another Interview
            </button>
          </div>
        </div>
      </UserLayout>
    );
  }

  if (!interviewData) {
    return (
      <UserLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </UserLayout>
    );
  }

  const answered = Object.values(answers).filter((a) => a.trim().length > 0).length;
  const total = interviewData.questions?.length || 0;

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
              <span className="text-sm text-slate-500">{total} Questions</span>
            </div>
          </div>
          {/* Progress indicator */}
          <div className="text-right">
            <div className="text-2xl font-bold font-display text-white">{answered}<span className="text-slate-600 text-lg">/{total}</span></div>
            <div className="text-xs text-slate-500">answered</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Questions */}
        <div className="space-y-5">
          {interviewData.questions?.map((q, idx) => {
            const isAnswered = answers[q.id]?.trim().length > 0;
            return (
              <div
                key={q.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isAnswered ? 'bg-violet-500/5 border-violet-500/20' : 'bg-white/3 border-white/6'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                    isAnswered ? 'bg-violet-500 text-white' : 'bg-white/8 text-slate-400'
                  }`}>
                    {isAnswered ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-white">{q.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{q.description}</p>
                  </div>
                </div>

                <textarea
                  id={`answer-${idx + 1}`}
                  value={answers[q.id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  placeholder="Type your detailed answer here. Be thorough — mention concepts, examples, and trade-offs..."
                  rows={5}
                  className="w-full p-4 bg-white/4 border border-white/8 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 resize-none transition-all"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-slate-600">{answers[q.id]?.length || 0} chars</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Submit Button */}
        <button
          id="submit-interview-btn"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl text-white font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Submitting & Evaluating...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Submit Interview
            </>
          )}
        </button>

        <p className="text-center text-xs text-slate-600">
          Your answers will be evaluated by AI, then reviewed by an admin before appearing in your reports.
        </p>
      </div>
    </UserLayout>
  );
}
