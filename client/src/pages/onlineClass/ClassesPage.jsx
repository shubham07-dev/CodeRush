import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';
import LiveClassRoom from './LiveClassRoom.jsx';

export default function ClassesPage() {
  const { user } = useAuth();
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [section, setSection] = useState('');
  
  // Room entry
  const [activeClass, setActiveClass] = useState(null);

  // Socket ref for lobby connection
  const lobbySocketRef = useRef(null);

  useEffect(() => {
    fetchClasses();

    // Connect to the classes-lobby for real-time updates
    const baseURL = (import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/v1').replace('/api/v1', '');
    const lobbySocket = io(baseURL);
    lobbySocketRef.current = lobbySocket;

    lobbySocket.on('connect', () => {
      lobbySocket.emit('join-classes-lobby');
    });

    // When any class is created/ended/deleted, auto-refresh the list
    lobbySocket.on('classes-updated', () => {
      fetchClasses();
    });

    return () => {
      if (lobbySocketRef.current) {
        lobbySocketRef.current.disconnect();
      }
    };
  }, []);

  const fetchClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(data.data);
    } catch (error) {
      console.error('Failed to fetch classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/classes', { title, subject, section });
      setShowCreateForm(false);
      fetchClasses();
      setTitle('');
      setSubject('');
      setSection('');
      // Auto-join the one just created
      setActiveClass(res.data.data);
    } catch (error) {
      alert('Error creating class: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEndClass = async (classId) => {
    try {
      if (confirm('Are you sure you want to completely end this live session for everyone?')) {
        await api.put(`/classes/${classId}/end`);
        fetchClasses();
      }
    } catch (error) {
      alert('Error ending class');
    }
  };

  const handleDeleteClass = async (classId) => {
    try {
      if (confirm('Are you sure you want to permanently delete this class session record from the system?')) {
        await api.delete(`/classes/${classId}`);
        fetchClasses();
      }
    } catch (error) {
      alert('Error deleting class session');
    }
  };

  // If inside a live room, mount it.
  if (activeClass) {
    return <LiveClassRoom classData={activeClass} onLeave={() => { setActiveClass(null); fetchClasses(); }} />;
  }

  if (loading) {
    return <div className="card text-center">Loading live classes...</div>;
  }

  return (
    <div className="mod-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mod-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="mod-title" style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 800 }}>
            Live Classes
            {user.role === 'student' && <span style={{ marginLeft: '1rem', background: '#eef2ff', color: '#4f46e5', padding: '0.3rem 0.8rem', borderRadius: '99px', fontSize: '0.9rem', verticalAlign: 'middle', fontWeight: 700 }}>Sec {user.section}</span>}
          </h2>
          <p className="mod-subtitle" style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.4rem', fontWeight: 500 }}>
            {user.role === 'student' ? 'Join active virtual lectures running for your section' : 'Host live video classrooms and interactive whiteboards'}
          </p>
        </div>
        {user.role === 'teacher' && (
          <button 
            className="btn-primary" 
            onClick={() => setShowCreateForm(true)}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 8px 16px rgba(17,24,39,0.15)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>
            Start Live Class
          </button>
        )}
      </div>

      {showCreateForm && user.role === 'teacher' && (
        <div className="dash-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', borderRadius: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#111827' }}>Host Live Session</h3>
            
            <form onSubmit={handleCreateClass} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="auth-field">
                <label>Topic / Title</label>
                <div className="auth-input-wrap">
                  <input type="text" placeholder="e.g., Intro to Machine Learning" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="auth-field">
                  <label>Subject Code</label>
                  <div className="auth-input-wrap">
                    <input type="text" placeholder="CS101" value={subject} onChange={e => setSubject(e.target.value)} required />
                  </div>
                </div>
                <div className="auth-field">
                  <label>Target Section</label>
                  <div className="auth-input-wrap">
                    <input type="text" placeholder="A" value={section} onChange={e => setSection(e.target.value)} required />
                  </div>
                </div>
              </div>

              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '1rem', borderRadius: '0.8rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <span style={{ fontSize: '1.5rem' }}>🔴</span>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#991b1b', lineHeight: 1.4 }}>Going live immediately activates peer-to-peer WebRTC connections. Make sure to allow camera and microphone access.</p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateForm(false)} style={{ background: '#fff' }}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  Go Live Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Classes Grid */}
      {classes.length === 0 ? (
        <div className="mod-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(0,0,0,0.1)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
          <div style={{ color: '#4b5563', fontSize: '1.1rem', fontWeight: 600 }}>No Active Sessions</div>
          <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.4rem' }}>{user.role === 'student' ? 'There are no live classes currently running for your section.' : 'You have not hosted any virtual sessions recently.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '1.5rem' }}>
          {classes.map((c) => (
            <div key={c._id} className="mod-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.3rem 0.6rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {c.subject} • Sec {c.section}
                </span>
                
                <span style={{ 
                  display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  background: c.status === 'live' ? '#fee2e2' : '#f3f4f6',
                  color: c.status === 'live' ? '#b91c1c' : '#6b7280'
                }}>
                  {c.status === 'live' && <span style={{ display: 'block', width: '6px', height: '6px', background: '#dc2626', borderRadius: '50%', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />}
                  {c.status === 'live' ? 'LIVE NOW' : 'Ended'}
                </span>
              </div>
              
              <h3 style={{ margin: '0 0 1rem', color: '#111827', fontSize: '1.3rem', fontWeight: 800, lineHeight: 1.3 }}>{c.title}</h3>
              
              <div style={{ flex: 1, padding: '1rem', background: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #f3f4f6', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  <strong style={{ color: '#111827' }}>Instructor:</strong> {c.teacherId.fullName}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563', marginBottom: c.status === 'ended' ? '0.5rem' : '0' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <strong style={{ color: '#111827' }}>Started:</strong> {new Date(c.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </div>
                {c.status === 'ended' && c.endTime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#4b5563' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <strong style={{ color: '#111827' }}>Concluded:</strong> {new Date(c.endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </div>
                )}
              </div>

              {/* Action Buttons Zone */}
              <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                {c.status === 'live' && (
                  <button 
                    className="btn-primary" 
                    onClick={() => setActiveClass(c)}
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    Join Room
                  </button>
                )}
                
                {c.status === 'live' && user.role === 'teacher' && c.teacherId._id === user._id && (
                  <button 
                    className="btn-outline" 
                    onClick={() => handleEndClass(c._id)}
                    style={{ flex: 'none', display: 'flex', gap: '0.5rem', alignItems: 'center', color: '#e53e3e', borderColor: '#fecaca', background: '#fef2f2', padding: '0.5rem 1rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>
                    End Session
                  </button>
                )}

                {/* Newly Added Delete Action for Teachers for OBSOLETE / ENDED classes */}
                {c.status === 'ended' && user.role === 'teacher' && c.teacherId._id === user._id && (
                  <button 
                    className="btn-outline" 
                    onClick={() => handleDeleteClass(c._id)}
                    style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center', color: '#4b5563', padding: '0.5rem 1rem' }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    Permanently Delete Record
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
