import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Brain, LayoutDashboard, Users, FileQuestion, ClipboardList, LogOut, Menu, X, ChevronRight, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin' },
  { icon: Users, label: 'Manage Users', path: '/admin/users' },
  { icon: FileQuestion, label: 'Questions', path: '/admin/questions' },
  { icon: ClipboardList, label: 'Pending Reviews', path: '/admin/reviews' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#030712] text-white flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-[#0a0e1a] border-r border-white/6 fixed h-full z-20">
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/6">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-bold font-display text-lg tracking-tight block leading-none">InterviewIQ</span>
            <span className="text-xs text-violet-400 flex items-center gap-1"><Shield className="w-2.5 h-2.5" />Admin</span>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active ? 'bg-violet-600/20 text-white border border-violet-500/20' : 'text-slate-400 hover:text-white hover:bg-white/4'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-white/6">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/3 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-violet-400">Administrator</p>
            </div>
          </div>
          <button
            id="admin-sidebar-logout"
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-60 bg-[#0a0e1a] border-r border-white/8 flex flex-col">
            <div className="flex items-center justify-between px-5 py-5 border-b border-white/6">
              <span className="font-bold font-display text-lg">Admin Panel</span>
              <button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${active ? 'bg-violet-600/20 text-white' : 'text-slate-400'}`}
                  >
                    <item.icon className="w-4 h-4" />{item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      <main className="flex-1 md:ml-60 min-h-screen flex flex-col">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/6">
          <button onClick={() => setSidebarOpen(true)}><Menu className="w-5 h-5 text-slate-400" /></button>
          <span className="font-bold text-sm font-display">Admin Panel</span>
          <div className="w-8" />
        </div>
        <div className="flex-1 p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
