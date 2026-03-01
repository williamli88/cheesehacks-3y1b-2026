import { useState, useEffect } from 'react';
import { login, getUsers } from '../api';
import './Login.css';

export default function Login({ onLogin, onShowRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUsers().then(res => setDemoUsers(res.data.slice(0, 6))).catch(() => {});
  }, []);

  const handleLogin = async (u, p, options = {}) => {
    setLoading(true);
    setError('');
    try {
      const res = await login(u, p);
      onLogin(res.data, options);
    } catch {
      setError('Invalid credentials. Try a demo account below.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(username, password, { isDemo: false });
  };

  return (
    <div className="login-screen login-sequenced">
      <div className="login-hero">
        <div className="login-icon">✦</div>
        <h1>STYLR</h1>
        <p>Campus Clothing Exchange</p>
      </div>

      <form className="login-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        {error && <p className="login-error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      {demoUsers.length > 0 && (
        <div className="demo-section">
          <p className="demo-label">Quick Demo Login</p>
          <div className="demo-users">
            {demoUsers.map(u => (
              <button
                type="button"
                key={u.id}
                className="demo-user-btn"
                onClick={() => handleLogin(u.username, 'password123', { isDemo: true })}
              >
                {/* Demo accounts use a fixed password for quick access — not for production */}
                <span>👤</span>
                <span>{u.username}</span>
                <small>{u.campus}</small>
              </button>
            ))}
          </div>
        </div>
      )}
      
      <div className="register-cta">
        <p>New here?</p>
        <button className="register-btn" onClick={onShowRegister}>Create an account</button>
      </div>
    </div>
  );
}
