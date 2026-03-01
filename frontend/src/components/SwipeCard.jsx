import { useState, useEffect, useRef, useCallback } from 'react';
import Hammer from 'hammerjs';
import { getFeed, postSwipe } from '../api';
import './SwipeCard.css';

const CATEGORY_ICONS = {
  TSHIRT: '👕', JEANS: '👖', JACKET: '🧥', DRESS: '👗',
  SHOES: '👟', SWEATER: '🧶', SKIRT: '👗', SHORTS: '🩳'
};

const CONDITION_COLORS = { NEW: '#102a5c', GOOD: '#1c4388', FAIR: '#45567a' };

export default function SwipeCard({ user, onMatch }) {
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(null); // 'left' | 'right' | null
  const [matchNotif, setMatchNotif] = useState(null);
  const [feedError, setFeedError] = useState(false);
  const cardRef = useRef(null);
  const hammerRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    getFeed(user.userId)
      .then(res => {
        setItems(res.data);
        setLoading(false);
      })
      .catch(() => { setFeedError(true); setLoading(false); });
  }, [user.userId]);

  const handleSwipe = useCallback(async (action) => {
    if (!items[currentIdx]) return;
    const item = items[currentIdx];
    setSwiping(action === 'RIGHT' ? 'right' : 'left');

    try {
      const res = await postSwipe(user.userId, item.id, action);
      if (res.data.matched) {
        setMatchNotif(item);
        onMatch && onMatch(item);
      }
      // Persist a lightweight client-side cache for recently liked items so
      // the Profile "Liked" tab can show the new like immediately without
      // waiting for a full server refresh. We still rely on the server as
      // the source-of-truth — this is just a UX improvement.
      if (action === 'RIGHT') {
        try {
          const raw = localStorage.getItem('recentLiked') || '[]';
          const arr = JSON.parse(raw);
          if (!arr.includes(item.id)) {
            arr.unshift(item.id);
            // keep small
            localStorage.setItem('recentLiked', JSON.stringify(arr.slice(0, 50)));
          }
        } catch (e) {
          // ignore localStorage issues
          console.warn('Could not update recentLiked cache', e);
        }
      }
    } catch (e) {
      console.error(e);
    }

    setTimeout(() => {
      setSwiping(null);
      setCurrentIdx(i => i + 1);
    }, 350);
  }, [items, currentIdx, user.userId, onMatch]);

  useEffect(() => {
    if (!cardRef.current || items.length === 0) return;
    if (hammerRef.current) hammerRef.current.destroy();

    const hammer = new Hammer(cardRef.current);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 });
    hammer.on('panend', (e) => {
      if (e.deltaX > 80) handleSwipe('RIGHT');
      else if (e.deltaX < -80) handleSwipe('LEFT');
    });
    hammer.on('panmove', (e) => {
      if (cardRef.current) {
        const rotate = e.deltaX * 0.05;
        cardRef.current.style.transform = `translateX(${e.deltaX}px) rotate(${rotate}deg)`;
      }
    });
    hammer.on('pancancel panend', () => {
      if (cardRef.current && !swiping) {
        cardRef.current.style.transform = '';
      }
    });
    hammerRef.current = hammer;
    return () => hammer.destroy();
  }, [currentIdx, items, handleSwipe, swiping]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'ArrowRight') handleSwipe('RIGHT');
      if (e.key === 'ArrowLeft') handleSwipe('LEFT');
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleSwipe]);

  const closeMatch = () => setMatchNotif(null);

  if (loading) {
    return (
      <div className="swipe-loading">
        <div className="spinner" />
        <p>Loading your feed...</p>
      </div>
    );
  }

  if (feedError) {
    return (
      <div className="swipe-empty">
        <div style={{ fontSize: '3rem' }}>⚠️</div>
        <h3>Could not load feed</h3>
        <p>Check your connection and try again.</p>
      </div>
    );
  }

  const current = items[currentIdx];

  if (!current) {
    return (
      <div className="swipe-empty">
        <div style={{ fontSize: '3rem' }}>🎉</div>
        <h3>You've seen everything!</h3>
        <p>Check back later for new items from your campus.</p>
      </div>
    );
  }

  return (
    <div className="swipe-container">
      {matchNotif && (
        <div className="match-overlay" onClick={closeMatch}>
          <div className="match-popup">
            <div className="match-emoji">🎊</div>
            <h2>It's a Match!</h2>
            <p>You and someone else both liked each other's items!</p>
            <div className="match-item-name">{matchNotif.title}</div>
            <button className="match-btn" onClick={closeMatch}>See Matches →</button>
          </div>
        </div>
      )}

      <div className="card-stack">
        {/* Preview of next card */}
        {items[currentIdx + 1] && (
          <div className="card card-behind">
            <img src={items[currentIdx + 1].imageUrl} alt="next" />
          </div>
        )}

        {/* Current card */}
        <div
          ref={cardRef}
          className={`card card-front ${swiping ? `swiping-${swiping}` : ''}`}
        >
          <div className="card-image-wrap">
            <img src={current.imageUrl} alt={current.title} />
            <div className="card-condition" style={{ background: CONDITION_COLORS[current.condition] || '#aaa' }}>
              {current.condition}
            </div>
          </div>
          <div className="card-info">
            <div className="card-header-row">
              <h2>{CATEGORY_ICONS[current.category] || '👚'} {current.title}</h2>
              <span className="card-size">Size {current.size}</span>
            </div>
            <p className="card-desc">{current.description}</p>
            <div className="card-tags">
              {current.colorTags?.split(',').map((t, idx) => (
                <span key={`color-${t.trim()}-${idx}`} className="tag tag-color">{t.trim()}</span>
              ))}
              {current.styleTags?.split(',').map((t, idx) => (
                <span key={`style-${t.trim()}-${idx}`} className="tag tag-style">{t.trim()}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="swipe-actions">
        <button className="btn-nope" onClick={() => handleSwipe('LEFT')}>
          ✕
        </button>
        <div className="swipe-hint">
          <small>Swipe or tap buttons</small>
        </div>
        <button className="btn-like" onClick={() => handleSwipe('RIGHT')}>
          ♥
        </button>
      </div>

      <div className="swipe-counter">
        {currentIdx + 1} / {items.length}
      </div>
    </div>
  );
}
