import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <div className="rounded-2xl border border-loss/30 bg-loss/10 p-6 text-center">
        <h2 className="text-lg font-semibold text-white">Configuration Required</h2>
        <p className="mt-2 text-gray-300">
          Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-gray-400">Loading TradeMirror...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export function VerifiedRoute({ children }: { children: React.ReactNode }) {
  const { isEmailVerified } = useAuth();
  if (!isEmailVerified) {
    return <Navigate to="/verify-email" replace />;
  }
  return <>{children}</>;
}
