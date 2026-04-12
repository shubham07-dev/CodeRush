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

  // Form states for Teacher
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [expectedOutput, setExpectedOutput] = useState('');

  useEffect(() => {
    fetchPracticals();
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
    <div className="module-page">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <h2 className="module-title">Virtual Practicals</h2>
        {user.role === 'teacher' && (
          <button className="btn-primary" onClick={() => setShowCreateForm(!showCreateForm)}>
            {showCreateForm ? 'Cancel' : '+ New Practical'}
          </button>
        )}
      </div>

      {showCreateForm && user.role === 'teacher' && (
        <form className="card fade-in" onSubmit={handleCreatePractical} style={{ marginBottom: '2rem' }}>
          <h3>Create New Experiment</h3>
          <div style={{ display: 'grid', gap: '1rem', marginTop: '1rem' }}>
            <input 
              type="text" 
              className="input-base" 
              placeholder="Title (e.g., Array Sorting)" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              required 
            />
            <input 
              type="text" 
              className="input-base" 
              placeholder="Subject Code (e.g., CS101)" 
              value={subject} 
              onChange={e => setSubject(e.target.value)} 
              required 
            />
            <textarea 
              className="input-base" 
              placeholder="Problem Statement / Description" 
              rows="4"
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              required 
            />
            <input 
              type="text" 
              className="input-base" 
              placeholder="Expected Exact Output (e.g., Hello World)" 
              value={expectedOutput} 
              onChange={e => setExpectedOutput(e.target.value)} 
              required 
            />
            <button type="submit" className="btn-primary" style={{ justifySelf: 'start' }}>
              Publish Experiment
            </button>
          </div>
        </form>
      )}

      {practicals.length === 0 ? (
        <div className="card text-center text-secondary">
          No practicals available at the moment.
        </div>
      ) : (
        <div className="grid-responsive">
          {practicals.map((p) => (
            <div key={p._id} className="card hover-up">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span className="badge badge-primary">{p.subject}</span>
                {user.role === 'student' && (
                  <span className={`badge ${p.isCorrect ? 'badge-success' : (p.submissionStatus === 'evaluated' ? 'badge-danger' : 'badge-warning')}`}>
                    {p.isCorrect ? 'Completed' : (p.submissionStatus === 'evaluated' ? 'Attempted' : 'Pending')}
                  </span>
                )}
              </div>
              <h3 style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>{p.title}</h3>
              <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem', flex: 1 }}>
                {p.description.substring(0, 80)}{p.description.length > 80 ? '...' : ''}
              </p>

              {user.role === 'student' && (
                <button 
                  className={p.isCorrect ? 'btn-outline' : 'btn-primary'} 
                  onClick={() => setActivePractical(p)}
                  style={{ width: '100%' }}
                >
                  {p.isCorrect ? 'Review Code' : 'Solve & Execute'}
                </button>
              )}
              {user.role === 'teacher' && (
                <>
                  <div style={{ fontSize: '0.85rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '1rem', marginBottom: '1rem' }}>
                    <strong>Expected:</strong> <code>{p.expectedOutput}</code>
                  </div>
                  <button 
                    className="btn-outline" 
                    onClick={() => setActivePractical(p)}
                    style={{ width: '100%' }}
                  >
                    View Student Submissions
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
