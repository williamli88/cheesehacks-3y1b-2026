import { useState, useEffect } from 'react';
import { getMatches } from '../api';
import './Matches.css';

export default function Matches({ user }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMatches(user.userId)
      .then(res => { setMatches(res.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [user.userId]);

  if (loading) {
    return <div className="matches-loading"><div className="spinner" />Loading matches...</div>;
  }

  return (
    <div className="matches-page">
      <div className="matches-header">
        <h2>Your Matches 💚</h2>
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
            <div key={i} className="match-card">
              <img src={match.matchedItem.imageUrl} alt={match.matchedItem.title} />
              <div className="match-card-info">
                <h3>{match.matchedItem.title}</h3>
                <p>Size {match.matchedItem.size} · {match.matchedItem.condition}</p>
                <p className="match-with">Matched with <strong>{match.matchedWithUsername || 'User'}</strong></p>
                <div className="match-tags">
                  {match.matchedItem.styleTags?.split(',').slice(0, 2).map(t => (
                    <span key={t} className="tag">{t.trim()}</span>
                  ))}
                </div>
              </div>
              <div className="match-badge">✓</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
