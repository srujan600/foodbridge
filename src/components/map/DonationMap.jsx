import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { formatDistance, getDistanceKm, getDrivingDistanceKm } from '@/lib/utils/distance';

// Fix Leaflet default marker icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const makeIcon = (color) => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

const blueIcon   = makeIcon('blue');
const orangeIcon = makeIcon('orange');
const greenIcon  = makeIcon('green');
const redIcon    = makeIcon('red');
const violetIcon = makeIcon('violet');

function FitBounds({ donations, userPos, ngos }) {
  const map = useMap();
  useEffect(() => {
    const points = donations
      .filter(d => d.latitude && d.longitude)
      .map(d => [parseFloat(d.latitude), parseFloat(d.longitude)]);
    if (userPos) points.push([userPos.lat, userPos.lng]);
    ngos?.forEach(n => { if (n.latitude && n.longitude) points.push([parseFloat(n.latitude), parseFloat(n.longitude)]); });
    if (points.length > 1) {
      map.fitBounds(points, { padding: [50, 50], maxZoom: 14 });
    } else if (points.length === 1) {
      map.setView(points[0], 13);
    }
  }, [donations, userPos, ngos, map]);
  return null;
}

const statusStyle = {
  pending:   { bg: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' },
  accepted:  { bg: '#DBEAFE', color: '#1E40AF', border: '1px solid #BFDBFE' },
  completed: { bg: '#D1FAE5', color: '#065F46', border: '1px solid #A7F3D0' },
  denied:    { bg: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' },
};

function AsyncRouteDistance({ lat1, lng1, lat2, lng2, fallbackDist }) {
  const [dist, setDist] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDist = async () => {
      setLoading(true);
      const drivingDist = await getDrivingDistanceKm(lat1, lng1, lat2, lng2);
      if (active) {
        setDist(drivingDist);
        setLoading(false);
      }
    };
    fetchDist();
    return () => { active = false; };
  }, [lat1, lng1, lat2, lng2]);

  if (loading) return <span style={{ color: '#6B7280' }}>🗺 Calculating route...</span>;
  if (dist === null) return <span>🗺 {formatDistance(fallbackDist)} (air)</span>;
  return <span>🚗 {formatDistance(dist)} drive</span>;
}

function InteractiveMarker({ position, icon, children, minWidth }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Marker 
      position={position} 
      icon={icon} 
      eventHandlers={{ 
        popupopen: () => setIsOpen(true), 
        popupclose: () => setIsOpen(false) 
      }}
    >
      <Popup minWidth={minWidth}>
        {isOpen ? children : null}
      </Popup>
    </Marker>
  );
}

