import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, Award, AlertCircle, Calendar, ShieldCheck, Sparkles, BookOpen } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

export default function ProgressAnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics/progress');
      setAnalyticsData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load progress analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center h-64 space-y-3">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Processing performance data...</p>
        </div>
      </UserLayout>
    );
  }

  if (error) {
    return (
      <UserLayout>
        <div className="max-w-md mx-auto text-center py-12 bg-red-500/10 border border-red-500/25 rounded-2xl p-6">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <h3 className="text-white font-bold">Analytics Unreachable</h3>
          <p className="text-xs text-slate-400 mt-1 mb-4">{error}</p>
          <button onClick={fetchAnalytics} className="px-4 py-2 bg-violet-600 rounded-xl text-white text-xs font-semibold hover:bg-violet-700">
            Retry Loading
          </button>
        </div>
      </UserLayout>
    );
  }

  if (!analyticsData || !analyticsData.hasData) {
    return (
      <UserLayout>
        <div className="max-w-lg mx-auto text-center py-20 bg-white/4 border border-white/8 rounded-3xl p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">No Interview Analytics Found</h1>
          <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-6">
            Long-term performance tracking activates automatically after you complete and get approval on your mock interviews.
          </p>
          <button
            onClick={() => window.location.href = '/interview/setup'}
            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-xs hover:opacity-90 transition-opacity"
          >
            Start Your First Interview
          </button>
        </div>
      </UserLayout>
    );
  }

  const { growth, monthlyPerformance, domainPerformance, bestDomain, weakestDomain } = analyticsData;

  // Format date helper
  const formatXAxisDate = (tickItem) => {
    return new Date(tickItem).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const formatTooltipDate = (value) => {
    return new Date(value).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <UserLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Banner */}
        <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-white/8 bg-gradient-to-r from-violet-900/40 via-blue-900/30 to-slate-900/40 backdrop-blur-md">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <TrendingUp className="w-3.5 h-3.5" /> Performance Analytics
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">Interview Growth Board</h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Track improvement across domains, follow-ups, and core assessments including technical ability, communication, and confidence.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-violet-600/10 to-transparent pointer-events-none" />
        </div>

        {/* Highlights Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Growth Cards */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Interviews Completed</span>
              <p className="text-3xl font-black font-display text-white">{growth.length}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
          </div>

          {/* Best Domain */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Best Performing Domain</span>
              <p className="text-sm font-bold text-white truncate max-w-[200px]">
                {bestDomain ? bestDomain.domain : 'N/A'}
              </p>
              {bestDomain && (
                <p className="text-xs text-emerald-400 font-semibold">{bestDomain.score.toFixed(1)} / 10 Avg</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
          </div>

          {/* Weakest Domain */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
            <div className="space-y-1">
              <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Weakest Domain</span>
              <p className="text-sm font-bold text-white truncate max-w-[200px]">
                {weakestDomain ? weakestDomain.domain : 'N/A'}
              </p>
              {weakestDomain && (
                <p className="text-xs text-red-400 font-semibold">{weakestDomain.score.toFixed(1)} / 10 Avg</p>
              )}
            </div>
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Charts Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Chart 1: Overall growth over time (Line Chart) */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 backdrop-blur-md">
            <div>
              <h3 className="font-bold text-white">Score Growth Over Time</h3>
              <p className="text-xs text-slate-500">A detailed chronological view of interview metrics</p>
            </div>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" tickFormatter={formatXAxisDate} stroke="#64748b" />
                  <YAxis domain={[0, 10]} stroke="#64748b" />
                  <Tooltip
                    labelFormatter={formatTooltipDate}
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  />
                  <Legend verticalAlign="top" height={36} />
                  <Line type="monotone" dataKey="overallScore" name="Overall" stroke="#7c3aed" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="technicalScore" name="Technical" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="communicationScore" name="Comms" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="confidenceScore" name="Confidence" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Domain-wise performance (Bar Chart) */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 backdrop-blur-md">
            <div>
              <h3 className="font-bold text-white">Domain Breakdown Performance</h3>
              <p className="text-xs text-slate-500">Average assessment scores across tech categories</p>
            </div>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={domainPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="domain" stroke="#64748b" tickFormatter={(v) => v.split(' ')[0]} />
                  <YAxis domain={[0, 10]} stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Bar dataKey="overallScore" name="Overall" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="technicalScore" name="Technical" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="communicationScore" name="Comms" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Monthly Performance (Area Chart) */}
          <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 lg:col-span-2 backdrop-blur-md">
            <div>
              <h3 className="font-bold text-white">Monthly Growth Trends</h3>
              <p className="text-xs text-slate-500">Your average score performance grouped by month</p>
            </div>
            <div className="h-80 w-full text-xs">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorOverall" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="month" stroke="#64748b" />
                  <YAxis domain={[0, 10]} stroke="#64748b" />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                  <Legend verticalAlign="top" height={36} />
                  <Area type="monotone" dataKey="overallScore" name="Average Overall Score" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorOverall)" />
                  <Line type="monotone" dataKey="technicalScore" name="Technical Avg" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="communicationScore" name="Comms Avg" stroke="#10b981" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
