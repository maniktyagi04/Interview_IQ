import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Play, FileText, BarChart2, BookOpen, FileSearch,
  TrendingUp, Clock, CheckCircle, AlertCircle, ArrowRight
} from 'lucide-react';
import { RadialBarChart, RadialBar, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from 'recharts';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const quickActions = [
  { icon: Play, label: 'Start Mock Interview', desc: 'Practice with AI-evaluated questions', path: '/interview/setup', gradient: 'from-violet-600 to-blue-600' },
  { icon: FileSearch, label: 'Analyze Resume', desc: 'Get AI alignment feedback', path: '/resume', gradient: 'from-blue-600 to-cyan-600' },
  { icon: BookOpen, label: 'My Notes', desc: 'Review and add study notes', path: '/notes', gradient: 'from-emerald-600 to-teal-600' },
  { icon: FileText, label: 'View Reports', desc: 'Track all interview attempts', path: '/reports', gradient: 'from-orange-600 to-amber-600' },
];

export default function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/users/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const scoreColor = !stats ? '#8b5cf6' : stats.averageScore >= 7 ? '#10b981' : stats.averageScore >= 5 ? '#f59e0b' : '#ef4444';
  const scoreData = [{ value: stats?.averageScore || 0, fill: scoreColor }];

  return (
    <UserLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Greeting */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">
              Welcome back, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">Track your progress and keep preparing for your dream role.</p>
          </div>
          <Link
            to="/interview/setup"
            id="dashboard-start-interview"
            className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Play className="w-4 h-4" />
            New Interview
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Interviews Done', value: loading ? '...' : stats?.totalInterviews || 0, icon: BarChart2, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Avg Score', value: loading ? '...' : `${stats?.averageScore || 0}/10`, icon: TrendingUp, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Strong Areas', value: loading ? '...' : stats?.strongAreas?.[0] === 'None Yet' ? '—' : stats?.strongAreas?.length || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Needs Work', value: loading ? '...' : stats?.weakAreas?.[0] === 'None Yet' ? '—' : stats?.weakAreas?.length || 0, icon: AlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((s) => (
            <div key={s.label} className="bg-white/3 border border-white/6 rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <s.icon className={`w-4.5 h-4.5 ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-white font-display">{s.value}</div>
              <div className="text-xs text-slate-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Score Gauge + Areas */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Radial Score Chart */}
          <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Overall Performance</h2>
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex items-center gap-6">
                <div className="relative w-36 h-36">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="100%" barSize={12} data={[{ value: (stats?.averageScore / 10) * 100, fill: scoreColor }]}>
                      <RadialBar dataKey="value" cornerRadius={6} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-white">{stats?.averageScore || 0}</span>
                    <span className="text-xs text-slate-500">/ 10</span>
                  </div>
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Strong Areas</p>
                    <div className="flex flex-wrap gap-1">
                      {(stats?.strongAreas || ['None Yet']).map((a) => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">{a}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Needs Work</p>
                    <div className="flex flex-wrap gap-1">
                      {(stats?.weakAreas || ['None Yet']).map((a) => (
                        <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/20">{a}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Progress History Chart */}
          <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Score History</h2>
            {loading || !stats?.progressHistory?.length ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-600">
                {loading ? <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /> : 'Complete your first interview to see progress!'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={stats.progressHistory.map((p, i) => ({ name: `#${i + 1}`, score: p.score }))}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} stroke="#475569" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                  <Area type="monotone" dataKey="score" stroke="#8b5cf6" fill="url(#scoreGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((a) => (
              <Link
                key={a.path}
                to={a.path}
                id={`quick-action-${a.label.toLowerCase().replace(/\s+/g, '-')}`}
                className="group p-5 rounded-2xl bg-white/3 border border-white/6 hover:border-white/12 hover:bg-white/5 transition-all"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${a.gradient} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <a.icon className="w-5 h-5 text-white" />
                </div>
                <p className="font-semibold text-sm text-white mb-1">{a.label}</p>
                <p className="text-xs text-slate-500">{a.desc}</p>
                <ArrowRight className="w-4 h-4 text-slate-600 mt-3 group-hover:text-slate-300 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
