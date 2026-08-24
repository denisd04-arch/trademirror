import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export function ResetPasswordPage() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    const result = await updatePassword(password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    navigate('/account');
  };

  return (
    <div className="mx-auto max-w-md space-y-6">
      <h1 className="text-center text-2xl font-bold text-white">Reset Password</h1>
      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="New Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Input label="Confirm New Password" type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
          {error && <p className="text-sm text-loss">{error}</p>}
          <Button type="submit" fullWidth disabled={loading}>
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
}
