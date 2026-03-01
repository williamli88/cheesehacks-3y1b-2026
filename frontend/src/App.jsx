import { useState, useEffect } from 'react';
import Login from './components/Login';
import Register from './components/Register';
import SwipeCard from './components/SwipeCard';
import Matches from './components/Matches';
import SettingsModal from './components/SettingsModal';
import Profile from './components/Profile';
import Upload from './components/Upload';
import DemoTutorialOverlay, { DEMO_TUTORIAL_STEPS } from './components/DemoTutorialOverlay';
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
  const [editingItem, setEditingItem] = useState(null);
  const [profileSource, setProfileSource] = useState('self'); // self | matches
  const [authView, setAuthView] = useState('login'); // login | register
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [demoTutorialOpen, setDemoTutorialOpen] = useState(false);
  const [demoTutorialStep, setDemoTutorialStep] = useState(0);
  const [demoTutorialLocked, setDemoTutorialLocked] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!demoTutorialOpen) {
      setDemoTutorialLocked(false);
      return;
    }

    setDemoTutorialLocked(true);
    const unlockTimer = window.setTimeout(() => {
      setDemoTutorialLocked(false);
    }, 950);

    return () => window.clearTimeout(unlockTimer);
  }, [demoTutorialOpen, demoTutorialStep]);

  useEffect(() => {
    if (!demoTutorialOpen) return;

    const targetPage = DEMO_TUTORIAL_STEPS[demoTutorialStep]?.page || 'swipe';
    if (targetPage === 'profile') {
      setProfileUser(null);
      setProfileSource('self');
    }
    setPage(targetPage);
  }, [demoTutorialOpen, demoTutorialStep]);

  useEffect(() => {
    if (!demoTutorialOpen) return;

    const preventSwipeKeys = (event) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener('keydown', preventSwipeKeys, true);
    return () => window.removeEventListener('keydown', preventSwipeKeys, true);
  }, [demoTutorialOpen]);

  const tutorialTargetPage = demoTutorialOpen ? (DEMO_TUTORIAL_STEPS[demoTutorialStep]?.page || null) : null;
  const navClassName = (targetPage) => {
    const classNames = [];
    if (page === targetPage) classNames.push('active');
    if (tutorialTargetPage === targetPage) classNames.push('tutorial-focus');
    return classNames.join(' ');
  };

  const handleLoginSuccess = (authUser, options = {}) => {
    setUser(authUser);
    setPage('swipe');
    setProfileUser(null);
    setEditingItem(null);
    setProfileSource('self');

    const fromDemoButton = Boolean(options?.isDemo);
    setDemoTutorialOpen(fromDemoButton);
    setDemoTutorialStep(0);
  };

  const goToNextTutorialStep = () => {
    if (demoTutorialLocked) return;

    setDemoTutorialStep((currentStep) => {
      const finalStepIndex = DEMO_TUTORIAL_STEPS.length - 1;
      if (currentStep >= finalStepIndex) {
        setDemoTutorialOpen(false);
        return 0;
      }
      return currentStep + 1;
    });
  };

  const closeDemoTutorial = () => {
    setDemoTutorialOpen(false);
    setDemoTutorialStep(0);
    setDemoTutorialLocked(false);
  };

  if (!user) {
    return (
      <div className="app-container">
        {authView === 'login' && <Login onLogin={handleLoginSuccess} onShowRegister={() => setAuthView('register')} />}
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
          <button className="settings-btn" onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings" disabled={demoTutorialOpen}>
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
              onEditListing={(item) => {
                setEditingItem(item);
                setPage('upload');
              }}
              onBack={() => {
                setProfileUser(null);
                setProfileSource('self');
                setPage('matches');
              }}
              isOwnProfile={
                profileSource !== 'matches' &&
                (!profileUser ||
                String(profileUser.userId ?? profileUser.id) === String(user.userId ?? user.id)
                )
              }
              onUpload={() => setPage('upload')}
            />
          )}
          {page === 'upload' && (
            <Upload
              user={user}
              initialItem={editingItem}
              onBack={() => {
                setEditingItem(null);
                setPage('profile');
              }}
            />
          )}
        </div>
      </main>

      {page === 'profile' && !profileUser && (
        <button
          className="add-listing-fab"
          onClick={() => {
            setEditingItem(null);
            setPage('upload');
          }}
          aria-label="Add Listing"
          disabled={demoTutorialOpen}
        >
          <span className="add-listing-fab-icon" aria-hidden="true">+</span>
          <span>Add Listing</span>
        </button>
      )}

      <nav className="app-nav">
        <button className={navClassName('swipe')} onClick={() => setPage('swipe')} disabled={demoTutorialOpen}>
          <span className="nav-icon"><ExploreIcon /></span><small>Discover</small>
        </button>
        <button className={navClassName('matches')} onClick={() => setPage('matches')} disabled={demoTutorialOpen}>
          <span className="nav-icon"><HeartIcon /></span><small>Matches</small>
        </button>
        <button className={navClassName('profile')} onClick={() => { setProfileUser(null); setProfileSource('self'); setPage('profile'); }} disabled={demoTutorialOpen}>
          <span className="nav-icon"><UserIcon /></span><small>Profile</small>
        </button>
      </nav>

      {demoTutorialOpen && (
        <DemoTutorialOverlay
          stepIndex={demoTutorialStep}
          isLocked={demoTutorialLocked}
          onNext={goToNextTutorialStep}
          onClose={closeDemoTutorial}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        onSignOut={() => {
          setUser(null);
          setAuthView('login');
          setSettingsOpen(false);
          setEditingItem(null);
          setDemoTutorialOpen(false);
          setDemoTutorialStep(0);
          setDemoTutorialLocked(false);
        }}
        onSave={(updated) => { setUser(prev => ({ ...prev, ...updated })); setSettingsOpen(false); }}
        theme={theme}
        toggleTheme={() => setTheme(t => (t === 'dark' ? 'light' : 'dark'))}
      />
    </div>
  );
}
