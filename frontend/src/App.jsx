import { useState } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import SwipeCard from './components/SwipeCard';
import Matches from './components/Matches';
import Profile from './components/Profile';
import Upload from './components/Upload';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('swipe'); // swipe | matches | profile
  const [authView, setAuthView] = useState('login'); // login | register

  if (!user) {
    return (
      <div className="app-container">
        {authView === 'login' && <Login onLogin={setUser} onShowRegister={() => setAuthView('register')} />}
        {authView === 'register' && (
          <Register onRegister={(data) => { setUser(data); setAuthView('login'); }} onCancel={() => setAuthView('login')} />
        )}
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
        {page === 'swipe' && <SwipeCard user={user} onMatch={() => setPage('profile')} />}
        {page === 'matches' && <Matches user={user} />}
        {page === 'profile' && <Profile user={user} onUpload={() => setPage('upload')} />}
        {page === 'upload' && <Upload user={user} />}
      </main>

      <nav className="app-nav">
        <button className={page === 'swipe' ? 'active' : ''} onClick={() => setPage('swipe')}>
          <span>🔄</span><small>Discover</small>
        </button>
        <button className={page === 'matches' ? 'active' : ''} onClick={() => setPage('matches')}>
          <span>💚</span><small>Matches</small>
        </button>
        <button className={page === 'profile' ? 'active' : ''} onClick={() => setPage('profile')}>
          <span>👤</span><small>Profile</small>
        </button>
      </nav>
    </div>
  );
}
