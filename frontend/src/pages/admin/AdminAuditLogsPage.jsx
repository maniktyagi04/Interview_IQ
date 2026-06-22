import React, { useState, useEffect } from 'react';
import { ShieldAlert, Search, Filter, Calendar, Clock, RefreshCw } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filtering & Search states
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchLogs = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError('');
      
      const params = {
        page: currentPage,
        limit: 15,
        search,
        action,
        startDate,
        endDate,
      };

      const res = await api.get('/admin/audit-logs', { params });
      setLogs(res.data.logs);
      setTotal(res.data.total);
      setPage(res.data.page);
      setTotalPages(res.data.totalPages);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch admin audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [action, startDate, endDate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setAction('');
    setStartDate('');
    setEndDate('');
    // Trigger reloading via states
    setTimeout(() => fetchLogs(1), 50);
  };

  // Helper to color-badge different actions
  const getActionBadgeColor = (actionType) => {
    switch (actionType) {
      case 'USER_BLOCKED':
        return 'bg-red-500/10 border-red-500/25 text-red-400';
      case 'USER_UNBLOCKED':
        return 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400';
      case 'USER_DELETED':
        return 'bg-rose-500/10 border-rose-500/25 text-rose-400';
      case 'QUESTION_CREATED':
        return 'bg-blue-500/10 border-blue-500/25 text-blue-400';
      case 'QUESTION_UPDATED':
        return 'bg-amber-500/10 border-amber-500/25 text-amber-400';
      case 'QUESTION_DELETED':
        return 'bg-orange-500/10 border-orange-500/25 text-orange-400';
      case 'REPORT_APPROVED':
        return 'bg-teal-500/10 border-teal-500/25 text-teal-400';
      case 'REPORT_REJECTED':
        return 'bg-red-500/10 border-red-500/25 text-red-400';
      default:
        return 'bg-slate-500/10 border-slate-500/25 text-slate-400';
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page Banner */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl border border-white/8 bg-white/3 backdrop-blur-md">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display text-white flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-violet-400" /> Platform Audit Trail
            </h1>
            <p className="text-xs text-slate-500">Track and monitor all administrative adjustments and moderator timeline events</p>
          </div>
          <button
            onClick={() => fetchLogs(page)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white hover:bg-white/8 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload logs
          </button>
        </div>

        {/* Filters Matrix */}
        <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4 backdrop-blur-md">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search description, admin..."
                className="w-full pl-9 pr-4 py-2 bg-white/3 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500/40"
              />
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            </div>

            {/* Action Dropdown */}
            <div className="relative">
              <select
                value={action}
                onChange={(e) => setAction(e.target.value)}
                className="w-full pl-3 pr-4 py-2 bg-white/3 border border-white/10 rounded-xl text-xs text-slate-400 focus:outline-none focus:border-violet-500/40 appearance-none"
              >
                <option value="">All Actions</option>
                <option value="QUESTION_CREATED">Question Created</option>
                <option value="QUESTION_UPDATED">Question Updated</option>
                <option value="QUESTION_DELETED">Question Deleted</option>
                <option value="USER_BLOCKED">User Blocked</option>
                <option value="USER_UNBLOCKED">User Unblocked</option>
                <option value="USER_DELETED">User Deleted</option>
                <option value="REPORT_APPROVED">Report Approved</option>
                <option value="REPORT_REJECTED">Report Rejected</option>
              </select>
              <Filter className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3 pointer-events-none" />
            </div>

            {/* Start Date */}
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="From Date"
                className="w-full px-3 py-2 bg-white/3 border border-white/10 rounded-xl text-xs text-slate-400 focus:outline-none focus:border-violet-500/40"
              />
            </div>

            {/* End Date + Reset */}
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="To Date"
                className="w-full px-3 py-2 bg-white/3 border border-white/10 rounded-xl text-xs text-slate-400 focus:outline-none focus:border-violet-500/40"
              />
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-slate-300 hover:bg-white/8 shrink-0"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Logs Timeline */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white/3 border border-white/6 rounded-2xl p-12 text-center text-slate-500 text-xs italic">
            No administrative audit logs match the filters.
          </div>
        ) : (
          <div className="bg-white/4 border border-white/8 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                    <th className="px-6 py-4">Action</th>
                    <th className="px-6 py-4">Admin</th>
                    <th className="px-6 py-4">Description</th>
                    <th className="px-6 py-4">Entity Type/ID</th>
                    <th className="px-6 py-4">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {logs.map((log) => (
                    <tr key={log.id} className="text-xs text-slate-300 hover:bg-white/1 transition-all">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getActionBadgeColor(log.action)}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.admin?.name || 'Admin'}</div>
                        <div className="text-[10px] text-slate-500">{log.admin?.email}</div>
                      </td>
                      <td className="px-6 py-4 leading-relaxed font-medium text-slate-200">
                        {log.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[10px] font-mono text-slate-500">
                        <div>{log.entityType}</div>
                        <div className="truncate max-w-[120px]">{log.entityId || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-400">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-600" />
                          {new Date(log.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-white/5 bg-white/1">
                <div className="text-[10px] text-slate-500 font-bold uppercase">
                  Showing {(page - 1) * 15 + 1} - {Math.min(page * 15, total)} of {total} events
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={page === 1}
                    onClick={() => fetchLogs(page - 1)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50 hover:bg-white/8 transition-all"
                  >
                    Previous
                  </button>
                  <button
                    disabled={page === totalPages}
                    onClick={() => fetchLogs(page + 1)}
                    className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white disabled:opacity-50 hover:bg-white/8 transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
