import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './AdminAuth.css';

const AdminLogin = () => {
  const nav = useNavigate();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminAPI.login(email, password);
      if (res?.token) {
        localStorage.setItem('adminToken', res.token);
        nav('/admin', { replace: true });
      } else {
        setError('Login failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-login-card card">
        <h2 className="admin-title">Admin Login</h2>
        {error && <div className="admin-error alert alert-error">{error}</div>}
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Email</label>
            <input 
              className="input" 
              value={email} 
              onChange={(e)=>setEmail(e.target.value)} 
              type="email" 
              required 
              placeholder="Enter your email"
            />
          </div>
          <div className="form-field">
            <label>Password</label>
            <input 
              className="input" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              type="password" 
              required 
              placeholder="Enter your password"
            />
          </div>
          <button 
            className="btn btn-primary btn-block" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        
        <div className="admin-auth-links">
          <p>
            Don't have an admin account? 
            <Link to="/admin/signup" className="admin-link"> Create one here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
