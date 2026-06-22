import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, FileText, Clock, CheckCircle, BarChart2, ArrowRight } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const pieData = stats?.domainCounts
    ? Object.entries(stats.domainCounts).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Platform overview and quick access to review queues.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: loading ? '...' : stats?.totalUsers || 0, icon: Users, color: 'text-violet-400', bg: 'bg-violet-500/10' },
            { label: 'Total Interviews', value: loading ? '...' : stats?.totalInterviews || 0, icon: FileText, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Pending Reviews', value: loading ? '...' : stats?.pendingReviews || 0, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Approved Reports', value: loading ? '...' : stats?.approvedReports || 0, icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
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

        {/* Charts + Quick Links */}
        <div className="grid md:grid-cols-2 gap-5">
          {/* Domain Pie Chart */}
          <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-violet-400" />
              <h2 className="font-semibold text-white">Interviews by Domain</h2>
            </div>
            {loading || pieData.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-600">
                {loading ? <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /> : 'No interview data yet.'}
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {pieData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                      <span className="text-xs text-slate-400 truncate">{d.name}</span>
                      <span className="text-xs text-slate-600 ml-auto">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white/3 border border-white/6 rounded-2xl p-6">
            <h2 className="font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { label: 'Review Pending Interviews', desc: `${loading ? '...' : stats?.pendingReviews || 0} awaiting review`, path: '/admin/reviews', color: 'text-amber-400', bg: 'bg-amber-500/10' },
                { label: 'Manage Users', desc: `${loading ? '...' : stats?.totalUsers || 0} registered users`, path: '/admin/users', color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { label: 'Manage Questions', desc: 'Add, edit, or delete questions', path: '/admin/questions', color: 'text-blue-400', bg: 'bg-blue-500/10' },
              ].map((a) => (
                <Link
                  key={a.path}
                  to={a.path}
                  id={`admin-quick-${a.path.split('/').pop()}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 hover:bg-white/4 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-xl ${a.bg} flex items-center justify-center shrink-0`}>
                    <ArrowRight className={`w-4 h-4 ${a.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{a.label}</p>
                    <p className="text-xs text-slate-500">{a.desc}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 group-hover:translate-x-1 transition-all shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
