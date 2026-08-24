import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await resetPassword(email);
    setLoading(false);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-[430px] space-y-5">
        <div className="text-center">
          <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
          <h1 className="mt-3 text-xl font-bold text-tm-text">Check Your Email</h1>
        </div>
        <div className="tm-card p-4 text-center">
          <p className="text-sm text-tm-muted">
            If an account exists for this email, you will receive a password reset link.
          </p>
          <Link to="/login" className="mt-4 inline-block text-sm text-tm-gold">
            Back to Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[430px] space-y-5">
      <div className="text-center">
        <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
        <h1 className="mt-3 text-xl font-bold text-tm-text">Forgot Password</h1>
      </div>
      <form onSubmit={handleSubmit} className="tm-card space-y-3 p-4">
        <label className="block">
          <span className="tm-label">Email</span>
          <input
            className="tm-input mt-1.5"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit" disabled={loading} className="tm-btn-primary justify-center">
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        <p className="text-center text-sm text-tm-muted">
          <Link to="/login" className="text-tm-gold">
            Back to Log In
          </Link>
        </p>
      </form>
    </div>
  );
}
