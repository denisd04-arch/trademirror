import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

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
    <div className="mx-auto max-w-[430px] space-y-5">
      <div className="text-center">
        <img src="/assets/trademirror-logo.svg" alt="TradeMirror" className="mx-auto h-10 w-10" />
        <h1 className="mt-3 text-xl font-bold text-tm-text">Reset Password</h1>
      </div>
      <form onSubmit={handleSubmit} className="tm-card space-y-3 p-4">
        <label className="block">
          <span className="tm-label">New Password</span>
          <input
            className="tm-input mt-1.5"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="tm-label">Confirm New Password</span>
          <input
            className="tm-input mt-1.5"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </label>
        {error && <p className="text-sm text-tm-red">{error}</p>}
        <button type="submit" disabled={loading} className="tm-btn-primary justify-center">
          {loading ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
