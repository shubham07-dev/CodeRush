// ─────────────────────────────────────────────────────────
// Complaint Page – student complaints & status tracking
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

const STATUS_OPTIONS = {
  'pending': { label: 'Pending', cls: 'mod-badge-urgent' },
  'in-progress': { label: 'In Progress', cls: 'mod-badge-important' },
  'resolved': { label: 'Resolved', cls: 'mod-badge-success' }
};

const CATEGORIES = ['hostel', 'wifi', 'infrastructure', 'academics', 'transport', 'canteen', 'other'];

export default function ComplaintPage() {
  const { user } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Forms
  const [form, setForm] = useState({ title: '', description: '', category: 'infrastructure' });
  const [reply, setReply] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');

  const isStudent = user.role === 'student';

  useEffect(() => { loadComplaints(); }, []);

  async function loadComplaints() {
    try {
      const { data } = await api.get('/complaints');
      setComplaints(data.data.complaints);
      setStats(data.data.stats);
    } catch { /* ignore */ }
  }

  async function createComplaint(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.post('/complaints', form);
      setMsg('Complaint submitted successfully.');
      setForm({ title: '', description: '', category: 'infrastructure' });
      setShowForm(false);
      loadComplaints();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to submit complaint');
    }
    setLoading(false);
  }

  async function viewComplaint(id) {
    try {
      const { data } = await api.get(`/complaints/${id}`);
      setSelected(data.data.complaint);
      setStatusUpdate(data.data.complaint.status);
    } catch { /* ignore */ }
  }

  async function addReply(e) {
    e.preventDefault();
    if (!reply.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/complaints/${selected._id}/responses`, { message: reply });
      setSelected(data.data.complaint);
      setReply('');
      loadComplaints(); // refresh list to update stats/status
    } catch { /* ignore */ }
    setLoading(false);
  }

  async function updateStatus(e) {
    setStatusUpdate(e.target.value);
    try {
      const { data } = await api.put(`/complaints/${selected._id}/status`, { status: e.target.value });
      setSelected(data.data.complaint);
      loadComplaints();
    } catch { /* ignore */ }
  }

  return (
    <>
      <section className="mod-hero">
        <h1>🔧 Complaint Management</h1>
        <p>{isStudent ? 'Raise issues and track their resolution status.' : 'Review and resolve student complaints.'}</p>
        {isStudent && (
          <button className="btn-primary" style={{ marginTop: '0.8rem' }} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Raise Complaint'}
          </button>
        )}
      </section>

      {/* Stats row */}
      {stats && (
        <section className="mod-stats-row">
          <div className="mod-stat-card"><span className="mod-stat-value">{stats.pending}</span><span className="mod-stat-label">Pending</span></div>
          <div className="mod-stat-card"><span className="mod-stat-value">{stats.inProgress}</span><span className="mod-stat-label">In Progress</span></div>
          <div className="mod-stat-card"><span className="mod-stat-value">{stats.resolved}</span><span className="mod-stat-label">Resolved</span></div>
          <div className="mod-stat-card"><span className="mod-stat-value">{stats.total}</span><span className="mod-stat-label">Total</span></div>
        </section>
      )}

      {msg && <div className={`mod-msg${msg.includes('Failed') ? ' error' : ''}`}>{msg}</div>}

      {/* Create Form */}
      {showForm && isStudent && (
        <section className="mod-section">
          <h3 className="mod-section-title">New Complaint</h3>
          <form className="mod-form" onSubmit={createComplaint}>
            <div className="mod-form-row">
              <div className="mod-field">
                <label>Title</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  required
                />
              </div>
              <div className="mod-field">
                <label>Category</label>
                <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
            </div>
            <div className="mod-field">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                required
                rows={4}
              />
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit Complaint'}
            </button>
          </form>
        </section>
      )}

      {/* Detail Modal */}
      {selected && (
        <section className="mod-section">
          <div className="mod-section-header">
            <h3 className="mod-section-title">Ticket: {selected.title}</h3>
            <button className="btn-ghost btn-sm" onClick={() => setSelected(null)}>Close</button>
          </div>
          
          <div className="mod-notice-meta" style={{ marginBottom: '1rem' }}>
            <span className={`mod-badge ${STATUS_OPTIONS[selected.status].cls}`}>{STATUS_OPTIONS[selected.status].label}</span>
            <span style={{ textTransform: 'capitalize' }}>Category: {selected.category}</span>
            <span>By: {selected.student?.fullName}</span>
            <span>Created: {new Date(selected.createdAt).toLocaleDateString()}</span>
          </div>
          
          <div className="mod-notice-body" style={{ background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px' }}>
            {selected.description}
          </div>

          <h4 style={{ marginTop: '1.5rem', marginBottom: '0.8rem' }}>Response Thread</h4>
          <div className="mod-thread">
            {selected.responses.length === 0 ? <p className="mod-empty">No responses yet.</p> : null}
            {selected.responses.map((resp, i) => (
              <div key={i} className={`mod-thread-msg ${resp.responder._id === user.id ? 'mod-thread-mine' : ''}`}>
                <div className="mod-thread-meta">
                  <strong>{resp.responder?.fullName}</strong> ({resp.responder?.role})
                  <span>{new Date(resp.createdAt).toLocaleString()}</span>
                </div>
                <div className="mod-thread-body">{resp.message}</div>
              </div>
            ))}
          </div>

          {!isStudent && selected.status !== 'resolved' && (
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.4)', borderRadius: '8px' }}>
              <div className="mod-field" style={{ marginBottom: '0.8rem' }}>
                <label>Update Status</label>
                <select value={statusUpdate} onChange={updateStatus}>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <form onSubmit={addReply} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={reply} 
                  onChange={(e) => setReply(e.target.value)} 
                  placeholder="Type a response..." 
                  style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '1px solid var(--line)' }}
                />
                <button type="submit" className="btn-primary" disabled={loading || !reply.trim()}>Reply</button>
              </form>
            </div>
          )}
        </section>
      )}

      {/* List */}
      <section className="mod-section">
        <h3 className="mod-section-title">All Complaints</h3>
        {complaints.length === 0 ? (
          <p className="mod-empty">No complaints found.</p>
        ) : (
          <div className="mod-table-wrap">
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Student</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((c) => (
                  <tr key={c._id} onClick={() => viewComplaint(c._id)} style={{ cursor: 'pointer' }}>
                    <td>{c.title}</td>
                    <td style={{ textTransform: 'capitalize' }}>{c.category}</td>
                    <td><span className={`mod-badge ${STATUS_OPTIONS[c.status].cls}`}>{STATUS_OPTIONS[c.status].label}</span></td>
                    <td>{c.student?.fullName || '—'}</td>
                    <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
