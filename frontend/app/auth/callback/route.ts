// app/auth/callback/route.ts - Enhanced with error handling
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Check for error parameters first
  const error = requestUrl.searchParams.get('error');
  const errorCode = requestUrl.searchParams.get('error_code');
  const errorDescription = requestUrl.searchParams.get('error_description');

  // Handle authentication errors
  if (error) {
    console.error('Auth callback error:', { error, errorCode, errorDescription });
    
    let redirectUrl;
    let errorMessage;
    
    switch (errorCode) {
      case 'otp_expired':
        errorMessage = 'The email link has expired. Please request a new one.';
        // Redirect to login with expired link message
        redirectUrl = new URL('/login?error=link_expired', requestUrl.origin);
        break;
        
      case 'email_not_confirmed':
        errorMessage = 'Please check your email and click the verification link.';
        redirectUrl = new URL('/login?error=email_not_confirmed', requestUrl.origin);
        break;
        
      case 'signup_disabled':
        errorMessage = 'Sign up is currently disabled.';
        redirectUrl = new URL('/login?error=signup_disabled', requestUrl.origin);
        break;
        
      case 'access_denied':
        if (errorDescription?.includes('expired')) {
          errorMessage = 'The email link has expired. Please request a new one.';
          redirectUrl = new URL('/login?error=link_expired', requestUrl.origin);
        } else {
          errorMessage = 'Access was denied. Please try again.';
          redirectUrl = new URL('/login?error=access_denied', requestUrl.origin);
        }
        break;
        
      default:
        errorMessage = errorDescription || 'An authentication error occurred.';
        redirectUrl = new URL('/login?error=auth_error', requestUrl.origin);
    }
    
    // Add the error message as a URL parameter
    redirectUrl.searchParams.set('message', errorMessage);
    return NextResponse.redirect(redirectUrl);
  }

  // Handle successful authentication
  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      
      if (exchangeError) {
        console.error('Error exchanging code for session:', exchangeError);
        const redirectUrl = new URL('/login?error=session_error', requestUrl.origin);
        redirectUrl.searchParams.set('message', 'Failed to create session. Please try logging in again.');
        return NextResponse.redirect(redirectUrl);
      }
      
      // Check if this is a password reset flow
      const type = requestUrl.searchParams.get('type');
      if (type === 'recovery') {
        // Redirect to password reset page
        return NextResponse.redirect(new URL('/reset-password', requestUrl.origin));
      }
      
      // Check if user just registered and needs email verification
      if (data.user && !data.user.email_confirmed_at) {
        const redirectUrl = new URL('/login?registered=true', requestUrl.origin);
        redirectUrl.searchParams.set('message', 'Please check your email and click the verification link to complete registration.');
        return NextResponse.redirect(redirectUrl);
      }
      
      // Successful sign-in - redirect to intended destination or home
      const redirectTo = requestUrl.searchParams.get('redirect_to') || '/';
      return NextResponse.redirect(new URL(redirectTo, requestUrl.origin));
      
    } catch (err) {
      console.error('Unexpected error in auth callback:', err);
      const redirectUrl = new URL('/login?error=unexpected', requestUrl.origin);
      redirectUrl.searchParams.set('message', 'An unexpected error occurred. Please try again.');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // No code and no error - redirect to login
  const redirectUrl = new URL('/login?error=no_code', requestUrl.origin);
  redirectUrl.searchParams.set('message', 'No authentication code received. Please try again.');
  return NextResponse.redirect(redirectUrl);
}