export default function DonationMap({ donations, userPosition, onAccept, showAcceptButton, ngos = [], donorStats = {} }) {
  const center = userPosition || { lat: 28.6139, lng: 77.2090 };

  const getMarkerIcon = (status, email) => {
    if (status === 'accepted') return blueIcon;
    if (status === 'denied') return redIcon;
    
    // reputation logic for pending markers
    const s = donorStats[email];
    if (!s || s.count === 0) return blueIcon; // No rating / new
    const avg = s.total / s.count;
    if (avg >= 4) return greenIcon;
    if (avg >= 2) return orangeIcon;
    return redIcon;
  };

  return (
    <div className="rounded-xl overflow-hidden border border-border h-full min-h-[400px]">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        style={{ height: '100%', width: '100%', minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* User / donor location marker */}
        {userPosition && (
          <Marker position={[userPosition.lat, userPosition.lng]} icon={blueIcon}>
            <Popup>
              <div style={{ textAlign: 'center', padding: '4px' }}>
                <strong style={{ fontSize: '13px', color: '#1E40AF' }}>📍 Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* NGO office markers */}
        {ngos.map((ngo, i) => {
          const lat = parseFloat(ngo.latitude);
          const lng = parseFloat(ngo.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;
          const dist = userPosition ? getDistanceKm(userPosition.lat, userPosition.lng, lat, lng) : null;
          const waPhone = ngo.mobile && /^\d{10}$/.test(ngo.mobile) ? ngo.mobile : null;
          const waMsg = encodeURIComponent(`Hello, I'm contacting regarding the food donation on FooBridge.`);
          const waLink = waPhone ? `https://wa.me/91${waPhone}?text=${waMsg}` : null;

          return (
            <InteractiveMarker key={`ngo-${i}`} position={[lat, lng]} icon={violetIcon} minWidth={200}>
              <div style={{ padding: '4px', fontFamily: 'Inter, sans-serif' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🏢</span>
                  <strong style={{ fontSize: '13px', color: '#5B21B6' }}>{ngo.organization_name || ngo.full_name}</strong>
                </div>
                {dist !== null && userPosition && (
                  <p style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, margin: '3px 0' }}>
                    <AsyncRouteDistance 
                      lat1={userPosition.lat} lng1={userPosition.lng} 
                      lat2={lat} lng2={lng} fallbackDist={dist} 
                    />
                  </p>
                )}
                {ngo.mobile && (
                  <p style={{ fontSize: '12px', color: '#4B5563', margin: '3px 0' }}>📞 {ngo.mobile}</p>
                )}
                {waLink && (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'block', marginTop: '8px', padding: '6px 10px',
                      textAlign: 'center', background: '#22C55E', color: '#fff',
                      borderRadius: '8px', fontSize: '12px', fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    💬 Contact on WhatsApp
                  </a>
                )}
              </div>
            </InteractiveMarker>
          );
        })}

        {/* Donation markers */}
        {donations
          .filter(d => d.latitude && d.longitude)
          .map(donation => {
            const lat = parseFloat(donation.latitude);
            const lng = parseFloat(donation.longitude);
            if (isNaN(lat) || isNaN(lng)) return null;

            const dist = userPosition
              ? getDistanceKm(userPosition.lat, userPosition.lng, lat, lng)
              : null;

            const waPhone = donation.donor_mobile && /^\d{10}$/.test(donation.donor_mobile) ? donation.donor_mobile : null;
            const whatsappMsg = encodeURIComponent(
              `Hello! I am from Food Bridge NGO.\n\n📦 Food: ${donation.food_type}\n🔢 Qty: ${donation.quantity}\n📍 Location: ${donation.address}\n\nWhen can I pick it up?`
            );
            const waLink = waPhone ? `https://wa.me/91${waPhone}?text=${whatsappMsg}` : null;
            const st = statusStyle[donation.status] || statusStyle.pending;

            const stats = donorStats[donation.created_by] || { count: 0, total: 0, feedbacks: [] };
            const avgRating = stats.count > 0 ? (stats.total / stats.count).toFixed(1) : null;
            
            let badgeHtml = null;
            if (avgRating !== null && avgRating >= 4.0 && stats.count >= 5) {
              badgeHtml = <span style={{ background: '#FEF08A', color: '#854D0E', border: '1px solid #FDE047', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>🏅 Trusted Donor</span>;
            } else if (avgRating !== null && avgRating < 2.0) {
              badgeHtml = <span style={{ background: '#FECACA', color: '#991B1B', border: '1px solid #FCA5A5', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>⚠️ Low Rated</span>;
            } else if (stats.count > 0 && stats.count < 5 && avgRating >= 3.0) {
              badgeHtml = <span style={{ background: '#BFDBFE', color: '#1E40AF', border: '1px solid #93C5FD', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>🚀 Rising Donor</span>;
            } else if (stats.count === 0) {
              badgeHtml = <span style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '3px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold' }}>🌱 New Donor</span>;
            }

            return (
              <InteractiveMarker key={donation.id} position={[lat, lng]} icon={getMarkerIcon(donation.status, donation.created_by)} minWidth={260}>
                <div style={{ padding: '0px', fontFamily: 'Inter, sans-serif' }}>
                  
                  {/* Premium Header Profile Box */}
                  <div style={{ padding: '10px', background: 'linear-gradient(to right, #EFF6FF, #F8FAFC)', borderRadius: '10px 10px 0 0', borderBottom: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#0F172A', display: 'block' }}>👤 {donation.donor_name || 'Anonymous Donor'}</strong>
                          <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>
                            {stats.count === 0 ? "No donations completed yet" : `${stats.count} Total Donations Completed`}
                          </div>
                        </div>
                        {badgeHtml}
                     </div>

                     {avgRating && (
                       <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 'bold', color: '#CA8A04' }}>
                          <span style={{ fontSize: '14px' }}>⭐</span> {avgRating} / 5.0 Average
                       </div>
                     )}
                  </div>

                  <div style={{ padding: '10px' }}>
                    {/* Donation Logistics Info */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '14px', color: '#1E3A8A' }}>{donation.food_type}</strong>
                      <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: st.bg, color: st.color, border: st.border }}>
                        {donation.status}
                      </span>
                    </div>

                    <p style={{ fontSize: '12px', color: '#4B5563', margin: '3px 0' }}>📦 {donation.quantity}</p>
                    <p style={{ fontSize: '12px', color: '#4B5563', margin: '3px 0' }}>📍 {donation.address}</p>
                    {dist !== null && userPosition && (
                      <p style={{ fontSize: '12px', color: '#2563EB', fontWeight: 600, margin: '3px 0' }}>
                        <AsyncRouteDistance 
                          lat1={userPosition.lat} lng1={userPosition.lng} 
                          lat2={lat} lng2={lng} fallbackDist={dist} 
                        />
                      </p>
                    )}

                    {/* Historical Feedbacks Scroll Container */}
                    {stats.feedbacks.length > 0 && (
                      <div style={{ marginTop: '10px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '8px', maxHeight: '110px', overflowY: 'auto' }}>
                        <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.05em' }}>
                          Recent NGO Feedback
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {stats.feedbacks.slice(-3).reverse().map((fb, idx) => (
                            <div key={idx} style={{ fontSize: '11px', color: '#334155', fontStyle: 'italic', background: '#fff', padding: '5px', borderRadius: '4px', border: '1px solid #F1F5F9' }}>
                              "{fb}"
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Accept button for NGO */}
                  {showAcceptButton && donation.status === 'pending' && onAccept && (
                    <button
                      onClick={() => onAccept(donation)}
                      style={{
                        width: '100%', marginTop: '10px', padding: '7px',
                        background: 'linear-gradient(to right, #1D4ED8, #2563EB)',
                        color: '#fff', border: 'none', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      ✓ Accept Donation
                    </button>
                  )}

                  {/* WhatsApp button after accept */}
                  {donation.status === 'accepted' && waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'block', width: '100%', marginTop: '8px',
                        padding: '7px', textAlign: 'center',
                        background: '#22C55E', color: '#fff',
                        borderRadius: '8px', fontSize: '12px',
                        fontWeight: 600, textDecoration: 'none',
                      }}
                    >
                      💬 Contact Donor on WhatsApp
                    </a>
                  )}
                </div>
              </InteractiveMarker>
            );
          })}

        <FitBounds donations={donations} userPos={userPosition} ngos={ngos} />
      </MapContainer>
    </div>
  );
}