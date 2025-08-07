'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import LoginForm from '../../components/auth/LoginForm';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const { loading, requestPasswordReset } = useSupabaseAuth();
  const [showResendMessage, setShowResendMessage] = useState(false);

  // Get all possible URL parameters
  const registered = searchParams?.get('registered');
  const resetSuccess = searchParams?.get('reset');
  const error = searchParams?.get('error');
  const message = searchParams?.get('message');
  const sessionExpired = searchParams?.get('session_expired');

  useEffect(() => {
    console.log('Login page mounted');
  }, []);

  const handleResendVerification = async () => {
    const email = searchParams?.get('email');
    if (email) {
      const success = await requestPasswordReset(email);
      if (success) {
        setShowResendMessage(true);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const renderErrorMessage = () => {
    if (!error) return null;

    let title = 'Authentication Error';
    let description = message || 'An error occurred during authentication.';
    let actionButton = null;
    let bgColor = 'bg-red-50';
    let textColor = 'text-red-700';

    switch (error) {
      case 'link_expired':
        title = 'Email Link Expired';
        description = message || 'The email link has expired. Please request a new verification email.';
        actionButton = (
          <button
            onClick={handleResendVerification}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Resend verification email
          </button>
        );
        break;
        
      case 'email_not_confirmed':
        title = 'Email Not Verified';
        description = message || 'Please check your email and click the verification link.';
        bgColor = 'bg-yellow-50';
        textColor = 'text-yellow-700';
        break;
        
      case 'session_error':
        title = 'Session Error';
        description = message || 'Failed to create session. Please try logging in again.';
        break;
        
      case 'access_denied':
        title = 'Access Denied';
        description = message || 'Access was denied. Please try again.';
        break;
        
      case 'signup_disabled':
        title = 'Registration Disabled';
        description = message || 'New account registration is currently disabled.';
        bgColor = 'bg-yellow-50';
        textColor = 'text-yellow-700';
        break;
        
      default:
        // Use the provided message or fallback
        description = message || 'An authentication error occurred. Please try again.';
    }

    return (
      <div className={`mb-4 p-4 ${bgColor} ${textColor} rounded-lg max-w-md`}>
        <div className="font-medium">{title}</div>
        <div className="text-sm mt-1">{description}</div>
        {actionButton}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Error Messages */}
      {renderErrorMessage()}
      
      {/* Success Messages */}
      {registered && !error && (
        <div className="mb-4 p-4 bg-blue-50 text-blue-700 rounded-lg max-w-md">
          <div className="font-medium">Check Your Email</div>
          <div className="text-sm mt-1">
            A verification link has been sent to your email address. Please verify your email before logging in.
          </div>
        </div>
      )}
      
      {resetSuccess === 'success' && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg max-w-md">
          <div className="font-medium">Password Reset Successful</div>
          <div className="text-sm mt-1">
            Your password has been reset successfully. Please log in with your new password.
          </div>
        </div>
      )}
      
      {sessionExpired && (
        <div className="mb-4 p-4 bg-yellow-50 text-yellow-700 rounded-lg max-w-md">
          <div className="font-medium">Session Expired</div>
          <div className="text-sm mt-1">
            Your session has expired. Please log in again to continue.
          </div>
        </div>
      )}

      {/* Resend confirmation message */}
      {showResendMessage && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-lg max-w-md">
          <div className="font-medium">Verification Email Sent</div>
          <div className="text-sm mt-1">
            A new verification email has been sent. Please check your email and click the link.
          </div>
        </div>
      )}

      <LoginForm />
    </div>
  );
}