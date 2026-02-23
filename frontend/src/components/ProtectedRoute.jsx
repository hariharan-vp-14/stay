import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { jwtDecode } from 'jwt-decode';

/** Safely extract roles array from a JWT */
function getRolesFromToken(token) {
  try {
    const decoded = jwtDecode(token);
    // Support both new `roles` array and legacy `role` string
    if (Array.isArray(decoded.roles) && decoded.roles.length) return decoded.roles;
    if (decoded.role) return [decoded.role];
    return [];
  } catch {
    return [];
  }
}

export default function ProtectedRoute({ children, requiredRole }) {
  const { token, logout } = useAuth();
  const location = useLocation();

  if (!token) {
    const loginPath = requiredRole === 'admin' ? '/admin/login' : '/login';
    return <Navigate to={loginPath} state={{ from: location.pathname }} replace />;
  }

  // Verify the JWT roles claim
  const tokenRoles = getRolesFromToken(token);
  if (!tokenRoles.length) {
    // Token is invalid/expired — force logout
    logout();
    return <Navigate to="/login" replace />;
  }

  // If a specific role is required, check it's included in the JWT roles array
  if (requiredRole && !tokenRoles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

/** Wraps public pages — redirects to dashboard if already logged in */
export function RedirectIfAuth({ children }) {
  const { token } = useAuth();

  if (token) {
    const tokenRoles = getRolesFromToken(token);
    const dest = tokenRoles.includes('admin') ? '/admin/dashboard' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  return children;
}
