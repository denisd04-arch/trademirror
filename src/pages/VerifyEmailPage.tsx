import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

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
      <Card className="mx-auto max-w-md text-center">
        <p className="text-profit">✓ Email verified</p>
        <Link to="/account" className="mt-4 inline-block text-accent-gold hover:underline">
          Go to Account
        </Link>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-md text-center">
      <h1 className="text-xl font-bold text-white">Please verify your email</h1>
      <p className="mt-2 text-gray-400">
        Check your inbox{user?.email ? ` (${user.email})` : ''} and click the verification link.
      </p>
      <Button className="mt-4" onClick={handleResend} disabled={loading}>
        Resend Verification Email
      </Button>
      {message && <p className="mt-3 text-sm text-gray-300">{message}</p>}
    </Card>
  );
}
