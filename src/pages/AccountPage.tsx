import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { profileService } from '../services/profileService';
import { supabase } from '../lib/supabase';
import { ProtectedRoute, VerifiedRoute } from '../components/layout/ProtectedRoute';

function AccountContent() {
  const { user, profile, refreshProfile, updateEmail, signOut, isEmailVerified } = useAuth();
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
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-tm-text">Account</h1>

      <div className="tm-card p-3.5">
        <p className="tm-section-title">Profile</p>
        <p className="mt-2 text-sm font-semibold text-tm-text">
          {profile?.first_name} {profile?.last_name}
        </p>
        <p className="text-xs text-tm-muted">{profile?.email ?? user?.email}</p>
        <p className="mt-2 text-xs text-tm-muted">
          Status: {profile?.account_status === 'disabled' ? 'Unavailable' : 'Logged in'}
          {isEmailVerified ? ' · Email verified' : ' · Email not verified'}
        </p>
      </div>

      <div className="tm-card space-y-3 p-3.5">
        <p className="tm-section-title">Edit Profile</p>
        <label className="block">
          <span className="tm-label">First Name</span>
          <input className="tm-input mt-1.5" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        </label>
        <label className="block">
          <span className="tm-label">Last Name</span>
          <input className="tm-input mt-1.5" value={lastName} onChange={(e) => setLastName(e.target.value)} />
        </label>
        <button type="button" onClick={saveProfile} className="tm-btn-primary justify-center">
          Save Profile
        </button>
        {profileMessage && <p className="text-xs text-tm-green">{profileMessage}</p>}
      </div>

      <div className="tm-card space-y-3 p-3.5">
        <p className="tm-section-title">Change Email</p>
        <input className="tm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="button" onClick={changeEmail} className="tm-btn-secondary w-full">
          Update Email
        </button>
        {emailMessage && <p className="text-xs text-tm-muted">{emailMessage}</p>}
      </div>

      <div className="tm-card space-y-3 p-3.5">
        <p className="tm-section-title">Change Password</p>
        <input className="tm-input" type="password" placeholder="Current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
        <input className="tm-input" type="password" placeholder="New password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
        <input className="tm-input" type="password" placeholder="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        <button type="button" onClick={changePassword} className="tm-btn-secondary w-full">
          Change Password
        </button>
        {passwordMessage && <p className="text-xs text-tm-muted">{passwordMessage}</p>}
      </div>

      <Link to="/strategies" className="tm-btn-secondary block text-center text-sm">
        My Strategies
      </Link>

      <button type="button" onClick={() => signOut()} className="w-full py-2 text-sm text-tm-red">
        Logout
      </button>
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
