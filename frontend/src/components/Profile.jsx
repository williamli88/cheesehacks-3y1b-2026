import { useState, useEffect, useRef } from 'react';
import { getUserItems, getLikedItems, getImpact, deleteItem, postSwipe } from '../api';
import { IMPACT_RANKS, getImpactRank } from '../impactRank';
import Dashboard from './Dashboard';
import './Profile.css';

export default function Profile({ user, viewer, profileSource, onBack, onEditListing }) {
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [showImpact, setShowImpact] = useState(false);
  const [viewMode, setViewMode] = useState('listings'); // 'listings' | 'liked'
  const [impactRank, setImpactRank] = useState(IMPACT_RANKS[0]);
  const [openMenuFor, setOpenMenuFor] = useState(null);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [undoLike, setUndoLike] = useState(null);
  const undoTimerRef = useRef(null);

  // Determine if the profile being viewed is the current logged-in user
  const viewerId = viewer ? (viewer.userId || viewer.id) : null;
  const profileId = user ? (user.userId || user.id) : null;
  const isOwn = !viewerId || viewerId === profileId;

  useEffect(() => {
    const id = user?.userId || user?.id;
    if (!id) {
      setImpactRank(IMPACT_RANKS[0]);
      return;
    }
    getImpact(id)
      .then((res) => {
        const co2 = Number(res?.data?.totalCo2Saved || 0);
        setImpactRank(getImpactRank(co2));
      })
      .catch(() => setImpactRank(IMPACT_RANKS[0]));
  }, [user]);

  useEffect(() => {
    if (!isOwn) {
      setLoadingItems(false);
      return;
    }
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
  }, [user, viewMode, isOwn, refreshKey]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (viewMode !== 'liked' && undoLike) {
      if (undoTimerRef.current) {
        window.clearTimeout(undoTimerRef.current);
        undoTimerRef.current = null;
      }
      setUndoLike(null);
    }
  }, [viewMode, undoLike]);

  const imageSrc = (src) => (typeof src === 'string' && src.trim().length > 0 ? src : null);
  const profileImageSrc = imageSrc(user.profileImageUrl || user.avatarUrl);
  const profileInitial = (user.username || 'U').trim().charAt(0).toUpperCase();
  const showBackToMatches = !isOwn && profileSource === 'matches' && typeof onBack === 'function';

  const canEmail = !isOwn && typeof user?.email === 'string' && user.email.trim().length > 0;
  const phoneNumber = !isOwn && typeof user?.phoneNumber === 'string' ? user.phoneNumber.trim() : '';
  const canMessage = phoneNumber.length > 0;

  const openEmailComposer = () => {
    if (!canEmail) return;
    const email = encodeURIComponent(user.email.trim());
    const isApplePlatform = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isApplePlatform) {
      window.location.href = `mailto:${user.email.trim()}`;
      return;
    }
    const href = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const openMessageComposer = () => {
    if (!canMessage) return;
    const normalizedPhone = phoneNumber.replace(/\s+/g, '');
    const isApplePlatform = /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isApplePlatform) {
      window.location.href = `sms:${normalizedPhone}`;
      return;
    }
    window.location.href = `sms:${normalizedPhone}`;
  };

  const handleDeleteListing = async (itemId) => {
    const confirmed = window.confirm('Delete this listing? This cannot be undone.');
    if (!confirmed) return;

    setDeletingItemId(itemId);
    try {
      await deleteItem(itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      setRefreshKey((k) => k + 1);
    } catch (e) {
      console.error('Failed to delete listing', e);
    } finally {
      setDeletingItemId(null);
      setOpenMenuFor(null);
    }
  };

  const syncRecentLikedCache = (itemId, liked) => {
    try {
      const raw = localStorage.getItem('recentLiked') || '[]';
      const parsed = JSON.parse(raw);
      const arr = Array.isArray(parsed) ? parsed : [];

      if (liked) {
        const next = [itemId, ...arr.filter((id) => id !== itemId)];
        localStorage.setItem('recentLiked', JSON.stringify(next.slice(0, 50)));
      } else {
        const next = arr.filter((id) => id !== itemId);
        localStorage.setItem('recentLiked', JSON.stringify(next));
      }
    } catch (e) {
      // ignore localStorage issues
    }
  };

  const handleUnlike = async (item) => {
    if (viewMode !== 'liked') return;
    const itemId = item?.id;
    if (!itemId) return;

    const currentIndex = items.findIndex((i) => i.id === itemId);
    if (currentIndex < 0) return;

    setItems((prev) => prev.filter((i) => i.id !== itemId));
    syncRecentLikedCache(itemId, false);

    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    setUndoLike({ item, index: currentIndex });
    undoTimerRef.current = window.setTimeout(() => {
      setUndoLike(null);
      undoTimerRef.current = null;
    }, 5000);

    const id = user?.userId || user?.id;
    if (!id) return;

    try {
      await postSwipe(id, itemId, 'LEFT');
    } catch (e) {
      console.error('Failed to unlike item', e);
    }
  };

  const handleUndoUnlike = async () => {
    if (!undoLike) return;

    const restore = undoLike;
    setUndoLike(null);
    if (undoTimerRef.current) {
      window.clearTimeout(undoTimerRef.current);
      undoTimerRef.current = null;
    }

    setItems((prev) => {
      if (prev.some((i) => i.id === restore.item.id)) return prev;
      const next = [...prev];
      const insertAt = Math.min(Math.max(restore.index, 0), next.length);
      next.splice(insertAt, 0, restore.item);
      return next;
    });
    syncRecentLikedCache(restore.item.id, true);

    const id = user?.userId || user?.id;
    if (!id) return;

    try {
      await postSwipe(id, restore.item.id, 'RIGHT');
    } catch (e) {
      console.error('Failed to restore liked item', e);
    }
  };

  // Impact data is shown in the embedded Dashboard modal; no local impact state here.

  return (
    <div className="profile-page">
      <div className="profile-header">
        {showBackToMatches && (
          <div className="profile-back-row">
            <button type="button" className="profile-back-btn" onClick={onBack}>
              ← Back to Matches
            </button>
          </div>
        )}
        <div className="profile-name-row">
          <h2>{user.username}</h2>
        </div>
        <div className="profile-rank-label">{impactRank.label}</div>
        <div className="profile-avatar-wrap">
          {profileImageSrc ? (
            <img className="profile-avatar" src={profileImageSrc} alt={`${user.username} profile`} />
          ) : (
            <div className="profile-avatar profile-avatar-fallback" aria-label={`${user.username} profile`}>
              {profileInitial}
            </div>
          )}
          <span className="profile-rank-icon" title={`Impact Rank: ${impactRank.label}`} aria-label={`Impact rank ${impactRank.label}`}>
            {impactRank.icon}
          </span>
        </div>
        {!isOwn && (
          <div className="profile-contact">
            {canEmail && (
              <button className="profile-email-btn" onClick={openEmailComposer}>
                Email
              </button>
            )}
            {phoneNumber && (
              <button className="profile-phone-btn" onClick={openMessageComposer}>
                Message: {phoneNumber}
              </button>
            )}
          </div>
        )}
      </div>

      {isOwn && (
        <div className="profile-actions">
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
            <button className="tab impact-tab" onClick={() => setShowImpact(true)}>
              View Impact
            </button>
          </div>
        </div>
      )}

      {showImpact && (
        <div className="impact-modal" onClick={() => setShowImpact(false)}>
          <div className="impact-modal-content" onClick={e => e.stopPropagation()}>
            <h4>Your Impact</h4>
            <div className="impact-dashboard-wrap">
              <Dashboard user={user} />
            </div>
            <button className="close-modal" onClick={() => setShowImpact(false)}>Close</button>
          </div>
        </div>
      )}

      {isOwn && (
        <div className="profile-items">
          <h3>{viewMode === 'liked' ? 'Liked Items' : 'Your Listings'}</h3>
          {loadingItems ? (
            <div className="small-loading">Loading items…</div>
          ) : items.length === 0 ? (
            <p>No items listed yet.</p>
          ) : (
            <div className="item-list gallery">
              {items.map(i => (
                <div key={i.id} className="item-card">
                  {isOwn && viewMode === 'listings' && (
                    <>
                      <button
                        type="button"
                        className="listing-menu-button"
                        aria-label="Listing options"
                        onClick={() => setOpenMenuFor(openMenuFor === i.id ? null : i.id)}
                      >
                        ⋮
                      </button>
                      {openMenuFor === i.id && (
                        <div className="listing-menu-wrapper">
                          <div className="listing-menu">
                            <button
                              type="button"
                              className="listing-menu-item"
                              onClick={() => {
                                if (onEditListing) onEditListing(i);
                                setOpenMenuFor(null);
                              }}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="listing-menu-item danger"
                              disabled={deletingItemId === i.id}
                              onClick={() => handleDeleteListing(i.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {imageSrc(i.imageUrl) ? (
                    <img src={imageSrc(i.imageUrl)} alt={i.title} />
                  ) : (
                    <div className="item-image-placeholder">No image</div>
                  )}
                  <div className={`item-info ${viewMode === 'liked' ? 'liked-item-info' : ''}`}>
                    <div className="item-meta">
                      <strong>{i.title}</strong>
                      <small>{i.category} • {i.condition}</small>
                    </div>
                    {viewMode === 'liked' && (
                      <button
                        type="button"
                        className="liked-remove-btn"
                        aria-label={`Unlike ${i.title}`}
                        title="Unlike"
                        onClick={() => handleUnlike(i)}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {openMenuFor !== null && (
                <button
                  type="button"
                  className="listing-menu-overlay"
                  aria-label="Close listing menu"
                  onClick={() => setOpenMenuFor(null)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {undoLike && (
        <div className="undo-like-toast" role="status" aria-live="polite">
          <span>Removed from liked items</span>
          <button type="button" onClick={handleUndoUnlike}>Undo</button>
        </div>
      )}
    </div>
  );
}
