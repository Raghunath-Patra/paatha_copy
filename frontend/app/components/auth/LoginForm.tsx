// frontend/app/components/auth/LoginForm.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams?.get('registered');
  const resetSuccess = searchParams?.get('reset');
  const sessionExpired = searchParams?.get('session_expired');
  const urlError = searchParams?.get('error');

  const { login, signInWithGoogle, loading, error, setError } = useSupabaseAuth();
  
  const [credentials, setCredentials] = React.useState({
    email: '',
    password: ''
  });

  // Clear any session-related errors when component mounts
  useEffect(() => {
    if (error && (
      error.includes("Session could not be refreshed") || 
      error.includes("Error refreshing session")
    )) {
      // Clear the error in the auth context
      setError(null);
    }
  }, [error, setError]);

  useEffect(() => {
    // Initialize Google One Tap
    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true;
    googleScript.defer = true;
    document.head.appendChild(googleScript);

    googleScript.onload = () => {
      if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleOneTapResponse,
          auto_select: true,
          cancel_on_tap_outside: false,
          context: 'signin',
          ux_mode: 'popup',
          login_uri: window.location.origin + '/auth/callback'
        });

        // Render the Google One-tap button
        const buttonDiv = document.getElementById('google-one-tap');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: buttonDiv.offsetWidth,
            text: 'signin_with'
          });
        }

        // Prompt One-tap
        window.google.accounts.id.prompt();
      }
    };

    return () => {
      if (googleScript.parentNode) {
        googleScript.parentNode.removeChild(googleScript);
      }
    };
  }, []);

  const handleGoogleOneTapResponse = async (response: any) => {
    try {
      console.log('Google One-Tap response received:', response);
      if (response.credential) {
        console.log('Attempting sign in with credential');
        await signInWithGoogle(response.credential);
        console.log('Sign in successful');
      } else {
        console.warn('No credential in response:', response);
      }
    } catch (error) {
      console.error('Google One-tap error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await login(credentials.email, credentials.password);
    // Set the initial login flag
    sessionStorage.setItem('isInitialLogin', 'true');
  };

  // Helper function to get user-friendly error messages
  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'email_not_confirmed':
        return 'Please check your email and click the verification link before logging in.';
      case 'invalid_or_expired_code':
        return 'The verification link has expired. Please try logging in again.';
      case 'no_code_provided':
        return 'Invalid verification link. Please try the link from your email again.';
      case 'no_user_returned':
        return 'Authentication failed. Please try again.';
      case 'unexpected_error':
        return 'An unexpected error occurred. Please try again.';
      case 'auth_callback_error':
        return 'Authentication failed. Please try logging in again.';
      default:
        return decodeURIComponent(errorCode);
    }
  };

  // Filter out session refresh errors for display
  const displayError = error && !(
    error.includes("Session could not be refreshed") || 
    error.includes("Error refreshing session")
  ) ? error : null;

  // URL error takes precedence
  const finalError = urlError ? getErrorMessage(urlError) : displayError;

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-medium mb-6">Login to Your Account</h2>

      {finalError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {finalError}
        </div>
      )}

      {registered && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">
          <div className="font-medium mb-1">Registration Successful!</div>
          <div className="text-sm">
            A verification link has been sent to your email address. 
            Please verify your email before logging in.
          </div>
        </div>
      )}

      {resetSuccess === 'success' && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg">
          Your password has been reset successfully. Please log in with your new password.
        </div>
      )}

      {sessionExpired && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg">
          Your session has expired. Please log in again to continue.
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
            value={credentials.email}
            onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={credentials.password}
            onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        <div className="text-right">
          <Link
            href="/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Log In'}
        </button>
        
        <p className="mt-2 text-sm text-gray-600">
          If you haven't provided your phone number yet, you'll be asked to do so after login to help us send you important updates about your learning progress.
        </p>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Google One-tap button container */}
        <div id="google-one-tap" className="w-full"></div>

        <div className="text-center mt-4">
          <span className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link href="/register" className="text-blue-600 hover:text-blue-500">
              Register
            </Link>
          </span>
        </div>
      </form>
    </div>
  );
}