// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(new URL('/login?error=auth_failed', requestUrl.origin));
      }

      // Check if this is email verification vs OAuth
      const type = requestUrl.searchParams.get('type');
      
      if (type === 'signup') {
        // Email verification after registration
        return NextResponse.redirect(new URL('/login?verified=true', requestUrl.origin));
      } else {
        // OAuth (Google) or other - go to home
        // Role selection modal will appear automatically if needed
        return NextResponse.redirect(new URL('/', requestUrl.origin));
      }
      
    } catch (error) {
      console.error('Callback processing error:', error);
      return NextResponse.redirect(new URL('/login?error=callback_failed', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}