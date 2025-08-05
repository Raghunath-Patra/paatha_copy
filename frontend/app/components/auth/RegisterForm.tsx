// frontend/app/components/auth/RegisterForm.tsx - FIXED to be compatible with LoginForm
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import Link from 'next/link';

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

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const { register, signInWithGoogle, loading, error, user } = useSupabaseAuth();
  const [passwordError, setPasswordError] = useState<string>('');
  
  // FIXED: Add submission tracking to prevent double submission (matching LoginForm)
  const [formSubmissionInProgress, setFormSubmissionInProgress] = useState(false);
  const googleInitialized = useRef(false);
  
  // FIXED: Google One-tap initialization with proper authentication checks (matching LoginForm)
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
    
    console.log('Initializing Google One-tap for registration');

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
          context: 'signup',
          ux_mode: 'popup',
          login_uri: window.location.origin + '/auth/callback'
        });

        // Render the Google One-tap button
        const buttonDiv = document.getElementById('google-one-tap-register');
        if (buttonDiv) {
          window.google.accounts.id.renderButton(buttonDiv, {
            theme: 'outline',
            size: 'large',
            width: buttonDiv.offsetWidth,
            text: 'signup_with'
          });
        }

        // FIXED: Only prompt One-tap if form submission is not in progress AND user is not authenticated
        if (!formSubmissionInProgress && !user) {
          console.log('Prompting Google One-tap for registration');
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

  // FIXED: Enhanced Google One-tap response handler (matching LoginForm)
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
      console.log('Google One-Tap registration response received:', response);
      if (response.credential) {
        console.log('Attempting sign up with Google credential');
        // For Google sign-up, we'll default to student role
        // Users can change this later in their profile
        await signInWithGoogle(response.credential);
        sessionStorage.setItem('isInitialLogin', 'true');
        console.log('Google One-tap registration completed');
      } else {
        console.warn('No credential in response:', response);
      }
    } catch (error) {
      console.error('Google One-tap registration error:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
      }
    }
  };

  // Replace handleBasicFormSubmit with direct register call
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (loading || formSubmissionInProgress) {
      console.log('Registration already in progress, ignoring submission');
      return;
    }

    setPasswordError('');
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    try {
      setFormSubmissionInProgress(true);
      console.log('Starting registration process');
      
      // Cancel any pending Google One-tap
      if (window.google?.accounts?.id?.cancel) {
        window.google.accounts.id.cancel();
      }
      
      // Direct registration - no role selection step
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined
      });
      
      console.log('Registration completed successfully');
      
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setTimeout(() => {
        setFormSubmissionInProgress(false);
      }, 1000);
    }
  };

  // FIXED: Enhanced loading state - check both loading states (matching LoginForm)
  const isSubmitting = loading || formSubmissionInProgress;

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm">
      <h2 className="text-2xl font-medium mb-6">Create an Account</h2>
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}
      {passwordError && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {passwordError}
        </div>
      )}
      
      {/* FIXED: Google Sign Up button with loading protection */}
      <div className="mb-6">
        <button
          onClick={() => signInWithGoogle()}
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          <span className="text-gray-700 font-medium">
            {isSubmitting ? 'Signing up...' : 'Sign up with Google'}
          </span>
        </button>
      </div>
      
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or sign up with email</span>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#ff3131] focus:border-[#ff3131]"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-gray-400">(optional)</span>
          </label>
          <input
            type="text"
            id="full_name"
            value={formData.full_name}
            onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#ff3131] focus:border-[#ff3131]"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            value={formData.password}
            onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#ff3131] focus:border-[#ff3131]"
            required
            disabled={isSubmitting}
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-[#ff3131] focus:border-[#ff3131]"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <p className="mt-2 text-sm text-gray-600">
          After creating your account, you'll be able to choose your role and customize your experience.
        </p>

        {/* FIXED: Enhanced button with better loading state (matching LoginForm) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-[#ff3131] text-white rounded hover:bg-[#e52e2e] disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Creating Account...
            </div>
          ) : (
            'Create Account'
          )}
        </button>

        <div className="text-center">
          <span className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#ff3131] hover:text-[#e52e2e]">
              Login
            </Link>
          </span>
        </div>
      </form>
      
      {/* FIXED: Only show Google One-tap button if user is not authenticated (matching LoginForm) */}
      {!user && (
        <div id="google-one-tap-register" className="w-full mt-6 hidden"></div>
      )}
    </div>
  );
}