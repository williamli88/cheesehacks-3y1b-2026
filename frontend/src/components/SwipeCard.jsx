import { useState, useEffect, useRef, useCallback, useLayoutEffect } from 'react';
import Hammer from 'hammerjs';
import { getFeed, postSwipe } from '../api';
import CustomDropdown from './CustomDropdown';
import './SwipeCard.css';

const CONDITION_COLORS = { NEW: '#245f2d', GOOD: '#2f7d38', FAIR: '#5d6f4a' };
const FILTER_GENDER_OPTIONS = [
  { value: '', label: 'Gender (All)' },
  { value: 'MEN', label: 'Men' },
  { value: 'WOMEN', label: 'Women' }
];

const FILTER_TYPE_OPTIONS = [
  { value: '', label: 'Type (All)' },
  { value: 'TOPS', label: 'Tops' },
  { value: 'BOTTOMS', label: 'Bottoms' },
  { value: 'OUTERWEAR', label: 'Outerwear' },
  { value: 'FOOTWEAR', label: 'Footwear' },
  { value: 'ACCESSORIES', label: 'Accessories' }
];

const FILTER_SIZE_OPTIONS = [
  { value: '', label: 'Size (All)' },
  { value: 'XS', label: 'XS' },
  { value: 'S', label: 'S' },
  { value: 'M', label: 'M' },
  { value: 'L', label: 'L' },
  { value: 'XL', label: 'XL' }
];

const FILTER_STYLE_OPTIONS = [
  { value: '', label: 'Style (All)' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'STREET', label: 'Street' },
  { value: 'FORMAL', label: 'Formal' },
  { value: 'VINTAGE', label: 'Vintage' }
];

const FILTER_COLOR_OPTIONS = [
  { value: '', label: 'Color (All)' },
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'blue', label: 'Blue' },
  { value: 'red', label: 'Red' },
  { value: 'green', label: 'Green' },
  { value: 'grey', label: 'Grey' },
  { value: 'brown', label: 'Brown' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'purple', label: 'Purple' },
  { value: 'pink', label: 'Pink' }
];
const CARD_ENTER_MS = 360;
const TITLE_SIZE_CONDITION_SUFFIX_RE = /\s*-\s*(XXS|XS|S|M|L|XL|XXL)\s+(NEW|GOOD|FAIR)\s*$/i;
const TITLE_EMOJI_RE = /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D]/gu;

const normalizeImageSrc = (src) => {
  if (typeof src !== 'string') return null;
  const trimmed = src.trim();
  if (!trimmed) return null;

  return trimmed.replace(/^\/P6\((\d+)\)\.jpg$/i, '/P6%20($1).jpg');
};

const displayGender = (item) => {
  if (item?.gender === 'MEN') return 'Men';
  if (item?.gender === 'WOMEN') return 'Women';

  // Legacy fallback when gender was not saved on older items.
  const legacyCategory = String(item?.category || '').toUpperCase();
  if (legacyCategory === 'DRESS' || legacyCategory === 'SKIRT') return 'Women';
  return 'Men';
};

const formatItemTitle = (title) => {
  if (typeof title !== 'string') return '';
  const withoutEmoji = title.replace(TITLE_EMOJI_RE, '');
  return withoutEmoji.replace(TITLE_SIZE_CONDITION_SUFFIX_RE, '').replace(/\s{2,}/g, ' ').trim();
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
  const [openFilterDropdown, setOpenFilterDropdown] = useState(null);
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
  const imageSrc = (src) => normalizeImageSrc(src);
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
    setOpenFilterDropdown(null);
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
  const currentMatchPercent = current && Number.isFinite(Number(current.matchScore))
    ? Math.round(Number(current.matchScore) * 100)
    : null;

  return (
    <div className="swipe-container">
      {matchNotif && (
        <div className="match-overlay" onClick={closeMatch}>
          <div className="match-popup">
            <div className="match-emoji">🎊</div>
            <h2>It's a Match!</h2>
            <p>You and someone else both liked each other's items!</p>
            <div className="match-item-name">{formatItemTitle(matchNotif.title) || matchNotif.title}</div>
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
            onClick={() => {
              setFiltersOpen((open) => {
                const next = !open;
                if (!next) setOpenFilterDropdown(null);
                return next;
              });
            }}
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
            <CustomDropdown
              id="filter-gender"
              value={filters.gender}
              options={FILTER_GENDER_OPTIONS}
              placeholder="Gender (All)"
              openDropdown={openFilterDropdown}
              setOpenDropdown={setOpenFilterDropdown}
              onChange={(value) => handleFilterChange('gender', value)}
            />
            <CustomDropdown
              id="filter-type"
              value={filters.type}
              options={FILTER_TYPE_OPTIONS}
              placeholder="Type (All)"
              openDropdown={openFilterDropdown}
              setOpenDropdown={setOpenFilterDropdown}
              onChange={(value) => handleFilterChange('type', value)}
            />
            <CustomDropdown
              id="filter-size"
              value={filters.size}
              options={FILTER_SIZE_OPTIONS}
              placeholder="Size (All)"
              openDropdown={openFilterDropdown}
              setOpenDropdown={setOpenFilterDropdown}
              onChange={(value) => handleFilterChange('size', value)}
            />
            <CustomDropdown
              id="filter-style"
              value={filters.style}
              options={FILTER_STYLE_OPTIONS}
              placeholder="Style (All)"
              openDropdown={openFilterDropdown}
              setOpenDropdown={setOpenFilterDropdown}
              onChange={(value) => handleFilterChange('style', value)}
            />
            <CustomDropdown
              id="filter-color"
              value={filters.color}
              options={FILTER_COLOR_OPTIONS}
              placeholder="Color (All)"
              openDropdown={openFilterDropdown}
              setOpenDropdown={setOpenFilterDropdown}
              onChange={(value) => handleFilterChange('color', value)}
            />
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
                  <img src={imageSrc(current.imageUrl)} alt={formatItemTitle(current.title) || current.title} />
                ) : (
                  <div className="card-image-placeholder">No image</div>
                )}
                {currentMatchPercent !== null && (
                  <div className="card-match-prob">{currentMatchPercent}% match</div>
                )}
                <div className="card-condition" style={{ background: CONDITION_COLORS[current.condition] || '#aaa' }}>
                  {current.condition}
                </div>
              </div>
              <div className="card-info">
                <div className="card-header-row">
                  <h2>{formatItemTitle(current.title) || current.title}</h2>
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
