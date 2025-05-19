// Path: frontend/app/(auth)/verify-email/page.tsx


'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../utils/supabase';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const router = useRouter();

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get the session to check if email is verified
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (!session) {
          // If no session, user needs to sign in again
          setStatus('error');
          setMessage('Verification link expired or invalid. Please sign in again.');
          setTimeout(() => {
            router.push('/login');
          }, 3000);
          return;
        }

        // Check if email is verified
        if (session.user.email_confirmed_at) {
          setStatus('success');
          setMessage('Email verified successfully! Redirecting to login...');
          
          // Update profile to mark as verified if needed
          await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', session.user.id);

          setTimeout(() => {
            router.push('/login');
          }, 3000);
        } else {
          setStatus('error');
          setMessage('Email verification pending. Please check your email and click the verification link.');
        }

      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('An error occurred during verification. Please try again.');
      }
    };

    handleEmailVerification();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        <div className="mt-8">
          {status === 'verifying' && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-600">Verifying your email...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="rounded-md bg-green-50 p-4">
              <div className="flex justify-center items-center mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
              <div className="text-center text-green-800">
                {message}
              </div>
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-center text-red-800 mb-4">
                {message}
              </div>
              <div className="text-center">
                <button
                  onClick={() => router.push('/login')}
                  className="text-blue-600 hover:text-blue-500"
                >
                  Return to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}