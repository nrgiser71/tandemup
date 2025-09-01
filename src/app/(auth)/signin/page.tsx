'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { ROUTES } from '@/lib/constants';
import { validateEmail } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: true,
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!formData.password) {
      setError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const { error } = await signIn({
        email: formData.email,
        password: formData.password,
        rememberMe: formData.rememberMe,
      });

      if (error) {
        if (error.message.includes('Invalid credentials')) {
          setError('Invalid email or password');
        } else {
          setError(error.message);
        }
      } else {
        router.push(ROUTES.DASHBOARD);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your TandemUp account"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Email */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Email address</span>
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="input input-bordered"
            placeholder="Enter your email"
            required
            autoComplete="email"
          />
        </div>

        {/* Password */}
        <div className="form-control">
          <label className="label">
            <span className="label-text">Password</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              className="input input-bordered w-full pr-12"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5 text-gray-400" />
              ) : (
                <Eye className="w-5 h-5 text-gray-400" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me & Forgot Password */}
        <div className="flex items-center justify-between">
          <label className="label cursor-pointer justify-start gap-2">
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData(prev => ({ ...prev, rememberMe: e.target.checked }))}
              className="checkbox checkbox-sm checkbox-primary"
            />
            <span className="label-text text-sm">Remember me</span>
          </label>
          
          <Link
            href={ROUTES.FORGOT_PASSWORD}
            className="link link-primary text-sm"
          >
            Forgot password?
          </Link>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading && <span className="loading loading-spinner loading-sm"></span>}
          Sign In
        </button>

        {/* Sign Up Link */}
        <div className="text-center">
          <span className="text-sm text-base-content/60">
            Don&apos;t have an account?{' '}
            <Link href={ROUTES.SIGN_UP} className="link link-primary">
              Sign up for free
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
}