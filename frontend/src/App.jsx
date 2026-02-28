import { useState } from 'react';
import Login from './components/Login';
import SwipeCard from './components/SwipeCard';
import Matches from './components/Matches';
import Dashboard from './components/Dashboard';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('swipe'); // swipe | matches | dashboard

  if (!user) {
    return (
      <div className="app-container">
        <Login onLogin={setUser} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <span className="logo">👕 SwapU</span>
        <span className="campus-badge">{user.campus}</span>
      </header>

      <main className="app-main">
        {page === 'swipe' && <SwipeCard user={user} onMatch={() => setPage('dashboard')} />}
        {page === 'matches' && <Matches user={user} />}
        {page === 'dashboard' && <Dashboard user={user} />}
      </main>

      <nav className="app-nav">
        <button className={page === 'swipe' ? 'active' : ''} onClick={() => setPage('swipe')}>
          <span>🔄</span><small>Discover</small>
        </button>
        <button className={page === 'matches' ? 'active' : ''} onClick={() => setPage('matches')}>
          <span>💚</span><small>Matches</small>
        </button>
        <button className={page === 'dashboard' ? 'active' : ''} onClick={() => setPage('dashboard')}>
          <span>🌱</span><small>Impact</small>
        </button>
      </nav>
    </div>
  );
}
