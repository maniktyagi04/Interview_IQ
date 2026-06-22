import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ChevronRight, FileText } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get('/interviews/pending-reviews');
        setReviews(res.data);
      } catch (err) {
        console.error('Failed to fetch reviews:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Pending Reviews</h1>
          <p className="text-slate-400 text-sm mt-1">Review AI-evaluated interview reports and approve or reject them.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : reviews.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
              <Clock className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="font-semibold text-white mb-2">No pending reviews</h2>
            <p className="text-sm text-slate-500">All interviews have been reviewed. Check back later.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((interview) => {
              const score = interview.report?.aiScore || 0;
              const scoreColor = score >= 7 ? 'text-emerald-400' : score >= 5 ? 'text-amber-400' : 'text-red-400';
              return (
                <Link
                  key={interview.id}
                  to={`/admin/reviews/${interview.id}`}
                  id={`pending-review-${interview.id}`}
                  className="flex items-center gap-5 p-5 rounded-2xl bg-white/3 border border-white/6 hover:border-white/12 hover:bg-white/5 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-white">{interview.domain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                        interview.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' :
                        interview.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/25 text-amber-400' :
                        'bg-red-500/10 border-red-500/25 text-red-400'
                      }`}>{interview.difficulty}</span>
                      <span className="text-xs text-slate-600">·</span>
                      <span className="text-xs text-slate-500">{interview.user?.name} ({interview.user?.email})</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={`text-xl font-bold font-display ${scoreColor}`}>{score.toFixed(1)}</div>
                    <div className="text-xs text-slate-600">AI Score</div>
                  </div>
                  <div className="text-xs text-slate-500 shrink-0">
                    {new Date(interview.submittedAt).toLocaleDateString()}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
