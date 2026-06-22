import React, { useState, useRef } from 'react';
import { User, Mail, Lock, Camera, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import UserLayout from '../../components/UserLayout';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const fileRef = useRef();

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      const res = await api.put('/users/profile', { name, email });
      refreshUser(res.data.user);
      setProfileMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed.' });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setPasswordLoading(true);
    setPasswordMsg(null);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordMsg({ type: 'success', text: 'Password updated successfully!' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Password change failed.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const formData = new FormData();
      formData.append('profileImage', file);
      const res = await api.post('/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      refreshUser(res.data.user);
    } catch (err) {
      console.error('Avatar upload error:', err);
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <UserLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-white">Profile Settings</h1>
          <p className="text-slate-400 text-sm mt-1">Manage your account information and security settings.</p>
        </div>

        {/* Avatar Section */}
        <div className="p-6 rounded-2xl bg-white/3 border border-white/6">
          <h2 className="font-semibold text-white mb-5">Profile Photo</h2>
          <div className="flex items-center gap-5">
            <div className="relative">
              {user?.profileImage ? (
                <img src={`http://localhost:5001${user.profileImage}`} alt="Profile" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-2xl font-bold text-white">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              {avatarLoading && (
                <div className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            <div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} id="avatar-file-input" />
              <button
                id="upload-avatar-btn"
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-slate-300 hover:bg-white/8 transition-all"
              >
                <Camera className="w-4 h-4" />
                Change Photo
              </button>
              <p className="text-xs text-slate-600 mt-1">JPEG, PNG, or WEBP · Max 5MB</p>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="p-6 rounded-2xl bg-white/3 border border-white/6">
          <h2 className="font-semibold text-white mb-5">Account Information</h2>

          {profileMsg && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${profileMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {profileMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {profileMsg.text}
            </div>
          )}

          <form id="update-profile-form" onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="profile-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                id="save-profile-btn"
                type="submit"
                disabled={profileLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              >
                {profileLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save className="w-4 h-4" />Save Changes</>}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="p-6 rounded-2xl bg-white/3 border border-white/6">
          <h2 className="font-semibold text-white mb-5">Change Password</h2>

          {passwordMsg && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm border ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
              {passwordMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {passwordMsg.text}
            </div>
          )}

          <form id="change-password-form" onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Current Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500/50"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                id="change-password-btn"
                type="submit"
                disabled={passwordLoading}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-blue-600 rounded-xl text-white font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              >
                {passwordLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Lock className="w-4 h-4" />Update Password</>}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="p-5 rounded-2xl bg-white/2 border border-white/5">
          <p className="text-xs text-slate-600">Role: <span className="text-slate-400">{user?.role}</span> · Member since: <span className="text-slate-400">{user ? new Date(user?.createdAt || '').toLocaleDateString() : '—'}</span></p>
        </div>
      </div>
    </UserLayout>
  );
}
