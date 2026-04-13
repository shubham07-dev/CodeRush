// ─────────────────────────────────────────────────────────
// Campus Navigate – Interactive campus map with routing
// Works for everyone (no login required)
// ─────────────────────────────────────────────────────────

import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons for Leaflet + bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// ── Campus Data ─────────────────────────────────────────
const CAMPUS_CENTER = [26.8865, 81.0585];
const CAMPUS_ZOOM = 16;

// Campus boundary polygon (approximate)
const CAMPUS_BOUNDARY = [
  [26.8895, 81.0560],
  [26.8895, 81.0600],
  [26.8825, 81.0600],
  [26.8825, 81.0560],
];

const CATEGORY_STYLES = {
  entry:          { color: '#e53e3e', emoji: '🚪', bg: '#fff5f5' },
  academic:       { color: '#2b6cb0', emoji: '🏫', bg: '#ebf8ff' },
  sports:         { color: '#38a169', emoji: '🏟️', bg: '#f0fff4' },
  facility:       { color: '#805ad5', emoji: '🏛️', bg: '#faf5ff' },
  landmark:       { color: '#d69e2e', emoji: '⛩️', bg: '#fffff0' },
  residential:    { color: '#dd6b20', emoji: '🏠', bg: '#fffaf0' },
  infrastructure: { color: '#718096', emoji: '🅿️', bg: '#f7fafc' },
  medical:        { color: '#c53030', emoji: '🏥', bg: '#fff5f5' },
  food:           { color: '#d53f8c', emoji: '🍽️', bg: '#fff5f7' },
  transport:      { color: '#2c7a7b', emoji: '🚌', bg: '#e6fffa' },
  garden:         { color: '#276749', emoji: '🌳', bg: '#f0fff4' },
  services:       { color: '#744210', emoji: '🏢', bg: '#fffff0' },
};

