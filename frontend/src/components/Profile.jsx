import { useState, useEffect } from 'react';
import { getUserItems, getLikedItems } from '../api';
import Dashboard from './Dashboard';
import './Profile.css';

export default function Profile({ user, onUpload, viewer }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showImpact, setShowImpact] = useState(false);
  const [viewMode, setViewMode] = useState('listings'); // 'listings' | 'liked'

  useEffect(() => {
    setLoadingItems(true);
    const id = user.userId || user.id;
    const fetcher = viewMode === 'liked' ? getLikedItems : getUserItems;
    fetcher(id)
      .then(res => {
        let fetched = res.data || [];
        // Merge in any recent client-side likes for immediate UX feedback.
        if (viewMode === 'liked') {
          try {
            const raw = localStorage.getItem('recentLiked') || '[]';
            const recent = JSON.parse(raw).filter(Boolean);
            if (recent.length > 0) {
              // Add any items from the server that match recent IDs (server is source of truth)
              const byId = new Map(fetched.map(i => [i.id, i]));
              // Try to fetch minimal info for recent IDs that the server hasn't returned
              // (we don't have an endpoint for single items here; instead, keep IDs and
              // rely on server refresh later). For now, dedupe and keep server items.
              fetched = fetched.filter((v, i, a) => {
                return true; // keep all server items (server authoritative)
              });
            }
          } catch (e) {
            // ignore localStorage problems
          }
        }
        setItems(fetched);
        setLoadingItems(false);
      })
      .catch(() => setLoadingItems(false));
  }, [user, viewMode]);

  const contactUrl = user.contactUrl || (user.email ? `mailto:${user.email}` : null);
  // Determine if the profile being viewed is the current logged-in user
  const viewerId = viewer ? (viewer.userId || viewer.id) : null;
  const profileId = user ? (user.userId || user.id) : null;
  const isOwn = !viewerId || viewerId === profileId;

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
          <div className="profile-tabs">
            <button
              className={`tab ${viewMode === 'listings' ? 'active' : ''}`}
              onClick={() => setViewMode('listings')}
            >
              Listings
            </button>
            <button
              className={`tab ${viewMode === 'liked' ? 'active' : ''}`}
              onClick={() => setViewMode('liked')}
            >
              Liked
            </button>
          </div>
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
        <h3>{viewMode === 'liked' ? 'Liked Items' : 'Your Listings'}</h3>
        {loadingItems ? (
          <div className="small-loading">Loading items…</div>
        ) : items.length === 0 ? (
          <p>No items listed yet.</p>
        ) : (
          <div className={`item-list ${viewMode === 'listings' ? 'gallery' : ''}`}>
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
