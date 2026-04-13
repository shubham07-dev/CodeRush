// ─────────────────────────────────────────────────────────
// Notice Page – campus notice board with file attachments
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

const PRIORITY_STYLES = {
  normal: { label: 'Normal', cls: '' },
  important: { label: '⚠️ Important', cls: 'mod-badge-important' },
  urgent: { label: '🔴 Urgent', cls: 'mod-badge-urgent' }
};

const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1').replace('/api/v1', '');

export default function NoticePage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ title: '', body: '', priority: 'normal', targetRoles: '' });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const canPost = user.role === 'teacher' || user.role === 'admin';

  useEffect(() => { loadNotices(); }, []);

  async function loadNotices() {
    try {
      const { data } = await api.get('/notices');
      setNotices(data.data.notices);
    } catch { /* ignore */ }
  }

  async function createNotice(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('body', form.body);
    fd.append('priority', form.priority);
    if (form.targetRoles) fd.append('targetRoles', form.targetRoles);
    for (const file of files) {
      fd.append('attachments', file);
    }

    try {
      await api.post('/notices', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMsg('Notice published!');
      setForm({ title: '', body: '', priority: 'normal', targetRoles: '' });
      setFiles([]);
      setShowForm(false);
      loadNotices();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to post notice');
    }
    setLoading(false);
  }

  async function viewNotice(id) {
    try {
      const { data } = await api.get(`/notices/${id}`);
      setSelected(data.data.notice);
    } catch { /* ignore */ }
  }

  async function deleteNotice(id) {
    if (!confirm('Delete this notice?')) return;
    try {
      await api.delete(`/notices/${id}`);
      setSelected(null);
      loadNotices();
    } catch { /* ignore */ }
  }

  return (
    <>
      <section className="mod-hero">
        <h1>📢 Notice Board</h1>
        <p>Stay updated with campus announcements and important notices.</p>
        {canPost && (
          <button
            className="btn-primary"
            style={{ marginTop: '0.8rem' }}
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : '+ Post Notice'}
          </button>
        )}
      </section>

      {msg && <div className={`mod-msg${msg.includes('Failed') ? ' error' : ''}`}>{msg}</div>}

      {/* Compose Form */}
      {showForm && canPost && (
        <section className="mod-section">
          <h3 className="mod-section-title">Compose Notice</h3>
          <form className="mod-form" onSubmit={createNotice}>
            <div className="mod-field">
              <label>Title</label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Notice title"
                required
              />
            </div>
            <div className="mod-field">
              <label>Body</label>
              <textarea
                value={form.body}
                onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))}
                placeholder="Write the notice content…"
                required
                rows={5}
              />
            </div>
            <div className="mod-form-row">
              <div className="mod-field">
                <label>Priority</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
                >
                  <option value="normal">Normal</option>
                  <option value="important">⚠️ Important</option>
                  <option value="urgent">🔴 Urgent</option>
                </select>
              </div>
              <div className="mod-field">
                <label>Target Roles (optional)</label>
                <select
                  value={form.targetRoles}
                  onChange={(e) => setForm((p) => ({ ...p, targetRoles: e.target.value }))}
                >
                  <option value="">Everyone</option>
                  <option value="student">Students only</option>
                  <option value="teacher">Teachers only</option>
                  <option value="admin">Admins only</option>
                </select>
              </div>
            </div>
            <div className="mod-field">
              <label>Attach Files (images, PDFs, docs)</label>
              <input
                type="file"
                multiple
                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv,.zip"
                onChange={(e) => setFiles(Array.from(e.target.files))}
                className="mod-file-input"
              />
              {files.length > 0 && (
                <div className="mod-file-list">
                  {files.map((f, i) => (
                    <span key={i} className="mod-file-tag">{f.name}</span>
                  ))}
                </div>
              )}
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Publishing…' : 'Publish Notice'}
            </button>
          </form>
        </section>
      )}

      {/* Notice Detail Modal */}
      {selected && (
        <section className="mod-section mod-notice-detail">
          <div className="mod-section-header">
            <h3 className="mod-section-title">{selected.title}</h3>
            <button className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
          <div className="mod-notice-meta">
            <span className={`mod-badge ${PRIORITY_STYLES[selected.priority]?.cls || ''}`}>
              {PRIORITY_STYLES[selected.priority]?.label}
            </span>
            <span>By {selected.author?.fullName} ({selected.author?.role})</span>
            <span>{new Date(selected.createdAt).toLocaleDateString()}</span>
            <span>{selected.readCount} read</span>
          </div>
          {selected.summary && (
            <div className="mod-notice-summary">
              <strong>AI Summary:</strong> {selected.summary}
            </div>
          )}
          <div className="mod-notice-body">{selected.body}</div>
          {selected.attachments?.length > 0 && (
            <div className="mod-attachments">
              <strong>Attachments:</strong>
              {selected.attachments.map((a, i) => (
                <a key={i} href={`${API_BASE}${a.url}`} target="_blank" rel="noopener noreferrer" className="mod-attachment-link">
                  📎 {a.originalName}
                </a>
              ))}
            </div>
          )}
          {(user.role === 'admin' || selected.author?._id === user.id) && (
            <button className="btn-ghost btn-sm" style={{ marginTop: '0.8rem', color: '#9b2c2c' }} onClick={() => deleteNotice(selected._id)}>
              Delete Notice
            </button>
          )}
        </section>
      )}

      {/* Notices List */}
      <section className="mod-section">
        <h3 className="mod-section-title">All Notices</h3>
        {notices.length === 0 ? (
          <p className="mod-empty">No notices posted yet.</p>
        ) : (
          <div className="mod-notice-list">
            {notices.map((n) => (
              <div
                key={n._id}
                className={`mod-notice-card${!n.isRead ? ' unread' : ''}${n.priority === 'urgent' ? ' urgent' : ''}`}
                onClick={() => viewNotice(n._id)}
              >
                <div className="mod-notice-card-header">
                  <span className={`mod-badge ${PRIORITY_STYLES[n.priority]?.cls || ''}`}>
                    {PRIORITY_STYLES[n.priority]?.label}
                  </span>
                  {!n.isRead && <span className="mod-unread-dot" />}
                </div>
                <h4>{n.title}</h4>
                <p className="mod-notice-excerpt">
                  {n.summary || n.body.substring(0, 120)}{n.body.length > 120 ? '…' : ''}
                </p>
                <div className="mod-notice-footer">
                  <span>{n.author?.fullName}</span>
                  <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                  {n.attachments?.length > 0 && <span>📎 {n.attachments.length} file(s)</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
