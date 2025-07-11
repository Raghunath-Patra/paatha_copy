// frontend/app/components/auth/LoginForm.tsx - FIXED Google One-tap Integration
'use client';

import React, { useEffect, useRef } from 'react';
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
          cancel: () => void;
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

  const { login, signInWithGoogle, loading, error, setError, user } = useSupabaseAuth();
  
  const [credentials, setCredentials] = React.useState({
    email: '',
    password: ''
  });

  const [formSubmissionInProgress, setFormSubmissionInProgress] = React.useState(false);
  const googleInitialized = useRef(false);

  // Clear any session-related errors when component mounts
  useEffect(() => {
    if (error && (
      error.includes("Session could not be refreshed") || 
      error.includes("Error refreshing session")
    )) {
      setError(null);
    }
  }, [error, setError]);

  // FIXED: Google One-tap initialization with proper authentication checks
  useEffect(() => {
    // CRITICAL FIX: Don't initialize Google One-tap if user is already authenticated
    if (user) {
      console.log('User already authenticated, skipping Google One-tap initialization');
      return;
    }

    // Prevent double initialization
    if (googleInitialized.current) {
      console.log('Google One-tap already initialized, skipping');
      return;
    }
    
    console.log('Initializing Google One-tap for unauthenticated user');

    // Initialize Google One Tap
    const googleScript = document.createElement('script');
    googleScript.src = 'https://accounts.google.com/gsi/client';
    googleScript.async = true;
    googleScript.defer = true;
    document.head.appendChild(googleScript);

    googleScript.onload = () => {
      // Double-check user is still not authenticated
      if (user) {
        console.log('User became authenticated during script load, canceling Google One-tap');
        return;
      }

      if (window.google && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
        googleInitialized.current = true;
        
        window.google.accounts.id.initialize({
          client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
          callback: handleGoogleOneTapResponse,
          // FIXED: Don't auto-select to prevent automatic re-authentication
          auto_select: false,
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

        // FIXED: Only prompt One-tap if form submission is not in progress AND user is not authenticated
        if (!formSubmissionInProgress && !user) {
          console.log('Prompting Google One-tap');
          window.google.accounts.id.prompt();
        }
      }
    };

    googleScript.onerror = () => {
      console.error('Failed to load Google One-tap script');
    };

    return () => {
      if (googleScript.parentNode) {
        googleScript.parentNode.removeChild(googleScript);
      }
      
      // FIXED: Cancel any pending Google One-tap prompts
      if (window.google?.accounts?.id?.cancel) {
        window.google.accounts.id.cancel();
      }
    };
  }, [user, formSubmissionInProgress]); // Include user in dependencies

  const handleGoogleOneTapResponse = async (response: any) => {
    // FIXED: Multiple safety checks
    if (formSubmissionInProgress || loading || user) {
      console.log('Skipping Google One-tap - conditions not met:', {
        formSubmissionInProgress,
        loading,
        userExists: !!user
      });
      return;
    }

    try {
      console.log('Google One-Tap response received:', response);
      if (response.credential) {
        console.log('Attempting sign in with credential');
        await signInWithGoogle(response.credential);
        console.log('Google One-tap sign in completed');
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
    
    // Prevent double submission
    if (loading || formSubmissionInProgress) {
      console.log('Login already in progress, ignoring submission');
      return;
    }

    try {
      setFormSubmissionInProgress(true);
      console.log('Starting form login process');
      
      // FIXED: Cancel any pending Google One-tap before form login
      if (window.google?.accounts?.id?.cancel) {
        window.google.accounts.id.cancel();
      }
      
      await login(credentials.email, credentials.password);
      
      console.log('Form login completed successfully');
      
    } catch (error) {
      console.error('Login submission error:', error);
    } finally {
      // Reset form submission flag after a delay
      setTimeout(() => {
        setFormSubmissionInProgress(false);
      }, 1000);
    }
  };

  // Filter out session refresh errors for display
  const displayError = error && !(
    error.includes("Session could not be refreshed") || 
    error.includes("Error refreshing session")
  ) ? error : null;

  const isSubmitting = loading || formSubmissionInProgress;

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-medium mb-6">Login to Your Account</h2>

      {displayError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {displayError}
        </div>
      )}

      {registered && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg">
          A verification link has been sent to your email address. 
          Please verify your email before logging in.
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Signing in...
            </div>
          ) : (
            'Log In'
          )}
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

        {/* FIXED: Only show Google One-tap button if user is not authenticated */}
        {!user && (
          <div id="google-one-tap" className="w-full"></div>
        )}

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