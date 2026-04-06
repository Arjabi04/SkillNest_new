import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import useSidebarLayout from '../hooks/useSidebarLayout';
import defaultAvatar from '../assets/default-avatar.jpg';
import defaultHeader from '../assets/default-header.jpeg';
import { clearAuth, getValidToken } from '../utils/tokenUtils';

const SettingsPage = () => {
  const navigate = useNavigate();
  const { mainContentClass } = useSidebarLayout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    bio: '',
    notificationsEnabled: true,
    profileImage: '',
    headerImage: '',
  });

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  useEffect(() => {
    const loadProfile = async () => {
      const token = getValidToken();
      if (!token) {
        navigate('/login');
        return;
      }

      try {
        const response = await fetch('http://localhost:4000/api/profile/me', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setProfile({
            username: data.username || '',
            email: data.email || '',
            bio: data.bio || '',
            notificationsEnabled: data.notificationsEnabled !== false,
            profileImage: data.profileImage || '',
            headerImage: data.headerImage || '',
          });
        } else {
          setMessage(data.msg || 'Failed to load settings');
        }
      } catch (err) {
        console.error(err);
        setMessage('Network error while loading settings');
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
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = getValidToken();
    if (!token) {
      navigate('/login');
      return;
    }

    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:4000/api/profile/me', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: profile.username,
          email: profile.email,
          bio: profile.bio,
          notificationsEnabled: profile.notificationsEnabled,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setProfile((prev) => ({
          ...prev,
          username: data.user.username,
          email: data.user.email,
          bio: data.user.bio || '',
          notificationsEnabled: data.user.notificationsEnabled !== false,
        }));
        setMessage('Settings saved successfully');
      } else {
        setMessage(data.msg || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      setMessage('Network error while saving settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans flex">
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
    <div className="min-h-screen bg-slate-50 font-sans flex">
      <Sidebar
        showLogoutConfirm={showLogoutConfirm}
        setShowLogoutConfirm={setShowLogoutConfirm}
        onLogout={handleLogout}
      />

      <main className={`flex-1 ${mainContentClass}`}>
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <div className="mb-8">
            {/* <p className="text-xs font-black uppercase tracking-[0.24em] text-blue-600">Account Settings</p> */}
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-900">Account Settings</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Update your account details and choose whether you want notifications turned on.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-black text-slate-900">Personal Info</h2>
              <p className="mt-1 text-sm text-slate-500">These changes apply to your public profile and login email.</p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
                  <input
                    name="username"
                    value={profile.username}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={profile.email}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Bio</label>
                  <textarea
                    name="bio"
                    rows={5}
                    value={profile.bio}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white"
                    placeholder="Tell people a bit about yourself..."
                  />
                </div>

                {message && (
                  <div className={`rounded-2xl border px-4 py-3 text-sm ${message.toLowerCase().includes('success') ? 'border-green-200 bg-green-50 text-green-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                    {message}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
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

            <aside className="space-y-6">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <img
                  src={profile.headerImage || defaultHeader}
                  alt="Header preview"
                  className="h-32 w-full object-cover"
                />
                <div className="p-6 text-center">
                  <img
                    src={profile.profileImage || defaultAvatar}
                    alt="Avatar preview"
                    className="mx-auto -mt-14 h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                  />
                  <h3 className="mt-4 text-xl font-bold text-slate-900">{profile.username || 'Your account'}</h3>
                  <p className="mt-1 text-sm text-slate-500">{profile.email}</p>
                </div>
              </section>

              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-black text-slate-900">Notifications</h2>
                <p className="mt-1 text-sm text-slate-500">Turn notifications on or off for your account.</p>

                <label className="mt-5 flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Enable notifications</div>
                    <div className="text-xs text-slate-500">When off, in-app notifications will be skipped.</div>
                  </div>
                  <input
                    name="notificationsEnabled"
                    type="checkbox"
                    checked={profile.notificationsEnabled}
                    onChange={handleChange}
                    className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </label>
              </section>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
