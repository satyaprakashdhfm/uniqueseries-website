import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRequire = ({ children }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  if (!token) return <Navigate to="/admin/login" replace />;
  return children;
};

export default AdminRequire;
