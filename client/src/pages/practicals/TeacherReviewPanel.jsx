import { useState, useEffect } from 'react';
import api from '../../api/client.js';

export default function TeacherReviewPanel({ practical, onBack }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubmission, setActiveSubmission] = useState(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await api.get(`/practicals/${practical._id}/submissions`);
      setSubmissions(response.data.data);
    } catch (error) {
      console.error('Failed to fetch practical submissions:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="card text-center">Loading submissions...</div>;
  }

  return (
    <div className="fade-in">
      <div className="flex-between" style={{ marginBottom: '1.5rem' }}>
        <div>
          <button className="btn-outline" onClick={onBack} style={{ marginRight: '1rem', padding: '0.25rem 0.75rem' }}>← Back</button>
          <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>Reviewing: {practical.title}</span>
        </div>
      </div>

      {activeSubmission ? (
        <div className="card">
          <div className="flex-between" style={{ borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h4>Student: {activeSubmission.studentId.fullName}</h4>
            <button className="btn-outline" onClick={() => setActiveSubmission(null)}>Close Review</button>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <h5>Submitted Code ({activeSubmission.language})</h5>
              <pre style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '4px', overflowX: 'auto', border: '1px solid #e0e0e0' }}>
                {activeSubmission.codeSubmitted}
              </pre>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h5>Output from VM</h5>
                <span className={`badge ${activeSubmission.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                  {activeSubmission.isCorrect ? 'Passed' : 'Failed'}
                </span>
              </div>
              <pre style={{ background: '#1e1e1e', color: '#fff', padding: '1rem', borderRadius: '4px', overflowX: 'auto', border: '1px solid #000' }}>
                {activeSubmission.output}
              </pre>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>Total Submissions: {submissions.length}</h3>
          
          {submissions.length === 0 ? (
            <p className="text-secondary">No final submissions yet from students.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '0.75rem' }}>Student Name</th>
                  <th style={{ padding: '0.75rem' }}>Email</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Submitted At</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map(sub => (
                  <tr key={sub._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>{sub.studentId.fullName}</td>
                    <td style={{ padding: '0.75rem' }}>{sub.studentId.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${sub.isCorrect ? 'badge-success' : 'badge-danger'}`}>
                        {sub.isCorrect ? 'Correct' : 'Incorrect'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{new Date(sub.updatedAt).toLocaleString()}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <button className="btn-outline" style={{ padding: '0.2rem 0.6rem' }} onClick={() => setActiveSubmission(sub)}>
                        Review Code
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
