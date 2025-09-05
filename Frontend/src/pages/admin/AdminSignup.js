import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { adminAPI } from '../../services/api';
import './AdminAuth.css';

const AdminSignup = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!formData.email || !formData.name || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await adminAPI.register(formData.email, formData.name, formData.password);
      if (res?.token) {
        localStorage.setItem('adminToken', res.token);
        navigate('/admin', { replace: true });
      } else {
        setError('Registration failed');
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-container">
      <div className="admin-login-card card">
        <h2 className="admin-title">Admin Registration</h2>
        {error && <div className="admin-error alert alert-error">{error}</div>}
        
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>Full Name</label>
            <input 
              className="input" 
              name="name"
              value={formData.name} 
              onChange={handleChange} 
              type="text" 
              required 
              placeholder="Enter your full name"
            />
          </div>
          
          <div className="form-field">
            <label>Email</label>
            <input 
              className="input" 
              name="email"
              value={formData.email} 
              onChange={handleChange} 
              type="email" 
              required 
              placeholder="Enter your email"
            />
          </div>
          
          <div className="form-field">
            <label>Password</label>
            <input 
              className="input" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              type="password" 
              required 
              placeholder="Enter your password"
            />
          </div>
          
          <div className="form-field">
            <label>Confirm Password</label>
            <input 
              className="input" 
              name="confirmPassword"
              value={formData.confirmPassword} 
              onChange={handleChange} 
              type="password" 
              required 
              placeholder="Confirm your password"
            />
          </div>
          
          <button 
            className="btn btn-primary btn-block" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Admin Account'}
          </button>
        </form>
        
        <div className="admin-auth-links">
          <p>
            Already have an admin account? 
            <Link to="/admin/login" className="admin-link"> Sign in here</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminSignup;
