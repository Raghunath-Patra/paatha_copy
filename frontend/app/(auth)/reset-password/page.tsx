// frontend/app/(auth)/reset-password/page.tsx
'use client';

import { useSearchParams } from 'next/navigation';
import PasswordReset from '../../components/auth/PasswordReset';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function ResetPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [validToken, setValidToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase handles the password reset flow via URL parameters
    const checkSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (!session) {
        setError('Invalid or expired reset link. Please request a new one.');
        setTimeout(() => {
          router.push('/forgot-password');
        }, 3000);
        return;
      }

      setValidToken(true);
    };

    checkSession();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm text-center">
          <h2 className="text-2xl font-medium mb-3 text-red-600">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-3">{error}</p>
          <p className="text-gray-500">Redirecting to password reset request...</p>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <PasswordReset />
    </div>
  );
}