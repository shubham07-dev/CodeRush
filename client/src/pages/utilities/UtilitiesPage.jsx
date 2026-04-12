// ─────────────────────────────────────────────────────────
// Utilities Page – Notes, Lost & Found, Discussion (tabbed)
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

const API_BASE = 'http://localhost:5000';

// ═══════════════════════════════════════════════════════════
// Tab: Notes Sharing
// ═══════════════════════════════════════════════════════════
function NotesTab() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', subject: '', content: '' });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadNotes(); }, []);

  async function loadNotes() {
    try {
      const { data } = await api.get('/utilities/notes');
      setNotes(data.data.notes);
    } catch { /* ignore */ }
  }

  async function createNote(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('subject', form.subject);
    fd.append('content', form.content);
    if (file) fd.append('file', file);

    try {
      await api.post('/utilities/notes', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Note shared!');
      setForm({ title: '', subject: '', content: '' });
      setFile(null);
      setShowForm(false);
      loadNotes();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to share note');
    }
    setLoading(false);
  }

  async function deleteNote(id) {
    if (!confirm('Delete this note?')) return;
    try {
      await api.delete(`/utilities/notes/${id}`);
      loadNotes();
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="mod-section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="mod-section-title">📝 Shared Notes</h3>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Share Note'}
        </button>
      </div>

      {msg && <div className={`mod-msg${msg.includes('Failed') ? ' error' : ''}`}>{msg}</div>}

      {showForm && (
        <form className="mod-form" onSubmit={createNote} style={{ marginBottom: '1.5rem' }}>
          <div className="mod-form-row">
            <div className="mod-field">
              <label>Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. DSA Unit 3 Notes" />
            </div>
            <div className="mod-field">
              <label>Subject</label>
              <input type="text" value={form.subject} onChange={(e) => setForm(p => ({ ...p, subject: e.target.value }))} required placeholder="e.g. Data Structures" />
            </div>
          </div>
          <div className="mod-field">
            <label>Content (optional text)</label>
            <textarea value={form.content} onChange={(e) => setForm(p => ({ ...p, content: e.target.value }))} rows={3} placeholder="Add notes content or just attach a file…" />
          </div>
          <div className="mod-field">
            <label>Attach File</label>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mod-file-input" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Sharing…' : 'Share Note'}</button>
        </form>
      )}

      {notes.length === 0 ? (
        <p className="mod-empty">No notes shared yet. Be the first!</p>
      ) : (
        <div className="mod-cards-grid">
          {notes.map(n => (
            <div key={n._id} className="mod-util-card">
              <div className="mod-util-card-header">
                <h4>{n.title}</h4>
                <span className="mod-badge">{n.subject}</span>
              </div>
              {n.content && <p className="mod-util-excerpt">{n.content.substring(0, 120)}{n.content.length > 120 ? '…' : ''}</p>}
              {n.file && (
                <a href={`${API_BASE}${n.file.url}`} target="_blank" rel="noopener noreferrer" className="mod-attachment-link">
                  📎 {n.file.originalName}
                </a>
              )}
              <div className="mod-util-footer">
                <span>By {n.uploader?.fullName}</span>
                <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                {(n.uploader?._id === user.id || user.role === 'admin') && (
                  <button className="btn-ghost btn-xs" onClick={() => deleteNote(n._id)}>🗑️</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Lost & Found
// ═══════════════════════════════════════════════════════════
function LostFoundTab() {
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'lost', title: '', description: '', location: '', contactInfo: '' });
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadPosts(); }, [filter]);

  async function loadPosts() {
    try {
      const qs = filter ? `?type=${filter}` : '';
      const { data } = await api.get(`/utilities/lostfound${qs}`);
      setPosts(data.data.posts);
    } catch { /* ignore */ }
  }

  async function createPost(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.post('/utilities/lostfound', form);
      setMsg('Post created!');
      setForm({ type: 'lost', title: '', description: '', location: '', contactInfo: '' });
      setShowForm(false);
      loadPosts();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to post');
    }
    setLoading(false);
  }

  async function claimItem(id) {
    try {
      await api.put(`/utilities/lostfound/${id}`, { status: 'claimed' });
      loadPosts();
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="mod-section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="mod-section-title">🔍 Lost & Found</h3>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Post'}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="mod-tabs" style={{ marginBottom: '1rem' }}>
        <button className={`mod-tab${filter === '' ? ' active' : ''}`} onClick={() => setFilter('')}>All</button>
        <button className={`mod-tab${filter === 'lost' ? ' active' : ''}`} onClick={() => setFilter('lost')}>🔴 Lost</button>
        <button className={`mod-tab${filter === 'found' ? ' active' : ''}`} onClick={() => setFilter('found')}>🟢 Found</button>
      </div>

      {msg && <div className={`mod-msg${msg.includes('Failed') ? ' error' : ''}`}>{msg}</div>}

      {showForm && (
        <form className="mod-form" onSubmit={createPost} style={{ marginBottom: '1.5rem' }}>
          <div className="mod-form-row">
            <div className="mod-field">
              <label>Type</label>
              <select value={form.type} onChange={(e) => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="lost">Lost</option>
                <option value="found">Found</option>
              </select>
            </div>
            <div className="mod-field">
              <label>Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm(p => ({ ...p, title: e.target.value }))} required placeholder="e.g. Blue backpack" />
            </div>
          </div>
          <div className="mod-field">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} required rows={3} placeholder="Describe the item…" />
          </div>
          <div className="mod-form-row">
            <div className="mod-field">
              <label>Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Library, Room 401" />
            </div>
            <div className="mod-field">
              <label>Contact Info</label>
              <input type="text" value={form.contactInfo} onChange={(e) => setForm(p => ({ ...p, contactInfo: e.target.value }))} placeholder="Phone or email" />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Posting…' : 'Post'}</button>
        </form>
      )}

      {posts.length === 0 ? (
        <p className="mod-empty">No posts yet.</p>
      ) : (
        <div className="mod-cards-grid">
          {posts.map(p => (
            <div key={p._id} className={`mod-util-card ${p.status === 'claimed' ? 'mod-claimed' : ''}`}>
              <div className="mod-util-card-header">
                <span className={`mod-badge ${p.type === 'lost' ? 'mod-badge-urgent' : 'mod-badge-success'}`}>
                  {p.type === 'lost' ? '🔴 Lost' : '🟢 Found'}
                </span>
                {p.status === 'claimed' && <span className="mod-badge">Claimed</span>}
              </div>
              <h4>{p.title}</h4>
              <p className="mod-util-excerpt">{p.description.substring(0, 100)}{p.description.length > 100 ? '…' : ''}</p>
              {p.location && <p className="mod-util-meta">📍 {p.location}</p>}
              {p.contactInfo && <p className="mod-util-meta">📞 {p.contactInfo}</p>}
              <div className="mod-util-footer">
                <span>By {p.postedBy?.fullName}</span>
                <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                {p.status === 'open' && (
                  <button className="btn-ghost btn-xs" onClick={() => claimItem(p._id)}>Mark Claimed</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Tab: Peer Discussion
// ═══════════════════════════════════════════════════════════
function DiscussionTab() {
  const { user } = useAuth();
  const [discussions, setDiscussions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ question: '', details: '', tags: '' });
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadDiscussions(); }, []);

  async function loadDiscussions() {
    try {
      const { data } = await api.get('/utilities/discussions');
      setDiscussions(data.data.discussions);
    } catch { /* ignore */ }
  }

  async function createQuestion(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.post('/utilities/discussions', form);
      setMsg('Question posted!');
      setForm({ question: '', details: '', tags: '' });
      setShowForm(false);
      loadDiscussions();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to post question');
    }
    setLoading(false);
  }

  async function submitAnswer(e) {
    e.preventDefault();
    if (!answer.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/utilities/discussions/${selected._id}/answers`, { body: answer });
      setSelected(data.data.discussion);
      setAnswer('');
      loadDiscussions();
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function toggleSolved(id) {
    try {
      const { data } = await api.put(`/utilities/discussions/${id}/solved`);
      setSelected(data.data.discussion);
      loadDiscussions();
    } catch { /* ignore */ }
  }

  return (
    <>
      <div className="mod-section-header" style={{ marginBottom: '1rem' }}>
        <h3 className="mod-section-title">💬 Peer Discussion</h3>
        <button className="btn-primary btn-sm" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Ask Question'}
        </button>
      </div>

      {msg && <div className={`mod-msg${msg.includes('Failed') ? ' error' : ''}`}>{msg}</div>}

      {showForm && (
        <form className="mod-form" onSubmit={createQuestion} style={{ marginBottom: '1.5rem' }}>
          <div className="mod-field">
            <label>Question</label>
            <input type="text" value={form.question} onChange={(e) => setForm(p => ({ ...p, question: e.target.value }))} required placeholder="What do you need help with?" />
          </div>
          <div className="mod-field">
            <label>Details (optional)</label>
            <textarea value={form.details} onChange={(e) => setForm(p => ({ ...p, details: e.target.value }))} rows={3} placeholder="Provide more context…" />
          </div>
          <div className="mod-field">
            <label>Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. java, dsa, exam" />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Posting…' : 'Post Question'}</button>
        </form>
      )}

      {/* Detail view */}
      {selected && (
        <div className="mod-section" style={{ marginBottom: '1.5rem' }}>
          <div className="mod-section-header">
            <h3 className="mod-section-title">{selected.question}</h3>
            <button className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
          {selected.details && <p style={{ color: '#5d513c', marginBottom: '1rem' }}>{selected.details}</p>}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {selected.tags.map(t => <span key={t} className="mod-badge">{t}</span>)}
            <span className={`mod-badge ${selected.solved ? 'mod-badge-success' : 'mod-badge-important'}`}>
              {selected.solved ? '✅ Solved' : '❓ Open'}
            </span>
            {(selected.author?._id === user.id || selected.author === user.id || user.role === 'admin') && (
              <button className="btn-ghost btn-xs" onClick={() => toggleSolved(selected._id)}>
                {selected.solved ? 'Reopen' : 'Mark Solved'}
              </button>
            )}
          </div>

          <h4 style={{ marginBottom: '0.6rem' }}>Answers ({selected.answers.length})</h4>
          <div className="mod-thread">
            {selected.answers.length === 0 && <p className="mod-empty">No answers yet. Be the first to help!</p>}
            {selected.answers.map((a, i) => (
              <div key={i} className="mod-thread-msg">
                <div className="mod-thread-meta">
                  <strong>{a.author?.fullName || 'Anonymous'}</strong>
                  <span>{new Date(a.createdAt).toLocaleString()}</span>
                </div>
                <div className="mod-thread-body">{a.body}</div>
              </div>
            ))}
          </div>

          <form onSubmit={submitAnswer} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your answer…"
              style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--line)', background: 'rgba(255,252,245,0.9)' }}
            />
            <button type="submit" className="btn-primary" disabled={loading || !answer.trim()}>Answer</button>
          </form>
        </div>
      )}

      {/* List */}
      {discussions.length === 0 ? (
        <p className="mod-empty">No discussions yet. Ask the first question!</p>
      ) : (
        <div className="mod-cards-grid">
          {discussions.map(d => (
            <div key={d._id} className="mod-util-card" onClick={() => setSelected(d)} style={{ cursor: 'pointer' }}>
              <div className="mod-util-card-header">
                <span className={`mod-badge ${d.solved ? 'mod-badge-success' : 'mod-badge-important'}`}>
                  {d.solved ? '✅ Solved' : '❓ Open'}
                </span>
                <span style={{ fontSize: '0.78rem', color: '#6b5a40' }}>{d.answers.length} answer(s)</span>
              </div>
              <h4>{d.question}</h4>
              {d.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {d.tags.map(t => <span key={t} className="mod-badge" style={{ fontSize: '0.7rem' }}>{t}</span>)}
                </div>
              )}
              <div className="mod-util-footer">
                <span>By {d.author?.fullName}</span>
                <span>{new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════
// Main: Tabbed Container
// ═══════════════════════════════════════════════════════════
export default function UtilitiesPage() {
  const [tab, setTab] = useState('notes');

  return (
    <>
      <section className="mod-hero">
        <h1>🛠️ Student Utilities</h1>
        <p>Share notes, find lost items, and get peer help — all in one place.</p>
      </section>

      <div className="mod-tabs">
        <button className={`mod-tab${tab === 'notes' ? ' active' : ''}`} onClick={() => setTab('notes')}>📝 Notes</button>
        <button className={`mod-tab${tab === 'lostfound' ? ' active' : ''}`} onClick={() => setTab('lostfound')}>🔍 Lost & Found</button>
        <button className={`mod-tab${tab === 'discussion' ? ' active' : ''}`} onClick={() => setTab('discussion')}>💬 Discussion</button>
      </div>

      <section className="mod-section">
        {tab === 'notes' && <NotesTab />}
        {tab === 'lostfound' && <LostFoundTab />}
        {tab === 'discussion' && <DiscussionTab />}
      </section>
    </>
  );
}
