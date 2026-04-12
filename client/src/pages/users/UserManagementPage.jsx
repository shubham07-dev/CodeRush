import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import api from '../../api/client.js';

export default function UserManagementPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Editing state
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ fullName: '', department: '', enrollmentYear: '', section: '', rollNumber: '' });

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data } = await api.get('/users');
      setUsers(data.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Are you sure you want to permanently delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      alert('User deleted');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  }

  function startEdit(usr) {
    setEditingUser(usr);
    setEditForm({
      fullName: usr.fullName || '',
      department: usr.department || '',
      enrollmentYear: usr.enrollmentYear || '',
      section: usr.section || '',
      rollNumber: usr.rollNumber || ''
    });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    try {
      await api.put(`/users/${editingUser._id}`, editForm);
      alert('User updated');
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  }

  return (
    <div className="mod-container animate-fade-in">
      <div className="mod-hero">
        <h2 className="mod-title flex gap-2 items-center">
          <span>👥</span> Directory Management
        </h2>
        <p className="mod-subtitle">View and manage users, update records, and maintain the campus roster.</p>
      </div>

      {loading ? (
        <div className="mod-spinner-wrap"><div className="mod-spinner"/></div>
      ) : (
        <div className="mod-card">
          <div className="mod-table-wrap">
            <table className="mod-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Details</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u._id}>
                    <td className="font-medium text-ink-900">{u.fullName}</td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                        u.role === 'teacher' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-sm text-ink-500">
                      {u.role === 'student' ? (
                        <>Dept: {u.department} | Yr: {u.enrollmentYear} | Sec: {u.section || 'N/A'}</>
                      ) : (
                        <>Dept: {u.department || 'All'} | {u.campus?.name}</>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button className="text-sm text-blue-600 hover:underline" onClick={() => startEdit(u)}>Edit</button>
                        <button className="text-sm text-red-600 hover:underline" onClick={() => handleDelete(u._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingUser && (
        <div className="dash-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="mod-card" style={{ width: '100%', maxWidth: '400px' }}>
            <h3 className="text-lg font-medium mb-4">Edit User Profile</h3>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium">Full Name</label>
                <input required className="mod-input" value={editForm.fullName} onChange={e => setEditForm({...editForm, fullName: e.target.value})} />
              </div>
              
              {editingUser.role === 'student' && (
                <>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <input className="mod-input" value={editForm.department} onChange={e => setEditForm({...editForm, department: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Year</label>
                    <input type="number" min="1" className="mod-input" value={editForm.enrollmentYear} onChange={e => setEditForm({...editForm, enrollmentYear: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Section</label>
                    <input className="mod-input" value={editForm.section} onChange={e => setEditForm({...editForm, section: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Roll Number</label>
                    <input className="mod-input" value={editForm.rollNumber} onChange={e => setEditForm({...editForm, rollNumber: e.target.value})} />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" className="btn-outline" onClick={() => setEditingUser(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
