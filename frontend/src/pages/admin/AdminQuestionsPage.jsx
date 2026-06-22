import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Save, Filter } from 'lucide-react';
import AdminLayout from '../../components/AdminLayout';
import api from '../../services/api';

const domains = ['Frontend Development', 'Backend Development', 'Full Stack Development', 'AI/ML Engineering', 'Data Science'];
const difficulties = ['Easy', 'Medium', 'Hard'];

const diffColors = {
  Easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Hard: 'bg-red-500/10 text-red-400 border-red-500/20',
};

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterDomain, setFilterDomain] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', domain: '', difficulty: '' });
  const [saving, setSaving] = useState(false);

  const fetchQuestions = async () => {
    try {
      const params = new URLSearchParams();
      if (filterDomain) params.append('domain', filterDomain);
      if (filterDifficulty) params.append('difficulty', filterDifficulty);
      const res = await api.get(`/questions?${params.toString()}`);
      setQuestions(res.data);
    } catch (err) {
      console.error('Failed to fetch questions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuestions(); }, [filterDomain, filterDifficulty]);

  const openCreate = () => { setEditing(null); setForm({ title: '', description: '', domain: '', difficulty: '' }); setShowModal(true); };
  const openEdit = (q) => { setEditing(q); setForm({ title: q.title, description: q.description, domain: q.domain, difficulty: q.difficulty }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title || !form.description || !form.domain || !form.difficulty) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/questions/${editing.id}`, form);
      } else {
        await api.post('/questions', form);
      }
      setShowModal(false);
      await fetchQuestions();
    } catch (err) {
      console.error('Save question error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this question?')) return;
    try {
      await api.delete(`/questions/${id}`);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
    } catch (err) {
      console.error('Delete question error:', err);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">Question Management</h1>
            <p className="text-slate-400 text-sm mt-1">Create, edit, and delete interview questions across all domains.</p>
          </div>
          <button
            id="create-question-btn"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />New Question
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              id="filter-domain"
              value={filterDomain}
              onChange={(e) => setFilterDomain(e.target.value)}
              className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40 appearance-none"
            >
              <option value="" className="bg-slate-900">All Domains</option>
              {domains.map((d) => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
            </select>
          </div>
          <select
            id="filter-difficulty"
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/40 appearance-none"
          >
            <option value="" className="bg-slate-900">All Difficulties</option>
            {difficulties.map((d) => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
          </select>
          <span className="px-3 py-2 text-xs text-slate-500 flex items-center">{questions.length} questions</span>
        </div>

        {/* Questions List */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-3">
            {questions.map((q) => (
              <div key={q.id} className="flex items-start gap-4 p-5 rounded-2xl bg-white/3 border border-white/6 group hover:border-white/10 transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${diffColors[q.difficulty]}`}>{q.difficulty}</span>
                    <span className="text-xs text-slate-600">{q.domain}</span>
                  </div>
                  <p className="font-semibold text-sm text-white">{q.title}</p>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{q.description}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    id={`edit-question-${q.id}`}
                    onClick={() => openEdit(q)}
                    className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 hover:bg-blue-500/20 transition-all"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    id={`delete-question-${q.id}`}
                    onClick={() => handleDelete(q.id)}
                    className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <div className="text-center py-12 text-slate-600 text-sm">No questions found for the selected filters.</div>
            )}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-[#0f1724] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">{editing ? 'Edit Question' : 'New Question'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                <input
                  id="question-title"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Question title..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Description (for candidate)</label>
                <textarea
                  id="question-description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Detailed description and context for the question..."
                  rows={4}
                  className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Domain</label>
                  <select
                    id="question-domain"
                    value={form.domain}
                    onChange={(e) => setForm({ ...form, domain: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select domain...</option>
                    {domains.map((d) => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Difficulty</label>
                  <select
                    id="question-difficulty"
                    value={form.difficulty}
                    onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                    className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50 appearance-none"
                  >
                    <option value="" className="bg-slate-900">Select...</option>
                    {difficulties.map((d) => <option key={d} value={d} className="bg-slate-900">{d}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
              <button
                id="save-question-btn"
                onClick={handleSave}
                disabled={saving || !form.title || !form.description || !form.domain || !form.difficulty}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{editing ? 'Save' : 'Create'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
