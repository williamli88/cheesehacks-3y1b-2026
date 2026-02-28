import { useState, useEffect } from 'react';
import { login, getUsers } from '../api';
import './Login.css';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getUsers().then(res => setDemoUsers(res.data.slice(0, 6))).catch(() => {});
  }, []);

  const handleLogin = async (u, p) => {
    setLoading(true);
    setError('');
    try {
      const res = await login(u, p);
      onLogin(res.data);
    } catch {
      setError('Invalid credentials. Try a demo account below.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLogin(username, password);
  };

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="login-icon">👕</div>
        <h1>SwapU</h1>
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
          <p className="demo-label">⚡ Quick Demo Login</p>
          <div className="demo-users">
            {demoUsers.map(u => (
              <button
                key={u.id}
                className="demo-user-btn"
                onClick={() => handleLogin(u.username, 'password123')}
              >
                <span>👤</span>
                <span>{u.username}</span>
                <small>{u.campus}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
