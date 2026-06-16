import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FiUser, FiMail, FiLock, FiCheckCircle, FiShield, FiArrowLeft } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();

  // Profile fields state
  const [name, setName] = useState(user?.name || '');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      return toast.error('Name cannot be empty');
    }

    try {
      setProfileLoading(true);
      const res = await authAPI.updateProfile({ name });
      // Update local context state
      updateUser(res.data.data);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return toast.error('Please fill in all password fields');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('New passwords do not match');
    }
    if (newPassword.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }

    try {
      setPasswordLoading(true);
      await authAPI.changePassword({ currentPassword, newPassword });
      toast.success('Password changed successfully!');
      // Reset password inputs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/" className="btn btn-secondary btn-icon btn-sm" title="Back to Dashboard">
          <FiArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            User <span className="gradient-text">Profile</span>
          </h1>
          <p className="text-sm text-surface-400 mt-1">
            Manage your account settings and update security credentials
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Side: General Profile Card */}
        <div className="glass rounded-3xl p-6 border border-surface-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-surface-800/50 pb-4">
            <div className="p-2.5 rounded-xl bg-primary-500/10 text-primary-400 border border-primary-500/20">
              <FiUser className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white">General Information</h3>
              <p className="text-xs text-surface-400">Update your account name</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="label">Email Address (Read-only)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-500">
                  <FiMail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="input pl-10 bg-surface-950/50 text-surface-500 border-surface-900 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                  <FiUser className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input pl-10"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={profileLoading}
              className="btn btn-primary w-full py-2.5 font-semibold mt-6 shadow-md"
            >
              {profileLoading ? 'Saving changes...' : 'Save Profile Details'}
            </button>
          </form>
        </div>

        {/* Right Side: Security / Password Change Card */}
        <div className="glass rounded-3xl p-6 border border-surface-800 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-surface-800/50 pb-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FiShield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-md font-bold text-white">Security & Password</h3>
              <p className="text-xs text-surface-400">Ensure your account stays secure</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="label">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                  <FiLock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <label className="label">New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                  <FiLock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="Min 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="label">Confirm New Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-surface-400">
                  <FiLock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="input pl-10"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-secondary w-full py-2.5 font-semibold mt-6 border-cyan-500/10 hover:border-cyan-500/20 hover:bg-surface-800"
            >
              {passwordLoading ? 'Updating password...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
