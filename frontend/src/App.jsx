import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import SwipeCard from './components/SwipeCard';
import Matches from './components/Matches';
import SettingsModal from './components/SettingsModal';
import Profile from './components/Profile';
import Upload from './components/Upload';
import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import FavoriteBorderOutlinedIcon from '@mui/icons-material/FavoriteBorderOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('swipe'); // swipe | matches | profile | upload
  const [profileUser, setProfileUser] = useState(null); // when viewing someone else's profile
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
        <div className="header-left"><span className="logo">👕 STYLR</span></div>
        <div className="header-center"><span className="campus-badge">{user.campus}</span></div>
        <div className="header-right"><button className="settings-btn" onClick={() => setSettingsOpen(true)} title="Settings">⚙️</button></div>
      </header>

      <main className="app-main">
        <div className="page-shell" key={page}>
          {page === 'swipe' && <SwipeCard user={user} onMatch={() => setPage('matches')} />}
          {page === 'matches' && <Matches user={user} openProfile={(u) => { setProfileUser(u); setPage('profile'); }} />}
          {page === 'profile' && <Profile user={profileUser || user} viewer={user} onUpload={() => setPage('upload')} />}
          {page === 'upload' && <Upload user={user} onBack={() => setPage('profile')} />}
        </div>
      </main>

      <nav className="app-nav">
        <button className={page === 'swipe' ? 'active' : ''} onClick={() => setPage('swipe')}>
          <span className="nav-icon"><ExploreOutlinedIcon fontSize="inherit" /></span><small>Discover</small>
        </button>
        <button className={page === 'matches' ? 'active' : ''} onClick={() => setPage('matches')}>
          <span className="nav-icon"><FavoriteBorderOutlinedIcon fontSize="inherit" /></span><small>Matches</small>
        </button>
        <button className={page === 'profile' ? 'active' : ''} onClick={() => { setProfileUser(null); setPage('profile'); }}>
          <span className="nav-icon"><PersonOutlineOutlinedIcon fontSize="inherit" /></span><small>Profile</small>
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
