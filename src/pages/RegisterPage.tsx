import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function RegisterPage() {
  const { signUp, configured } = useAuth();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return <div className="tm-card p-4 text-center text-sm text-tm-muted">Supabase is not configured.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    setLoading(true);
    setError('');
    const result = await signUp({
      email: form.email,
      password: form.password,
      firstName: form.firstName,
      lastName: form.lastName,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="tm-card mx-auto max-w-[430px] p-4 text-center">
        <h2 className="text-lg font-bold text-tm-text">Please verify your email</h2>
        <p className="mt-2 text-sm text-tm-muted">Check your inbox and click the verification link.</p>
        <Link to="/verify-email" className="mt-4 inline-block text-sm text-tm-gold">Go to verification page</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[430px] space-y-5">
      <div className="text-center">
        <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
        <h1 className="mt-3 text-xl font-bold text-tm-text">Create Account</h1>
      </div>
      <form onSubmit={handleSubmit} className="tm-card space-y-3 p-4">
        <label className="block">
          <span className="tm-label">First Name</span>
          <input className="tm-input mt-1.5" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
        </label>
        <label className="block">
          <span className="tm-label">Last Name</span>
          <input className="tm-input mt-1.5" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
        </label>
        <label className="block">
          <span className="tm-label">Email</span>
          <input className="tm-input mt-1.5" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </label>
        <label className="block">
          <span className="tm-label">Password</span>
          <input className="tm-input mt-1.5" type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
        </label>
        {error && <p className="text-sm text-tm-red">{error}</p>}
        <button type="submit" disabled={loading} className="tm-btn-primary justify-center">
          {loading ? 'Creating account...' : 'Create Free Account'}
        </button>
        <p className="text-center text-sm text-tm-muted">
          Already have an account? <Link to="/login" className="text-tm-gold">Log In</Link>
        </p>
      </form>
    </div>
  );
}
