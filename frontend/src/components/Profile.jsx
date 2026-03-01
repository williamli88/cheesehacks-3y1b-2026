import { useState, useEffect } from 'react';
import { getUserItems } from '../api';
import Dashboard from './Dashboard';
import './Profile.css';

export default function Profile({ user, onUpload }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showImpact, setShowImpact] = useState(false);

  useEffect(() => {
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

  // Impact data is shown in the embedded Dashboard modal; no local impact state here.

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
            <Dashboard user={user} />
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
