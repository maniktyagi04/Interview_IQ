import React, { useEffect, useState } from 'react';
import { Shield, ShieldOff, Trash2, Activity, Search, AlertCircle } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get('/admin/users');
        setUsers(res.data);
      } catch (err) {
        console.error('Failed to fetch users:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleBlock = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/block`);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'BLOCKED' } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnblock = async (id) => {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/unblock`);
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, status: 'ACTIVE' } : u));
    } catch (err) {
      setError(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setActionLoading(id);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">User Management</h1>
          <p className="text-slate-400 text-sm mt-1">View, block, or delete registered users.</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4" />{error}
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="admin-user-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/3 border border-white/8 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/40"
          />
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="bg-white/3 border border-white/6 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/6">
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">User</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Role</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-left px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Joined</th>
                    <th className="text-right px-5 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/4">
                  {filtered.map((u) => (
                    <tr key={u.id} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white">{u.name}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${u.role === 'ADMIN' ? 'bg-violet-500/15 text-violet-400 border-violet-500/25' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${u.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== 'ADMIN' && (
                            <>
                              {u.status === 'ACTIVE' ? (
                                <button
                                  id={`block-user-${u.id}`}
                                  onClick={() => handleBlock(u.id)}
                                  disabled={actionLoading === u.id}
                                  className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-40"
                                  title="Block user"
                                >
                                  <ShieldOff className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  id={`unblock-user-${u.id}`}
                                  onClick={() => handleUnblock(u.id)}
                                  disabled={actionLoading === u.id}
                                  className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-40"
                                  title="Unblock user"
                                >
                                  <Shield className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                id={`delete-user-${u.id}`}
                                onClick={() => handleDelete(u.id, u.name)}
                                disabled={actionLoading === u.id}
                                className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
                                title="Delete user"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-10 text-slate-600 text-sm">No users found.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
