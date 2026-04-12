// ─────────────────────────────────────────────────────────
// Campus Locations Page – admin manages campus coordinates
// ─────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import api from '../../api/client.js';

export default function CampusLocationsPage() {
  const [locations, setLocations] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', latitude: '', longitude: '', radiusMetres: 100 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => { loadLocations(); }, []);

  async function loadLocations() {
    try {
      const { data } = await api.get('/locations');
      setLocations(data.data.locations);
    } catch { /* ignore */ }
  }

  async function addLocation(e) {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      await api.post('/locations', {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        radiusMetres: parseInt(form.radiusMetres)
      });
      setMsg('Location added!');
      setForm({ name: '', address: '', latitude: '', longitude: '', radiusMetres: 100 });
      setShowForm(false);
      loadLocations();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Failed to add location');
    }
    setLoading(false);
  }

  async function deleteLocation(id) {
    if (!confirm('Delete this campus location?')) return;
    try {
      await api.delete(`/locations/${id}`);
      loadLocations();
    } catch { /* ignore */ }
  }

  return (
    <>
      <section className="mod-hero">
        <h1>📍 Campus Locations</h1>
        <p>Manage college GPS coordinates used for geolocation-based attendance.</p>
        <button className="btn-primary" style={{ marginTop: '0.8rem' }} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Location'}
        </button>
      </section>

      {msg && <div className={`mod-msg${msg.includes('Failed') ? ' error' : ''}`}>{msg}</div>}

      {showForm && (
        <section className="mod-section">
          <h3 className="mod-section-title">Add New Campus Location</h3>
          <form className="mod-form" onSubmit={addLocation}>
            <div className="mod-form-row">
              <div className="mod-field">
                <label>Name</label>
                <input type="text" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g. BBD NIIT Main Block" />
              </div>
              <div className="mod-field">
                <label>Address</label>
                <input type="text" value={form.address} onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" />
              </div>
            </div>
            <div className="mod-form-row">
              <div className="mod-field">
                <label>Latitude</label>
                <input type="number" step="any" value={form.latitude} onChange={(e) => setForm(p => ({ ...p, latitude: e.target.value }))} required placeholder="26.886316" />
              </div>
              <div className="mod-field">
                <label>Longitude</label>
                <input type="number" step="any" value={form.longitude} onChange={(e) => setForm(p => ({ ...p, longitude: e.target.value }))} required placeholder="81.059048" />
              </div>
              <div className="mod-field">
                <label>Radius (metres)</label>
                <input type="number" value={form.radiusMetres} onChange={(e) => setForm(p => ({ ...p, radiusMetres: e.target.value }))} min={10} max={5000} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Adding…' : 'Add Location'}</button>
          </form>
        </section>
      )}

      {/* Locations list */}
      <section className="mod-section">
        <h3 className="mod-section-title">Registered Campuses</h3>
        {locations.length === 0 ? (
          <p className="mod-empty">No campus locations registered.</p>
        ) : (
          <div className="mod-cards-grid">
            {locations.map(loc => (
              <div key={loc._id} className="mod-util-card">
                <h4>{loc.name}</h4>
                {loc.address && <p className="mod-util-meta">📫 {loc.address}</p>}
                <div className="mod-location-coords">
                  <span>📍 {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}</span>
                  <span>📏 Radius: {loc.radiusMetres}m</span>
                </div>
                <div className="mod-util-footer">
                  <span className={`mod-badge ${loc.isActive ? 'mod-badge-success' : 'mod-badge-urgent'}`}>
                    {loc.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span>Added {new Date(loc.createdAt).toLocaleDateString()}</span>
                  <button className="btn-ghost btn-xs" onClick={() => deleteLocation(loc._id)} style={{ color: '#9b2c2c' }}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
