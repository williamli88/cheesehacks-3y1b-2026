import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import Hammer from 'hammerjs';
import { getFeed, postSwipe } from '../api';
import './SwipeCard.css';

const CATEGORY_ICONS = {
  TSHIRT: '👕', JEANS: '👖', JACKET: '🧥', DRESS: '👗',
  SHOES: '👟', SWEATER: '🧶', SKIRT: '👗', SHORTS: '🩳',
  TOPS: '👕', BOTTOMS: '👖', OUTERWEAR: '🧥', FOOTWEAR: '👟', ACCESSORIES: '👜'
};

const CONDITION_COLORS = { NEW: '#102a5c', GOOD: '#1c4388', FAIR: '#45567a' };
const FILTER_GENDERS = ['', 'MEN', 'WOMEN'];
const FILTER_TYPES = ['', 'TOPS', 'BOTTOMS', 'OUTERWEAR', 'FOOTWEAR', 'ACCESSORIES'];
const FILTER_SIZES = ['', 'XS', 'S', 'M', 'L', 'XL'];
const FILTER_STYLES = ['', 'ACTIVE', 'STREET', 'FORMAL', 'VINTAGE'];
const FILTER_COLORS = ['', 'black', 'white', 'blue', 'red', 'green', 'grey', 'brown', 'yellow', 'purple', 'pink'];
const CARD_ENTER_MS = 360;

const displayGender = (item) => {
  if (item?.gender === 'MEN') return 'Men';
  if (item?.gender === 'WOMEN') return 'Women';

  // Legacy fallback when gender was not saved on older items.
  const legacyCategory = String(item?.category || '').toUpperCase();
  if (legacyCategory === 'DRESS' || legacyCategory === 'SKIRT') return 'Women';
  return 'Men';
};

