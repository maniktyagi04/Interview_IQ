import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, Award, AlertCircle, Calendar, ShieldCheck, Sparkles, BookOpen, Code2, CheckCircle2, AlertTriangle, Brain, RefreshCw } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

export default function ProgressAnalyticsPage() {
  const [activeTab, setActiveTab] = useState('interview'); // 'interview' | 'coding'
  
  // Interview Analytics State
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Coding Analytics State
  const [codingData, setCodingData] = useState(null);
  const [loadingCoding, setLoadingCoding] = useState(false);
  const [codingError, setCodingError] = useState('');

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

  const fetchCodingAnalytics = async () => {
    try {
      setLoadingCoding(true);
      const res = await api.get('/analytics/coding');
      setCodingData(res.data);
    } catch (err) {
      setCodingError(err.response?.data?.message || 'Failed to load coding analytics.');
    } finally {
      setLoadingCoding(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  useEffect(() => {
    if (activeTab === 'coding' && !codingData) {
      fetchCodingAnalytics();
    }
  }, [activeTab]);

  // Format date helpers
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
            <h1 className="text-3xl font-extrabold text-white font-display">Candidate Growth Board</h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Track improvement across coding challenges, mock interviews, AI feedback, and core developer competencies.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-violet-600/10 to-transparent pointer-events-none" />
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-white/8 gap-2">
          <button
            onClick={() => setActiveTab('interview')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 rounded-t-xl ${
              activeTab === 'interview'
                ? 'border-violet-500 text-white bg-white/3'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Interview Analytics
          </button>
          <button
            onClick={() => setActiveTab('coding')}
            className={`px-5 py-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 rounded-t-xl ${
              activeTab === 'coding'
                ? 'border-violet-500 text-white bg-white/3'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Coding Analytics
          </button>
        </div>

        {/* Tab Content: Interview Analytics */}
        {activeTab === 'interview' && (
          <div className="space-y-8 animate-fadeIn">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Processing performance data...</p>
              </div>
            ) : error ? (
              <div className="max-w-md mx-auto text-center py-12 bg-red-500/10 border border-red-500/25 rounded-2xl p-6">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-white font-bold">Analytics Unreachable</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">{error}</p>
                <button onClick={fetchAnalytics} className="px-4 py-2 bg-violet-600 rounded-xl text-white text-xs font-semibold hover:bg-violet-700">
                  Retry Loading
                </button>
              </div>
            ) : !analyticsData || !analyticsData.hasData ? (
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
            ) : (
              <>
                {/* Highlights Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Interviews Completed */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Interviews Completed</span>
                      <p className="text-3xl font-black font-display text-white">{analyticsData.growth.length}</p>
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
                        {analyticsData.bestDomain ? analyticsData.bestDomain.domain : 'N/A'}
                      </p>
                      {analyticsData.bestDomain && (
                        <p className="text-xs text-emerald-400 font-semibold">{analyticsData.bestDomain.score.toFixed(1)} / 10 Avg</p>
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
                        {analyticsData.weakestDomain ? analyticsData.weakestDomain.domain : 'N/A'}
                      </p>
                      {analyticsData.weakestDomain && (
                        <p className="text-xs text-red-400 font-semibold">{analyticsData.weakestDomain.score.toFixed(1)} / 10 Avg</p>
                      )}
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center justify-center text-red-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Charts Matrix */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Score Growth */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white">Score Growth Over Time</h3>
                      <p className="text-xs text-slate-500">A detailed chronological view of interview metrics</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={analyticsData.growth} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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

                  {/* Domain breakdown */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white">Domain Breakdown Performance</h3>
                      <p className="text-xs text-slate-500">Average assessment scores across tech categories</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analyticsData.domainPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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

                  {/* Monthly trends */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 lg:col-span-2 backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white">Monthly Growth Trends</h3>
                      <p className="text-xs text-slate-500">Your average score performance grouped by month</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analyticsData.monthlyPerformance} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
              </>
            )}
          </div>
        )}

        {/* Tab Content: Coding Analytics */}
        {activeTab === 'coding' && (
          <div className="space-y-8 animate-fadeIn">
            {loadingCoding ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-400 text-sm">Aggregating coding statistics and AI feedback...</p>
              </div>
            ) : codingError ? (
              <div className="max-w-md mx-auto text-center py-12 bg-red-500/10 border border-red-500/25 rounded-2xl p-6">
                <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <h3 className="text-white font-bold">Analytics Unreachable</h3>
                <p className="text-xs text-slate-400 mt-1 mb-4">{codingError}</p>
                <button onClick={fetchCodingAnalytics} className="px-4 py-2 bg-violet-600 rounded-xl text-white text-xs font-semibold hover:bg-violet-700">
                  Retry Loading
                </button>
              </div>
            ) : !codingData || !codingData.hasData ? (
              <div className="max-w-lg mx-auto text-center py-20 bg-white/4 border border-white/8 rounded-3xl p-8 flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-6 text-violet-400">
                  <Code2 className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold text-white mb-2">No Coding Analytics Found</h1>
                <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-6">
                  Complete coding assessments and submit answers to activate automatic test case evaluation and AI code quality audits.
                </p>
                <button
                  onClick={() => window.location.href = '/coding'}
                  className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-xs hover:opacity-90 transition-opacity"
                >
                  Start Coding Challenges
                </button>
              </div>
            ) : (
              <>
                {/* Stats Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Problems Solved */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Problems Solved</span>
                      <p className="text-3xl font-black font-display text-white">{codingData.totalSolved}</p>
                      <p className="text-[10px] text-slate-400">Distinct challenges passed</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-violet-500/10 border border-violet-500/25 flex items-center justify-center text-violet-400">
                      <Award className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Accuracy Rate */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Accuracy Percentage</span>
                      <p className="text-3xl font-black font-display text-white">{codingData.accuracyRate}%</p>
                      <p className="text-[10px] text-slate-400">Passed / Total submissions</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Submission Count */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex items-center justify-between backdrop-blur-md">
                    <div className="space-y-1">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Submission Count</span>
                      <p className="text-3xl font-black font-display text-white">{codingData.submissionCount}</p>
                      <p className="text-[10px] text-slate-400">Total sandbox run attempts</p>
                    </div>
                    <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400">
                      <Code2 className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Difficulty Breakdown Progress Card */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col justify-between backdrop-blur-md">
                    <div className="space-y-1.5 w-full">
                      <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Difficulty Breakdown</span>
                      <div className="space-y-1.5 text-[11px] text-slate-300 font-semibold">
                        <div className="flex justify-between items-center">
                          <span className="text-emerald-400">Easy</span>
                          <span>{codingData.difficultyBreakdown.Easy} solved</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-yellow-400">Medium</span>
                          <span>{codingData.difficultyBreakdown.Medium} solved</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-rose-400">Hard</span>
                          <span>{codingData.difficultyBreakdown.Hard} solved</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Charts Area */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Chart 1: Problems Solved Trend (Area Chart) */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white">Problems Solved Trend</h3>
                      <p className="text-xs text-slate-500">Cumulative count of unique solved challenges over time</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={codingData.solvedTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="#64748b" />
                          <YAxis allowDecimals={false} stroke="#64748b" />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                          <Area type="monotone" dataKey="count" name="Solved Challenges" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorSolved)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 2: Cumulative Accuracy Trend (Line Chart) */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white">Accuracy Trend</h3>
                      <p className="text-xs text-slate-500">Chronological progression of submission accuracy percentage</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={codingData.accuracyTrend} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="date" stroke="#64748b" />
                          <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                          <Line type="monotone" dataKey="accuracy" name="Cumulative Accuracy" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Chart 3: Weekly Progress (Bar Chart of submissions vs solved count) */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-6 space-y-4 lg:col-span-2 backdrop-blur-md">
                    <div>
                      <h3 className="font-bold text-white">Weekly Coding Progress</h3>
                      <p className="text-xs text-slate-500">Weekly breakdown of submission attempts vs solved problems</p>
                    </div>
                    <div className="h-80 w-full text-xs">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={codingData.weeklyProgress} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                          <XAxis dataKey="week" stroke="#64748b" />
                          <YAxis stroke="#64748b" />
                          <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '12px', color: '#fff' }} />
                          <Legend verticalAlign="top" height={36} />
                          <Bar dataKey="submissions" name="Submissions" fill="#2563eb" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="solved" name="Solved Challenges" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* AI Insights & Mistakes Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* Topic Strengths Card */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4.5 backdrop-blur-md flex flex-col">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      <h3 className="font-bold text-white">Strong Topics</h3>
                    </div>
                    <div className="flex-1 space-y-3">
                      {codingData.strongTopics.length === 0 ? (
                        <p className="text-slate-500 text-xs py-4 text-center">No strong topics identified yet.</p>
                      ) : (
                        codingData.strongTopics.map((item, idx) => (
                          <div key={idx} className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-white">{item.topic}</p>
                              <p className="text-[10px] text-slate-400">{item.solved} solved</p>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="inline-block text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-full border border-emerald-500/15">
                                {item.accuracy}% Acc
                              </span>
                              <p className="text-[9px] text-violet-400">Quality: {item.avgQuality}%</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Topic Weaknesses Card */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4.5 backdrop-blur-md flex flex-col">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                      <h3 className="font-bold text-white">Weak Topics</h3>
                    </div>
                    <div className="flex-1 space-y-3">
                      {codingData.weakTopics.length === 0 ? (
                        <p className="text-slate-500 text-xs py-4 text-center">No major topic weaknesses identified.</p>
                      ) : (
                        codingData.weakTopics.map((item, idx) => (
                          <div key={idx} className="p-3 bg-white/2 border border-white/5 rounded-xl flex items-center justify-between">
                            <div className="space-y-0.5">
                              <p className="text-xs font-bold text-white">{item.topic}</p>
                              <p className="text-[10px] text-slate-400">{item.failedCount} failures</p>
                            </div>
                            <div className="text-right space-y-0.5">
                              <span className="inline-block text-[10px] px-2 py-0.5 bg-red-500/10 text-red-400 font-bold rounded-full border border-red-500/15">
                                {item.accuracy}% Acc
                              </span>
                              <p className="text-[9px] text-violet-400">Quality: {item.avgQuality}%</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Frequently Repeated Mistakes (AI-Analyzed) */}
                  <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4.5 backdrop-blur-md flex flex-col">
                    <div className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-rose-400" />
                      <h3 className="font-bold text-white">AI-Analyzed Mistakes</h3>
                    </div>
                    <div className="flex-1 space-y-3">
                      {codingData.repeatedMistakes.length === 0 ? (
                        <p className="text-slate-500 text-xs py-4 text-center">No recurrent mistakes or optimization issues recorded.</p>
                      ) : (
                        codingData.repeatedMistakes.map((item, idx) => (
                          <div key={idx} className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-1.5">
                            <p className="text-xs font-semibold text-slate-300 leading-relaxed">{item.mistake}</p>
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] text-slate-500">AI DETECTED MISTAKE</span>
                              <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/15">
                                Flagged {item.count} {item.count === 1 ? 'time' : 'times'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </UserLayout>
  );
}

