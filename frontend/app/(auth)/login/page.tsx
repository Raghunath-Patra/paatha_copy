'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from '../../components/auth/LoginForm';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const registered = searchParams?.get('registered');
  const resetSuccess = searchParams?.get('reset');
  const { loading } = useSupabaseAuth();

  useEffect(() => {
    console.log('Login page mounted');  // Debug log
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {registered && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg max-w-md">
          A verification link has been sent to your email address. Please verify your email before logging in.
        </div>
      )}
      {resetSuccess === 'success' && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg max-w-md">
          Your password has been reset successfully. Please log in with your new password.
        </div>
      )}
      <LoginForm />
    </div>
  );
}