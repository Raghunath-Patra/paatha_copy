// Path: frontend/app/components/auth/PasswordResetRequest.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PasswordResetRequest() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const { requestPasswordReset, loading, error } = useSupabaseAuth();
  const router = useRouter();

  // Check if the form was submitted previously
  useEffect(() => {
    const isSubmitted = sessionStorage.getItem('passwordResetSubmitted');
    if (isSubmitted) {
      setSubmitted(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitted(false); // Reset in case of retry
      const success = await requestPasswordReset(email);
      if (success) {
        setSubmitted(true);
        sessionStorage.setItem('passwordResetSubmitted', 'true');
      }
    } catch (err) {
      console.error('Error requesting password reset:', err);
    }
  };

  useEffect(() => {
    if (submitted) {
      const timer = setTimeout(() => {
        sessionStorage.removeItem('passwordResetSubmitted');
        router.push('/login');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [submitted, router]);

  if (submitted) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm">
        <h2 className="text-2xl font-medium mb-6">Check Your Email</h2>
        <div aria-live="polite" className="text-center mb-6">
          <div
            role="img"
            aria-label="Success"
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <p className="text-gray-600 mb-4">
          A password reset link has been sent to your email.
        </p>
        <p className="text-gray-600 mb-4">
          Please check your email and click on the reset link. The link will expire in 1 hour.
        </p>
        <p className="text-gray-600 mb-4">
          Redirecting to login page in <strong>5 seconds...</strong>
        </p>
        <p className="text-gray-500 text-sm mb-6">Don't see the email? Check your spam folder.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-medium mb-6">Reset Password</h2>
      <p className="text-gray-600 mb-4">
        Enter your email address and we'll send you a link to reset your password.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
        
        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}