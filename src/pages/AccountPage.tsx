import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/Button';
import { Card, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { ProtectedRoute, VerifiedRoute } from '../components/layout/ProtectedRoute';

function AccountContent() {
  const { user, profile, refreshProfile, updateEmail } = useAuth();
  const [firstName, setFirstName] = useState(profile?.first_name ?? '');
  const [lastName, setLastName] = useState(profile?.last_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [emailMessage, setEmailMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name);
      setLastName(profile.last_name);
      setEmail(profile.email ?? user?.email ?? '');
    }
  }, [profile, user]);

  const saveProfile = async () => {
    if (!user) return;
    await profileService.updateNames(user.id, firstName, lastName);
    await refreshProfile();
    setProfileMessage('Profile updated');
  };

  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage('Passwords do not match');
      return;
    }
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email ?? '',
      password: currentPassword,
    });
    if (signInError) {
      setPasswordMessage('Current password is incorrect');
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPasswordMessage(error ? error.message : '✓ Password changed successfully');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const changeEmail = async () => {
    const result = await updateEmail(email);
    setEmailMessage(result.error ?? 'Verification email sent to new address');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {profile?.first_name || 'Trader'} 👋
          </h1>
          <p className="text-gray-400">Manage your TradeMirror account</p>
        </div>
        <Link to="/strategies">
          <Button variant="secondary">Manage Strategies</Button>
        </Link>
      </div>

      <Card>
        <CardTitle>Profile</CardTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          <Input label="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </div>
        <Button className="mt-4" onClick={saveProfile}>
          Save Profile
        </Button>
        {profileMessage && <p className="mt-2 text-sm text-profit">{profileMessage}</p>}
      </Card>

      <Card>
        <CardTitle>Change Email</CardTitle>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Button className="mt-4" variant="secondary" onClick={changeEmail}>
          Update Email
        </Button>
        {emailMessage && <p className="mt-2 text-sm text-gray-300">{emailMessage}</p>}
      </Card>

      <Card>
        <CardTitle>Change Password</CardTitle>
        <div className="grid gap-4">
          <Input label="Current Password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          <Input label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          <Input label="Confirm New Password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        </div>
        <Button className="mt-4" variant="secondary" onClick={changePassword}>
          Change Password
        </Button>
        {passwordMessage && <p className="mt-2 text-sm text-gray-300">{passwordMessage}</p>}
      </Card>
    </div>
  );
}

export function AccountPage() {
  return (
    <ProtectedRoute>
      <VerifiedRoute>
        <AccountContent />
      </VerifiedRoute>
    </ProtectedRoute>
  );
}
