import { useState, useEffect } from 'react';
import './SettingsModal.css';

export default function SettingsModal({ open, onClose, user, onSignOut, onSave, theme, toggleTheme }) {
  const [username, setUsername] = useState(user.username || '');
  const [profileImageUrl, setProfileImageUrl] = useState(user.profileImageUrl || '');

  useEffect(() => {
    if (open) {
      setUsername(user.username || '');
      setProfileImageUrl(user.profileImageUrl || '');
    }
  }, [open, user]);

  if (!open) return null;

  const handleSave = () => {
    onSave({ username, profileImageUrl });
  };

  const handleCancel = () => {
    // Revert local edits and close without saving
    setUsername(user.username || '');
    setProfileImageUrl(user.profileImageUrl || '');
    onClose();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfileImageUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const changed =
    (username !== (user.username || '')) ||
    (profileImageUrl !== (user.profileImageUrl || ''));

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
          <input value={user.email || ''} disabled />
          <small className="settings-field-note">Email cannot be changed after account creation.</small>
        </div>

        <div className="settings-section">
          <label>Profile Picture</label>
          <div className="settings-avatar-row">
            {profileImageUrl ? (
              <img className="settings-avatar-preview" src={profileImageUrl} alt="Profile preview" />
            ) : (
              <div className="settings-avatar-preview settings-avatar-fallback">No photo</div>
            )}
            <input type="file" accept="image/*" onChange={handleImageUpload} />
          </div>
        </div>

        <div className="settings-section">
          <label>Campus</label>
          <input value={user.campus || ''} disabled />
        </div>
        <div className="settings-section theme-row">
          <label>Theme</label>
          <button className="theme-toggle" onClick={toggleTheme}>{theme === 'dark' ? 'Dark' : 'Light'}</button>
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
