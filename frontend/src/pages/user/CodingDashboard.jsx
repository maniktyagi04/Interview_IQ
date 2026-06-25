import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Trophy, Flame, Bookmark, BookmarkCheck, Calendar, Zap, Play, CheckCircle2, 
  Search, SlidersHorizontal, ChevronRight, Timer, AlertCircle, RefreshCw, Star, Info
} from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

const DIFFICULTIES = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};

const STATUS_ICONS = {
  SOLVED: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
  ATTEMPTED: <AlertCircle className="w-4 h-4 text-amber-400" />,
  UNSOLVED: <div className="w-4 h-4 rounded-full border border-slate-600" />
};

export default function CodingDashboard() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [dailyChallenge, setDailyChallenge] = useState(null);
  const [problems, setProblems] = useState([]);
  const [contests, setContests] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [heatmapData, setHeatmapData] = useState([]);
  
  // Dashboard state
  const [activeTab, setActiveTab] = useState('problems'); // problems | contests | leaderboard
  const [loading, setLoading] = useState(true);
  
  // Problems filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterBookmarked, setFilterBookmarked] = useState(false);
  
  // Daily challenge countdown
  const [timeLeft, setTimeLeft] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profileRes, dailyRes, problemsRes, contestsRes, leaderboardRes, heatmapRes] = await Promise.all([
        api.get('/users/profile'),
        api.get('/problems/daily'),
        api.get('/problems'),
        api.get('/contests'),
        api.get('/problems/leaderboard'),
        api.get('/problems/heatmap')
      ]);

      setUserProfile(profileRes.data);
      setDailyChallenge(dailyRes.data);
      setProblems(problemsRes.data);
      setContests(contestsRes.data);
      setLeaderboard(leaderboardRes.data);
      setHeatmapData(heatmapRes.data);
    } catch (err) {
      console.error('Failed to load coding dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Countdown timer for daily challenge
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
      const diff = endOfDay - now;
      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      
      const hours = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
      const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');
      
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle bookmark toggle
  const handleToggleBookmark = async (problemId, e) => {
    e.stopPropagation();
    try {
      const res = await api.post(`/problems/${problemId}/bookmark`);
      setProblems(prev => prev.map(p => {
        if (p.id === problemId) {
          return { ...p, isBookmarked: res.data.bookmarked };
        }
        return p;
      }));
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  // Register for a contest
  const handleRegisterContest = async (contestId) => {
    try {
      await api.post(`/contests/${contestId}/register`);
      setContests(prev => prev.map(c => {
        if (c.id === contestId) {
          return { ...c, isRegistered: true, participantsCount: c.participantsCount + 1 };
        }
        return c;
      }));
    } catch (err) {
      console.error('Registration error:', err);
      alert(err.response?.data?.message || 'Failed to register for contest');
    }
  };

  // Generate date array for activity heatmap
  const renderHeatmap = () => {
    const dates = [];
    const today = new Date();
    
    // Build array of last 365 days
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayData = heatmapData.find(item => item.date === dateStr);
      dates.push({
        date: dateStr,
        count: dayData ? dayData.count : 0
      });
    }

    return (
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto py-2 pr-2 scrollbar-thin">
        {dates.map((day, idx) => {
          let color = 'bg-white/5';
          if (day.count === 1) color = 'bg-emerald-950/70 border border-emerald-900/40';
          else if (day.count === 2) color = 'bg-emerald-800/60 border border-emerald-700/35';
          else if (day.count >= 3 && day.count <= 4) color = 'bg-emerald-600/70';
          else if (day.count >= 5) color = 'bg-emerald-400';

          return (
            <div
              key={idx}
              className={`w-3.5 h-3.5 rounded-sm transition-all duration-300 hover:scale-125 cursor-pointer relative group ${color}`}
              title={`${day.count} submissions on ${new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
            >
              {/* Tooltip */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[#0f172a] border border-white/10 px-2 py-1 rounded text-[10px] text-white whitespace-nowrap z-50 pointer-events-none">
                {day.count} {day.count === 1 ? 'submission' : 'submissions'} on {day.date}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Filter problems based on states
  const filteredProblems = problems.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDifficulty = filterDifficulty === 'All' || p.difficulty === filterDifficulty;
    const matchesStatus = filterStatus === 'All' || p.status === filterStatus;
    const matchesBookmarked = !filterBookmarked || p.isBookmarked;

    return matchesSearch && matchesDifficulty && matchesStatus && matchesBookmarked;
  });

  if (loading) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading Coding Hub...</p>
        </div>
      </UserLayout>
    );
  }

  // Get podium users (top 3)
  const podiumUsers = leaderboard.slice(0, 3);
  const remainingLeaderboard = leaderboard.slice(3);

  return (
    <UserLayout>
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        {/* Hub Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold font-display bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Coding Challenge Hub
            </h1>
            <p className="text-slate-400 text-sm mt-1">Practice coding challenges, master algorithms, and compete in contests.</p>
          </div>
          <button 
            onClick={fetchData} 
            className="flex items-center gap-2 px-3 py-1.5 bg-white/3 border border-white/6 hover:bg-white/5 text-xs text-slate-300 rounded-xl transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Data
          </button>
        </div>

        {/* Daily Challenge Banner */}
        {dailyChallenge && (
          <div className="relative group overflow-hidden rounded-3xl border border-white/6 bg-gradient-to-br from-violet-950/20 via-slate-900/40 to-slate-950/60 p-6 md:p-8 backdrop-blur-md shadow-xl">
            {/* Glowing blur background */}
            <div className="absolute -top-12 -left-12 w-64 h-64 rounded-full bg-violet-600/10 blur-3xl group-hover:bg-violet-600/15 transition-all duration-700" />
            <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-blue-600/10 blur-3xl group-hover:bg-blue-600/15 transition-all duration-700" />

            <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              <div className="space-y-4 max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-extrabold tracking-wider bg-violet-500/15 text-violet-400 border border-violet-500/25 rounded-full uppercase">
                    <Zap className="w-3.5 h-3.5" />
                    Daily Challenge
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DIFFICULTIES[dailyChallenge.problem.difficulty]}`}>
                    {dailyChallenge.problem.difficulty}
                  </span>
                  <span className="text-slate-500 text-xs flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-amber-500" />
                    +{dailyChallenge.points} Points
                  </span>
                  {dailyChallenge.isSolved && (
                    <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" /> Solved
                    </span>
                  )}
                </div>
                
                <div>
                  <h2 className="text-2xl font-bold text-white font-display leading-tight">{dailyChallenge.problem.title}</h2>
                  <p className="text-slate-400 text-sm mt-2 line-clamp-2 leading-relaxed">
                    {dailyChallenge.problem.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {dailyChallenge.problem.tags.map(t => (
                    <span key={t} className="text-xs px-2.5 py-0.5 rounded-lg bg-white/3 border border-white/5 text-slate-400">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action and Timer */}
              <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between w-full lg:w-auto border-t lg:border-t-0 border-white/6 pt-4 lg:pt-0 shrink-0 gap-4">
                <div className="text-left lg:text-right space-y-1">
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Time Remaining</p>
                  <div className="flex items-center gap-2 text-white font-mono text-xl font-bold">
                    <Timer className="w-5 h-5 text-violet-400" />
                    {timeLeft}
                  </div>
                </div>

                <Link
                  to={`/coding/solve/${dailyChallenge.problem.id}`}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-violet-500/10 shrink-0"
                >
                  <Play className="w-4 h-4 fill-white" />
                  Solve Challenge
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Dashboard Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Area (Tabs) */}
          <div className="lg:col-span-8 space-y-6">
            {/* Tab switchers */}
            <div className="flex border-b border-white/6 bg-white/2 p-1.5 rounded-2xl border">
              {[
                { id: 'problems', label: 'Problems' },
                { id: 'contests', label: 'Contest Mode' },
                { id: 'leaderboard', label: 'Leaderboard' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-2.5 text-sm font-bold transition-all rounded-xl ${
                    activeTab === t.id
                      ? 'bg-gradient-to-r from-violet-600/80 to-blue-600/80 text-white shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-white/3'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Contents: Problems */}
            {activeTab === 'problems' && (
              <div className="space-y-6">
                {/* Search & Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white/3 border border-white/6 p-4 rounded-2xl">
                  {/* Search bar */}
                  <div className="relative sm:col-span-6">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search problem title or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-white/8 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
                    />
                  </div>

                  {/* Difficulty Select */}
                  <select
                    value={filterDifficulty}
                    onChange={(e) => setFilterDifficulty(e.target.value)}
                    className="sm:col-span-3 bg-slate-900 border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="All">All Difficulties</option>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>

                  {/* Status Select */}
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="sm:col-span-3 bg-slate-900 border border-white/8 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
                  >
                    <option value="All">All Statuses</option>
                    <option value="SOLVED">Solved</option>
                    <option value="ATTEMPTED">Attempted</option>
                    <option value="UNSOLVED">Unsolved</option>
                  </select>

                  {/* Bookmarked Filter */}
                  <div className="col-span-full flex items-center gap-2 pt-2 border-t border-white/4">
                    <button
                      onClick={() => setFilterBookmarked(!filterBookmarked)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        filterBookmarked
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          : 'bg-transparent text-slate-400 border-white/6 hover:text-white'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${filterBookmarked ? 'fill-amber-400' : ''}`} />
                      Bookmarked Only
                    </button>
                  </div>
                </div>

                {/* Problems Table */}
                <div className="bg-white/3 border border-white/6 rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                      <thead>
                        <tr className="border-b border-white/6 bg-white/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
                          <th className="px-5 py-4 w-10 text-center">Status</th>
                          <th className="px-5 py-4">Title</th>
                          <th className="px-5 py-4 w-28">Difficulty</th>
                          <th className="px-5 py-4">Tags</th>
                          <th className="px-5 py-4 w-24 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/4">
                        {filteredProblems.length > 0 ? (
                          filteredProblems.map(p => (
                            <tr 
                              key={p.id}
                              className="hover:bg-white/2 cursor-pointer transition-colors group"
                              onClick={() => navigate(`/coding/solve/${p.id}`)}
                            >
                              {/* Solve status */}
                              <td className="px-5 py-4 text-center">
                                <div className="flex items-center justify-center">
                                  {STATUS_ICONS[p.status] || STATUS_ICONS.UNSOLVED}
                                </div>
                              </td>

                              {/* Title + Bookmark Toggle */}
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-2.5">
                                  <button
                                    onClick={(e) => handleToggleBookmark(p.id, e)}
                                    className="text-slate-500 hover:text-amber-400 p-0.5 rounded transition-colors shrink-0"
                                  >
                                    <Star className={`w-4 h-4 ${p.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                                  </button>
                                  <span className="font-semibold text-white group-hover:text-violet-400 transition-colors">
                                    {p.title}
                                  </span>
                                </div>
                              </td>

                              {/* Difficulty */}
                              <td className="px-5 py-4">
                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${DIFFICULTIES[p.difficulty]}`}>
                                  {p.difficulty}
                                </span>
                              </td>

                              {/* Tags */}
                              <td className="px-5 py-4 max-w-[200px] truncate">
                                <div className="flex gap-1.5 overflow-hidden">
                                  {p.tags.slice(0, 2).map(tag => (
                                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-white/4 border border-white/5 text-slate-400">
                                      {tag}
                                    </span>
                                  ))}
                                  {p.tags.length > 2 && (
                                    <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                                      +{p.tags.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Action button */}
                              <td className="px-5 py-4 text-right">
                                <button className="inline-flex items-center gap-1 text-xs font-bold text-violet-400 group-hover:text-white transition-colors">
                                  Solve
                                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="5" className="px-5 py-8 text-center text-slate-500 text-sm">
                              No problems found matching filters.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Contents: Contests */}
            {activeTab === 'contests' && (
              <div className="space-y-8">
                {/* Categorized Contests */}
                {['active', 'upcoming', 'past'].map(status => {
                  const statusContests = contests.filter(c => c.status === status);
                  if (statusContests.length === 0) return null;

                  return (
                    <div key={status} className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          status === 'active' ? 'bg-red-500 animate-ping' : 
                          status === 'upcoming' ? 'bg-violet-500' : 'bg-slate-600'
                        }`} />
                        {status} contests
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {statusContests.map(c => (
                          <div 
                            key={c.id} 
                            className="bg-white/3 border border-white/6 hover:border-white/12 p-5 rounded-2xl space-y-4 flex flex-col justify-between backdrop-blur-sm"
                          >
                            <div className="space-y-2">
                              <h4 className="text-lg font-bold text-white leading-tight font-display">{c.title}</h4>
                              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">{c.description}</p>
                              
                              <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-500 font-mono">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(c.startTime).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>

                            <div className="border-t border-white/4 pt-4 flex items-center justify-between mt-auto">
                              <span className="text-[11px] text-slate-400 font-medium">
                                {c.participantsCount} competitors registered
                              </span>

                              {status === 'active' ? (
                                <Link 
                                  to={`/coding/solve/${c.problems?.[0]?.problemId || 'default'}?contestId=${c.id}`}
                                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-xs font-bold text-white rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1.5"
                                >
                                  <Play className="w-3 h-3 fill-white" />
                                  Enter Contest
                                </Link>
                              ) : status === 'upcoming' ? (
                                <button
                                  onClick={() => handleRegisterContest(c.id)}
                                  disabled={c.isRegistered}
                                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                                    c.isRegistered
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 cursor-default'
                                      : 'bg-white text-slate-950 hover:bg-slate-200'
                                  }`}
                                >
                                  {c.isRegistered ? '✓ Registered' : 'Register Now'}
                                </button>
                              ) : (
                                <button 
                                  onClick={() => {
                                    alert('Past contest leaderboard matches general results');
                                  }}
                                  className="px-4 py-2 bg-white/5 border border-white/8 hover:bg-white/8 text-xs font-bold text-slate-300 rounded-xl transition-all"
                                >
                                  View Scoreboard
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tab Contents: Leaderboard */}
            {activeTab === 'leaderboard' && (
              <div className="space-y-8 animate-fadeIn">
                {/* Visual Podium for Top 3 */}
                <div className="grid grid-cols-3 gap-3 md:gap-6 items-end justify-center pt-8 pb-4 max-w-xl mx-auto border-b border-white/6">
                  {/* Rank 2 (Left) */}
                  {podiumUsers[1] && (
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-slate-400 flex items-center justify-center font-black text-xl text-slate-200">
                          {podiumUsers[1].name.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -top-3 -right-1 bg-slate-400 text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 shadow">
                          2nd
                        </span>
                      </div>
                      <p className="text-xs font-bold mt-3 text-slate-200 max-w-[80px] truncate text-center">{podiumUsers[1].name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{podiumUsers[1].points} pts</p>
                      <div className="w-full bg-slate-800/40 border border-slate-700/30 rounded-t-xl h-16 flex items-center justify-center mt-3">
                        <span className="text-slate-400 font-black text-sm">🥈</span>
                      </div>
                    </div>
                  )}

                  {/* Rank 1 (Middle) */}
                  {podiumUsers[0] && (
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-500 to-yellow-300 blur animate-pulse opacity-30" />
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-3 border-amber-400 flex items-center justify-center font-black text-2xl text-amber-400 relative">
                          {podiumUsers[0].name.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-lg">👑</span>
                        <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-xs w-6 h-6 rounded-full flex items-center justify-center border border-slate-900 shadow">
                          1st
                        </span>
                      </div>
                      <p className="text-sm font-extrabold mt-3 text-white max-w-[100px] truncate text-center">{podiumUsers[0].name}</p>
                      <p className="text-xs text-amber-400 font-mono mt-0.5 font-bold">{podiumUsers[0].points} pts</p>
                      <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-t-xl h-24 flex items-center justify-center mt-3">
                        <span className="text-amber-400 font-black text-lg">🥇</span>
                      </div>
                    </div>
                  )}

                  {/* Rank 3 (Right) */}
                  {podiumUsers[2] && (
                    <div className="flex flex-col items-center">
                      <div className="relative group">
                        <div className="w-14 h-14 rounded-full bg-slate-800 border-2 border-amber-700 flex items-center justify-center font-black text-lg text-amber-700">
                          {podiumUsers[2].name.charAt(0).toUpperCase()}
                        </div>
                        <span className="absolute -top-2.5 -right-1 bg-amber-700 text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border border-slate-900 shadow">
                          3rd
                        </span>
                      </div>
                      <p className="text-xs font-bold mt-3 text-slate-300 max-w-[80px] truncate text-center">{podiumUsers[2].name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{podiumUsers[2].points} pts</p>
                      <div className="w-full bg-slate-800/40 border border-slate-700/30 rounded-t-xl h-12 flex items-center justify-center mt-3">
                        <span className="text-amber-600 font-black text-xs">🥉</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rest of Leaderboard */}
                <div className="bg-white/3 border border-white/6 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-white/4">
                    {remainingLeaderboard.map((u, idx) => (
                      <div key={u.id} className="flex items-center justify-between px-6 py-4 hover:bg-white/2 transition-colors">
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500 font-mono text-sm w-6 text-center">{idx + 4}</span>
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-white/8 flex items-center justify-center text-xs font-bold text-slate-300">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white">{u.name}</p>
                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                                <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
                                {u.currentStreak} day streak
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-sm font-bold text-white font-mono">{u.points} pts</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area */}
          <div className="lg:col-span-4 space-y-6">
            {/* Streak & Profile Stats widget */}
            {userProfile && (
              <div className="bg-white/3 border border-white/6 p-6 rounded-3xl space-y-5 backdrop-blur-md relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
                
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">My Coding Activity</h3>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 animate-pulse">
                    <Flame className="w-8 h-8 text-orange-500 fill-orange-500" />
                  </div>
                  <div>
                    <p className="text-3xl font-extrabold text-white font-display">
                      {userProfile.currentStreak || 0}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Day Streak</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-white/6 pt-4">
                  <div>
                    <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Total Points</p>
                    <p className="text-xl font-bold text-white font-mono mt-0.5">
                      {userProfile.points || 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-400 font-semibold uppercase tracking-wider">Best Streak</p>
                    <p className="text-xl font-bold text-white font-mono mt-0.5">
                      {userProfile.longestStreak || 0}
                    </p>
                  </div>
                </div>

                {/* Badge level meter */}
                <div className="border-t border-white/6 pt-4 space-y-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Rank Level: <strong className="text-violet-400">
                      {userProfile.points >= 500 ? 'Algorithms Sage' : userProfile.points >= 200 ? 'Coding Ninja' : 'Code Novice'}
                    </strong></span>
                    <span>{userProfile.points} / {userProfile.points >= 500 ? '1000' : userProfile.points >= 200 ? '500' : '200'}</span>
                  </div>
                  <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="bg-gradient-to-r from-violet-600 to-blue-500 h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${Math.min(100, 
                          userProfile.points >= 500 ? (userProfile.points / 1000) * 100 : 
                          userProfile.points >= 200 ? (userProfile.points / 500) * 100 : 
                          (userProfile.points / 200) * 100
                        )}%` 
                      }} 
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Heatmap Widget */}
            <div className="bg-white/3 border border-white/6 p-6 rounded-3xl space-y-4 backdrop-blur-md">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">Activity Calendar</h3>
                <span className="text-[10px] text-slate-500">Last 365 Days</span>
              </div>
              
              {renderHeatmap()}

              <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/4">
                <span>Less</span>
                <div className="flex gap-1 items-center">
                  <div className="w-2.5 h-2.5 rounded-sm bg-white/5" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-950/70" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-800/60" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-600/70" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-emerald-400" />
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Quick tips card */}
            <div className="bg-white/3 border border-white/6 p-6 rounded-3xl space-y-3 backdrop-blur-md text-xs text-slate-400 leading-relaxed">
              <h4 className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-4 h-4 text-violet-400 animate-pulse" />
                Coding Advice
              </h4>
              <p>Solve coding problems consistently to increase your streak multiplier and level up your ranking.</p>
              <p>Completing a **Daily Challenge** awards an extra **+15 bonus points**! Ensure you compile your solution successfully before midnight.</p>
            </div>
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
