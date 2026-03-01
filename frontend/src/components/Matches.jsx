import { useState, useEffect } from 'react';
import { getMatches, confirmMatch, postSwipe } from '../api';
import './Matches.css';

export default function Matches({ user, openProfile }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openMenuFor, setOpenMenuFor] = useState(null); // match id that has menu open
  const [confirmingKey, setConfirmingKey] = useState(null);
  const [rejectingKey, setRejectingKey] = useState(null);
  const [tradeSummary, setTradeSummary] = useState(null);

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
      {tradeSummary && (
        <div className="trade-summary-overlay" onClick={() => setTradeSummary(null)}>
          <div className="trade-summary-card" onClick={(e) => e.stopPropagation()}>
            <h3>Trade Confirmed</h3>
            <p>
              You confirmed a trade with <strong>{tradeSummary.username}</strong>.
            </p>
            <p className="trade-summary-item">{tradeSummary.itemTitle}</p>
            <button type="button" onClick={() => setTradeSummary(null)}>
              Close
            </button>
          </div>
        </div>
      )}

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
                    <button
                      className="match-menu-item danger"
                      disabled={rejectingKey === (match.id || i)}
                      onClick={() => { rejectSwap(match, match.id || i); setOpenMenuFor(null); }}
                    >
                      ✖️ Reject swap
                    </button>
                    <button className="match-menu-item" onClick={() => { viewProfile(match); setOpenMenuFor(null); }}>
                      📇 Contact
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
      console.error('Could not confirm swap: missing item id.');
      return;
    }

    setConfirmingKey(matchKey);
    try {
      await confirmMatch(user.userId || user.id, itemId);
      setTradeSummary({
        username: match.matchedWithUsername || 'User',
        itemTitle: match?.matchedItem?.title || 'Trade item'
      });
      // remove confirmed match locally
      setMatches(prev => prev.filter(m => m !== match));
    } catch (e) {
      if (e?.response?.status === 409) {
        setTradeSummary({
          username: match.matchedWithUsername || 'User',
          itemTitle: match?.matchedItem?.title || 'Trade item'
        });
        // already confirmed on server; also drop locally
        setMatches(prev => prev.filter(m => m !== match));
      } else {
        console.error('Failed to confirm swap', e);
      }
    } finally {
      setConfirmingKey(null);
    }
  }

  async function rejectSwap(match, matchKey) {
    const itemId = match?.matchedItem?.id;
    if (!itemId) {
      console.error('Could not reject swap: missing item id.');
      return;
    }

    setRejectingKey(matchKey);
    try {
      // Persist reject as a LEFT swipe so the match is removed server-side.
      await postSwipe(user.userId || user.id, itemId, 'LEFT');
      setMatches(prev => prev.filter(m => m !== match));
    } catch (e) {
      console.error('Failed to reject swap', e);
    } finally {
      setRejectingKey(null);
    }
  }

  function viewProfile(match) {
    // Ask parent to open profile view for the matched user.
    if (openProfile) {
      openProfile({
        userId: match.matchedWithUserId,
        username: match.matchedWithUsername,
        email: match.matchedWithEmail,
        phoneNumber: match.matchedWithPhoneNumber,
        contactUrl: match.matchedWithContactUrl
      });
    } else {
      alert(`Open profile for ${match.matchedWithUsername || 'User'}`);
    }
  }
}
