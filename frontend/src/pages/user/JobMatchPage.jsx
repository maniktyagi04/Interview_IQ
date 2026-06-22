import React, { useState, useEffect } from 'react';
import { FileText, Upload, Sparkles, CheckCircle, AlertTriangle, ArrowRight, Trash2, HelpCircle } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

export default function JobMatchPage() {
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [analyses, setAnalyses] = useState([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);

  // Fetch previous job match analysis records
  const fetchAnalyses = async () => {
    try {
      const res = await api.get('/job-match');
      setAnalyses(res.data);
      if (res.data.length > 0 && !selectedAnalysis) {
        setSelectedAnalysis(res.data[0]); // Default to show latest
      }
    } catch (err) {
      console.error('Failed to fetch previous analyses:', err);
    }
  };

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload your resume file (PDF, DOC, or DOCX).');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please paste a Job Description to match against.');
      return;
    }

    setError('');
    setSuccess('');
    setAnalyzing(true);

    const formData = new FormData();
    formData.append('resume', file);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await api.post('/job-match', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Job description match analysis finished successfully!');
      setJobDescription('');
      setFile(null);
      
      // Refresh list
      const updatedList = await api.get('/job-match');
      setAnalyses(updatedList.data);
      
      // Auto select the new analysis
      const newAnalysis = updatedList.data.find(a => a.id === res.data.jobMatch.id) || res.data.jobMatch;
      setSelectedAnalysis(newAnalysis);
    } catch (err) {
      setError(err.response?.data?.message || 'Job match analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis report?')) return;

    try {
      await api.delete(`/job-match/${id}`);
      const updated = analyses.filter(a => a.id !== id);
      setAnalyses(updated);
      if (selectedAnalysis?.id === id) {
        setSelectedAnalysis(updated.length > 0 ? updated[0] : null);
      }
    } catch (err) {
      setError('Failed to delete report.');
    }
  };

  // Helper to color overall match score
  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (score >= 55) return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    return 'text-red-400 border-red-500/30 bg-red-500/10';
  };

  return (
    <UserLayout>
      <div className="space-y-8 max-w-6xl mx-auto">
        {/* Page Banner */}
        <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-white/8 bg-gradient-to-r from-violet-900/40 via-blue-900/30 to-slate-900/40 backdrop-blur-md">
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <Sparkles className="w-3.5 h-3.5" /> AI Recruiter Suite
            </div>
            <h1 className="text-3xl font-extrabold text-white font-display">Resume vs Job Description Match</h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Upload your candidate profile and match it against direct job postings. The AI evaluates keywords, missing skills, strengths, and suggests resume improvements.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial-gradient from-violet-600/10 to-transparent pointer-events-none" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Analyze Form & History */}
          <div className="lg:col-span-1 space-y-6">
            {/* Form */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white">New Match Analysis</h2>
              
              {error && (
                <div className="flex items-center gap-2 p-3 text-xs bg-red-500/15 border border-red-500/20 rounded-xl text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 p-3 text-xs bg-emerald-500/15 border border-emerald-500/20 rounded-xl text-emerald-400">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  {success}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Resume Upload drop zone */}
                <div className="space-y-1">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Upload Resume</span>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-violet-500/40 rounded-xl p-4 cursor-pointer hover:bg-white/1 transition-all">
                    <Upload className="w-8 h-8 text-slate-500 mb-2" />
                    <span className="text-xs text-slate-300 text-center font-medium">
                      {file ? file.name : 'Select PDF, DOC, or DOCX'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-1">Max 5MB</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Job Description textarea */}
                <div className="space-y-1">
                  <label htmlFor="jd" className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">Paste Job Description</label>
                  <textarea
                    id="jd"
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Copy/paste the target job description requirements here..."
                    rows={8}
                    className="w-full p-3 bg-white/3 border border-white/10 rounded-xl text-white placeholder-slate-600 text-xs focus:outline-none focus:border-violet-500/40 resize-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={analyzing}
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-bold text-sm hover:opacity-95 transition-opacity disabled:opacity-50"
                >
                  {analyzing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                      Scanning Match Alignment...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze Match Score
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* History List */}
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 space-y-4 backdrop-blur-md">
              <h2 className="text-lg font-bold text-white">Previous Match Scans</h2>
              {analyses.length === 0 ? (
                <p className="text-slate-500 text-xs italic">No analyses generated yet.</p>
              ) : (
                <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                  {analyses.map((a) => (
                    <div
                      key={a.id}
                      onClick={() => setSelectedAnalysis(a)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedAnalysis?.id === a.id
                          ? 'bg-violet-500/10 border-violet-500/30'
                          : 'bg-white/2 border-white/5 hover:bg-white/4'
                      }`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border shrink-0 ${getScoreColor(a.matchScore)}`}>
                          {a.matchScore}%
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-semibold text-white truncate">
                            {a.jobDescription.substring(0, 40)}...
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(a.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(a.id, e)}
                        className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
                        title="Delete Analysis"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Match Report details */}
          <div className="lg:col-span-2">
            {selectedAnalysis ? (
              <div className="bg-white/4 border border-white/8 rounded-2xl p-6 md:p-8 space-y-6 backdrop-blur-md">
                {/* Header score card */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 p-6 rounded-2xl bg-white/2 border border-white/5">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Match Level</span>
                    <h3 className="text-xl font-bold text-white">Job Alignment Feedback</h3>
                    <p className="text-xs text-slate-500">Scan generated on {new Date(selectedAnalysis.createdAt).toLocaleString()}</p>
                  </div>
                  {/* Large Ring Score */}
                  <div className="flex items-center gap-4">
                    <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center shrink-0 ${
                      selectedAnalysis.matchScore >= 80 ? 'border-emerald-500 bg-emerald-500/5' :
                      selectedAnalysis.matchScore >= 55 ? 'border-amber-500 bg-amber-500/5' :
                      'border-red-500 bg-red-500/5'
                    }`}>
                      <span className="text-2xl font-black font-display text-white">{selectedAnalysis.matchScore}%</span>
                      <span className="text-[8px] uppercase tracking-wider text-slate-400 font-bold">Match Score</span>
                    </div>
                  </div>
                </div>

                {/* JD Snip */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Job Description</span>
                  <div className="p-4 bg-white/2 rounded-xl text-xs text-slate-400 max-h-36 overflow-y-auto leading-relaxed whitespace-pre-line border border-white/5">
                    {selectedAnalysis.jobDescription}
                  </div>
                </div>

                {/* Skills Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Matching Skills */}
                  <div className="bg-white/2 border border-white/5 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Matching Skills Listed
                    </h4>
                    {selectedAnalysis.matchingSkills?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">No matching keywords scanned.</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.matchingSkills?.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-semibold uppercase">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Missing Skills */}
                  <div className="bg-white/2 border border-white/5 rounded-xl p-5 space-y-3">
                    <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Missing Keywords / Skills
                    </h4>
                    {selectedAnalysis.missingSkills?.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">Excellent keyword coverage achieved!</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedAnalysis.missingSkills?.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold uppercase">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resume Strengths</span>
                    <ul className="space-y-2">
                      {selectedAnalysis.strengths?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Weaknesses */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Resume Weaknesses</span>
                    <ul className="space-y-2">
                      {selectedAnalysis.weaknesses?.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0 mt-1.5" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <hr className="border-white/5" />

                {/* Recommendations and Suggestions */}
                <div className="space-y-5">
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-violet-400 uppercase tracking-wider block">Recommended Skills to Learn</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedAnalysis.recommendations?.map((rec, idx) => (
                        <div key={idx} className="p-3 bg-violet-500/5 border border-violet-500/10 rounded-xl text-xs text-slate-300 leading-relaxed">
                          {rec}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Suggested Resume Improvements</span>
                    <ul className="space-y-2.5">
                      {selectedAnalysis.suggestions?.map((sug, idx) => (
                        <li key={idx} className="flex items-start gap-3 bg-white/2 border border-white/5 p-3 rounded-xl text-xs text-slate-300 leading-relaxed">
                          <ArrowRight className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                          {sug}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white/4 border border-white/8 rounded-2xl p-12 text-center backdrop-blur-md flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center text-slate-600">
                  <FileText className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg">No Match Report Selected</h3>
                  <p className="text-slate-500 text-xs mt-1 max-w-sm mx-auto leading-relaxed">
                    Upload your resume file and paste the job description parameters to generate an instant match report, or select one from the scan list on the left.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </UserLayout>
  );
}
