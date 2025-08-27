// src/Protected.jsx
import { Navigate } from 'react-router-dom';

export default function Protected({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/auth" replace />;
}
