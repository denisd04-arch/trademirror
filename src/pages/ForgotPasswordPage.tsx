import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

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
      <Card className="mx-auto max-w-md text-center">
        <p className="text-gray-300">
          If an account exists for this email, you will receive a password reset link.
        </p>
        <Link to="/login" className="mt-4 inline-block text-accent-gold hover:underline">
          Back to Login
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-center text-2xl font-bold text-white">Forgot Password</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" fullWidth disabled={loading}>
            Send Reset Link
          </Button>
        </form>
      </Card>
    </div>
  );
}
