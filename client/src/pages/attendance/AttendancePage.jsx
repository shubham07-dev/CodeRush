// ─────────────────────────────────────────────────────────
// Attendance Page – teacher creates sessions, students mark
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

// ── Teacher View ────────────────────────────────────────
function TeacherAttendance() {
  const [sessions, setSessions] = useState([]);
  const [form, setForm] = useState({ subject: '', expiresInMinutes: 30 });
  const [selectedSession, setSelectedSession] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadSessions(); }, []);

  async function loadSessions() {
    try {
      const { data } = await api.get('/attendance/sessions');
      setSessions(data.data.sessions);
    } catch { /* ignore */ }
  }

  async function createSession(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const { data } = await api.post('/attendance/sessions', form);
      setMsg(`Session created! Code: ${data.data.session.qrCode}`);
      setForm({ subject: '', expiresInMinutes: 30 });
      loadSessions();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to create session');
    }
    setLoading(false);
  }

  async function viewRecords(sessionId) {
    try {
      const { data } = await api.get(`/attendance/sessions/${sessionId}/records`);
      setSelectedSession(data.data.session);
      setRecords(data.data.records);
    } catch { /* ignore */ }
  }

  return (
    <>
      <section className="mod-hero">
        <h1>📋 Attendance Management</h1>
        <p>Create sessions and track student attendance in real time.</p>
      </section>

      {/* Create Session Form */}
      <section className="mod-section">
        <h3 className="mod-section-title">Create New Session</h3>
        <form className="mod-form" onSubmit={createSession}>
          <div className="mod-form-row">
            <div className="mod-field">
              <label>Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                placeholder="e.g. Data Structures"
                required
              />
            </div>
            <div className="mod-field">
              <label>Expires in (minutes)</label>
              <input
                type="number"
                value={form.expiresInMinutes}
                onChange={(e) => setForm((p) => ({ ...p, expiresInMinutes: parseInt(e.target.value) || 30 }))}
                min={5}
                max={480}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Session'}
          </button>
        </form>
        {msg && <div className={`mod-msg${msg.includes('Failed') ? ' error' : ''}`}>{msg}</div>}
      </section>

      {/* Sessions List */}
      <section className="mod-section">
        <h3 className="mod-section-title">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="mod-empty">No sessions yet. Create one above.</p>
        ) : (
          <div className="mod-table-wrap">
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Code</th>
                  <th>Date</th>
                  <th>Expires</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr key={s._id}>
                    <td>{s.subject}</td>
                    <td><span className="mod-code">{s.qrCode}</span></td>
                    <td>{new Date(s.date).toLocaleDateString()}</td>
                    <td className={new Date(s.expiresAt) < new Date() ? 'mod-expired' : ''}>
                      {new Date(s.expiresAt) < new Date() ? 'Expired' : new Date(s.expiresAt).toLocaleTimeString()}
                    </td>
                    <td>
                      <button className="btn-ghost btn-sm" onClick={() => viewRecords(s._id)}>
                        View Records
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Session Records Modal */}
      {selectedSession && (
        <section className="mod-section">
          <div className="mod-section-header">
            <h3 className="mod-section-title">Records: {selectedSession.subject}</h3>
            <button className="btn-ghost btn-sm" onClick={() => setSelectedSession(null)}>Close</button>
          </div>
          {records.length === 0 ? (
            <p className="mod-empty">No attendance records yet.</p>
          ) : (
            <div className="mod-table-wrap">
              <table className="mod-table">
                <thead>
                  <tr><th>Student</th><th>Status</th><th>Method</th><th>Distance</th><th>Time</th></tr>
                </thead>
                <tbody>
                  {records.map((r) => (
                    <tr key={r._id}>
                      <td>{r.student?.fullName || 'Unknown'}</td>
                      <td><span className={`mod-badge mod-badge-${r.status}`}>{r.status}</span></td>
                      <td>{r.method}</td>
                      <td>{r.distanceFromCampus != null ? `${r.distanceFromCampus}m` : '—'}</td>
                      <td>{new Date(r.markedAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}

// ── Student View ────────────────────────────────────────
function StudentAttendance() {
  const [attendance, setAttendance] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [geoError, setGeoError] = useState('');

  useEffect(() => { loadMyAttendance(); }, []);

  async function loadMyAttendance() {
    try {
      const { data } = await api.get('/attendance/my');
      setAttendance(data.data);
    } catch { /* ignore */ }
  }

  async function markAttendance(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    setGeoError('');

    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data } = await api.post('/attendance/mark', {
            qrCode: code.trim(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setMsg(data.message);
          setCode('');
          loadMyAttendance();
        } catch (err) {
          setMsg(err.response?.data?.message || 'Failed to mark attendance');
        }
        setLoading(false);
      },
      (err) => {
        setGeoError(`Location access denied: ${err.message}. Please enable GPS.`);
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <>
      <section className="mod-hero">
        <h1>📋 My Attendance</h1>
        <p>Enter the session code shared by your teacher to mark attendance.</p>
      </section>

      {/* Mark Attendance Form */}
      <section className="mod-section">
        <h3 className="mod-section-title">Mark Attendance</h3>
        <form className="mod-form" onSubmit={markAttendance}>
          <div className="mod-field">
            <label>Session Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Enter code (e.g. A1B2C3D4)"
              required
              maxLength={10}
              style={{ textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}
            />
          </div>
          <p className="mod-hint">📍 Your GPS location will be verified automatically.</p>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying location…' : 'Mark Present'}
          </button>
        </form>
        {msg && <div className={`mod-msg${msg.includes('Failed') || msg.includes('away') || msg.includes('expired') || msg.includes('Invalid') || msg.includes('already') ? ' error' : ''}`}>{msg}</div>}
        {geoError && <div className="mod-msg error">{geoError}</div>}
      </section>

      {/* Attendance Stats */}
      {attendance && (
        <>
          <section className="mod-stats-row">
            <div className="mod-stat-card">
              <span className="mod-stat-value">{attendance.stats.percentage}%</span>
              <span className="mod-stat-label">Attendance</span>
            </div>
            <div className="mod-stat-card">
              <span className="mod-stat-value">{attendance.stats.present}</span>
              <span className="mod-stat-label">Present</span>
            </div>
            <div className="mod-stat-card">
              <span className="mod-stat-value">{attendance.stats.absent}</span>
              <span className="mod-stat-label">Absent</span>
            </div>
            <div className="mod-stat-card">
              <span className="mod-stat-value">{attendance.stats.total}</span>
              <span className="mod-stat-label">Total Sessions</span>
            </div>
          </section>

          {/* Percentage bar */}
          <section className="mod-section">
            <div className="mod-progress-wrap">
              <div className="mod-progress-bar" style={{ width: `${attendance.stats.percentage}%` }} />
            </div>
          </section>

          {/* History */}
          <section className="mod-section">
            <h3 className="mod-section-title">Attendance History</h3>
            {attendance.records.length === 0 ? (
              <p className="mod-empty">No records yet.</p>
            ) : (
              <div className="mod-table-wrap">
                <table className="mod-table">
                  <thead>
                    <tr><th>Subject</th><th>Date</th><th>Status</th><th>Method</th></tr>
                  </thead>
                  <tbody>
                    {attendance.records.map((r) => (
                      <tr key={r._id}>
                        <td>{r.session?.subject || '—'}</td>
                        <td>{r.session ? new Date(r.session.date).toLocaleDateString() : '—'}</td>
                        <td><span className={`mod-badge mod-badge-${r.status}`}>{r.status}</span></td>
                        <td>{r.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </>
  );
}

// ── Main Switch ─────────────────────────────────────────
export default function AttendancePage() {
  const { user } = useAuth();

  if (user.role === 'student') return <StudentAttendance />;
  return <TeacherAttendance />;
}
