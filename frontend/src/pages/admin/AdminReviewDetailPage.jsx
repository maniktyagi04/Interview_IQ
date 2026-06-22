import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, XCircle, MessageSquare, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const safeJsonParse = (value) => { try { return JSON.parse(value); } catch { return []; } };

export default function AdminReviewDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [manualFeedback, setManualFeedback] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [done, setDone] = useState('');

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        const res = await api.get(`/interviews/reports/detail/${id}`);
        setInterview(res.data);
      } catch (err) {
        console.error('Failed to fetch interview:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [id]);

  const handleApprove = async () => {
    setActionLoading('approve');
    try {
      await api.post(`/interviews/reports/${id}/approve`, { manualFeedback });
      setDone('approved');
    } catch (err) {
      console.error('Approval failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    setActionLoading('reject');
    try {
      await api.post(`/interviews/reports/${id}/reject`, { manualFeedback });
      setDone('rejected');
    } catch (err) {
      console.error('Rejection failed:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) return (
    <AdminLayout>
      <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
    </AdminLayout>
  );

  if (done) return (
    <AdminLayout>
      <div className="max-w-lg mx-auto text-center py-20">
        <div className={`w-20 h-20 rounded-full ${done === 'approved' ? 'bg-emerald-500/15 border-emerald-500/30' : 'bg-red-500/15 border-red-500/30'} border flex items-center justify-center mx-auto mb-6`}>
          {done === 'approved' ? <CheckCircle2 className="w-10 h-10 text-emerald-400" /> : <XCircle className="w-10 h-10 text-red-400" />}
        </div>
        <h1 className="text-xl font-bold text-white mb-3">Report {done === 'approved' ? 'Approved' : 'Rejected'}</h1>
        <p className="text-slate-400 text-sm mb-8">{done === 'approved' ? 'The report is now visible in the user\'s dashboard.' : 'The interview has been rejected and user will not see this report.'}</p>
        <button onClick={() => navigate('/admin/reviews')} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-semibold hover:opacity-90">
          ← Back to Pending Reviews
        </button>
      </div>
    </AdminLayout>
  );

  if (!interview) return null;
  const report = interview.report;
  const score = report?.aiScore || 0;
  const scoreColor = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';
  const strengths = safeJsonParse(report?.strengths);
  const weaknesses = safeJsonParse(report?.weaknesses);
  const suggestions = safeJsonParse(report?.suggestions);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/admin/reviews')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />Back to Reviews
          </button>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">Pending Review</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-white">{interview.domain} Interview</h1>
          <p className="text-slate-400 text-sm mt-1">Submitted by <span className="text-white">{interview.user?.name}</span> ({interview.user?.email}) · {new Date(interview.submittedAt).toLocaleDateString()}</p>
        </div>

        {/* Score + Summary */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-white/3 border border-white/6 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={12} data={[{ value: (score / 10) * 100, fill: scoreColor }]}>
                  <RadialBar dataKey="value" cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{score.toFixed(1)}</span>
                <span className="text-xs text-slate-500">/ 10 AI Score</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-2 bg-white/3 border border-white/6 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">AI Summary</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{report?.summary || 'No summary.'}</p>
          </div>
        </div>

        {/* Strengths + Weaknesses */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white/3 border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><TrendingUp className="w-4 h-4 text-emerald-400" /><h2 className="font-semibold text-white">Strengths</h2></div>
            <ul className="space-y-2">
              {strengths.map((s, i) => <li key={i} className="flex items-start gap-2 text-sm"><CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span className="text-slate-300">{s}</span></li>)}
            </ul>
          </div>
          <div className="bg-white/3 border border-white/6 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3"><TrendingDown className="w-4 h-4 text-amber-400" /><h2 className="font-semibold text-white">Weaknesses</h2></div>
            <ul className="space-y-2">
              {weaknesses.map((w, i) => <li key={i} className="flex items-start gap-2 text-sm"><XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /><span className="text-slate-300">{w}</span></li>)}
            </ul>
          </div>
        </div>

        {/* Answers */}
        <div className="space-y-4">
          <h2 className="font-semibold text-white">Candidate Answers</h2>
          {interview.answers?.map((ans, idx) => {
            let feedback = {}; try { feedback = JSON.parse(ans.feedback || '{}'); } catch {}
            return (
              <div key={ans.id} className="p-5 rounded-2xl bg-white/3 border border-white/6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div><p className="text-xs text-slate-500 mb-1">Q{idx + 1}: {ans.question?.title}</p></div>
                  <span className={`text-lg font-bold font-display shrink-0 ${ans.score >= 7 ? 'text-emerald-400' : ans.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>{ans.score}/10</span>
                </div>
                <div className="p-3 rounded-xl bg-white/2 border border-white/5 mb-3">
                  <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{ans.answer}</p>
                </div>
                {feedback.technicalAccuracy && <p className="text-xs text-slate-500 mt-1"><span className="text-slate-400 font-medium">Technical: </span>{feedback.technicalAccuracy}</p>}
                {feedback.suggestedImprovements && <p className="text-xs text-slate-500 mt-1"><span className="text-slate-400 font-medium">Suggestions: </span>{feedback.suggestedImprovements}</p>}
              </div>
            );
          })}
        </div>

        {/* Admin Manual Feedback + Actions */}
        <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-white">Admin Feedback (Optional)</h2>
          </div>
          <textarea
            id="admin-feedback"
            value={manualFeedback}
            onChange={(e) => setManualFeedback(e.target.value)}
            placeholder="Add personalized feedback for the candidate (optional)..."
            rows={4}
            className="w-full p-4 bg-white/4 border border-white/8 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/40 resize-none mb-4"
          />
          <div className="flex gap-3">
            <button
              id="approve-report-btn"
              onClick={handleApprove}
              disabled={!!actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-40"
            >
              {actionLoading === 'approve' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 className="w-5 h-5" />Approve Report</>}
            </button>
            <button
              id="reject-report-btn"
              onClick={handleReject}
              disabled={!!actionLoading}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-40"
            >
              {actionLoading === 'reject' ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><XCircle className="w-5 h-5" />Reject Report</>}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
