import React, { useEffect, useState } from 'react';
import { Plus, Search, Pencil, Trash2, X, Save, BookOpen } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import api from '../../services/api';

const COLORS = ['from-violet-600/20 to-blue-600/20', 'from-emerald-600/20 to-teal-600/20', 'from-amber-500/20 to-orange-500/20', 'from-pink-600/20 to-rose-600/20', 'from-blue-600/20 to-cyan-600/20'];

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', content: '' });
  const [saving, setSaving] = useState(false);

  const fetchNotes = async () => {
    try {
      const res = await api.get(`/notes${search ? `?search=${search}` : ''}`);
      setNotes(res.data);
    } catch (err) {
      console.error('Failed to fetch notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchNotes(), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const openCreate = () => { setEditing(null); setForm({ title: '', content: '' }); setShowModal(true); };
  const openEdit = (note) => { setEditing(note); setForm({ title: note.title, content: note.content }); setShowModal(true); };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/notes/${editing.id}`, form);
      } else {
        await api.post('/notes', form);
      }
      setShowModal(false);
      await fetchNotes();
    } catch (err) {
      console.error('Save note error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Delete note error:', err);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold font-display text-white">My Notes</h1>
            <p className="text-slate-400 text-sm mt-1">Capture interview insights and study notes.</p>
          </div>
          <button
            id="create-note-btn"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="notes-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search notes by title or content..."
            className="w-full pl-10 pr-4 py-2.5 bg-white/3 border border-white/8 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/40 focus:ring-1 focus:ring-violet-500/20 transition-all"
          />
        </div>

        {/* Notes Grid */}
        {loading ? (
          <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" /></div>
        ) : notes.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/3 border border-white/6 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-slate-600" />
            </div>
            <h2 className="font-semibold text-white mb-2">{search ? 'No notes match your search' : 'No notes yet'}</h2>
            <p className="text-sm text-slate-500 mb-6">{search ? 'Try a different search term.' : 'Create your first note to get started.'}</p>
            {!search && <button onClick={openCreate} className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm">Create Note</button>}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note, idx) => (
              <div
                key={note.id}
                className={`group relative p-5 rounded-2xl bg-gradient-to-br ${COLORS[idx % COLORS.length]} border border-white/6 hover:border-white/12 transition-all`}
              >
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    id={`edit-note-${note.id}`}
                    onClick={() => openEdit(note)}
                    className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/20 transition-all"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    id={`delete-note-${note.id}`}
                    onClick={() => handleDelete(note.id)}
                    className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400 hover:bg-red-500/25 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <h3 className="font-semibold text-white text-sm mb-2 pr-16">{note.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-4 leading-relaxed">{note.content}</p>
                <p className="text-xs text-slate-600 mt-3">{new Date(note.updatedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-lg bg-[#0f1724] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-white">{editing ? 'Edit Note' : 'New Note'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Title</label>
                <input
                  id="note-title-input"
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Note title..."
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Content</label>
                <textarea
                  id="note-content-input"
                  value={form.content}
                  onChange={(e) => setForm({ ...form, content: e.target.value })}
                  placeholder="Write your notes here..."
                  rows={8}
                  className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-5">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors">Cancel</button>
              <button
                id="save-note-btn"
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.content.trim()}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              >
                {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" />{editing ? 'Save Changes' : 'Create Note'}</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </UserLayout>
  );
}
