// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  console.log('Auth callback called with:', { code: !!code, error, error_description });

  // Handle error from OAuth provider
  if (error) {
    console.error('OAuth error:', error, error_description);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error_description || error)}`, requestUrl.origin)
    );
  }

  // Handle missing code
  if (!code) {
    console.error('No code provided in callback');
    return NextResponse.redirect(
      new URL('/login?error=no_code_provided', requestUrl.origin)
    );
  }

  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    console.log('Attempting to exchange code for session...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (exchangeError) {
      console.error('Code exchange error:', exchangeError);
      
      // Handle specific error types
      if (exchangeError.message?.includes('Email not confirmed')) {
        return NextResponse.redirect(
          new URL('/login?error=email_not_confirmed', requestUrl.origin)
        );
      }
      
      if (exchangeError.message?.includes('Invalid or expired')) {
        return NextResponse.redirect(
          new URL('/login?error=invalid_or_expired_code', requestUrl.origin)
        );
      }
      
      // Generic error handling
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      );
    }

    if (!data.user) {
      console.error('No user returned from code exchange');
      return NextResponse.redirect(
        new URL('/login?error=no_user_returned', requestUrl.origin)
      );
    }

    console.log('Code exchange successful, user:', data.user.id);

    // Check if user has a profile and role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, board, class_level, is_verified')
      .eq('id', data.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    console.log('User profile:', profile);

    // Determine redirect URL based on profile status
    let redirectUrl = '/';
    
    // Check for Google registration flow
    const isGoogleRegistration = requestUrl.searchParams.get('google_registration') === 'true';
    
    // If no role (either new Google user or incomplete profile)
    if (!profile?.role) {
      console.log('No role found, redirecting to role selection');
      redirectUrl = '/role-selection';
    } 
    // If has role and complete profile, go to their dashboard
    else if (profile.board && profile.class_level) {
      console.log('Complete profile found, redirecting to dashboard');
      redirectUrl = `/${profile.board}/${profile.class_level}`;
    }
    // If has role but incomplete profile, go to home for completion
    else {
      console.log('Incomplete profile, redirecting to home');
      redirectUrl = '/';
    }

    console.log('Redirecting to:', redirectUrl);
    return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));

  } catch (err) {
    console.error('Unexpected error in auth callback:', err);
    return NextResponse.redirect(
      new URL('/login?error=unexpected_error', requestUrl.origin)
    );
  }
}