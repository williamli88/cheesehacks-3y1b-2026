import { useState, useEffect } from 'react';
import './SettingsModal.css';

export default function SettingsModal({ open, onClose, user, onSignOut, onSave, theme, toggleTheme }) {
  const [username, setUsername] = useState(user.username || '');
  const [email, setEmail] = useState(user.email || '');

  useEffect(() => {
    if (open) {
      setUsername(user.username || '');
      setEmail(user.email || '');
    }
  }, [open, user]);

  if (!open) return null;

  const handleSave = () => {
    // Local update — backend update endpoint not implemented in API helper.
    onSave({ username, email });
  };

  const handleCancel = () => {
    // Revert local edits and close without saving
    setUsername(user.username || '');
    setEmail(user.email || '');
    onClose();
  };

  const changed = (username !== (user.username || '')) || (email !== (user.email || ''));

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={e => e.stopPropagation()}>
        <div className="settings-header">
          <h3>Settings</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-section">
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} />
        </div>

        <div className="settings-section">
          <label>Email</label>
          <input value={email} onChange={e => setEmail(e.target.value)} />
        </div>

        <div className="settings-section">
          <label>Campus</label>
          <input value={user.campus || ''} disabled />
        </div>
        <div className="settings-section theme-row">
          <label>Theme</label>
          <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? '🌙 Dark' : '☀️ Light'}</button>
        </div>

        <div className="settings-actions">
          <button className="save-btn" onClick={handleSave} disabled={!changed}>Save</button>
          <button className="cancel-btn" onClick={handleCancel}>Cancel</button>
          <button className="signout-btn" onClick={onSignOut}>Sign out</button>
        </div>
        <div className="settings-note">Note: profile edits apply locally in this demo.</div>
      </div>
    </div>
  );
}
