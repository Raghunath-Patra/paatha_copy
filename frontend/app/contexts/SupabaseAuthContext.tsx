// frontend/app/contexts/SupabaseAuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';
import { User, Session } from '@supabase/supabase-js';

// Constants for session management
const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes
const SESSION_EXPIRY_WARNING = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh when 10 min remaining
const AUTH_TIMEOUT = 15000; // 15 seconds timeout for auth operations
const MAX_REFRESH_ATTEMPTS = 3; // Limit refresh attempts

interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  board?: string;
  class_level?: string;
  role?: 'student' | 'teacher';
  institution_name?: string;
  phone_number?: string;
  mother_tongue?: string;
  primary_language?: string;
  location?: string;
  join_purpose?: string;
  // Teacher-specific fields
  teaching_experience?: number;
  qualification?: string;
  subjects_taught?: string[];
  teacher_verified?: boolean;
  is_active: boolean;
  is_verified: boolean;
  is_premium?: boolean;
  daily_question_limit?: number;
  questions_used_today?: number;
  questions_reset_date?: string;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  isSessionExpiring: boolean;
  refreshSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<UserProfile>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (newPassword: string) => Promise<void>;
  signInWithGoogle: (credential?: string) => Promise<void>;
  setError: (error: string | null) => void;
}

interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
}

const SupabaseAuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSessionExpiring, setIsSessionExpiring] = useState(false);
  const router = useRouter();
  const initialized = useRef(false);
  const authListenerRef = useRef<{ data: { subscription: { unsubscribe: () => void } } } | null>(null);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const authOperationInProgress = useRef<boolean>(false);
  const lastRefreshAttempt = useRef<number>(0);
  const refreshAttempts = useRef<number>(0); // Track refresh attempts

  // Helper function to safely extract error messages
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof Error) {
      return err.message;
    }
    return String(err);
  };

  // Fetch user profile from Supabase
  const fetchProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {  // Profile not found
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (!currentUser) throw new Error("User not found");
          
          const newProfileData = {
            id: userId,
            email: currentUser?.email,
            full_name: currentUser?.user_metadata?.full_name,
            is_active: true,
            is_verified: false
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfileData])
            .select()
            .single();

          if (createError) throw createError;
          return createdProfile;
        }
        throw fetchError;
      }

      return existingProfile;
    } catch (err) {
      console.error('Error in fetchProfile:', err);
      return null;
    }
  }, []);

  // FIXED: Improved session expiration check with better guards
  const checkSessionExpiration = useCallback(() => {
    // Don't check if no session exists or if auth operation is in progress
    if (!session || authOperationInProgress.current) return;
    
    const expiresAt = session.expires_at;
    if (!expiresAt) return;
    
    const expiresAtMs = expiresAt * 1000; // Convert to milliseconds
    const timeRemaining = expiresAtMs - Date.now();
    
    // If session already expired, don't try to refresh
    if (timeRemaining <= 0) {
      setUser(null);
      setSession(null);
      setProfile(null);
      setIsSessionExpiring(false);
      return;
    }
    
    // If session will expire soon, show warning
    if (timeRemaining < SESSION_EXPIRY_WARNING) {
      setIsSessionExpiring(true);
    } else {
      setIsSessionExpiring(false);
    }
    
    // If getting close to expiry and haven't exceeded refresh attempts, refresh session
    if (timeRemaining < SESSION_REFRESH_THRESHOLD && 
        refreshAttempts.current < MAX_REFRESH_ATTEMPTS &&
        !authOperationInProgress.current) {
      const now = Date.now();
      // Avoid refreshing too frequently (minimum 2 minutes between refreshes)
      if (now - lastRefreshAttempt.current > 120000) {
        refreshSession();
      }
    }
  }, [session]);

  // FIXED: Improved refresh session with proper error handling and attempt limiting
  const refreshSession = useCallback(async () => {
    if (authOperationInProgress.current || refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
      return;
    }

    try {
      authOperationInProgress.current = true;
      lastRefreshAttempt.current = Date.now();
      refreshAttempts.current += 1;
      
      // First check if we have a session to refresh
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        console.log('No session to refresh');
        setSession(null);
        setUser(null);
        setProfile(null);
        setIsSessionExpiring(false);
        return;
      }
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        
        // If refresh fails multiple times, clear session
        if (refreshAttempts.current >= MAX_REFRESH_ATTEMPTS) {
          console.log('Max refresh attempts reached, clearing session');
          setSession(null);
          setUser(null);
          setProfile(null);
          setIsSessionExpiring(false);
        }
        return;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsSessionExpiring(false);
        refreshAttempts.current = 0; // Reset on successful refresh
        
        // Fetch updated profile if needed
        if (!profile && data.session.user) {
          const userProfile = await fetchProfile(data.session.user.id);
          if (userProfile) {
            setProfile(userProfile);
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      
      // Don't show session refresh errors during registration
      const errorMessage = getErrorMessage(err);
      if (!errorMessage.includes('Auth session missing')) {
        setErrorSafe('Session could not be refreshed. Please try again or log in.');
      }
    } finally {
      authOperationInProgress.current = false;
    }
  }, [profile, fetchProfile]);

  // FIXED: Improved session checking interval with better conditions
  useEffect(() => {
    // Only start interval if we have a session
    if (session && session.expires_at) {
      sessionCheckInterval.current = setInterval(() => {
        checkSessionExpiration();
      }, SESSION_CHECK_INTERVAL);
    } else {
      // Clear interval if no session
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
        sessionCheckInterval.current = null;
      }
    }

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
        sessionCheckInterval.current = null;
      }
    };
  }, [checkSessionExpiration, session?.expires_at]); // Only depend on session expiry

  // FIXED: Improved authentication initialization
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;
    let initTimeoutId: NodeJS.Timeout;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        initTimeoutId = setTimeout(() => {
          if (mounted && loading) {
            setLoading(false);
            setUser(null);
            setProfile(null);
            setSession(null);
          }
        }, AUTH_TIMEOUT);
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error during init:', sessionError);
          // Don't throw for session errors during init
          if (mounted) {
            setUser(null);
            setProfile(null);
            setSession(null);
          }
        } else if (currentSession?.user && mounted) {
          setUser(currentSession.user);
          setSession(currentSession);
          refreshAttempts.current = 0; // Reset refresh attempts for valid session
          
          const userProfile = await fetchProfile(currentSession.user.id);
          if (mounted && userProfile) {
            setProfile(userProfile);
          }
        }

        // FIXED: Improved auth state change listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (!mounted) return;
            
            console.log('Auth state change:', event, session?.user?.id);
            
            switch (event) {
              case 'SIGNED_IN':
                if (session?.user) {
                  setUser(session.user);
                  setSession(session);
                  refreshAttempts.current = 0; // Reset on successful sign in
                  
                  const userProfile = await fetchProfile(session.user.id);
                  if (mounted && userProfile) {
                    setProfile(userProfile);
                  }
                  
                  const originalPath = sessionStorage.getItem('originalPath');
                  if (originalPath) {
                    sessionStorage.removeItem('originalPath');
                    window.location.href = originalPath;
                  } else {
                    window.location.href = '/';
                  }
                }
                break;
                
              case 'SIGNED_OUT':
                setUser(null);
                setSession(null);
                setProfile(null);
                setIsSessionExpiring(false);
                refreshAttempts.current = 0;
                break;
                
              case 'TOKEN_REFRESHED':
                if (session) {
                  setSession(session);
                  setUser(session.user);
                  refreshAttempts.current = 0; // Reset on successful refresh
                }
                break;
                
              default:
                // For other events, don't change state unnecessarily
                break;
            }
          });

        authListenerRef.current = { data: { subscription } };

      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setSession(null);
          // Only set error for non-session related errors
          const errorMessage = getErrorMessage(err);
          if (!errorMessage.includes('Auth session missing')) {
            setErrorSafe(errorMessage);
          }
        }
      } finally {
        clearTimeout(initTimeoutId);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      clearTimeout(initTimeoutId);
      if (authListenerRef.current) {
        authListenerRef.current.data.subscription.unsubscribe();
      }
    };
  }, [fetchProfile]);

  // FIXED: Improved setError function to filter session-related errors
  const setErrorSafe = useCallback((newError: string | null) => {
    // Filter out session-related errors that shouldn't be shown during registration/normal flow
    if (newError && (
      newError.includes("Session could not be refreshed") || 
      newError.includes("Error refreshing session") ||
      newError.includes("AuthSessionMissingError") ||
      newError.includes("Auth session missing")
    )) {
      console.warn('Filtered session error:', newError);
      return; // Don't set these errors in state
    }
    
    setError(newError);
  }, []);

  // COMPLETE LOGIN FUNCTION (unchanged but using setErrorSafe)
  const login = async (email: string, password: string) => {
    if (authOperationInProgress.current) {
      setErrorSafe('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setErrorSafe(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from login');

      setUser(data.user);
      setSession(data.session);
      refreshAttempts.current = 0; // Reset refresh attempts on successful login
      
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isInitialLogin', 'true');
      }
      const originalPath = sessionStorage.getItem('originalPath');
      if (originalPath) {
        sessionStorage.removeItem('originalPath');
        window.location.href = originalPath;
      } else {
        window.location.href = '/';
      }
      
    } catch (err) {
      console.error('Login error:', err);
      setErrorSafe(getErrorMessage(err));
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  // COMPLETE REGISTER FUNCTION (unchanged but using setErrorSafe)
  const register = async (userData: RegisterData) => {
    if (authOperationInProgress.current) {
      setErrorSafe('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setErrorSafe(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: userData.full_name ? { full_name: userData.full_name } : undefined
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from registration');

      // Create initial profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{
          id: data.user.id,
          email: userData.email,
          full_name: userData.full_name,
          is_active: true,
          is_verified: false,
          created_at: new Date().toISOString()
        }]);

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }

      // Auto-login: We're already logged in after signUp
      setUser(data.user);
      setSession(data.session);
      refreshAttempts.current = 0; // Reset refresh attempts on successful registration
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setProfile(profile);
      }

      router.push('/login?registered=true');
    } catch (err) {
      console.error('Registration error:', err);
      setErrorSafe(getErrorMessage(err));
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  // COMPLETE GOOGLE SIGN IN FUNCTION (unchanged but using setErrorSafe)
  const signInWithGoogle = async (credential?: string) => {
    if (authOperationInProgress.current) {
      setErrorSafe('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setErrorSafe(null);
      setLoading(true);
  
      if (credential) {
        // Handle Google One-tap sign in
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: credential,
        });
  
        if (error) throw error;
        if (data.user) {
          setUser(data.user);
          setSession(data.session);
          refreshAttempts.current = 0; // Reset refresh attempts
          const userProfile = await fetchProfile(data.user.id);
          if (userProfile) {
            setProfile(userProfile);
            if (userProfile.board && userProfile.class_level) {
              router.push(`/${userProfile.board}/${userProfile.class_level}`);
            } else {
              router.push('/');
            }
          }
        }
      } else {
        // Handle regular Google OAuth
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
            queryParams: {
              access_type: 'offline',
              prompt: 'consent',
            },
          },
        });
  
        if (error) throw error;
        // For OAuth, we don't get the user immediately - the redirect will handle it
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      setErrorSafe(getErrorMessage(err));
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  // Rest of the functions remain unchanged but use setErrorSafe instead of setError...
  
  const logout = async () => {
    if (authOperationInProgress.current) {
      setErrorSafe('Another operation is in progress. Please try again.');
      return;
    }
  
    try {
      authOperationInProgress.current = true;
      setLoading(true);
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
  
      setUser(null);
      setProfile(null);
      setSession(null);
      refreshAttempts.current = 0;
      
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      
      setUser(null);
      setProfile(null);
      setSession(null);
      refreshAttempts.current = 0;
      window.location.href = '/login';
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  const updateProfile = async (userData: Partial<UserProfile>) => {
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          ...userData,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      const updatedProfile = await fetchProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setErrorSafe(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const requestPasswordReset = async (email: string) => {
    if (authOperationInProgress.current) {
      setErrorSafe('Another operation is in progress. Please try again.');
      return false;
    }

    try {
      authOperationInProgress.current = true;
      setErrorSafe(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Password reset request error:', err);
      setErrorSafe(getErrorMessage(err));
      return false;
    } finally {
      authOperationInProgress.current = false;
    }
  };

  const resetPassword = async (newPassword: string) => {
    if (authOperationInProgress.current) {
      setErrorSafe('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setErrorSafe(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      router.push('/login?reset=success');
    } catch (err) {
      console.error('Password reset error:', err);
      setErrorSafe(getErrorMessage(err));
    } finally {
      authOperationInProgress.current = false;
    }
  };

  return (
    <SupabaseAuthContext.Provider
      value={{
        user,
        profile,
        loading,
        error,
        isSessionExpiring,
        refreshSession,
        login,
        register,
        logout,
        updateProfile,
        requestPasswordReset,
        resetPassword,
        signInWithGoogle,
        setError: setErrorSafe
      }}
    >
      {isSessionExpiring && (
        <div className="fixed bottom-4 right-4 bg-yellow-100 text-yellow-800 p-4 rounded-lg shadow-lg z-50">
          <p className="font-medium">Your session is expiring soon</p>
          <p className="text-sm">Click to refresh and continue</p>
          <button 
            onClick={refreshSession}
            className="mt-2 px-3 py-1 bg-yellow-700 text-white rounded hover:bg-yellow-800"
          >
            Refresh Session
          </button>
        </div>
      )}
      {children}
    </SupabaseAuthContext.Provider>
  );
}

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};