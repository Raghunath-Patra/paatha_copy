// app/auth/callback/route.ts - DEBUG VERSION with detailed logging
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const type = requestUrl.searchParams.get('type');
  const token = requestUrl.searchParams.get('token');

  // DEBUG: Log all incoming parameters
  console.log('=== AUTH CALLBACK DEBUG ===');
  console.log('Full URL:', requestUrl.toString());
  console.log('Parameters:', {
    code: code ? 'present' : 'missing',
    error,
    type,
    token: token ? 'present' : 'missing',
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  });

  // Handle error cases first
  if (error) {
    console.error('❌ Auth callback received error parameter:', error);
    return NextResponse.redirect(new URL(`/login?error=auth_failed&details=${encodeURIComponent(error)}`, requestUrl.origin));
  }

  // Handle email verification with token (PKCE flow)
  if (token && type === 'signup') {
    console.log('📧 Email verification detected (token + type=signup)');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      // For email verification, we need to verify the token
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'signup'
      });

      console.log('Token verification result:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        error: error?.message
      });

      if (error) {
        console.error('❌ Token verification failed:', error);
        return NextResponse.redirect(new URL(`/login?error=verification_failed&details=${encodeURIComponent(error.message)}`, requestUrl.origin));
      }

      if (data.user) {
        console.log('✅ Email verified successfully for user:', data.user.email);
        
        if (data.session) {
          // User is now signed in after verification
          console.log('🎉 User signed in after email verification');
          return NextResponse.redirect(new URL('/', requestUrl.origin));
        } else {
          // Email verified but user not signed in
          console.log('📝 Email verified, redirecting to login');
          return NextResponse.redirect(new URL('/login?verified=true', requestUrl.origin));
        }
      } else {
        console.error('❌ No user returned from token verification');
        return NextResponse.redirect(new URL('/login?error=no_user_returned', requestUrl.origin));
      }
      
    } catch (error) {
      console.error('❌ Exception during token verification:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Unknown error';
      return NextResponse.redirect(new URL(`/login?error=verification_exception&details=${encodeURIComponent(errorMessage)}`, requestUrl.origin));
    }
  }

  // Handle OAuth code exchange
  if (code) {
    console.log('🔐 OAuth code exchange detected');
    
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      console.log('Code exchange result:', {
        hasSession: !!data.session,
        hasUser: !!data.user,
        userEmail: data.user?.email,
        error: error?.message,
        errorCode: error?.status
      });
      
      if (error) {
        console.error('❌ Code exchange failed:', error);
        return NextResponse.redirect(new URL(`/login?error=code_exchange_failed&details=${encodeURIComponent(error.message)}`, requestUrl.origin));
      }

      if (!data.session || !data.user) {
        console.error('❌ No session or user after successful code exchange');
        return NextResponse.redirect(new URL('/login?error=no_session_after_exchange', requestUrl.origin));
      }

      // Successful OAuth login
      console.log('✅ OAuth login successful for user:', data.user.email);
      return NextResponse.redirect(new URL('/', requestUrl.origin));
      
    } catch (error) {
      console.error('❌ Exception during code exchange:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Unknown error';
      return NextResponse.redirect(new URL(`/login?error=exchange_exception&details=${encodeURIComponent(errorMessage)}`, requestUrl.origin));
    }
  }

  // No code or token parameter
  console.log('❓ No code or token parameter found, redirecting to login');
  return NextResponse.redirect(new URL('/login?error=missing_parameters', requestUrl.origin));
}