const BUILDINGS = [
  // ── Gates & Entry ──
  { id: 'main_gate',       name: 'Main Gate',                              lat: 26.888526, lng: 81.056818, category: 'entry',          info: 'Primary campus entrance' },
  { id: 'gate_east',       name: 'East Gate',                              lat: 26.887159, lng: 81.059814, category: 'entry',          info: 'Eastern campus gate' },
  { id: 'university_gate', name: 'University Gate',                        lat: 26.889218, lng: 81.058706, category: 'entry',          info: 'BBD University entrance' },

  // ── Academic Blocks ──
  { id: 'main_block',      name: 'Main Block',                             lat: 26.887985, lng: 81.056755, category: 'academic',       info: 'Library, Computer Lab, Architecture Dept' },
  { id: 'bbd_university',  name: 'BBD University',                         lat: 26.888654, lng: 81.058934, category: 'academic',       info: 'Main university building' },
  { id: 'h_block',         name: 'BBD H-Block',                            lat: 26.887191, lng: 81.059058, category: 'academic',       info: 'Engineering departments' },
  { id: 'bbdec',           name: 'BBDEC',                                  lat: 26.887143, lng: 81.057621, category: 'academic',       info: 'BBD Engineering College' },
  { id: 'bbditm',          name: 'BBDITM',                                 lat: 26.886769, lng: 81.056959, category: 'academic',       info: 'BBD Institute of Technology & Management' },
  { id: 'pharmacy_block',  name: 'BBDNIIT Pharmacy Block',                 lat: 26.886242, lng: 81.059323, category: 'academic',       info: 'School of Pharmacy' },
  { id: 'new_block',       name: 'New Block BBDNIIT',                      lat: 26.885866, lng: 81.058905, category: 'academic',       info: 'New academic block' },
  { id: 'admission_block', name: 'Admission Block',                        lat: 26.884994, lng: 81.058876, category: 'academic',       info: 'Student admissions office' },

  // ── Medical ──
  { id: 'dental_hospital', name: 'BBD Dental Hospital',                    lat: 26.888199, lng: 81.057541, category: 'medical',        info: 'University dental college & hospital' },

  // ── Sports ──
  { id: 'stadium',         name: 'Dr. Akhilesh Das Gupta Stadium',         lat: 26.883872, lng: 81.058574, category: 'sports',         info: 'Main sports ground & athletic track' },
  { id: 'tennis_court',    name: 'BBD Tennis Court',                        lat: 26.885585, lng: 81.058033, category: 'sports',         info: 'Campus tennis courts' },

  // ── Facilities ──
  { id: 'auditorium',      name: 'Dr. Akhilesh Das Gupta Auditorium',      lat: 26.885374, lng: 81.058550, category: 'facility',       info: 'Campus auditorium for events & seminars' },
  { id: 'student_welfare', name: 'Student Welfare',                         lat: 26.887256, lng: 81.057636, category: 'facility',       info: 'Student welfare office' },
  { id: 'bbd_fm',          name: 'BBD FM',                                  lat: 26.887538, lng: 81.057952, category: 'facility',       info: 'Campus radio station' },
  { id: 'police_station',  name: 'BBD Police Station',                      lat: 26.887193, lng: 81.059630, category: 'services',       info: 'Campus police outpost' },
  { id: 'pnb_bank',        name: 'PNB Bank',                                lat: 26.884994, lng: 81.057869, category: 'services',       info: 'Punjab National Bank branch' },

  // ── Residential ──
  { id: 'vidyavati_hostel', name: 'Vidyavati Girls Hostel',                 lat: 26.886761, lng: 81.058210, category: 'residential',    info: 'Girls hostel' },
  { id: 'girls_hostel',     name: 'Girls Hostel',                           lat: 26.886039, lng: 81.058295, category: 'residential',    info: 'Girls residential quarters' },
  { id: 'nirmala_hostel',   name: 'Dr. Nirmala Devi Girls Hostel',          lat: 26.887782, lng: 81.058545, category: 'residential',    info: 'Girls hostel' },
  { id: 'boys_hostel',      name: 'Boys Hostel A & B Block',                lat: 26.882876, lng: 81.058086, category: 'residential',    info: 'Boys residential hostel' },

  // ── Food & Dining ──
  { id: 'nescafe',          name: 'Nescafé',                                lat: 26.887143, lng: 81.058074, category: 'food',           info: 'Campus coffee shop' },
  { id: 'dominos',          name: 'Dominos BBD',                            lat: 26.887829, lng: 81.058061, category: 'food',           info: 'Domino\'s Pizza outlet' },
  { id: 'bbd_canteen',      name: 'BBD Canteen',                            lat: 26.887693, lng: 81.057872, category: 'food',           info: 'Main campus canteen' },
  { id: 'stadium_canteen',  name: 'Stadium Canteen',                        lat: 26.884647, lng: 81.058382, category: 'food',           info: 'Canteen near the stadium' },

  // ── Gardens & Landmarks ──
  { id: 'temple',           name: 'Temple',                                  lat: 26.888437, lng: 81.057134, category: 'landmark',       info: 'Campus temple' },
  { id: 'temple_garden',    name: 'Temple Garden',                           lat: 26.888578, lng: 81.057487, category: 'garden',         info: 'Garden near the temple' },
  { id: 'dental_garden',    name: 'Dental Garden',                           lat: 26.888066, lng: 81.057361, category: 'garden',         info: 'Garden near dental hospital' },
  { id: 'herbal_garden',    name: 'Herbal Garden',                           lat: 26.887380, lng: 81.058378, category: 'garden',         info: 'Medicinal herbal garden' },

  // ── Infrastructure & Transport ──
  { id: 'parking_1',        name: 'Parking Space (Main)',                    lat: 26.887726, lng: 81.056905, category: 'infrastructure', info: 'Main parking area' },
  { id: 'parking_2',        name: 'Parking Space (Inner)',                   lat: 26.886978, lng: 81.057936, category: 'infrastructure', info: 'Inner campus parking' },
  { id: 'buses',            name: 'Bus Stand',                               lat: 26.887013, lng: 81.059503, category: 'transport',      info: 'Campus bus terminal' },
  { id: 'junction',         name: 'BBD Three Road Junction',                 lat: 26.886797, lng: 81.058764, category: 'transport',      info: 'Central road junction' },
];

const MAIN_GATE = BUILDINGS.find(b => b.id === 'main_gate');

// ── Helper: check if point is inside campus ─────────────
function isInsideCampus(lat, lng) {
  // Simple bounding box check
  const lats = CAMPUS_BOUNDARY.map(p => p[0]);
  const lngs = CAMPUS_BOUNDARY.map(p => p[1]);
  return lat >= Math.min(...lats) && lat <= Math.max(...lats) &&
         lng >= Math.min(...lngs) && lng <= Math.max(...lngs);
}

