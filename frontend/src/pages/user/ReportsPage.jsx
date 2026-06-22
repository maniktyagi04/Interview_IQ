import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Clock, CheckCircle, XCircle, ChevronRight, AlertCircle } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

const statusConfig = {
  APPROVED: { label: 'Approved', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  REJECTED: { label: 'Rejected', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  PENDING_REVIEW: { label: 'Pending Review', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
};

export default function ReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/interviews/reports');
        setReports(res.data);
      } catch (err) {
        console.error('Failed to fetch reports:', err);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">My Reports</h1>
          <p className="text-slate-400 text-sm mt-1">Only approved reports are shown here. Pending reports await admin review.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="font-semibold text-white mb-2">No approved reports yet</h2>
            <p className="text-sm text-slate-500 mb-6 max-w-sm">Complete a mock interview and wait for admin approval to see your reports here.</p>
            <Link to="/interview/setup" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity">
              Start an Interview
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((interview) => {
              const cfg = statusConfig['APPROVED'];
              const score = interview.report?.aiScore || 0;
              const scoreColor = score >= 7 ? 'text-emerald-400' : score >= 5 ? 'text-amber-400' : 'text-red-400';
              return (
                <Link
                  key={interview.id}
                  to={`/reports/${interview.id}`}
                  id={`report-${interview.id}`}
                  className="flex items-center gap-5 p-5 rounded-2xl bg-white/3 border border-white/6 hover:border-white/12 hover:bg-white/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-blue-600/30 border border-violet-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-violet-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{interview.domain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${
                        interview.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                        interview.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
                        'bg-red-500/10 border-red-500/25 text-red-400'
                      }`}>{interview.difficulty}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{new Date(interview.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-2xl font-bold font-display ${scoreColor}`}>{score.toFixed(1)}</div>
                    <div className="text-xs text-slate-600">/ 10</div>
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full ${cfg.bg} border ${cfg.border}`}>
                    <cfg.icon className={`w-3.5 h-3.5 ${cfg.color}`} />
                    <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
