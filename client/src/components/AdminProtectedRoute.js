import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminProtectedRoute = ({ children }) => {
  const adminToken = localStorage.getItem('adminToken');
  const adminUser = localStorage.getItem('adminUser');
  
  if (!adminToken || !adminUser) {
    return <Navigate to="/login" replace />;
  }
  
  try {
    const user = JSON.parse(adminUser);
    if (user.role !== 'admin') {
      return <Navigate to="/login" replace />;
    }
  } catch (error) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default AdminProtectedRoute;