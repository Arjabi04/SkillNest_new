import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Sidebar from '../layouts/Sidebar';
import useSidebarLayout from '../hooks/useSidebarLayout';
import { clearAuth, getValidToken } from '../utils/tokenUtils';
import { getProfileSettings, updateProfileSettings, changePassword } from '../api/auth';

const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mainContentClass } = useSidebarLayout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: 'info', text: '' });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState({ type: 'info', text: '' });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    currentEmail: '',
    pendingEmail: '',
    emailVerified: true,
    bio: '',
  });

  const verificationState = searchParams.get('verification');

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  useEffect(() => {
    if (!verificationState) return;

    if (verificationState === 'success') {
      setFeedback({ type: 'success', text: 'Email verified successfully.' });
    } else if (verificationState === 'invalid') {
      setFeedback({ type: 'error', text: 'Verification link is invalid or expired.' });
    } else if (verificationState === 'taken') {
      setFeedback({ type: 'error', text: 'That email address is already in use.' });
    } else {
      setFeedback({ type: 'error', text: 'Unable to verify email.' });
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('verification');
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams, verificationState]);

  useEffect(() => {
    const loadProfile = async () => {
      const token = getValidToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const data = await getProfileSettings(token);
        if (data?.user) {
          const nextEmail = data.user.pendingEmail || data.user.email || '';
          setProfile({
            username: data.user.username || '',
            email: nextEmail,
            currentEmail: data.user.currentEmail || data.user.email || '',
            pendingEmail: data.user.pendingEmail || '',
            emailVerified: data.user.emailVerified !== false,
            bio: data.user.bio || '',
          });
          if (data.user.pendingEmail) {
            setFeedback({
              type: 'info',
              text: `Verification email is waiting in Mailtrap for ${data.user.pendingEmail}.`,
            });
          }
        } else {
          setFeedback({ type: 'error', text: 'Failed to load settings' });
        }
      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', text: 'Network error while loading settings' });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    if (feedback.text) setFeedback({ type: 'info', text: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getValidToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setSaving(true);
    setFeedback({ type: 'info', text: '' });

    try {
      const data = await updateProfileSettings(token, {
        username: profile.username,
        email: profile.email,
      });

      if (data?.user) {
        const nextEmail = data.user.pendingEmail || data.user.email || '';
        setProfile((prev) => ({
          ...prev,
          username: data.user.username || prev.username,
          email: nextEmail,
          currentEmail: data.user.currentEmail || prev.currentEmail,
          pendingEmail: data.user.pendingEmail || '',
          emailVerified: data.user.emailVerified !== false,
        }));

        setFeedback({
          type: data.verificationRequired ? 'info' : 'success',
          text: data.verificationRequired
            ? `Verification email sent to ${data.user.pendingEmail}. Check Mailtrap to approve the new address.`
            : 'Settings saved successfully.',
        });
      } else {
        setFeedback({ type: 'error', text: 'Failed to save settings' });
      }
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', text: err?.message || 'Network error while saving settings' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (passwordFeedback.text) setPasswordFeedback({ type: 'info', text: '' });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const token = getValidToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setPasswordChanging(true);
    setPasswordFeedback({ type: 'info', text: '' });

    try {
      await changePassword(token, passwordForm.currentPassword, passwordForm.newPassword, passwordForm.confirmPassword);

      setPasswordFeedback({
        type: 'success',
        text: 'Password changed successfully.',
      });

      // Clear password form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err) {
      console.error(err);
      setPasswordFeedback({ type: 'error', text: err?.message || 'Failed to change password' });
    } finally {
      setPasswordChanging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white font-sans flex">
        <Sidebar
          showLogoutConfirm={showLogoutConfirm}
          setShowLogoutConfirm={setShowLogoutConfirm}
          onLogout={handleLogout}
        />
        <main className={`flex-1 ${mainContentClass}`}>
          <div className="mx-auto flex min-h-screen max-w-4xl items-center justify-center px-6">
            <div className="rounded-3xl border border-slate-200 bg-white px-8 py-10 shadow-sm">
              <p className="text-slate-600">Loading settings...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans flex">
      <Sidebar
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        onLogout={handleLogout}
      />

      <main className={`flex-1 ${mainContentClass}`}>
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-[0.3em] text-slate-500">Account Settings</p>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-10 bg-blue-600 rounded-full" />
                <h1 className="text-4xl font-black tracking-tight text-slate-950">Manage your profile</h1>
              </div>
              <p className="mt-3 max-w-2xl text-slate-600">
                Change your name and email, then verify the new address through the Mailtrap inbox before it goes live.
              </p>
            </div>

          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <section className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-black text-slate-950">Personal details</h2>
                  <p className="mt-1 text-sm text-slate-500">Your name updates immediately. New emails must be verified.</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${profile.emailVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                  {profile.pendingEmail ? 'Verification pending' : profile.emailVerified ? 'Email verified' : 'Email not verified'}
                </span>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Name</label>
                  <input
                    name="username"
                    value={profile.username}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>

                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    disabled={saving}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-500 focus:bg-white"
                  />
                </div>

                {feedback.text && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${feedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : feedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
                    {feedback.text}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/profile?userId=' + localStorage.getItem('userId'))}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Go to Profile
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-4xl border border-white/70 bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.12)] backdrop-blur">
              <div>
                <h2 className="text-lg font-black text-slate-950">Change Password</h2>
                <p className="mt-1 text-sm text-slate-500">Update your password to keep your account secure.</p>
              </div>

              <form onSubmit={handlePasswordSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordChanging}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-500 focus:bg-white"
                    placeholder="Enter your current password"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordChanging}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-500 focus:bg-white"
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                    disabled={passwordChanging}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 focus:border-blue-500 focus:bg-white"
                    placeholder="Confirm new password"
                  />
                </div>

                {passwordFeedback.text && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${passwordFeedback.type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : passwordFeedback.type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
                    {passwordFeedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={passwordChanging}
                  className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {passwordChanging ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
