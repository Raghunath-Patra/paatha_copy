// app/auth/callback/route.ts - FIXED VERSION
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const type = requestUrl.searchParams.get('type');

  console.log('Auth callback called with:', { code: !!code, error, type });

  // Handle error cases first
  if (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
  }

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback exchange error:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }

      console.log('Code exchange result:', { 
        hasSession: !!data.session, 
        hasUser: !!data.user,
        userEmailConfirmed: data.user?.email_confirmed_at 
      });

      // FIXED: Handle email verification properly
      if (type === 'signup') {
        console.log('Email verification flow detected');
        
        // For email verification, the user might or might not be signed in
        if (data.session && data.user) {
          // User is signed in after verification - go to home
          console.log('User signed in after email verification, redirecting to home');
          return NextResponse.redirect(new URL('/', requestUrl.origin));
        } else {
          // Email verified but user not signed in - go to login with success message
          console.log('Email verified but user not signed in, redirecting to login');
          return NextResponse.redirect(new URL('/login?verified=true', requestUrl.origin));
        }
      } else {
        // OAuth login (Google, etc.) - user should be signed in
        if (data.session && data.user) {
          console.log('OAuth login successful, redirecting to home');
          return NextResponse.redirect(new URL('/', requestUrl.origin));
        } else {
          console.log('OAuth callback but no session, redirecting to login');
          return NextResponse.redirect(new URL('/login?error=no_session', requestUrl.origin));
        }
      }
      
    } catch (error) {
      console.error('Callback processing error:', error);
      return NextResponse.redirect(new URL('/login?error=callback_failed', requestUrl.origin));
    }
  }

  // No code parameter - redirect to login
  console.log('No code parameter, redirecting to login');
  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}