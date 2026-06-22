import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle, XCircle, TrendingUp, TrendingDown, Lightbulb, Printer } from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer } from 'recharts';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

const safeJsonParse = (value) => {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
};

export default function ReportDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/interviews/reports/detail/${id}`);
        setInterview(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load report.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <UserLayout>
      <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
    </UserLayout>
  );

  if (error) return (
    <UserLayout>
      <div className="text-center py-20">
        <p className="text-red-400 mb-4">{error}</p>
        <button onClick={() => navigate('/reports')} className="px-4 py-2 bg-white/5 rounded-xl text-sm text-slate-300 hover:bg-white/8">← Back to Reports</button>
      </div>
    </UserLayout>
  );

  const report = interview?.report;
  const score = report?.aiScore || 0;
  const strengths = safeJsonParse(report?.strengths);
  const weaknesses = safeJsonParse(report?.weaknesses);
  const suggestions = safeJsonParse(report?.suggestions);
  const scoreColor = score >= 7 ? '#10b981' : score >= 5 ? '#f59e0b' : '#ef4444';

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button onClick={() => navigate('/reports')} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </button>
          <button
            id="print-report"
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/8 rounded-xl text-sm text-slate-300 hover:bg-white/8 transition-all"
          >
            <Printer className="w-4 h-4" />
            Download / Print
          </button>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold font-display text-white">{interview.domain} — Interview Report</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
              interview.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
              interview.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
              'bg-red-500/10 border-red-500/25 text-red-400'
            }`}>{interview.difficulty}</span>
            <span className="text-xs text-slate-500">{new Date(interview.submittedAt).toLocaleDateString()}</span>
            {report?.approver && <span className="text-xs text-slate-600">Reviewed by {report.approver.name}</span>}
          </div>
        </div>

        {/* Score + Summary */}
        <div className="grid md:grid-cols-3 gap-5">
          {/* Score radial */}
          <div className="bg-white/3 border border-white/6 rounded-2xl p-6 flex flex-col items-center justify-center">
            <div className="relative w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={12} data={[{ value: (score / 10) * 100, fill: scoreColor }]}>
                  <RadialBar dataKey="value" cornerRadius={6} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-white">{score.toFixed(1)}</span>
                <span className="text-xs text-slate-500">/ 10</span>
              </div>
            </div>
            <p className="text-sm font-medium text-white mt-2">Overall Score</p>
          </div>

          {/* Summary */}
          <div className="md:col-span-2 bg-white/3 border border-white/6 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-3">Interview Summary</h2>
            <p className="text-sm text-slate-300 leading-relaxed">{report?.summary || 'No summary available.'}</p>
            {report?.manualFeedback && (
              <div className="mt-4 pt-4 border-t border-white/6">
                <p className="text-xs text-slate-500 mb-1">Admin Feedback</p>
                <p className="text-sm text-violet-300 leading-relaxed">{report.manualFeedback}</p>
              </div>
            )}
          </div>
        </div>

        {/* Strengths + Weaknesses */}
        <div className="grid md:grid-cols-2 gap-5">
          <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <h2 className="font-semibold text-white">Strengths</h2>
            </div>
            <ul className="space-y-2">
              {strengths.length > 0 ? strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{s}</span>
                </li>
              )) : <p className="text-sm text-slate-600">No strengths listed.</p>}
            </ul>
          </div>

          <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-white">Needs Improvement</h2>
            </div>
            <ul className="space-y-2">
              {weaknesses.length > 0 ? weaknesses.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <XCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-slate-300">{w}</span>
                </li>
              )) : <p className="text-sm text-slate-600">No weaknesses listed.</p>}
            </ul>
          </div>
        </div>

        {/* Suggestions */}
        <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-white">Improvement Suggestions</h2>
          </div>
          <ol className="space-y-3">
            {suggestions.length > 0 ? suggestions.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 border border-blue-500/20">{i + 1}</span>
                <span className="text-slate-300 leading-relaxed">{s}</span>
              </li>
            )) : <p className="text-sm text-slate-600">No suggestions available.</p>}
          </ol>
        </div>

        {/* Per-Answer Breakdown */}
        <div className="space-y-4">
          <h2 className="font-semibold text-white">Answer Breakdown</h2>
          {interview.answers?.map((ans, idx) => {
            let feedback = {};
            try { feedback = JSON.parse(ans.feedback || '{}'); } catch {}
            return (
              <div key={ans.id} className="p-5 rounded-2xl bg-white/3 border border-white/6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Q{idx + 1}</p>
                    <p className="font-semibold text-sm text-white">{ans.question?.title}</p>
                  </div>
                  <div className={`shrink-0 text-xl font-bold font-display ${ans.score >= 7 ? 'text-emerald-400' : ans.score >= 5 ? 'text-amber-400' : 'text-red-400'}`}>
                    {ans.score}/10
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                  {feedback.technicalAccuracy && <p className="text-xs text-slate-400"><span className="text-slate-500 font-medium">Technical: </span>{feedback.technicalAccuracy}</p>}
                  {feedback.communicationQuality && <p className="text-xs text-slate-400"><span className="text-slate-500 font-medium">Communication: </span>{feedback.communicationQuality}</p>}
                  {feedback.suggestedImprovements && <p className="text-xs text-slate-400"><span className="text-slate-500 font-medium">Improvement: </span>{feedback.suggestedImprovements}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </UserLayout>
  );
}
