import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, ChevronRight, Layers, BarChart2 } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

const domains = [
  { value: 'Frontend Development', label: 'Frontend Development', emoji: '🎨', desc: 'HTML, CSS, JS, React, Vue, performance' },
  { value: 'Backend Development', label: 'Backend Development', emoji: '⚙️', desc: 'APIs, databases, Node.js, Python' },
  { value: 'Full Stack Development', label: 'Full Stack Development', emoji: '🔗', desc: 'End-to-end systems, architecture' },
  { value: 'AI/ML Engineering', label: 'AI/ML Engineering', emoji: '🤖', desc: 'ML models, LLMs, pipelines, RAG' },
  { value: 'Data Science', label: 'Data Science', emoji: '📊', desc: 'Statistics, Python, visualization, A/B testing' },
];

const difficulties = [
  { value: 'Easy', label: 'Easy', desc: 'Concepts & definitions', color: 'from-emerald-600 to-teal-600', border: 'border-emerald-500/30', selected: 'bg-emerald-500/15' },
  { value: 'Medium', label: 'Medium', desc: 'Practical applications', color: 'from-amber-500 to-orange-500', border: 'border-amber-500/30', selected: 'bg-amber-500/15' },
  { value: 'Hard', label: 'Hard', desc: 'Architecture & advanced patterns', color: 'from-red-500 to-rose-600', border: 'border-red-500/30', selected: 'bg-red-500/15' },
];

export default function InterviewSetupPage() {
  const [selectedDomain, setSelectedDomain] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleStart = async () => {
    if (!selectedDomain || !selectedDifficulty) {
      setError('Please select both a domain and a difficulty level.');
      return;
    }

    setError('');
    setLoading(true);
    try {
      const res = await api.post('/interviews/generate', {
        domain: selectedDomain,
        difficulty: selectedDifficulty,
      });
      navigate(`/interview/${res.data.interviewId}`, { state: { interviewData: res.data } });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate interview. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Start Mock Interview</h1>
          <p className="text-slate-400 text-sm mt-1">Choose your domain and difficulty to begin a 5-question AI-evaluated session.</p>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
        )}

        {/* Domain Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-violet-400" />
            <h2 className="font-semibold text-white">Select Domain</h2>
          </div>
          <div className="space-y-3">
            {domains.map((d) => (
              <button
                key={d.value}
                id={`domain-${d.value.toLowerCase().replace(/[\s/]+/g, '-')}`}
                onClick={() => setSelectedDomain(d.value)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${
                  selectedDomain === d.value
                    ? 'bg-violet-500/15 border-violet-500/30'
                    : 'bg-white/3 border-white/6 hover:border-white/12 hover:bg-white/5'
                }`}
              >
                <div className="text-2xl">{d.emoji}</div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-white">{d.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{d.desc}</p>
                </div>
                {selectedDomain === d.value && (
                  <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center">
                    <ChevronRight className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-4 h-4 text-blue-400" />
            <h2 className="font-semibold text-white">Select Difficulty</h2>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {difficulties.map((d) => (
              <button
                key={d.value}
                id={`difficulty-${d.value.toLowerCase()}`}
                onClick={() => setSelectedDifficulty(d.value)}
                className={`p-4 rounded-2xl border transition-all text-center ${
                  selectedDifficulty === d.value
                    ? `${d.selected} ${d.border}`
                    : 'bg-white/3 border-white/6 hover:border-white/12 hover:bg-white/5'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${d.color} flex items-center justify-center mx-auto mb-2`}>
                  <BarChart2 className="w-4 h-4 text-white" />
                </div>
                <p className="font-semibold text-sm text-white">{d.label}</p>
                <p className="text-xs text-slate-500 mt-1">{d.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Summary + Start */}
        {selectedDomain && selectedDifficulty && (
          <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-600/10 to-blue-600/10 border border-violet-500/20">
            <p className="text-sm text-slate-300 mb-1">You selected:</p>
            <p className="font-semibold text-white">
              {selectedDomain} &nbsp;·&nbsp;
              <span className={`${selectedDifficulty === 'Easy' ? 'text-emerald-400' : selectedDifficulty === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                {selectedDifficulty}
              </span>
            </p>
            <p className="text-xs text-slate-500 mt-1">5 random questions will be selected from this category.</p>
          </div>
        )}

        <button
          id="start-interview-btn"
          onClick={handleStart}
          disabled={loading || !selectedDomain || !selectedDifficulty}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-2xl text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Play className="w-5 h-5" /> Begin Interview</>}
        </button>
      </div>
    </UserLayout>
  );
}