export default function SwipeCard({ user, onGoToMatches }) {
  const [items, setItems] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(null); // 'left' | 'right' | null
  const [isDragging, setIsDragging] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const [matchNotif, setMatchNotif] = useState(null);
  const [feedError, setFeedError] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    gender: '',
    type: '',
    size: '',
    color: '',
    style: '',
  });
  const cardRef = useRef(null);
  const hammerRef = useRef(null);
  const enterTimerRef = useRef(null);

  useLayoutEffect(() => {
    if (!items[currentIdx]) {
      setIsEntering(false);
      return;
    }

    setIsEntering(true);

    if (enterTimerRef.current) {
      window.clearTimeout(enterTimerRef.current);
    }
    enterTimerRef.current = window.setTimeout(() => {
      setIsEntering(false);
      enterTimerRef.current = null;
    }, CARD_ENTER_MS);

    return () => {
      if (enterTimerRef.current) {
        window.clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
    };
  }, [items, currentIdx]);

  useEffect(() => {
    setLoading(true);
    setFeedError(false);
    const requestFilters = Object.fromEntries(
      Object.entries(filters)
        .map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])
        .filter(([, v]) => Boolean(v))
    );

    getFeed(user.userId, requestFilters)
      .then(res => {
        setItems(res.data);
        setCurrentIdx(0);
        setLoading(false);
      })
      .catch(() => { setFeedError(true); setLoading(false); });
  }, [user.userId, filters]);

  const handleSwipe = useCallback(async (action) => {
    if (!items[currentIdx]) return;
    const item = items[currentIdx];
    setSwiping(action === 'RIGHT' ? 'right' : 'left');

    try {
      const res = await postSwipe(user.userId, item.id, action);
      
      // Show congrats popup and let the user choose where to go next.
      if (res.data.matched) {
        setMatchNotif(item);
      }

      // UX Improvement: Persist liked items to local cache
      if (action === 'RIGHT') {
        try {
          const raw = localStorage.getItem('recentLiked') || '[]';
          const arr = JSON.parse(raw);
          if (!arr.includes(item.id)) {
            arr.unshift(item.id);
            localStorage.setItem('recentLiked', JSON.stringify(arr.slice(0, 50)));
          }
        } catch (e) {
          console.warn('Could not update recentLiked cache', e);
        }
      }
    } catch (e) {
      console.error("Swipe failed:", e);
    }

    setTimeout(() => {
      setSwiping(null);
      setCurrentIdx(i => i + 1);
    }, 350);
  }, [items, currentIdx, user.userId]);

  useEffect(() => {
    if (!cardRef.current || items.length === 0) return;
    if (hammerRef.current) hammerRef.current.destroy();

    const hammer = new Hammer(cardRef.current);
    hammer.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL, threshold: 10 });
    hammer.on('panstart', () => {
      setIsDragging(true);
    });
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
      setIsDragging(false);
      if (cardRef.current && !swiping) {
        cardRef.current.style.transform = '';
      }
    });
    hammerRef.current = hammer;
    return () => {
      setIsDragging(false);
      hammer.destroy();
    };
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
  const imageSrc = (src) => (typeof src === 'string' && src.trim().length > 0 ? src : null);
  const hasAnyFilter = Object.values(filters).some(v => typeof v === 'string' && v.trim().length > 0);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      gender: '',
      type: '',
      size: '',
      color: '',
      style: '',
    });
  };

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
  const noFilteredResults = items.length === 0 && hasAnyFilter;

  return (
    <div className="swipe-container">
      {matchNotif && (
        <div className="match-overlay" onClick={closeMatch}>
          <div className="match-popup">
            <div className="match-emoji">🎊</div>
            <h2>It's a Match!</h2>
            <p>You and someone else both liked each other's items!</p>
            <div className="match-item-name">{matchNotif.title}</div>
            <div className="match-actions">
              <button className="match-btn secondary" onClick={closeMatch}>Continue Swiping</button>
              <button
                className="match-btn"
                onClick={() => {
                  closeMatch();
                  if (onGoToMatches) onGoToMatches();
                }}
              >
                Go to Matches
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="discover-filters">
        <div className="discover-filters-header">
          <button
            type="button"
            className={`filter-toggle ${filtersOpen ? 'open' : ''}`}
            onClick={() => setFiltersOpen(open => !open)}
          >
            Filters
          </button>
          {hasAnyFilter && (
            <button type="button" className="filter-clear" onClick={clearFilters}>
              Clear
            </button>
          )}
        </div>

        {filtersOpen && (
          <div className="filter-grid">
            <select value={filters.gender} onChange={e => handleFilterChange('gender', e.target.value)}>
              {FILTER_GENDERS.map(v => <option key={`gender-${v || 'all'}`} value={v}>{v || 'Gender (All)'}</option>)}
            </select>
            <select value={filters.type} onChange={e => handleFilterChange('type', e.target.value)}>
              {FILTER_TYPES.map(v => <option key={`type-${v || 'all'}`} value={v}>{v || 'Type (All)'}</option>)}
            </select>
            <select value={filters.size} onChange={e => handleFilterChange('size', e.target.value)}>
              {FILTER_SIZES.map(v => <option key={`size-${v || 'all'}`} value={v}>{v || 'Size (All)'}</option>)}
            </select>
            <select value={filters.style} onChange={e => handleFilterChange('style', e.target.value)}>
              {FILTER_STYLES.map(v => <option key={`style-${v || 'all'}`} value={v}>{v || 'Style (All)'}</option>)}
            </select>
            <select value={filters.color} onChange={e => handleFilterChange('color', e.target.value)}>
              {FILTER_COLORS.map(v => (
                <option key={`color-${v || 'all'}`} value={v}>
                  {v ? `${v.charAt(0).toUpperCase()}${v.slice(1)}` : 'Color (All)'}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!current ? (
        <div className="swipe-empty">
          <div style={{ fontSize: '3rem' }}>{noFilteredResults ? '🔎' : '🎉'}</div>
          <h3>{noFilteredResults ? 'No results found for this filter' : "You've seen everything!"}</h3>
          <p>
            {noFilteredResults
              ? 'Try removing one or more filters.'
              : 'Check back later for new items from your campus.'}
          </p>
        </div>
      ) : (
        <>
          <div className="card-stack">
            {/* Preview of next card */}
            {!swiping && !isDragging && !isEntering && items[currentIdx + 1] && (
              <div className="card card-behind">
                {imageSrc(items[currentIdx + 1].imageUrl) ? (
                  <img src={imageSrc(items[currentIdx + 1].imageUrl)} alt="next item" />
                ) : (
                  <div className="card-image-placeholder">No image</div>
                )}
              </div>
            )}

            {/* Current card */}
            <div
              ref={cardRef}
              className={`card card-front ${swiping ? `swiping-${swiping}` : ''}`}
            >
              <div className="card-image-wrap">
                {imageSrc(current.imageUrl) ? (
                  <img src={imageSrc(current.imageUrl)} alt={current.title} />
                ) : (
                  <div className="card-image-placeholder">No image</div>
                )}
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
              <span className="tag tag-gender">{displayGender(current)}</span>
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
        </>
      )}
    </div>
  );
}
