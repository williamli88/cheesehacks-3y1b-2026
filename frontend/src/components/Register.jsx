import { useState } from 'react';
import { register } from '../api';
import './Login.css';

export default function Register({ onRegister, onCancel }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [campus, setCampus] = useState('MIT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await register(username, email, password, campus);
      onRegister(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-hero">
        <div className="login-icon">🧾</div>
        <h1>Create account</h1>
        <p>Register to join your campus swap</p>
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
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <select value={campus} onChange={e => setCampus(e.target.value)}>
          <option>MIT</option>
          <option>Harvard</option>
          <option>Stanford</option>
        </select>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <button type="button" onClick={onCancel} style={{ marginTop: 8, background: 'transparent', color: '#27ae60', border: 'none', cursor: 'pointer' }}>
          Back to Sign In
        </button>
      </form>
    </div>
  );
}
