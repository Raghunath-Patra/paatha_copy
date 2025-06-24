// frontend/app/components/auth/RegisterForm.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import RoleSelection from './RoleSelection';
import Link from 'next/link';

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

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name?: string;
  role?: 'student' | 'teacher';
  // Teacher-specific fields
  teaching_experience?: number;
  qualification?: string;
  subjects_taught?: string[];
  institution_name?: string;
}

export default function RegisterForm() {
  const router = useRouter();
  const [step, setStep] = useState<'basic' | 'role'>('basic');
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: ''
  });
  const { register, signInWithGoogle, loading, error } = useSupabaseAuth();
  const [passwordError, setPasswordError] = useState<string>('');
  
  // For Google One-tap
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
      if (response.credential) {
        // Set flag to indicate this is a registration flow
        sessionStorage.setItem('isGoogleRegistration', 'true');
        await signInWithGoogle(response.credential);
      }
    } catch (error) {
      console.error('Google One-tap error:', error);
    }
  };

  const handleBasicFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    
    if (formData.password !== formData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Basic validation passed, move to role selection
    setStep('role');
  };

  const handleRoleSelect = async (role: 'student' | 'teacher', additionalData?: any) => {
    try {
      const registrationData = {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name || undefined,
        role,
        ...additionalData
      };

      await register(registrationData);
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  // Handle regular Google OAuth sign in
  const handleGoogleSignIn = async () => {
    try {
      // Set flag to indicate this is a registration flow
      sessionStorage.setItem('isGoogleRegistration', 'true');
      await signInWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
    }
  };

  if (step === 'role') {
    return (
      <RoleSelection 
        onRoleSelect={handleRoleSelect} 
        loading={loading}
        showBackButton={true}
        onBack={() => setStep('basic')}
      />
    );
  }

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
      
      {/* Google Sign Up button - a faster option at the top */}
      <div className="mb-6">
        <button
          onClick={handleGoogleSignIn}
          className="w-full py-2 px-4 bg-white border border-gray-300 rounded-lg shadow-sm flex items-center justify-center gap-2 hover:bg-gray-50"
          disabled={loading}
        >
          <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
          </svg>
          <span className="text-gray-700 font-medium">Sign up with Google</span>
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
      
      <form onSubmit={handleBasicFormSubmit} className="space-y-4">
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
          />
        </div>
        
        <p className="mt-2 text-sm text-gray-600">
          Next, you'll choose whether you're a student or teacher to customize your experience.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-[#ff3131] text-white rounded hover:bg-[#e52e2e] disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Continue'}
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
      
      {/* Google One-tap button container (alternative placement) */}
      <div id="google-one-tap-register" className="w-full mt-6 hidden"></div>
    </div>
  );
}