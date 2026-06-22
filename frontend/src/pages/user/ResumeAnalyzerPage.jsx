import React, { useEffect, useState, useRef } from 'react';
import { Upload, Trash2, FileText, CheckCircle, AlertCircle, BarChart2, X, Plus } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

const domains = ['Frontend Development', 'Backend Development', 'Full Stack Development', 'AI/ML Engineering', 'Data Science'];

export default function ResumeAnalyzerPage() {
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetDomain, setTargetDomain] = useState('');
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);
  const fileInputRef = useRef();

  const fetchResumes = async () => {
    try {
      const res = await api.get('/resumes');
      setResumes(res.data);
    } catch (err) {
      console.error('Failed to fetch resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResumes(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) { setError('Please select a file'); return; }
    if (!targetDomain) { setError('Please select a target domain'); return; }

    setError('');
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);
      formData.append('targetDomain', targetDomain);
      await api.post('/resumes/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSelectedFile(null);
      setTargetDomain('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchResumes();
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      setResumes((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Resume Analyzer</h1>
          <p className="text-slate-400 text-sm mt-1">Upload your resume and get AI-powered alignment feedback against your target role.</p>
        </div>

        {/* Upload Card */}
        <div className="p-6 rounded-2xl bg-white/3 border border-white/6">
          <h2 className="font-semibold text-white mb-4">Upload New Resume</h2>

          {error && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:border-violet-500/40 hover:bg-violet-500/3 transition-all"
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleFileChange} id="resume-file-input" />
            <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center">
              <Upload className="w-6 h-6 text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-white">{selectedFile ? selectedFile.name : 'Click to upload resume'}</p>
              <p className="text-xs text-slate-500 mt-1">PDF, DOC, or DOCX · Max 5MB</p>
            </div>
          </div>

          {/* Domain selector */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">Target Domain</label>
            <select
              id="resume-domain-select"
              value={targetDomain}
              onChange={(e) => setTargetDomain(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 appearance-none"
            >
              <option value="" className="bg-slate-900">Select target domain...</option>
              {domains.map((d) => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
            </select>
          </div>

          <button
            id="resume-analyze-btn"
            onClick={handleUpload}
            disabled={uploading || !selectedFile || !targetDomain}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {uploading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Analyzing...</> : <><BarChart2 className="w-4 h-4" />Analyze Resume</>}
          </button>
        </div>

        {/* Previous Resumes */}
        {loading ? (
          <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : resumes.length === 0 ? (
          <div className="text-center py-10 text-slate-600 text-sm">No resumes analyzed yet. Upload your first resume above.</div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-semibold text-white">Previous Analyses</h2>
            {resumes.map((r) => {
              const ai = r.aiAnalysis;
              const isOpen = expanded === r.id;
              const matchPct = ai?.matchPercentage || 0;
              const matchColor = matchPct >= 70 ? 'text-emerald-400' : matchPct >= 50 ? 'text-amber-400' : 'text-red-400';
              return (
                <div key={r.id} className="rounded-2xl bg-white/3 border border-white/6 overflow-hidden">
                  <div className="flex items-center gap-4 p-5">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">Resume Analysis</p>
                      <p className="text-xs text-slate-500 mt-0.5">{new Date(r.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className={`text-2xl font-bold font-display ${matchColor}`}>{matchPct}%</div>
                    <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                      {isOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                    <button onClick={() => handleDelete(r.id)} id={`delete-resume-${r.id}`} className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {isOpen && ai && (
                    <div className="px-5 pb-5 space-y-4 border-t border-white/5 pt-4">
                      <p className="text-sm text-slate-300 leading-relaxed">{ai.verdict}</p>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2">Key Skills Found</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ai.keySkillsFound?.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">{s}</span>)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2">Missing Keywords</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ai.missingKeywords?.map((s) => <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">{s}</span>)}
                          </div>
                        </div>
                      </div>
                      {ai.suggestions?.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-slate-500 mb-2">Suggestions</p>
                          <ul className="space-y-1.5">
                            {ai.suggestions.map((s, i) => <li key={i} className="text-xs text-slate-400 flex gap-2"><span className="text-violet-400">→</span>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </UserLayout>
  );
}
