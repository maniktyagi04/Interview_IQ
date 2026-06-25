import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { 
  Code2, Terminal, Play, Send, History, Sparkles, 
  CheckCircle2, AlertTriangle, XCircle, RefreshCw, ChevronRight, Info, Eye, Download, Star, ArrowLeft, Timer
} from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';
import Editor from '@monaco-editor/react';

const DIFFICULTIES = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Hard: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
};

export default function CodingAssessmentPage() {
  const { problemId } = useParams();
  const [searchParams] = useSearchParams();
  const contestId = searchParams.get('contestId');
  const navigate = useNavigate();

  const [problems, setProblems] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [code, setCode] = useState('');
  const [codesCache, setCodesCache] = useState({}); // problemId -> code mapping
  const [language, setLanguage] = useState('javascript');
  const [activeTab, setActiveTab] = useState('description'); // description | submissions
  const [submissions, setSubmissions] = useState([]);
  
  // Contest States
  const [contestInfo, setContestInfo] = useState(null);
  const [contestTimeLeft, setContestTimeLeft] = useState('');

  // Execution states
  const [isRunning, setIsRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [loadingProblems, setLoadingProblems] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Modal states for viewing code
  const [viewingCode, setViewingCode] = useState(null);

  // Fetch problems for selector
  const fetchSelectorProblems = async () => {
    try {
      if (contestId) {
        const res = await api.get(`/contests/${contestId}`);
        setContestInfo(res.data);
        setProblems(res.data.problems);
      } else {
        const res = await api.get('/problems');
        setProblems(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch selector problems:', err);
    }
  };

  // Fetch active problem details
  const fetchActiveProblem = async () => {
    if (!problemId) return;
    try {
      setLoadingProblems(true);
      const res = await api.get(`/problems/${problemId}`);
      setSelectedProblem(res.data);
      
      // Load code from cache or starter template
      if (codesCache[problemId]) {
        setCode(codesCache[problemId]);
      } else {
        setCode(res.data.starterCode);
      }
      
      // Load submissions for this problem
      fetchSubmissions(problemId);
    } catch (err) {
      console.error('Failed to load active problem details:', err);
    } finally {
      setLoadingProblems(false);
    }
  };

  // Fetch submissions for active problem
  const fetchSubmissions = async (pId) => {
    if (!pId) return;
    try {
      setLoadingSubmissions(true);
      const res = await api.get(`/submissions/user?problemId=${pId}`);
      setSubmissions(res.data);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  useEffect(() => {
    fetchSelectorProblems();
  }, [contestId]);

  useEffect(() => {
    fetchActiveProblem();
  }, [problemId]);

  // Contest timer countdown
  useEffect(() => {
    if (!contestInfo) return;
    
    const updateContestTime = () => {
      const now = new Date();
      const end = new Date(contestInfo.endTime);
      const diff = end - now;

      if (diff <= 0) {
        setContestTimeLeft('Contest Ended');
        return;
      }

      const hrs = String(Math.floor((diff / (1000 * 60 * 60)) % 24)).padStart(2, '0');
      const mins = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, '0');
      const secs = String(Math.floor((diff / 1000) % 60)).padStart(2, '0');

      setContestTimeLeft(`${hrs}:${mins}:${secs}`);
    };

    updateContestTime();
    const interval = setInterval(updateContestTime, 1000);
    return () => clearInterval(interval);
  }, [contestInfo]);

  // Handle problem change
  const handleProblemChange = (newProblemId) => {
    if (selectedProblem) {
      setCodesCache(prev => ({ ...prev, [selectedProblem.id]: code }));
    }
    const query = contestId ? `?contestId=${contestId}` : '';
    navigate(`/coding/solve/${newProblemId}${query}`);
  };

  // Toggle problem bookmark directly from workspace
  const handleToggleBookmark = async () => {
    if (!selectedProblem) return;
    try {
      const res = await api.post(`/problems/${selectedProblem.id}/bookmark`);
      setSelectedProblem(prev => ({
        ...prev,
        isBookmarked: res.data.bookmarked
      }));
    } catch (err) {
      console.error('Bookmark toggle failed:', err);
    }
  };

  // Reset to starter code
  const handleResetCode = () => {
    if (selectedProblem && confirm('Are you sure you want to reset your code to the default template? This will discard your current draft.')) {
      setCode(selectedProblem.starterCode);
      setCodesCache(prev => {
        const copy = { ...prev };
        delete copy[selectedProblem.id];
        return copy;
      });
    }
  };

  // Run/Submit code
  const handleSubmit = async (isSubmissionSubmit = true) => {
    if (!selectedProblem) return;
    setIsRunning(true);
    setRunResult(null);
    
    try {
      const res = await api.post('/submissions', {
        problemId: selectedProblem.id,
        code,
        language,
        contestId: contestId || undefined
      });
      
      setRunResult(res.data.result);
      
      // If it is a submit action, switch to submissions tab and reload
      if (isSubmissionSubmit) {
        fetchSubmissions(selectedProblem.id);
        setActiveTab('submissions');
      }
    } catch (err) {
      console.error('Execution failure:', err);
      setRunResult({
        success: false,
        status: 'Runtime Error',
        message: err.response?.data?.message || 'Server connection timed out. Please try again.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Load code from historical submission
  const handleLoadSubmissionCode = (submissionCode) => {
    if (confirm('Load this code into the editor? This will overwrite your current draft.')) {
      setCode(submissionCode);
      setViewingCode(null);
    }
  };

  if (loadingProblems) {
    return (
      <UserLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading workspace environment...</p>
        </div>
      </UserLayout>
    );
  }

  return (
    <UserLayout>
      <div className="max-w-[1600px] mx-auto flex flex-col gap-6 h-[calc(100vh-120px)]">
        {/* Contest Header Banner if in contest mode */}
        {contestId && contestInfo && (
          <div className="flex justify-between items-center bg-gradient-to-r from-red-950/20 via-slate-900/40 to-amber-950/20 border border-white/6 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Link 
                to="/coding" 
                className="p-1.5 bg-white/3 hover:bg-white/6 border border-white/8 rounded-lg text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Exit Contest
              </Link>
              <div className="ml-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400">Contest Mode Active</span>
                <h4 className="text-sm font-bold text-white">{contestInfo.title}</h4>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-[9px] uppercase font-bold text-slate-500">Contest Time Remaining</p>
                <div className="flex items-center gap-1.5 text-white font-mono font-bold text-sm">
                  <Timer className="w-4 h-4 text-red-400" />
                  {contestTimeLeft}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/3 border border-white/6 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold font-display text-white">Coding Assessment Workspace</h1>
                {!contestId && (
                  <Link to="/coding" className="text-xs text-violet-400 hover:underline flex items-center">
                    (Return to Hub)
                  </Link>
                )}
              </div>
              <p className="text-xs text-slate-400">Solve mock interview coding tasks and check answers in real-time.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* Problem Selector Dropdown */}
            <div className="relative flex-1 sm:flex-none">
              <select
                id="problem-select"
                value={selectedProblem?.id || ''}
                onChange={(e) => handleProblemChange(e.target.value)}
                className="w-full sm:w-64 bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none cursor-pointer pr-10"
              >
                {problems.map(p => {
                  const id = contestId ? p.id : p.id;
                  const title = contestId ? p.title : p.title;
                  return (
                    <option key={id} value={id}>{title}</option>
                  );
                })}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>

            {/* Language Selector */}
            <div className="relative">
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 appearance-none pr-10 cursor-not-allowed"
                disabled
              >
                <option value="javascript">JavaScript</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        </div>

        {/* Split Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0 overflow-y-auto lg:overflow-hidden">
          {/* Left Column: Problem details / Submissions */}
          <div className="lg:col-span-5 flex flex-col bg-white/3 border border-white/6 rounded-2xl overflow-hidden min-h-[400px] lg:h-full">
            {/* Tabs */}
            <div className="flex border-b border-white/6 bg-white/2">
              <button
                id="tab-description"
                onClick={() => setActiveTab('description')}
                className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-2 ${
                  activeTab === 'description'
                    ? 'border-violet-500 text-white bg-white/2'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Info className="w-4 h-4" />
                Description
              </button>
              <button
                id="tab-submissions"
                onClick={() => setActiveTab('submissions')}
                className={`flex-1 py-3 text-sm font-semibold transition-all border-b-2 flex items-center justify-center gap-2 ${
                  activeTab === 'submissions'
                    ? 'border-violet-500 text-white bg-white/2'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <History className="w-4 h-4" />
                Submissions
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {activeTab === 'description' && selectedProblem && (
                <div className="space-y-5 animate-fadeIn">
                  {/* Title & Metadata */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-xl font-bold text-white font-display">{selectedProblem.title}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${DIFFICULTIES[selectedProblem.difficulty]}`}>
                          {selectedProblem.difficulty}
                        </span>
                      </div>

                      <button
                        onClick={handleToggleBookmark}
                        className="text-slate-400 hover:text-amber-400 p-1.5 bg-white/3 border border-white/6 hover:bg-white/6 rounded-xl transition-all flex items-center gap-1 text-xs"
                      >
                        <Star className={`w-3.5 h-3.5 ${selectedProblem.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                        {selectedProblem.isBookmarked ? 'Bookmarked' : 'Bookmark'}
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProblem.tags.map(tag => (
                        <span key={tag} className="text-xs px-2.5 py-1 rounded-lg bg-white/5 border border-white/5 text-slate-400 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-white/6" />

                  {/* Body description */}
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {selectedProblem.description}
                  </div>

                  {/* Test Cases */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-violet-400" />
                      Sample Test Case
                    </h3>
                    
                    <div className="space-y-3 bg-slate-950/60 border border-white/6 p-4 rounded-xl">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sample Input</span>
                        <pre className="text-xs text-violet-300 font-mono overflow-x-auto p-2 bg-white/2 rounded-md">
                          {selectedProblem.sampleInput}
                        </pre>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Sample Output</span>
                        <pre className="text-xs text-emerald-400 font-mono overflow-x-auto p-2 bg-white/2 rounded-md">
                          {selectedProblem.sampleOutput}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'submissions' && (
                <div className="space-y-4 animate-fadeIn">
                  {loadingSubmissions ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : submissions.length === 0 ? (
                    <div className="text-center py-12 space-y-3 bg-white/2 rounded-2xl border border-dashed border-white/6">
                      <Code2 className="w-8 h-8 text-slate-600 mx-auto" />
                      <p className="text-sm text-slate-400 font-medium">No submissions yet for this problem.</p>
                      <p className="text-xs text-slate-500">Submit your solution to check correctness.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {submissions.map((sub) => (
                        <div 
                          key={sub.id} 
                          className="flex items-center justify-between p-3.5 bg-white/3 border border-white/6 rounded-xl hover:bg-white/6 transition-all"
                        >
                          <div className="space-y-1 overflow-hidden pr-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-slate-300">JavaScript</span>
                              <span className="text-[10px] text-slate-500">
                                {new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-400 truncate font-mono bg-slate-950/40 px-2 py-0.5 rounded">
                              {sub.code.replace(/\s+/g, ' ').substring(0, 60)}...
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              id={`view-submission-${sub.id}`}
                              onClick={() => setViewingCode(sub)}
                              className="w-8 h-8 rounded-lg bg-white/5 border border-white/6 hover:bg-white/10 hover:border-white/12 flex items-center justify-center text-slate-400 hover:text-white transition-all"
                              title="View Solution"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              id={`load-submission-${sub.id}`}
                              onClick={() => handleLoadSubmissionCode(sub.code)}
                              className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/25 hover:bg-violet-600/20 flex items-center justify-center text-violet-400 hover:text-white transition-all"
                              title="Load into Editor"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Code Editor & Console */}
          <div className="lg:col-span-7 flex flex-col h-[650px] lg:h-full gap-5">
            {/* Editor Container */}
            <div className="flex-1 flex flex-col bg-white/3 border border-white/6 rounded-2xl overflow-hidden min-h-0">
              {/* Editor Header */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-white/6 bg-white/2">
                <span className="text-xs font-semibold text-slate-300 tracking-wider flex items-center gap-2 uppercase">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Editor Workspace
                </span>
                
                <button
                  id="reset-code-btn"
                  onClick={handleResetCode}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-white/5 border border-white/8 hover:border-white/12 rounded-lg transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset Code
                </button>
              </div>

              {/* Monaco Editor */}
              <div className="flex-1 min-h-0 bg-[#1e1e1e]">
                <Editor
                  height="100%"
                  language={language}
                  value={code}
                  onChange={(val) => setCode(val || '')}
                  theme="vs-dark"
                  loading={
                    <div className="flex items-center justify-center h-full text-sm text-slate-500">
                      <RefreshCw className="w-4 h-4 animate-spin mr-2 text-violet-500" />
                      Initializing code editor...
                    </div>
                  }
                  options={{
                    fontSize: 14,
                    fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                    minimap: { enabled: false },
                    automaticLayout: true,
                    tabSize: 2,
                    padding: { top: 12 },
                    lineHeight: 22,
                    scrollbar: {
                      verticalScrollbarSize: 8,
                      horizontalScrollbarSize: 8
                    }
                  }}
                />
              </div>
            </div>

            {/* Results Console Panel */}
            <div className="bg-white/3 border border-white/6 rounded-2xl p-4 flex flex-col gap-4">
              {/* Run Actions Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4.5 h-4.5 text-slate-400" />
                  <span className="text-sm font-semibold text-white">Execution Console</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    id="run-code-btn"
                    onClick={() => handleSubmit(false)}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-4 py-2 border border-white/8 hover:border-white/15 bg-white/3 hover:bg-white/6 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-all disabled:opacity-40"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Run Code
                  </button>
                  <button
                    id="submit-code-btn"
                    onClick={() => handleSubmit(true)}
                    disabled={isRunning}
                    className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-xs font-bold hover:opacity-90 transition-opacity shadow-lg shadow-violet-900/10 disabled:opacity-40"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Submit Answer
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-white/6" />

              {/* Console Output area */}
              <div className="min-h-[120px] max-h-[160px] overflow-y-auto bg-slate-950/70 border border-white/6 rounded-xl p-3.5 font-mono text-xs">
                {isRunning ? (
                  <div className="flex items-center justify-center h-20 gap-2.5 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-violet-500" />
                    <span>Executing test cases on sandbox...</span>
                  </div>
                ) : runResult ? (
                  <div className="space-y-3 animate-fadeIn">
                    {/* Status Label */}
                    <div className="flex items-center gap-2">
                      {runResult.status === 'Accepted' && (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold text-sm">Status: Accepted (Passed Sample Tests)</span>
                        </>
                      )}
                      {runResult.status === 'Wrong Answer' && (
                        <>
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                          <span className="text-amber-400 font-bold text-sm">Status: Wrong Answer</span>
                        </>
                      )}
                      {(runResult.status === 'Runtime Error' || runResult.status === 'Compilation Error') && (
                        <>
                          <XCircle className="w-5 h-5 text-rose-500" />
                          <span className="text-rose-500 font-bold text-sm">Status: {runResult.status}</span>
                        </>
                      )}
                    </div>

                    {/* Results details */}
                    {runResult.status === 'Accepted' || runResult.status === 'Wrong Answer' ? (
                      <div className="space-y-2.5 border-l-2 border-white/10 pl-3">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Sample Input:</span>
                          <div className="text-slate-300 font-mono mt-0.5 bg-slate-900/60 p-1.5 rounded">{selectedProblem.sampleInput}</div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Expected Output:</span>
                            <div className="text-emerald-400 font-mono mt-0.5 bg-slate-900/60 p-1.5 rounded">{runResult.expectedOutput}</div>
                          </div>
                          <div>
                            <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Your Output:</span>
                            <div className={`${runResult.status === 'Accepted' ? 'text-emerald-400' : 'text-rose-400'} font-mono mt-0.5 bg-slate-900/60 p-1.5 rounded`}>
                              {runResult.actualOutput}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 border-l-2 border-rose-500/30 pl-3">
                        <span className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Error Details:</span>
                        <pre className="text-rose-400 whitespace-pre-wrap break-words bg-slate-900/60 p-2 rounded max-h-24 overflow-y-auto">
                          {runResult.message}
                        </pre>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-slate-500 gap-1.5">
                    <Sparkles className="w-5 h-5 text-slate-600" />
                    <span>Run your code first to verify against sample outputs.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer Modal */}
      {viewingCode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setViewingCode(null)} />
          <div className="relative w-full max-w-2xl bg-[#0f1724] border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col max-h-[80vh]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-white text-lg">Solution Draft</h3>
                <p className="text-xs text-slate-400 mt-0.5">Submitted on: {new Date(viewingCode.submittedAt).toLocaleString()}</p>
              </div>
              <button onClick={() => setViewingCode(null)} className="text-slate-400 hover:text-white p-1 hover:bg-white/5 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-slate-950/80 border border-white/6 rounded-xl p-4 overflow-y-auto font-mono text-xs text-slate-300 leading-relaxed">
              <pre>{viewingCode.code}</pre>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button 
                onClick={() => setViewingCode(null)} 
                className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                Close
              </button>
              <button
                id="load-viewed-solution-btn"
                onClick={() => handleLoadSubmissionCode(viewingCode.code)}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90"
              >
                <Download className="w-4 h-4" />
                Load into Editor
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