// ── Custom marker icon creator ──────────────────────────
function createMarkerIcon(category) {
  const style = CATEGORY_STYLES[category] || CATEGORY_STYLES.facility;
  return L.divIcon({
    className: 'campus-marker',
    html: `<div style="
      width: 36px; height: 36px; border-radius: 50%;
      background: ${style.color}; color: white;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; box-shadow: 0 3px 10px rgba(0,0,0,0.3);
      border: 3px solid white;
    ">${style.emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

// ── User location pulsing icon ──────────────────────────
const USER_ICON = L.divIcon({
  className: 'user-location-marker',
  html: `<div style="
    width: 20px; height: 20px; border-radius: 50%;
    background: #3182ce; border: 3px solid white;
    box-shadow: 0 0 0 8px rgba(49,130,206,0.25), 0 2px 8px rgba(0,0,0,0.3);
    animation: pulse-ring 1.5s ease-out infinite;
  "></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// ── COMPONENT ───────────────────────────────────────────
export default function CampusNavigatePage({ onBack }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const userMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [userPosition, setUserPosition] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null); // { distance, time, viaGate }
  const [locating, setLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mapReady, setMapReady] = useState(false);

  // ── Initialize Map ──────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current) return; // already initialized

    const map = L.map(mapRef.current, {
      center: CAMPUS_CENTER,
      zoom: CAMPUS_ZOOM,
      zoomControl: false,
    });

    // Tile layer — clean CartoDB style
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
      maxZoom: 20,
    }).addTo(map);

    // Zoom control top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Campus boundary polygon
    L.polygon(CAMPUS_BOUNDARY, {
      color: '#b49359',
      weight: 2,
      dashArray: '8 4',
      fillColor: '#b49359',
      fillOpacity: 0.06,
    }).addTo(map);

    // Building markers
    BUILDINGS.forEach(bld => {
      const style = CATEGORY_STYLES[bld.category] || CATEGORY_STYLES.facility;
      const marker = L.marker([bld.lat, bld.lng], { icon: createMarkerIcon(bld.category) })
        .addTo(map);

      marker.bindPopup(`
        <div style="min-width:200px; font-family: 'Inter', system-ui, sans-serif;">
          <h3 style="margin:0 0 4px 0; font-size:14px; color:${style.color};">${style.emoji} ${bld.name}</h3>
          <p style="margin:0 0 4px 0; font-size:12px; color:#555;">${bld.info}</p>
          <div style="font-size:11px; color:#888; border-top:1px solid #eee; padding-top:4px; margin-top:4px;">
            📍 ${bld.lat.toFixed(6)}, ${bld.lng.toFixed(6)} &nbsp;|&nbsp; 🏷️ ${bld.category}
          </div>
          <button onclick="document.dispatchEvent(new CustomEvent('campus-navigate', { detail: '${bld.id}' }))" 
            style="margin-top:8px; width:100%; padding:0.4rem; border:none; border-radius:6px; background:#b49359; color:white; font-weight:600; cursor:pointer;"
          >
            🧭 Navigate Here
          </button>
        </div>
      `);

      marker.on('click', () => {
        setSelectedBuilding(bld);
      });
    });

    mapInstanceRef.current = map;
    setMapReady(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // ── Watch User Position ─────────────────────────────
  const startLocating = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);

    navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserPosition([latitude, longitude]);

        if (mapInstanceRef.current) {
          if (userMarkerRef.current) {
            userMarkerRef.current.setLatLng([latitude, longitude]);
          } else {
            userMarkerRef.current = L.marker([latitude, longitude], { icon: USER_ICON })
              .addTo(mapInstanceRef.current)
              .bindPopup('<b>📍 You are here</b>');
          }
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        alert('Unable to access your location. Please enable GPS and try again.');
        setLocating(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
  }, []);

  // ── Route Calculation ───────────────────────────────
  const calculateRoute = useCallback((destination) => {
    if (!userPosition || !mapInstanceRef.current) {
      alert('Please enable your location first using the "📍 My Location" button.');
      return;
    }

    // Clear previous route
    if (routeLayerRef.current) {
      mapInstanceRef.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    const map = mapInstanceRef.current;
    const insideCampus = isInsideCampus(userPosition[0], userPosition[1]);
    const viaGate = !insideCampus;

    // Build waypoints
    const waypoints = [];
    waypoints.push(L.latLng(userPosition[0], userPosition[1]));
    if (viaGate) {
      waypoints.push(L.latLng(MAIN_GATE.lat, MAIN_GATE.lng));
    }
    waypoints.push(L.latLng(destination.lat, destination.lng));

    // Use Leaflet Routing Machine
    import('leaflet-routing-machine').then(() => {
      const routeControl = L.Routing.control({
        waypoints: waypoints,
        routeWhileDragging: false,
        show: false,             // hide default itinerary panel
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: true,
        lineOptions: {
          styles: [{ color: '#b49359', weight: 5, opacity: 0.85 }],
          extendToWaypoints: true,
          missingRouteTolerance: 0,
        },
        createMarker: () => null, // don't add extra markers
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          profile: 'foot',
        }),
      }).addTo(map);

      routeControl.on('routesfound', (e) => {
        const route = e.routes[0];
        const distKm = (route.summary.totalDistance / 1000).toFixed(2);
        const timeMin = Math.ceil(route.summary.totalTime / 60);
        setRouteInfo({ distance: distKm, time: timeMin, viaGate });
      });

      routeLayerRef.current = routeControl;
    });
  }, [userPosition]);

  const [pendingRoute, setPendingRoute] = useState(null);

  const handleNavigateClick = useCallback((bld) => {
    if (!userPosition) {
      if (!locating && window.confirm(`Activate GPS to find your route to ${bld.name}?`)) {
        setPendingRoute(bld);
        startLocating();
      } else if (locating) {
        setPendingRoute(bld);
      }
    } else {
      calculateRoute(bld);
    }
  }, [userPosition, locating, startLocating, calculateRoute]);

  useEffect(() => {
    if (userPosition && pendingRoute) {
      calculateRoute(pendingRoute);
      setPendingRoute(null);
    }
  }, [userPosition, pendingRoute, calculateRoute]);

  useEffect(() => {
    const handleNav = (e) => {
      const bldId = e.detail;
      const bld = BUILDINGS.find(b => b.id === bldId);
      if (bld) {
        setSelectedBuilding(bld);
        handleNavigateClick(bld);
      }
    };
    document.addEventListener('campus-navigate', handleNav);
    return () => document.removeEventListener('campus-navigate', handleNav);
  }, [handleNavigateClick]);

  // ── Filtered buildings for search ───────────────────
  const filteredBuildings = BUILDINGS.filter(b =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.info.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // ── Fly to building on selection ────────────────────
  useEffect(() => {
    if (selectedBuilding && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([selectedBuilding.lat, selectedBuilding.lng], 18, { duration: 0.8 });
    }
  }, [selectedBuilding]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', minHeight: '85vh' }}>
      {/* ── CSS for pulse animation ─── */}
      <style>{`
        @keyframes pulse-ring {
          0% { box-shadow: 0 0 0 0 rgba(49,130,206,0.5), 0 2px 8px rgba(0,0,0,0.3); }
          70% { box-shadow: 0 0 0 15px rgba(49,130,206,0), 0 2px 8px rgba(0,0,0,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(49,130,206,0), 0 2px 8px rgba(0,0,0,0.3); }
        }
        .campus-marker { background: transparent !important; border: none !important; }
        .leaflet-routing-container { display: none !important; }
        @media (max-width: 768px) {
          .campus-legend.navigating {
            display: none !important;
          }
        }
      `}</style>

      {/* ── Map Container ─── */}
      <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: '85vh', borderRadius: '12px', overflow: 'hidden' }} />

      {/* ── Controls Panel (Top-Left) ─── */}
      <div style={{
        position: 'absolute', top: '1rem', left: '1rem', zIndex: 1000,
        width: '320px', maxHeight: 'calc(100% - 2rem)', display: 'flex', flexDirection: 'column', gap: '0.5rem',
      }}>
        {/* Header */}
        <div style={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          borderRadius: '12px', padding: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem' }}>
            {onBack && (
              <button onClick={onBack} style={{
                background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', padding: '0.2rem',
              }}>←</button>
            )}
            <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#2a241a' }}>🗺️ BBD Campus Navigator</h2>
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search buildings, departments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem 0.8rem', border: '1px solid #e2e2e2',
              borderRadius: '8px', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box',
              background: '#fafafa',
            }}
          />

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
            <button
              onClick={() => {
                if (userPosition && mapInstanceRef.current) {
                  mapInstanceRef.current.flyTo(userPosition, 18, { duration: 0.8 });
                } else if (!locating) {
                  if (window.confirm("We need your location to show where you are. Activate GPS?")) {
                    startLocating();
                  }
                }
              }}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: (locating && !userPosition) ? 'wait' : 'pointer',
                background: userPosition ? '#38a169' : '#3182ce', color: 'white', fontWeight: 600, fontSize: '0.8rem',
              }}
            >
              📍 My Location
            </button>
            {selectedBuilding && (
              <button
                onClick={() => handleNavigateClick(selectedBuilding)}
                style={{
                  flex: 1, padding: '0.5rem', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: '#b49359', color: 'white', fontWeight: 600, fontSize: '0.8rem',
                }}
              >
                🧭 Navigate
              </button>
            )}
          </div>
        </div>

        {/* Building List */}
        {searchQuery.trim().length > 0 && (
        <div style={{
          background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          maxHeight: '350px', overflowY: 'auto',
        }}>
          {filteredBuildings.length > 0 ? (
            filteredBuildings.map(bld => {
              const style = CATEGORY_STYLES[bld.category];
              const isSelected = selectedBuilding?.id === bld.id;
              return (
                <button
                  key={bld.id}
                  onClick={() => {
                    setSelectedBuilding(bld);
                    setSearchQuery(''); // Hide dropdown and show map after selection
                  }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.6rem', width: '100%',
                  padding: '0.7rem 1rem', border: 'none', borderBottom: '1px solid #f0f0f0',
                  background: isSelected ? style.bg : 'transparent',
                  cursor: 'pointer', textAlign: 'left',
                  borderLeft: isSelected ? `4px solid ${style.color}` : '4px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{
                  width: '32px', height: '32px', borderRadius: '8px', background: style.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0,
                }}>{style.emoji}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#2a241a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bld.name}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {bld.info}
                  </div>
                </div>
                </button>
              );
            })
          ) : (
            <div style={{ padding: '1.2rem', textAlign: 'center', color: '#888', fontSize: '0.85rem' }}>
              No locations found matching "{searchQuery}"
            </div>
          )}
        </div>
        )}
      </div>

      {/* ── Route Info Card (Bottom-Center) ─── */}
      {routeInfo && (
        <div style={{
          position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 1000, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)',
          borderRadius: '12px', padding: '1rem 1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: '320px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#b49359' }}>{routeInfo.distance} km</div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>Distance</div>
          </div>
          <div style={{ width: '1px', height: '40px', background: '#e2e2e2' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#2a241a' }}>{routeInfo.time} min</div>
            <div style={{ fontSize: '0.75rem', color: '#888' }}>Walking</div>
          </div>
          {routeInfo.viaGate && (
            <>
              <div style={{ width: '1px', height: '40px', background: '#e2e2e2' }} />
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e53e3e' }}>🚪 Via Main Gate</div>
                <div style={{ fontSize: '0.7rem', color: '#888' }}>You're outside campus</div>
              </div>
            </>
          )}
          <button
            onClick={() => {
              if (routeLayerRef.current && mapInstanceRef.current) {
                mapInstanceRef.current.removeControl(routeLayerRef.current);
                routeLayerRef.current = null;
              }
              setRouteInfo(null);
            }}
            style={{
              background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer',
              color: '#aaa', marginLeft: 'auto',
            }}
          >✕</button>
        </div>
      )}

      {/* ── Legend (Bottom-Right) ─── */}
      <div className={`campus-legend ${routeInfo ? 'navigating' : ''}`} style={{
        position: 'absolute', bottom: '1.5rem', right: '1rem', zIndex: 1000,
        background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
        borderRadius: '10px', padding: '0.7rem 1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        fontSize: '0.72rem',
      }}>
        <div style={{ fontWeight: 700, marginBottom: '0.3rem', color: '#2a241a' }}>Legend</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.2rem 0.8rem' }}>
          {Object.entries(CATEGORY_STYLES).map(([key, val]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <span>{val.emoji}</span>
              <span style={{ color: '#555', textTransform: 'capitalize' }}>{key}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
