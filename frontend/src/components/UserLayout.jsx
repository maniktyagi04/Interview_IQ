import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Brain, LayoutDashboard, Play, FileText, FileSearch,
  BookOpen, User, LogOut, ChevronRight, Menu, Sparkles, TrendingUp, Code
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Play, label: 'Mock Interview', path: '/interview/setup' },
  { icon: FileText, label: 'My Reports', path: '/reports' },
  { icon: FileSearch, label: 'Resume Analyzer', path: '/resume' },
  { icon: Sparkles, label: 'Job JD Matcher', path: '/job-match' },
  { icon: Code, label: 'Coding Assessment', path: '/coding' },
  { icon: TrendingUp, label: 'Progress Board', path: '/analytics' },
  { icon: BookOpen, label: 'Notes', path: '/notes' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export default function UserLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  
  const dropdownRef = useRef(null);
  const sidebarRef = useRef(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Close dropdown and sidebar when clicking outside or scrolling
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target) && !event.target.closest('#hamburger-btn')) {
        setSidebarOpen(false);
      }
    }

    function handleScroll() {
      if (sidebarOpen) {
        setSidebarOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, [sidebarOpen]);

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#030712] text-white flex flex-col">
      {/* Top Header Bar */}
      <header className="bg-white/2 border-b border-white/6 px-4 md:px-6 py-3.5 flex items-center justify-between sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Hamburger button (3 lines) */}
          <button
            id="hamburger-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 rounded-xl bg-white/3 border border-white/6 hover:bg-white/6 text-slate-300 hover:text-white transition-all shrink-0 cursor-pointer"
            title="Toggle Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Logo / Branding */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-600 flex items-center justify-center shrink-0">
              <Brain className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold font-display text-base md:text-lg tracking-tight hidden xs:inline-block">InterviewIQ</span>
          </div>
        </div>

        {/* Right side: Welcome greeting & Profile dropdown */}
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          {/* Welcome Message */}
          <span className="text-sm font-medium text-slate-400 hidden sm:inline-block">
            Welcome back, <strong className="text-white font-semibold">{user?.name?.split(' ')[0]}</strong> 👋
          </span>

          {/* Profile Dropdown Trigger */}
          <button
            id="header-profile-btn"
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-2.5 p-1 pr-2.5 rounded-full bg-white/3 border border-white/6 hover:bg-white/6 transition-all cursor-pointer"
          >
            {user?.profileImage ? (
              <img src={`http://localhost:5001${user.profileImage}`} alt="Avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-xs font-black">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-300 max-w-[100px] truncate hidden md:inline-block">
              {user?.name}
            </span>
          </button>

          {/* Dropdown Menu */}
          {profileDropdownOpen && (
            <div className="absolute right-0 top-11 bg-[#090d16] border border-white/10 rounded-2xl p-1.5 shadow-2xl w-48 text-left z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-white/4 mb-1">
                <p className="text-xs text-slate-400 truncate">Logged in as</p>
                <p className="text-xs font-semibold text-white truncate">{user?.email}</p>
              </div>
              
              <Link
                to="/profile"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/4 rounded-xl transition-all"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <User className="w-3.5 h-3.5 text-slate-500" />
                My Profile
              </Link>
              <Link
                to="/reports"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/4 rounded-xl transition-all"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                My Reports
              </Link>
              <Link
                to="/notes"
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/4 rounded-xl transition-all"
                onClick={() => setProfileDropdownOpen(false)}
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                Notes
              </Link>
              
              <div className="h-px bg-white/6 my-1.5" />
              
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-left cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Sidebar Drawer (Floating on top of main content without backdrop overlay) */}
      <aside
        ref={sidebarRef}
        className={`fixed left-0 top-[61px] bottom-0 w-64 bg-[#080c16] border-r border-white/6 flex flex-col transition-transform duration-300 ease-out z-40 shadow-2xl ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation Links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || (item.path !== '/dashboard' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? 'bg-gradient-to-r from-violet-600/20 to-blue-600/10 text-white border border-violet-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-white/4'
                }`}
              >
                <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-violet-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-violet-400" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer block (Quick Sign out) */}
        <div className="px-3 py-4 border-t border-white/6 bg-white/1">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/5 transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
