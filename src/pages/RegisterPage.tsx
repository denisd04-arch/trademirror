import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function RegisterPage() {
  const { signUp, configured } = useAuth();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return (
      <Card className="mx-auto max-w-md text-center">
        <p className="text-gray-400">Supabase is not configured.</p>
      </Card>
    );
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
      <Card className="mx-auto max-w-md text-center">
        <h2 className="text-xl font-bold text-white">Please verify your email</h2>
        <p className="mt-2 text-gray-400">
          Check your inbox and click the verification link.
        </p>
        <Link to="/verify-email" className="mt-4 inline-block text-accent-gold hover:underline">
          Go to verification page
        </Link>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="text-center">
        <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-12 w-12" />
        <h1 className="mt-4 text-2xl font-bold text-white">Create Account</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="First Name" required value={form.firstName} onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))} />
          <Input label="Last Name" required value={form.lastName} onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))} />
          <Input label="Email" type="email" required value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Password" type="password" required minLength={8} value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} />
          {error && <p className="text-sm text-loss">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? 'Creating account...' : 'Create Free Account'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <Link to="/login" className="text-accent-gold hover:underline">
            Log In
          </Link>
        </p>
      </Card>
    </div>
  );
}
