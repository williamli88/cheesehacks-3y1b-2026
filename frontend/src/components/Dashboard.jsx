import { useState, useEffect, useRef } from 'react';
import { getImpact } from '../api';
import { IMPACT_RANKS, getImpactRank } from '../impactRank';
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
  const impactRank = getImpactRank(co2);
  const nextRank = IMPACT_RANKS.find((rank) => rank.minCo2 > co2) || null;
  const carbonMilestones = [5, 15, 30, 50, 75, 100, 150, 200];
  const waterMilestones = [5000, 15000, 30000, 50000, 75000, 100000, 150000, 200000];
  const milesMilestones = [10, 40, 100, 200, 350, 500, 750, 1000];

  const milestoneLabel = (value, unit) => `${value}${unit}`;

  return (
    <div className="dashboard-page">
      <div className="dash-hero">
        <div className="dash-hero-icon">{impactRank.icon}</div>
        <h2>{impactRank.label}</h2>
        <p>{user.username} · {swaps} swap{swaps !== 1 ? 's' : ''} completed</p>
        <div className="dash-next-rank">
          {nextRank ? (
            <span>Next Rank: {nextRank.icon} {nextRank.label}</span>
          ) : (
            <span>Next Rank: 🌳 Max Rank Achieved</span>
          )}
        </div>
      </div>

      <div className="impact-cards">
        <div className="impact-card co2-card">
          <div className="impact-card-icon">💨</div>
          <div className="impact-card-value">
            <AnimatedNumber value={co2} decimals={1} /> <span className="unit">kg CO₂</span>
          </div>
          <div className="impact-card-label">Carbon saved</div>
          <div className="milestone-scroll">
            <div className="milestone-badges">
              {carbonMilestones.map((m) => (
                <span key={`co2-${m}`} className={`milestone-badge ${co2 >= m ? 'earned' : ''}`}>
                  {co2 >= m ? '✓ ' : ''}{milestoneLabel(m, 'kg')}
                </span>
              ))}
            </div>
          </div>
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
          <div className="milestone-scroll">
            <div className="milestone-badges">
              {waterMilestones.map((m) => (
                <span key={`water-${m}`} className={`milestone-badge ${water >= m ? 'earned' : ''}`}>
                  {water >= m ? '✓ ' : ''}{milestoneLabel(m, 'L')}
                </span>
              ))}
            </div>
          </div>
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
          <div className="milestone-scroll">
            <div className="milestone-badges">
              {milesMilestones.map((m) => (
                <span key={`miles-${m}`} className={`milestone-badge ${miles >= m ? 'earned' : ''}`}>
                  {miles >= m ? '✓ ' : ''}{milestoneLabel(m, 'mi')}
                </span>
              ))}
            </div>
          </div>
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

    </div>
  );
}
