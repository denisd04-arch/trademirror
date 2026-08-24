import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function LoginPage() {
  const { signIn, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return (
      <div className="tm-card p-4 text-center text-sm text-tm-muted">
        Supabase environment variables are not configured.
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await signIn(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/account');
  };

  return (
    <div className="mx-auto max-w-[430px] space-y-5">
      <div className="text-center">
        <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
        <h1 className="mt-3 text-xl font-bold text-tm-text">Log In</h1>
      </div>
      <form onSubmit={handleSubmit} className="tm-card space-y-3 p-4">
        <label className="block">
          <span className="tm-label">Email</span>
          <input className="tm-input mt-1.5" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label className="block">
          <span className="tm-label">Password</span>
          <input className="tm-input mt-1.5" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <p className="text-sm text-tm-red">{error}</p>}
        <button type="submit" disabled={loading} className="tm-btn-primary justify-center">
          {loading ? 'Signing in...' : 'Log In'}
        </button>
        <div className="flex flex-col gap-2 text-center text-sm">
          <Link to="/forgot-password" className="text-tm-gold">Forgot Password</Link>
          <Link to="/register" className="text-tm-muted">Create an account</Link>
        </div>
      </form>
    </div>
  );
}
