// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth callback error:', error);
      return NextResponse.redirect(new URL('/login?error=auth_callback_error', requestUrl.origin));
    }

    if (data.user) {
      // Check if user has a profile and role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, board, class_level')
        .eq('id', data.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Profile fetch error:', profileError);
      }

      // Determine redirect URL based on profile status
      let redirectUrl = '/';
      
      // If no role, redirect to role selection (for Google registration)
      if (!profile?.role) {
        redirectUrl = '/role-selection';
      } 
      // If has role and complete profile, go to their dashboard
      else if (profile.board && profile.class_level) {
        redirectUrl = `/${profile.board}/${profile.class_level}`;
      }
      // Otherwise, go to home page to complete profile

      return NextResponse.redirect(new URL(redirectUrl, requestUrl.origin));
    }
  }

  // Fallback redirect
  return NextResponse.redirect(new URL('/', requestUrl.origin));
}