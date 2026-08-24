import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function LoginPage() {
  const { signIn, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return (
      <Card className="text-center">
        <p className="text-tm-muted">Supabase environment variables are not configured.</p>
      </Card>
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
    <div className="mx-auto max-w-md space-y-5">
      <div className="text-center">
        <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
        <h1 className="mt-3 text-2xl font-bold text-tm-text">Log In</h1>
      </div>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <p className="text-sm text-loss">{error}</p>}
          <Button type="submit" variant="profit" fullWidth disabled={loading}>
            {loading ? 'Signing in...' : 'Log In'}
          </Button>
        </form>
        <div className="mt-4 flex flex-col gap-2 text-center text-sm">
          <Link to="/forgot-password" className="text-accent-gold hover:underline">Forgot Password</Link>
          <Link to="/register" className="text-tm-muted hover:text-tm-text">Create an account</Link>
        </div>
      </Card>
    </div>
  );
}
