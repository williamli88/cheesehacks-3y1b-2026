import { useState, useEffect, useRef } from 'react';
import { getImpact } from '../api';
import './Dashboard.css';

function AnimatedNumber({ value, decimals = 0, duration = 1500 }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef(null);

  useEffect(() => {
    const start = performance.now();
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(value * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <span>{display.toFixed(decimals)}</span>;
}

function StatBar({ value, max, color }) {
  const pct = Math.min((value / max) * 100, 100);
  return (
    <div className="stat-bar-bg">
      <div className="stat-bar-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}

export default function Dashboard({ user }) {
  const [impact, setImpact] = useState(null);
  const [loading, setLoading] = useState(true);
  const currentUserId = user?.userId || user?.id;

  useEffect(() => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    getImpact(currentUserId)
      .then(res => { setImpact(res.data); setLoading(false); })
      .catch(() => { setLoading(false); });
  }, [currentUserId]);

  if (loading) {
    return <div className="dash-loading"><div className="spinner" />Calculating your impact...</div>;
  }

  if (!impact) {
    return <div className="dash-loading">Could not load impact data.</div>;
  }

  const co2 = impact.totalCo2Saved || 0;
  const water = impact.totalWaterSaved || 0;
  const swaps = impact.totalSwapsCompleted || 0;
  const trees = impact.treesEquivalent || 0;
  const showers = impact.showersSaved || 0;
  const miles = impact.milesNotDriven || 0;

  return (
    <div className="dashboard-page">
      <div className="dash-hero">
        <div className="dash-hero-icon">🌱</div>
        <h2>Your Impact</h2>
        <p>{user.username} · {swaps} swap{swaps !== 1 ? 's' : ''} completed</p>
      </div>

      <div className="impact-cards">
        <div className="impact-card co2-card">
          <div className="impact-card-icon">💨</div>
          <div className="impact-card-value">
            <AnimatedNumber value={co2} decimals={1} /> <span className="unit">kg CO₂</span>
          </div>
          <div className="impact-card-label">Carbon saved</div>
          <StatBar value={co2} max={50} color="#102a5c" />
          <div className="impact-equiv">
            ≈ <strong>{trees.toFixed(1)}</strong> trees planted for a year
          </div>
        </div>

        <div className="impact-card water-card">
          <div className="impact-card-icon">💧</div>
          <div className="impact-card-value">
            <AnimatedNumber value={water} decimals={0} /> <span className="unit">L</span>
          </div>
          <div className="impact-card-label">Water saved</div>
          <StatBar value={water} max={10000} color="#1c4388" />
          <div className="impact-equiv">
            ≈ <strong>{showers.toFixed(0)}</strong> showers saved
          </div>
        </div>

        <div className="impact-card miles-card">
          <div className="impact-card-icon">🚗</div>
          <div className="impact-card-value">
            <AnimatedNumber value={miles} decimals={1} /> <span className="unit">mi</span>
          </div>
          <div className="impact-card-label">Driving avoided</div>
          <StatBar value={miles} max={500} color="#445a84" />
          <div className="impact-equiv">
            That's <strong>{miles.toFixed(0)}</strong> miles not driven
          </div>
        </div>
      </div>

      {swaps === 0 && (
        <div className="dash-cta">
          <p>🔄 Start swiping to earn your first impact badge!</p>
        </div>
      )}

      {co2 > 0 && (
        <div className="dash-summary">
          <p>🎉 You saved <strong>{co2.toFixed(1)}kg CO₂</strong> — equivalent to planting <strong>{trees.toFixed(1)} trees</strong>.</p>
        </div>
      )}
    </div>
  );
}
