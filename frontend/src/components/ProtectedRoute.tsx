import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'var(--surface)',
      }}>
        <div className="loading-spinner" />
      </div>
    );
  }

  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
