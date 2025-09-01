'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layouts/AppLayout';
import { LANGUAGES, TIMEZONE_OPTIONS } from '@/lib/constants';
import { 
  User, 
  Mail, 
  Globe, 
  Clock, 
  Camera,
  AlertCircle,
  CheckCircle,
  Save
} from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, updateProfile, loading } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: profile?.first_name || '',
    language: profile?.language || 'en',
    timezone: profile?.timezone || 'UTC',
  });
  
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setUpdating(false);
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

                <button className="btn btn-outline btn-sm mt-4">
                  <Camera className="w-4 h-4" />
                  Change Photo
                </button>
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
                    <button className="btn btn-outline btn-sm">
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
                    <button className="btn btn-outline btn-sm">
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
                    <button className="btn btn-outline btn-error btn-sm">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}