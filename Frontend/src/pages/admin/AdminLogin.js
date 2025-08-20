import React from 'react';
import { useNavigate } from 'react-router-dom';
import { adminAPI } from '../../services/api';

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
    <div className="admin-login-card card">
      <h2 className="admin-title">Admin Login</h2>
      {error && <div className="admin-error">{error}</div>}
      <form onSubmit={onSubmit}>
        <div className="form-field">
          <label>Email</label>
          <input className="input" value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required />
        </div>
        <div className="form-field">
          <label>Password</label>
          <input className="input" value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required />
        </div>
        <button className="btn btn-primary btn-block" type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
};

export default AdminLogin;
