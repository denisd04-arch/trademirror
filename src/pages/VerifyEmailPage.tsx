import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export function VerifyEmailPage() {
  const { user, isEmailVerified, resendVerification } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    const result = await resendVerification();
    setLoading(false);
    setMessage(result.error ?? 'Verification email sent. Check your inbox.');
  };

  if (isEmailVerified) {
    return (
      <div className="mx-auto max-w-[430px] space-y-5">
        <div className="text-center">
          <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
          <h1 className="mt-3 text-xl font-bold text-tm-text">Email Verified</h1>
        </div>
        <div className="tm-card p-4 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-tm-green/15">
            <Check className="h-5 w-5 text-tm-green" />
          </div>
          <p className="mt-3 text-sm text-tm-muted">Your email has been verified.</p>
          <Link to="/account" className="mt-4 inline-block text-sm text-tm-gold">
            Go to Account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[430px] space-y-5">
      <div className="text-center">
        <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
        <h1 className="mt-3 text-xl font-bold text-tm-text">Verify Your Email</h1>
      </div>
      <div className="tm-card p-4 text-center">
        <p className="text-sm text-tm-muted">
          Check your inbox{user?.email ? ` (${user.email})` : ''} and click the verification link.
        </p>
        <button
          type="button"
          onClick={handleResend}
          disabled={loading}
          className="tm-btn-primary mt-4 justify-center"
        >
          {loading ? 'Sending...' : 'Resend Verification Email'}
        </button>
        {message && <p className="mt-3 text-sm text-tm-muted">{message}</p>}
      </div>
    </div>
  );
}
