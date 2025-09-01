'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import { ROUTES } from '@/lib/constants';
import { validateEmail } from '@/lib/utils';
import { AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword({ email });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout
        title="Check your email"
        subtitle="We've sent you a password reset link"
      >
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          
          <div className="space-y-2">
            <p className="text-base-content/70">
              We&apos;ve sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-base-content/60">
              Check your email and follow the link to reset your password.
              If you don&apos;t see the email, check your spam folder.
            </p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => {
                setSuccess(false);
                setEmail('');
              }}
              className="btn btn-outline w-full"
            >
              Send another link
            </button>
            
            <Link href={ROUTES.SIGN_IN} className="btn btn-ghost w-full">
              <ArrowLeft className="w-4 h-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email address and we'll send you a link to reset your password"
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input input-bordered"
            placeholder="Enter your email address"
            required
            autoComplete="email"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary w-full"
        >
          {loading && <span className="loading loading-spinner loading-sm"></span>}
          Send Reset Link
        </button>

        {/* Back to Sign In */}
        <div className="text-center">
          <Link
            href={ROUTES.SIGN_IN}
            className="link link-primary text-sm inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}