import { useState } from 'react';
import { register } from '../api';
import { getCampusFromEmail } from '../campusUtils';
import './Login.css';

export default function Register({ onRegister, onCancel }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const derivedCampus = getCampusFromEmail(email);
  const isValidEdu = email.endsWith('.edu');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidEdu) {
      setError("You must use a valid .edu email address.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      // We pass the derivedCampus just in case your api.js still expects a 4th argument,
      // but remember our backend AuthController now recalculates this securely anyway!
      const res = await register(username, email, password, derivedCampus);
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
          placeholder="e.g. nhung@wisc.edu"
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
        
        {/* Dynamic Campus Display instead of a Select dropdown */}
        <div style={{ 
            padding: '12px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px', 
            marginBottom: '15px',
            border: isValidEdu ? '1px solid #27ae60' : '1px solid #ddd',
            textAlign: 'center'
        }}>
            <span style={{ fontSize: '0.85rem', color: '#666' }}>Your Campus: </span>
            <strong style={{ color: isValidEdu ? '#27ae60' : '#e74c3c' }}>
                {derivedCampus}
            </strong>
        </div>

        {error && <p className="login-error">{error}</p>}

        <button type="submit" disabled={loading || !isValidEdu}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>

        <button type="button" onClick={onCancel} style={{ marginTop: 8, background: 'transparent', color: '#27ae60', border: 'none', cursor: 'pointer' }}>
          Back to Sign In
        </button>
      </form>
    </div>
  );
}