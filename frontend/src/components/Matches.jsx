import { useState, useEffect } from 'react';
import { getMatches, confirmMatch } from '../api';
import './Matches.css';

export default function Matches({ user, openProfile }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState(null); // match id that has menu open
  const [confirmingKey, setConfirmingKey] = useState(null);

  useEffect(() => {
    getMatches(user.userId)
      .then(res => { setMatches(res.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [user.userId]);

  const imageSrc = (src) => (typeof src === 'string' && src.trim().length > 0 ? src : null);

  if (loading) {
    return <div className="matches-loading"><div className="spinner" />Loading matches...</div>;
  }

  if (error) {
    return (
      <div className="no-matches">
        <div style={{ fontSize: '2.5rem' }}>⚠️</div>
        <h3>Could not load matches</h3>
        <p>Check your connection and try again.</p>
      </div>
    );
  }

  return (
  <div className="matches-page">
      <div className="matches-header">
        <h2>Your Matches 💙</h2>
        <span className="match-count">{matches.length}</span>
      </div>

      {matches.length === 0 ? (
        <div className="no-matches">
          <div style={{ fontSize: '2.5rem' }}>💫</div>
          <h3>No matches yet</h3>
          <p>Keep swiping to find items you both love!</p>
        </div>
      ) : (
        <div className="matches-list">
          {matches.map((match, i) => (
            <div key={match.id || i} className="match-card">
              {imageSrc(match?.matchedItem?.imageUrl) ? (
                <img src={imageSrc(match.matchedItem.imageUrl)} alt={match.matchedItem.title} />
              ) : (
                <div className="match-image-placeholder">No image</div>
              )}
              <div className="match-card-info">
                <h3>{match.matchedItem.title}</h3>
                <p>Size {match.matchedItem.size} · {match.matchedItem.condition}</p>
                <p className="match-with">Matched with <strong>{match.matchedWithUsername || 'User'}</strong></p>
                <div className="match-tags">
                  {match.matchedItem.styleTags?.split(',').slice(0, 2).map((t, idx) => (
                    <span key={`match-style-${t.trim()}-${idx}`} className="tag">{t.trim()}</span>
                  ))}
                </div>
              </div>

              {/* three-dot menu button */}
              <button
                className="menu-button"
                aria-label="options"
                onClick={() => setOpenMenuFor(openMenuFor === (match.id || i) ? null : (match.id || i))}
              >
                ⋮
              </button>

              {openMenuFor === (match.id || i) && (
                <div className="match-menu-wrapper">
                  <div className="match-menu">
                    <button
                      className="match-menu-item"
                      disabled={confirmingKey === (match.id || i)}
                      onClick={() => { confirmSwap(match, match.id || i); setOpenMenuFor(null); }}
                    >
                      ✅ Confirm swap
                    </button>
                    <button className="match-menu-item danger" onClick={() => { rejectSwap(match); setOpenMenuFor(null); }}>
                      ✖️ Reject swap
                    </button>
                    <button className="match-menu-item" onClick={() => { viewProfile(match); setOpenMenuFor(null); }}>
                      👤 View profile
                    </button>
                  </div>
                  <div className="menu-overlay" onClick={() => setOpenMenuFor(null)} />
                </div>
              )}

              <div className="match-badge">✓</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Handlers: placeholder implementations — replace with real API calls as needed
  async function confirmSwap(match, matchKey) {
    const itemId = match?.matchedItem?.id;
    if (!itemId) {
      alert('Could not confirm swap: missing item id.');
      return;
    }

    setConfirmingKey(matchKey);
    try {
      await confirmMatch(user.userId || user.id, itemId);
      setMatches(prev => prev.map(m => (m === match ? { ...m, status: 'confirmed' } : m)));
      alert(`Confirmed swap for "${match.matchedItem.title}"`);
    } catch (e) {
      if (e?.response?.status === 409) {
        setMatches(prev => prev.map(m => (m === match ? { ...m, status: 'confirmed' } : m)));
        alert(`"${match.matchedItem.title}" was already confirmed.`);
      } else {
        console.error('Failed to confirm swap', e);
        alert('Could not confirm swap. Please try again.');
      }
    } finally {
      setConfirmingKey(null);
    }
  }

  function rejectSwap(match) {
    // For demo: remove the match locally
    setMatches(prev => prev.filter(m => m !== match));
    alert(`Rejected swap for "${match.matchedItem.title}"`);
  }

  function viewProfile(match) {
    // Ask parent to open profile view for the matched user.
    if (openProfile) {
      openProfile({ userId: match.matchedWithUserId, username: match.matchedWithUsername });
    } else {
      alert(`Open profile for ${match.matchedWithUsername || 'User'}`);
    }
  }
}
