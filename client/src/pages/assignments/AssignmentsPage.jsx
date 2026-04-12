import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';
import { DEPARTMENTS } from '../../constants.js';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  // For teachers
  const [showModal, setShowModal] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({
    title: '', description: '', subject: '', dueDate: '', 
    targetDepartment: '', targetYear: '', targetSection: ''
  });
  const [file, setFile] = useState(null);

  useEffect(() => {
    fetchAssignments();
    if (user.role === 'teacher' || user.role === 'admin') {
      fetchSubjects();
    }
  }, [user]);

  async function fetchAssignments() {
    try {
      const { data } = await api.get('/assignments');
      setAssignments(user.role === 'student' ? data.data.records : data.data.assignments);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubjects() {
    try {
      const { data } = await api.get('/subjects');
      setSubjects(data.data.subjects);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleCreateAssignment(e) {
    e.preventDefault();
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('file', file);

      await api.post('/assignments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setShowModal(false);
      fetchAssignments();
      setForm({ title: '', description: '', subject: '', dueDate: '', targetDepartment: '', targetYear: '', targetSection: '' });
      setFile(null);
    } catch (err) {
      console.error(err);
      alert('Failed to post assignment');
    }
  }

  async function handleGrade(recordId) {
    const marks = prompt('Enter marks for student:');
    if (marks === null) return;
    try {
      await api.put(`/assignments/records/${recordId}`, { marks: Number(marks) });
      alert('Graded successfully!');
    } catch (err) {
      console.error(err);
    }
  }

  async function downloadReport(assignmentId) {
    try {
      const response = await api.get(`/assignments/${assignmentId}/report/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `assignment-${assignmentId}-report.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      alert('Failed to download report');
    }
  }

  async function handleDeleteAssignment(id) {
    if (!window.confirm('Are you sure you want to completely delete this assignment and all student records?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      fetchAssignments();
    } catch (err) {
      alert('Failed to delete assignment: ' + (err.response?.data?.message || err.message));
    }
  }

  return (
    <div className="mod-container animate-fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div className="mod-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(0,0,0,0.06)', paddingBottom: '1.5rem', marginBottom: '2rem' }}>
        <div>
          <h2 className="mod-title" style={{ fontSize: '2rem', color: '#111827', margin: 0, fontWeight: 800 }}>Assignments Hub</h2>
          <p className="mod-subtitle" style={{ fontSize: '0.95rem', color: '#6b7280', marginTop: '0.4rem', fontWeight: 500 }}>
            {user.role === 'student' 
              ? 'Track deadlines and submit your coursework'
              : 'Manage assignments, track student submissions, and grade work'}
          </p>
        </div>
        {(user.role === 'teacher' || user.role === 'admin') && (
          <button 
            className="btn-primary" 
            onClick={() => setShowModal(true)}
            style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', boxShadow: '0 8px 16px rgba(17,24,39,0.15)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14"/></svg>
            Post Assignment
          </button>
        )}
      </div>

      {loading ? (
        <div className="mod-spinner-wrap"><div className="mod-spinner"/></div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {user.role === 'student' ? (
            // Student View
            assignments.length === 0 ? (
              <div className="mod-card" style={{ textAlign: 'center', padding: '4rem 2rem', background: 'rgba(255,255,255,0.5)', border: '1px dashed rgba(0,0,0,0.1)' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" style={{ margin: '0 auto 1rem' }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/></svg>
                <div style={{ color: '#4b5563', fontSize: '1.1rem', fontWeight: 600 }}>No Pending Assignments</div>
                <div style={{ color: '#9ca3af', fontSize: '0.9rem', marginTop: '0.4rem' }}>You're all caught up on your coursework!</div>
              </div>
            ) : (
              assignments.map((record) => (
                <div key={record._id} className="mod-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', background: '#fff', border: '1px solid rgba(0,0,0,0.05)', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div style={{ flex: '1 1 300px' }}>
                      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.6rem', background: '#f3f4f6', color: '#4b5563', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {record.assignment.subject?.code || 'SUBJ'}
                        </span>
                        <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#111827', fontWeight: 700 }}>{record.assignment.title}</h3>
                      </div>
                      <p style={{ margin: '0.5rem 0 0', color: '#4b5563', fontSize: '0.95rem', lineHeight: 1.5 }}>{record.assignment.description}</p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                      <span style={{ 
                        display: 'inline-flex', padding: '0.4rem 0.8rem', borderRadius: '99px', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                        background: record.status === 'completed' ? '#dcfce7' : record.status === 'submitted' ? '#dbeafe' : '#fef3c7',
                        color: record.status === 'completed' ? '#166534' : record.status === 'submitted' ? '#1e40af' : '#b45309'
                      }}>
                        {record.status === 'completed' ? 'Graded' : record.status}
                      </span>
                      {record.status === 'completed' && (
                        <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827' }}>
                          {record.marks}<span style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: 600 }}>/100</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Area */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', paddingTop: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)', flexWrap: 'wrap' }}>
                    {record.assignment.pdfAttachment && (
                      <a href={`${record.assignment.pdfAttachment}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: '#4b5563', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', padding: '0.5rem 0.8rem', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                        Resource PDF
                      </a>
                    )}
                    
                    <div style={{ flex: 1 }} />
                    
                    {record.status === 'pending' && (
                      <div style={{ position: 'relative' }}>
                        <input type="file" accept=".pdf" id={`upload-${record._id}`} style={{ opacity: 0, position: 'absolute', inset: 0, cursor: 'pointer', zIndex: 10 }} 
                          onChange={async (e) => {
                            if (!e.target.files[0]) return;
                            try {
                              const fd = new FormData();
                              fd.append('file', e.target.files[0]);
                              await api.post(`/assignments/records/${record._id}/submit`, fd, {
                                headers: { 'Content-Type': 'multipart/form-data' }
                              });
                              alert('Submitted Successfully!');
                              fetchAssignments();
                            } catch (err) {
                              alert('Submission failed: ' + (err.response?.data?.message || err.message));
                            }
                          }}
                        />
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                          Upload Homework (PDF)
                        </button>
                      </div>
                    )}
                    
                    {(record.status === 'submitted' || record.status === 'completed') && record.submissionPdf && (
                       <a href={`${record.submissionPdf}`} target="_blank" rel="noreferrer" style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', color: '#059669', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none', padding: '0.5rem 0.8rem', background: '#ecfdf5', borderRadius: '6px', border: '1px solid #a7f3d0' }}>
                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                         My Submission
                       </a>
                    )}
                  </div>
                </div>
              ))
            )
          ) : (
            // Teacher View
            assignments.length === 0 ? (
              <div className="mod-card text-center p-md text-ink-500">No assignments created yet.</div>
            ) : (
              assignments.map((assignment) => (
                <TeacherAssignmentCard key={assignment._id} assignment={assignment} downloadReport={downloadReport} deleteAssignment={handleDeleteAssignment} />
              ))
            )
          )}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="dash-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="auth-card" style={{ width: '100%', maxWidth: '560px', padding: '2.5rem', borderRadius: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 1.5rem', color: '#111827' }}>Post New Assignment</h3>
            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div className="auth-field">
                <label>Assignment Title</label>
                <div className="auth-input-wrap"><input required placeholder="e.g., Data Structures Midtern" value={form.title} onChange={e => setForm({...form, title: e.target.value})} /></div>
              </div>
              
              <div className="auth-field">
                <label>Instructions & Description</label>
                <div className="auth-input-wrap" style={{ padding: 0 }}><textarea placeholder="Provide detailed instructions..." style={{ width: '100%', border: 'none', background: 'transparent', padding: '1rem', font: 'inherit', minHeight: '100px', resize: 'vertical' }} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="auth-field">
                  <label>Subject</label>
                  <div className="auth-input-wrap">
                    <select required value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} style={{ width: '100%', border: 'none', background: 'transparent' }}>
                      <option value="" disabled>Select Subject</option>
                      {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                </div>
                <div className="auth-field">
                  <label>Strict Due Date</label>
                  <div className="auth-input-wrap"><input type="date" required value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} /></div>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <label style={{ display: 'block', fontWeight: 800, color: '#111827', marginBottom: '1rem' }}>Target Filter Scope</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                  <div className="auth-input-wrap"><select value={form.targetDepartment} onChange={e => setForm({...form, targetDepartment: e.target.value})} style={{ width: '100%', border: 'none', background: 'transparent' }}><option value="">All Depts</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select></div>
                  <div className="auth-input-wrap"><input type="number" placeholder="Year" min="1" max="6" value={form.targetYear} onChange={e => setForm({...form, targetYear: e.target.value})} /></div>
                  <div className="auth-input-wrap"><input placeholder="Sec (A)" value={form.targetSection} onChange={e => setForm({...form, targetSection: e.target.value})} /></div>
                </div>
              </div>

              <div className="auth-field" style={{ marginTop: '0.5rem' }}>
                <label>Reference Material (PDF)</label>
                <div className="auth-input-wrap" style={{ padding: '0.5rem 1rem' }}>
                  <input type="file" accept=".pdf" onChange={e => setFile(e.target.files[0])} style={{ padding: 0 }} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.8rem', marginTop: '1rem' }}>
                <button type="button" className="btn-outline" onClick={() => setShowModal(false)} style={{ background: '#fff' }}>Cancel</button>
                <button type="submit" className="btn-primary">Create Assignment</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function TeacherAssignmentCard({ assignment, downloadReport, deleteAssignment }) {
  const [expanded, setExpanded] = useState(false);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  async function fetchRecords() {
    setLoadingRecords(true);
    try {
      const { data } = await api.get(`/assignments/${assignment._id}/records`);
      setRecords(data.data.records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecords(false);
    }
  }

  function toggleExpand() {
    if (!expanded) fetchRecords();
    setExpanded(!expanded);
  }

  async function handleGradeSubmit(recordId, marks) {
    if (marks === null || marks === '') return;
    try {
      await api.put(`/assignments/records/${recordId}`, { marks: Number(marks) });
      fetchRecords(); // refresh records to show completed status
    } catch (err) {
      console.error(err);
      alert('Failed to grade');
    }
  }

  return (
    <div className="mod-card" style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 2px 10px rgba(0,0,0,0.02)', paddingBottom: expanded ? '0' : '1.5rem', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={toggleExpand}>
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0, color: '#111827', fontWeight: 800 }}>{assignment.title}</h3>
          <p style={{ margin: '0.4rem 0 0', fontSize: '0.9rem', color: '#6b7280', fontWeight: 500, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <span style={{ background: '#f3f4f6', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>{assignment.subject?.name}</span>
            <span>•</span>
            <span style={{ color: '#059669' }}>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button className="btn-outline" style={{ display: 'flex', gap: '0.4rem', color: '#e53e3e', borderColor: '#fecaca', background: '#fef2f2', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }} onClick={(e) => { e.stopPropagation(); deleteAssignment(assignment._id); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </button>
          <button className="btn-outline" style={{ display: 'flex', gap: '0.4rem', padding: '0.5rem 0.8rem', fontSize: '0.85rem' }} onClick={(e) => { e.stopPropagation(); downloadReport(assignment._id); }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
            PDF Report
          </button>
          <div style={{ padding: '0.5rem', background: '#f3f4f6', borderRadius: '50%', display: 'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
      
      {expanded && (
        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(0,0,0,0.06)', margin: '1.5rem -1.5rem 0', padding: '1.5rem', background: '#f9fafb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', padding: '0.8rem 1.25rem', borderRadius: '0.5rem', border: '1px solid #e5e7eb', marginBottom: '1.5rem' }}>
            <div style={{ fontSize: '0.85rem', color: '#4b5563', fontWeight: 600, display: 'flex', gap: '1rem' }}>
              <span><strong style={{ color: '#111827' }}>Target:</strong> {assignment.targetDepartment || 'All Depts'}</span>
              <span><strong style={{ color: '#111827' }}>Year:</strong> {assignment.targetYear || 'All'}</span>
              <span><strong style={{ color: '#111827' }}>Section:</strong> {assignment.targetSection || 'All'}</span>
            </div>
            {assignment.pdfAttachment && (
              <a href={`${assignment.pdfAttachment}`} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: '#111827', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Reference PDF
              </a>
            )}
          </div>
          
          {loadingRecords ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280' }}>Loading submissions...</div>
          ) : records.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: '#6b7280', background: '#fff', borderRadius: '0.5rem', border: '1px dashed #d1d5db' }}>
              No student records have spawned for this assignment scope.
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: '0.5rem', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead style={{ background: '#f3f4f6', color: '#4b5563', fontWeight: 600, borderBottom: '1px solid #e5e7eb' }}>
                  <tr>
                    <th style={{ padding: '0.8rem 1.25rem', fontWeight: 600 }}>Student Name</th>
                    <th style={{ padding: '0.8rem 1.25rem', fontWeight: 600 }}>Status</th>
                    <th style={{ padding: '0.8rem 1.25rem', fontWeight: 600 }}>File</th>
                    <th style={{ padding: '0.8rem 1.25rem', fontWeight: 600 }}>Grade / Marks</th>
                    <th style={{ padding: '0.8rem 1.25rem', fontWeight: 600 }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record, i) => (
                    <tr key={record._id} style={{ borderBottom: i === records.length - 1 ? 'none' : '1px solid #e5e7eb' }}>
                      <td style={{ padding: '1rem 1.25rem', fontWeight: 600, color: '#111827' }}>
                        {record.student.fullName} <span style={{ color: '#9ca3af', fontWeight: 400 }}>({record.student.section || 'N/A'})</span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        <span style={{ 
                          display: 'inline-flex', padding: '0.25rem 0.6rem', borderRadius: '99px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                          background: record.status === 'completed' ? '#dcfce7' : record.status === 'submitted' ? '#dbeafe' : '#fef3c7',
                          color: record.status === 'completed' ? '#166534' : record.status === 'submitted' ? '#1e40af' : '#b45309'
                        }}>
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {record.submissionPdf ? (
                          <a href={`${record.submissionPdf}`} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'underline' }}>View PDF</a>
                        ) : <span style={{ color: '#9ca3af' }}>No File</span>}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {record.status === 'completed' ? (
                           <span style={{ fontWeight: 800, color: '#111827', fontSize: '1.1rem' }}>{record.marks}/100</span>
                        ) : (
                          <div className="auth-input-wrap" style={{ padding: '0.2rem 0.5rem', width: '80px', borderRadius: '4px' }}>
                            <input type="number" id={`grade-${record._id}`} defaultValue={record.marks} placeholder="100" style={{ padding: '0.2rem', textAlign: 'center' }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem 1.25rem' }}>
                        {record.status !== 'completed' ? (
                          <button 
                            className="btn-primary"
                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: '6px' }}
                            onClick={() => {
                              const inputEle = document.getElementById(`grade-${record._id}`);
                              handleGradeSubmit(record._id, inputEle.value);
                            }}
                          >
                            Finalize
                          </button>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                            Graded
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
