import { useState, useEffect } from 'react';
import { getMatches, confirmMatch, postSwipe } from '../api';
import './Matches.css';

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMetric(value, digits = 2) {
  return toNumber(value).toFixed(digits);
}

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
  const ownImage = (match) => imageSrc(
    match?.ownItem?.imageUrl
    || match?.ownItem?.image_url
    || match?.ownImageUrl
  );
  const matchedImage = (match) => imageSrc(
    match?.matchedItem?.imageUrl
    || match?.matchedItem?.image_url
  );

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
            <h3>Swap Successful!</h3>
            <p>
              You confirmed a trade with <strong>{tradeSummary.username}</strong>.
            </p>
            <p className="trade-summary-item">{tradeSummary.ownItemTitle} ↔ {tradeSummary.matchedItemTitle}</p>
            <p className="trade-summary-stats-title">You saved:</p>
            <div className="trade-summary-stats">
              <div className="trade-stat">
                <span className="label">Water</span>
                <strong>{formatMetric(tradeSummary.waterSaved)} L</strong>
              </div>
              <div className="trade-stat">
                <span className="label">Carbon</span>
                <strong>{formatMetric(tradeSummary.co2Saved)} kg CO2</strong>
              </div>
              <div className="trade-stat">
                <span className="label">Miles</span>
                <strong>{formatMetric(tradeSummary.milesNotDriven)} mi</strong>
              </div>
            </div>
            <button type="button" onClick={() => setTradeSummary(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      <div className="matches-header">
        <h2>Your Matches</h2>
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
            <div key={match.id || `${match?.ownItem?.id || 'x'}-${match?.matchedItem?.id || i}`} className="match-card">
              <div className="match-items">
                <div className="match-item-pane">
                  <div className="match-item-label">Your item</div>
                  {ownImage(match) ? (
                    <img src={ownImage(match)} alt={match?.ownItem?.title || match?.ownItemTitle || 'Your item'} />
                  ) : (
                    <div className="match-image-placeholder">No image</div>
                  )}
                  <div className="match-item-title">{match?.ownItem?.title || match?.ownItemTitle || 'Your item'}</div>
                </div>
                <div className="match-pair-divider">↔</div>
                <div className="match-item-pane">
                  <div className="match-item-label">Their item</div>
                  {matchedImage(match) ? (
                    <img src={matchedImage(match)} alt={match?.matchedItem?.title || 'Matched item'} />
                  ) : (
                    <div className="match-image-placeholder">No image</div>
                  )}
                  <div className="match-item-title">{match?.matchedItem?.title || 'Matched item'}</div>
                </div>
              </div>
              <div className="match-card-info">
                <h3>{match?.ownItem?.title || 'Your item'} ↔ {match?.matchedItem?.title || 'Matched item'}</h3>
                <p>You: {match?.ownItem?.size || '-'} · {match?.ownItem?.condition || '-'} | Them: {match?.matchedItem?.size || '-'} · {match?.matchedItem?.condition || '-'}</p>
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
    const ownItemId = match?.ownItem?.id || match?.ownItemId;
    if (!itemId) {
      console.error('Could not confirm swap: missing item id.');
      return;
    }

    setConfirmingKey(matchKey);
    try {
      const res = await confirmMatch(user.userId || user.id, itemId, ownItemId);
      const data = res?.data || {};
      setTradeSummary({
        username: match.matchedWithUsername || 'User',
        ownItemTitle: match?.ownItem?.title || 'Your item',
        matchedItemTitle: match?.matchedItem?.title || 'Matched item',
        waterSaved: data.waterSaved,
        co2Saved: data.co2Saved,
        milesNotDriven: data.milesNotDriven
      });
      // Remove all pairs that include either traded item (both are now inactive).
      setMatches(prev => prev.filter(m =>
        m?.matchedItem?.id !== itemId && m?.ownItem?.id !== ownItemId
      ));
    } catch (e) {
      if (e?.response?.status === 409) {
        const data = e?.response?.data || {};
        setTradeSummary({
          username: match.matchedWithUsername || 'User',
          ownItemTitle: match?.ownItem?.title || 'Your item',
          matchedItemTitle: match?.matchedItem?.title || 'Matched item',
          waterSaved: data.waterSaved,
          co2Saved: data.co2Saved,
          milesNotDriven: data.milesNotDriven
        });
        // already confirmed on server; also drop impacted pairs locally
        setMatches(prev => prev.filter(m =>
          m?.matchedItem?.id !== itemId && m?.ownItem?.id !== ownItemId
        ));
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
      setMatches(prev => prev.filter(m => m?.matchedItem?.id !== itemId));
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
