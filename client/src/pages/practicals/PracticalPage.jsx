import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';
import VirtualCodeEditor from './VirtualCodeEditor.jsx';
import TeacherReviewPanel from './TeacherReviewPanel.jsx';

export default function PracticalPage() {
  const { user } = useAuth();
  const [practicals, setPracticals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePractical, setActivePractical] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Form states for Teacher
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  useEffect(() => {
    fetchPracticals();

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchPracticals = async () => {
    try {
      const { data } = await api.get('/practicals');
      setPracticals(data.data);
    } catch (error) {
      console.error('Failed to fetch practicals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePractical = async (e) => {
    e.preventDefault();
    try {
      await api.post('/practicals', {
        title,
        description,
        subject,
        expectedOutput
      });
      setShowCreateForm(false);
      fetchPracticals();
      // reset
      setTitle('');
      setDescription('');
      setSubject('');
      setExpectedOutput('');
    } catch (error) {
      alert('Error creating practical: ' + (error.response?.data?.message || error.message));
    }
  };

  if (loading) {
    return <div className="card text-center">Loading practicals...</div>;
  }

  if (isMobile) {
    return (
      <div className="page-shell" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="card text-center" style={{ padding: '3rem 2rem', borderTop: '4px solid #e53e3e' }}>
          <h2 style={{ margin: '0 0 1rem', color: '#111827' }}>Desktop Required</h2>
          <p style={{ color: '#4b5563', fontSize: '1.05rem' }}>
            Please open the Practical Editor on a laptop or desktop.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.85rem', marginTop: '1rem' }}>
            Coding environments require wider screens to function properly.
          </p>
        </div>
      </div>
    );
  }

  // Student view active practical
  if (activePractical && user.role === 'student') {
    return (
      <VirtualCodeEditor 
        practical={activePractical} 
        onBack={() => {
          setActivePractical(null);
          fetchPracticals(); // Refresh status on back
        }} 
      />
    );
  }

  // Teacher review active practical
  if (activePractical && user.role === 'teacher') {
    return (
      <TeacherReviewPanel 
        practical={activePractical} 
        onBack={() => setActivePractical(null)} 
      />
    );
  }

  return (
    <div className="mod-container animate-fade-in" style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="mod-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="mod-title" style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 800 }}>Virtual Practicals</h2>
          <p className="mod-subtitle" style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.4rem', fontWeight: 500 }}>
            {user.role === 'student' ? 'Access your automated code evaluation environments' : 'Create sandbox experiments and track student execution'}
          </p>
        </div>
        {user.role === 'teacher' && (
          <button 
            className="btn-primary" 
            onClick={() => setShowCreateForm(true)}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 8px 16px rgba(17,24,39,0.15)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            New Practical
          </button>
        )}
      </div>

      {/* Create Modal */}
      {showCreateForm && user.role === 'teacher' && (
        <div className="dash-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: '560px', padding: '2.5rem', borderRadius: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#111827' }}>Create New Experiment</h3>
            
            <form onSubmit={handleCreatePractical} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className="auth-field">
                <label>Practical Title</label>
                <div className="auth-input-wrap">
                  <input type="text" placeholder="e.g., Array Sorting Algorithms" value={title} onChange={e => setTitle(e.target.value)} required />
                </div>
              </div>
              
              <div className="auth-field">
                <label>Subject Code</label>
                <div className="auth-input-wrap">
                  <input type="text" placeholder="e.g., CS101" value={subject} onChange={e => setSubject(e.target.value)} required />
                </div>
              </div>
              
              <div className="auth-field">
                <label>Problem Statement</label>
                <div className="auth-input-wrap" style={{ padding: 0 }}>
                  <textarea placeholder="Write the code requirements..." rows="4" style={{ width: '100%', border: 'none', background: 'transparent', padding: '1rem', font: 'inherit', resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} required />
                </div>
              </div>

              <div className="auth-field" style={{ background: '#f3f4f6', padding: '1rem', borderRadius: '0.8rem', border: '1px solid #e5e7eb' }}>
                <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: '#111827' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
                  Expected Strict Output
                </label>
                <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0.2rem 0 0.8rem' }}>The student's compiled code output MUST match this string exactly (case-sensitive) to auto-pass.</p>
                <div className="auth-input-wrap" style={{ background: '#fff' }}>
                  <input type="text" style={{ fontFamily: 'monospace' }} placeholder="Hello World" value={expectedOutput} onChange={e => setExpectedOutput(e.target.value)} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowCreateForm(false)} style={{ background: '#fff' }}>Cancel</button>
                <button type="submit" className="btn-primary">Publish Experiment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Practical List */}
      {practicals.length === 0 ? (
        <div className="mod-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(0,0,0,0.1)' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          <div style={{ color: '#4b5563', fontSize: '1.1rem', fontWeight: 600 }}>No Virtual Practicals Found</div>
          <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.4rem' }}>{user.role === 'teacher' ? 'Click "New Practical" to spawn a coding sandbox.' : 'You have no pending code evaluation tasks.'}</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {practicals.map((p) => (
            <div key={p._id} className="mod-card" style={{ display: 'flex', flexDirection: 'column', padding: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 800, padding: '0.3rem 0.6rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {p.subject}
                </span>
                
                {user.role === 'student' && (
                  <span style={{ 
                    fontSize: '0.75rem', fontWeight: 800, padding: '0.3rem 0.6rem', borderRadius: '99px', textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: p.isFinal ? '#dcfce7' : (p.submissionStatus === 'evaluated' ? '#fef3c7' : '#fee2e2'),
                    color: p.isFinal ? '#166534' : (p.submissionStatus === 'evaluated' ? '#b45309' : '#b91c1c')
                  }}>
                    {p.isFinal ? 'Completed' : (p.submissionStatus === 'evaluated' ? 'Attempted' : 'Pending')}
                  </span>
                )}
              </div>
              
              <h3 style={{ margin: '0 0 0.5rem', color: '#111827', fontSize: '1.3rem', fontWeight: 800 }}>{p.title}</h3>
              <p style={{ color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5, flex: 1, margin: '0 0 1.5rem' }}>
                {p.description.substring(0, 100)}{p.description.length > 100 ? '...' : ''}
              </p>

              {user.role === 'teacher' && (
                <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '0.8rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                  <div style={{ color: '#6b7280', fontWeight: 600, fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Expected Output Match</div>
                  <code style={{ color: '#111827', background: '#fff', padding: '0.2rem 0.4rem', border: '1px solid #d1d5db', borderRadius: '4px', display: 'block', overflowX: 'auto' }}>
                    {p.expectedOutput}
                  </code>
                </div>
              )}

              <button 
                className="btn-primary" 
                onClick={() => setActivePractical(p)}
                style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center',
                  background: user.role === 'student' && p.isFinal ? '#f3f4f6' : '#111827',
                  color: user.role === 'student' && p.isFinal ? '#111827' : '#fff'
                }}
              >
                {user.role === 'student' ? (
                  p.isFinal ? (
                    <> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Review Code </> 
                  ) : (
                    <> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> Open Virtual IDE </>
                  )
                ) : (
                  <> <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></svg> View Student Tests </>
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
