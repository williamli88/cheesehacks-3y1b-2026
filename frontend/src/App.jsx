import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import SwipeCard from './components/SwipeCard';
import Matches from './components/Matches';
import SettingsModal from './components/SettingsModal';
import Profile from './components/Profile';
import Upload from './components/Upload';
import './App.css';

function ExploreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8" />
      <path d="m14.6 9.4-4.4 1.4-1.4 4.4 4.4-1.4z" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.2 4.8 13a4.9 4.9 0 0 1 6.9-6.9L12 7l.3-.9a4.9 4.9 0 0 1 6.9 6.9z" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3.2" />
      <path d="M19.2 14.8a1 1 0 0 0 .2 1.1l.1.1a1.8 1.8 0 1 1-2.6 2.6l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V20a1.8 1.8 0 1 1-3.6 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1 .2l-.2.1a1.8 1.8 0 1 1-2.6-2.6l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H4a1.8 1.8 0 1 1 0-3.6h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1l-.1-.2a1.8 1.8 0 1 1 2.6-2.6l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V4a1.8 1.8 0 1 1 3.6 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1-.2l.2-.1a1.8 1.8 0 1 1 2.6 2.6l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H20a1.8 1.8 0 1 1 0 3.6h-.2a1 1 0 0 0-.9.7z" />
    </svg>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('swipe'); // swipe | matches | profile | upload
  const [profileUser, setProfileUser] = useState(null); // when viewing someone else's profile
  const [profileSource, setProfileSource] = useState('self'); // self | matches
  const [authView, setAuthView] = useState('login'); // login | register
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

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
        <div className="header-center"><span className="logo">STYLR</span></div>
        <div className="header-right">
          <button className="settings-btn" onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings">
            <span className="settings-btn-icon"><SettingsIcon /></span>
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="page-shell" key={page}>
          {page === 'swipe' && <SwipeCard user={user} onMatch={() => setPage('matches')} />}
          {page === 'matches' && (
            <Matches
              user={user}
              openProfile={(u) => {
                setProfileUser({ ...u, _fromMatches: true });
                setProfileSource('matches');
                setPage('profile');
              }}
            />
          )}
          {page === 'profile' && (
            <Profile
              user={profileUser || user}
              viewer={user}
              profileSource={profileSource}
              isOwnProfile={
                profileSource !== 'matches' &&
                (!profileUser ||
                String(profileUser.userId ?? profileUser.id) === String(user.userId ?? user.id)
                )
              }
              onUpload={() => setPage('upload')}
            />
          )}
          {page === 'upload' && <Upload user={user} onBack={() => setPage('profile')} />}
        </div>
      </main>

      {page === 'profile' && !profileUser && (
        <button className="add-listing-fab" onClick={() => setPage('upload')} aria-label="Add Listing">
          <span className="add-listing-fab-icon" aria-hidden="true">+</span>
          <span>Add Listing</span>
        </button>
      )}

      <nav className="app-nav">
        <button className={page === 'swipe' ? 'active' : ''} onClick={() => setPage('swipe')}>
          <span className="nav-icon"><ExploreIcon /></span><small>Discover</small>
        </button>
        <button className={page === 'matches' ? 'active' : ''} onClick={() => setPage('matches')}>
          <span className="nav-icon"><HeartIcon /></span><small>Matches</small>
        </button>
        <button className={page === 'profile' ? 'active' : ''} onClick={() => { setProfileUser(null); setProfileSource('self'); setPage('profile'); }}>
          <span className="nav-icon"><UserIcon /></span><small>Profile</small>
        </button>
      </nav>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onSignOut={() => { setUser(null); setAuthView('login'); setSettingsOpen(false); }}
        onSave={(updated) => { setUser(prev => ({ ...prev, ...updated })); setSettingsOpen(false); }}
        theme={theme}
        toggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      />
    </div>
  );
}
