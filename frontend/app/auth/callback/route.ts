// app/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(new URL('/login?error=verification_failed', requestUrl.origin));
      }

      // Check if this is email verification (user just registered)
      if (data.session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, created_at')
          .eq('id', data.session.user.id)
          .single();

        // If profile was just created or role not selected, this is likely email verification
        const isNewUser = profile && (
          profile.role === 'not_selected' || 
          (new Date().getTime() - new Date(profile.created_at).getTime()) < 10 * 60 * 1000
        );

        if (isNewUser) {
          return NextResponse.redirect(new URL('/login?verified=true', requestUrl.origin));
        }
      }
      
      return NextResponse.redirect(new URL(next, requestUrl.origin));
      
    } catch (error) {
      console.error('Callback processing error:', error);
      return NextResponse.redirect(new URL('/login?error=callback_failed', requestUrl.origin));
    }
  }

  return NextResponse.redirect(new URL('/login', requestUrl.origin));
}