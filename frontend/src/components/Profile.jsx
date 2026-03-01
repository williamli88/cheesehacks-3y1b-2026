import { useState, useEffect } from 'react';
import { getImpact, getUserItems } from '../api';
import './Profile.css';

export default function Profile({ user, onUpload }) {
  const [impact, setImpact] = useState(null);
  const [items, setItems] = useState([]);
  const [loadingImpact, setLoadingImpact] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showImpact, setShowImpact] = useState(false);

  useEffect(() => {
    setLoadingImpact(true);
    getImpact(user.userId || user.id)
      .then(res => { setImpact(res.data); setLoadingImpact(false); })
      .catch(() => setLoadingImpact(false));

    setLoadingItems(true);
    getUserItems(user.userId || user.id)
      .then(res => { setItems(res.data); setLoadingItems(false); })
      .catch(() => setLoadingItems(false));
  }, [user]);

  const contactUrl = user.contactUrl || (user.email ? `mailto:${user.email}` : null);
  const isOwn = true; // only viewing own profile in this app

  const renderContactButton = () => {
    if (!contactUrl) return null;
    let label = 'Contact';
    if (contactUrl.startsWith('mailto:')) {
      label = 'Email';
    } else if (contactUrl.includes('instagram.com')) {
      label = 'Instagram';
    } else if (contactUrl.includes('facebook.com')) {
      label = 'Facebook';
    } else if (contactUrl.startsWith('tel:')) {
      label = 'Call';
    }

    return (
      <a href={contactUrl} className="contact-btn" target="_blank" rel="noreferrer">
        {label}
      </a>
    );
  };

  const co2 = impact?.totalCo2Saved || 0;
  const water = impact?.totalWaterSaved || 0;
  const swaps = impact?.totalSwapsCompleted || 0;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h2>{user.username}</h2>
        {renderContactButton()}
      </div>

      {isOwn && (
        <div className="profile-actions">
          <button className="upload-btn" onClick={onUpload}>Upload Item</button>
        </div>
      )}

      <div className="impact-summary">
        <h3>Impact</h3>
        <button className="impact-btn" onClick={() => setShowImpact(true)}>
          View Impact
        </button>
      </div>
      {showImpact && (
        <div className="impact-modal" onClick={() => setShowImpact(false)}>
          <div className="impact-modal-content" onClick={e => e.stopPropagation()}>
            <h4>Your Impact</h4>
            {loadingImpact ? (
              <div className="small-loading">Loading…</div>
            ) : (
              <div className="impact-numbers">
                <div>{co2.toFixed(1)} kg CO₂ saved</div>
                <div>{water.toFixed(0)} L water saved</div>
                <div>{swaps} swaps</div>
              </div>
            )}
            <button className="close-modal" onClick={() => setShowImpact(false)}>Close</button>
          </div>
        </div>
      )}

      <div className="profile-items">
        <h3>Your Listings</h3>
        {loadingItems ? (
          <div className="small-loading">Loading items…</div>
        ) : items.length === 0 ? (
          <p>No items listed yet.</p>
        ) : (
          <div className="item-list">
            {items.map(i => (
              <div key={i.id} className="item-card">
                <img src={i.imageUrl} alt={i.title} />
                <div className="item-info">
                  <strong>{i.title}</strong>
                  <small>{i.category} • {i.condition}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
