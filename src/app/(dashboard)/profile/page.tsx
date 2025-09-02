'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { LANGUAGES, TIMEZONE_OPTIONS } from '@/lib/constants';
import { 
  User, 
  Mail, 
  Globe, 
  Clock, 
  AlertCircle,
  CheckCircle,
  Save,
  Upload,
  Trash2
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    language: profile?.language || 'en',
    timezone: profile?.timezone || 'UTC',
  });
  
  const [updating, setUpdating] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setUpdating(true);

    try {
      const { error } = await updateProfile({
        first_name: formData.firstName.trim(),
        language: formData.language as 'en' | 'nl' | 'fr',
        timezone: formData.timezone,
      });

      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to upload avatar');
      }

      // Refresh profile data to get new avatar URL
      window.location.reload(); // Simple way to refresh - could be improved with state management
      
      setMessage({ type: 'success', text: 'Avatar updated successfully!' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingAvatar(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    setMessage(null);

    try {
      const response = await fetch('/api/auth/avatar', {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to remove avatar');
      }

      // Refresh profile data
      window.location.reload();
      
      setMessage({ type: 'success', text: 'Avatar removed successfully!' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove avatar';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;

    try {
      const { error } = await (await import('@/lib/supabase/client')).supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Password reset email sent! Check your inbox.' });
      setShowPasswordModal(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send password reset email';
      setMessage({ type: 'error', text: errorMessage });
    }
  };

  const handleDeleteAccount = async () => {
    // This would typically involve calling an API that handles user deletion
    // For now, we'll just show a message
    setMessage({ 
      type: 'error', 
      text: 'Account deletion is not yet implemented. Please contact support.' 
    });
    setShowDeleteModal(false);
  };

  const handleBillingPortal = async () => {
    try {
      const response = await fetch('/api/payments/customer-portal', {
        method: 'POST',
      });

      if (response.ok) {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        throw new Error('Failed to open billing portal');
      }
    } catch (err) {
      console.error('Billing portal error:', err);
      setMessage({ type: 'error', text: 'Failed to open billing portal' });
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Profile Settings</h1>
          <p className="text-base-content/70 mt-2">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body text-center">
                <div className="avatar">
                  <div className="w-24 rounded-full bg-primary/20">
                    {profile.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt={profile.first_name}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold mt-4">{profile.first_name}</h2>
                <p className="text-base-content/60">{user.email}</p>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  {profile.subscription_status === 'trial' ? (
                    <div className="badge badge-warning">Trial</div>
                  ) : (
                    <div className="badge badge-success">Pro</div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                  />
                  
                  <button
                    onClick={handleAvatarClick}
                    disabled={uploadingAvatar}
                    className="btn btn-primary btn-sm"
                  >
                    {uploadingAvatar ? (
                      <span className="loading loading-spinner loading-xs"></span>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    Upload Photo
                  </button>
                  
                  {profile?.avatar_url && (
                    <button
                      onClick={handleAvatarRemove}
                      disabled={uploadingAvatar}
                      className="btn btn-outline btn-error btn-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="card bg-base-100 shadow-lg mt-6">
              <div className="card-body">
                <h3 className="card-title text-lg">Account Stats</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/70">Total Sessions</span>
                    <span className="font-semibold">{profile.total_sessions}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/70">Member Since</span>
                    <span className="font-semibold">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/70">No-Shows</span>
                    <span className="font-semibold">{profile.no_show_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Form */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Personal Information</h2>
                
                {/* Message Alert */}
                {message && (
                  <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                    {message.type === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <AlertCircle className="w-4 h-4" />
                    )}
                    <span>{message.text}</span>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email (Read-only) */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </span>
                    </label>
                    <input
                      type="email"
                      value={user.email || ''}
                      className="input input-bordered"
                      disabled
                    />
                    <label className="label">
                      <span className="label-text-alt text-xs text-base-content/60">
                        Contact support to change your email address
                      </span>
                    </label>
                  </div>

                  {/* First Name */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <User className="w-4 h-4" />
                        First Name
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="input input-bordered"
                      placeholder="Enter your first name"
                      required
                    />
                  </div>

                  {/* Language */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Language
                      </span>
                    </label>
                    <select
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        language: e.target.value as 'en' | 'nl' | 'fr' 
                      }))}
                      className="select select-bordered"
                    >
                      {LANGUAGES.map(lang => (
                        <option key={lang.code} value={lang.code}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <label className="label">
                      <span className="label-text-alt text-xs text-base-content/60">
                        Used for matching with other users
                      </span>
                    </label>
                  </div>

                  {/* Timezone */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Timezone
                      </span>
                    </label>
                    <select
                      value={formData.timezone}
                      onChange={(e) => setFormData(prev => ({ ...prev, timezone: e.target.value }))}
                      className="select select-bordered"
                    >
                      {TIMEZONE_OPTIONS.map(tz => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label} ({tz.offset})
                        </option>
                      ))}
                    </select>
                    <label className="label">
                      <span className="label-text-alt text-xs text-base-content/60">
                        Used for session scheduling
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <div className="card-actions justify-end">
                    <button
                      type="submit"
                      disabled={updating}
                      className="btn btn-primary"
                    >
                      {updating && <span className="loading loading-spinner loading-sm"></span>}
                      <Save className="w-4 h-4" />
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Account Management */}
            <div className="card bg-base-100 shadow-lg mt-6">
              <div className="card-body">
                <h2 className="card-title">Account Management</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Password</h3>
                      <p className="text-sm text-base-content/60">
                        Change your account password
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowPasswordModal(true)}
                      className="btn btn-outline btn-sm"
                    >
                      Change Password
                    </button>
                  </div>
                  
                  <div className="divider"></div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Subscription</h3>
                      <p className="text-sm text-base-content/60">
                        Manage your billing and subscription
                      </p>
                    </div>
                    <button 
                      onClick={handleBillingPortal}
                      className="btn btn-outline btn-sm"
                    >
                      Manage Billing
                    </button>
                  </div>
                  
                  <div className="divider"></div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-error">Delete Account</h3>
                      <p className="text-sm text-base-content/60">
                        Permanently delete your account and data
                      </p>
                    </div>
                    <button 
                      onClick={() => setShowDeleteModal(true)}
                      className="btn btn-outline btn-error btn-sm"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Reset Modal */}
      {showPasswordModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Reset Password</h3>
            <p className="mb-4">
              We&apos;ll send a password reset link to your email address: 
              <span className="font-semibold ml-1">{user?.email}</span>
            </p>
            <div className="modal-action">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handlePasswordReset}
                className="btn btn-primary"
              >
                Send Reset Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg text-error mb-4">Delete Account</h3>
            <div className="space-y-4">
              <p>Are you sure you want to permanently delete your account?</p>
              <div className="alert alert-warning">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  This action cannot be undone. All your data will be permanently removed.
                </span>
              </div>
            </div>
            <div className="modal-action">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn btn-error"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}