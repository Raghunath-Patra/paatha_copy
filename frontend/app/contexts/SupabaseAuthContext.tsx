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
  updateUserRole: (role: 'student' | 'teacher', additionalData?: any) => Promise<void>;
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

  // Check session expiration
  const checkSessionExpiration = useCallback(() => {
    if (!session) return;
    
    const expiresAt = session.expires_at;
    if (!expiresAt) return;
    
    const expiresAtMs = expiresAt * 1000; // Convert to milliseconds
    const timeRemaining = expiresAtMs - Date.now();
    
    // If session will expire soon, show warning
    if (timeRemaining < SESSION_EXPIRY_WARNING) {
      setIsSessionExpiring(true);
    } else {
      setIsSessionExpiring(false);
    }
    
    // If getting close to expiry, refresh session
    if (timeRemaining < SESSION_REFRESH_THRESHOLD && !authOperationInProgress.current) {
      const now = Date.now();
      // Avoid refreshing too frequently (minimum 2 minutes between refreshes)
      if (now - lastRefreshAttempt.current > 120000) {
        refreshSession();
      }
    }
  }, [session]);

  // Refresh session
  const refreshSession = useCallback(async () => {
    if (authOperationInProgress.current) {
      return;
    }

    try {
      authOperationInProgress.current = true;
      lastRefreshAttempt.current = Date.now();
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        throw error;
      }
      
      if (data.session) {
        setSession(data.session);
        setUser(data.session.user);
        setIsSessionExpiring(false);
      } else {
        setSession(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      setError('Session could not be refreshed. Please try again or log in.');
    } finally {
      authOperationInProgress.current = false;
    }
  }, []);

  // Helper function to handle post-login navigation
  const handlePostLoginNavigation = useCallback(async (user: User, profile: UserProfile | null) => {
    // Check if this was a Google registration flow
    const isGoogleRegistration = sessionStorage.getItem('isGoogleRegistration');
    
    if (isGoogleRegistration) {
      sessionStorage.removeItem('isGoogleRegistration');
      
      // If user doesn't have a role, redirect to role selection
      if (!profile?.role) {
        router.push('/role-selection');
        return;
      }
    }
    
    // Normal login flow
    const originalPath = sessionStorage.getItem('originalPath');
    if (originalPath) {
      sessionStorage.removeItem('originalPath');
      window.location.href = originalPath;
    } else {
      // Navigate based on user role and profile completion
      if (profile?.board && profile?.class_level) {
        router.push(`/${profile.board}/${profile.class_level}`);
      } else {
        router.push('/');
      }
    }
  }, [router]);

  // Update user role (new function for Google registration)
  const updateUserRole = useCallback(async (role: 'student' | 'teacher', additionalData?: any) => {
    if (!user) throw new Error('No user found');

    try {
      setLoading(true);
      
      const updateData = {
        role,
        ...additionalData,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      // Fetch updated profile
      const updatedProfile = await fetchProfile(user.id);
      if (updatedProfile) {
        setProfile(updatedProfile);
      }

      // Navigate to appropriate page after role selection
      if (updatedProfile?.board && updatedProfile?.class_level) {
        router.push(`/${updatedProfile.board}/${updatedProfile.class_level}`);
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err instanceof Error ? err.message : 'An error occurred updating your role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user, fetchProfile, router]);

  // IMPORTANT: NO VISIBILITY CHANGE HANDLING - this prevents the refresh issue
  // Set up session checking with longer intervals only
  useEffect(() => {
    sessionCheckInterval.current = setInterval(() => {
      checkSessionExpiration();
    }, SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [checkSessionExpiration]);

  // Initialize authentication
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
        
        if (sessionError) throw sessionError;

        if (currentSession?.user && mounted) {
          setUser(currentSession.user);
          setSession(currentSession);
          const userProfile = await fetchProfile(currentSession.user.id);
          if (mounted && userProfile) {
            setProfile(userProfile);
          }
        }

        // Set up Supabase auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user);
              setSession(session);
              
              const userProfile = await fetchProfile(session.user.id);
              if (userProfile) {
                setProfile(userProfile);
              }
              
              // Handle navigation after successful sign in
              await handlePostLoginNavigation(session.user, userProfile);
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setSession(null);
              setProfile(null);
            }
          });

        authListenerRef.current = { data: { subscription } };

      } catch (err) {
        console.error('Auth initialization error:', err);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setSession(null);
          setError(err instanceof Error ? err.message : 'An error occurred during initialization');
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
  }, [fetchProfile, loading, handlePostLoginNavigation]);

  // COMPLETE LOGIN FUNCTION
  const login = async (email: string, password: string) => {
    if (authOperationInProgress.current) {
      setError('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setError(null);
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('No user returned from login');

      setUser(data.user);
      setSession(data.session);
      
      const userProfile = await fetchProfile(data.user.id);
      if (userProfile) {
        setProfile(userProfile);
      }
      
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('isInitialLogin', 'true');
      }
      
      await handlePostLoginNavigation(data.user, userProfile);
      
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during login');
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  // COMPLETE REGISTER FUNCTION
  const register = async (userData: RegisterData) => {
    if (authOperationInProgress.current) {
      setError('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setError(null);
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
      const profile = await fetchProfile(data.user.id);
      if (profile) {
        setProfile(profile);
      }

      router.push('/login?registered=true');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  // COMPLETE GOOGLE SIGN IN FUNCTION
  const signInWithGoogle = async (credential?: string) => {
    if (authOperationInProgress.current) {
      setError('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setError(null);
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
          const userProfile = await fetchProfile(data.user.id);
          if (userProfile) {
            setProfile(userProfile);
          }
          
          await handlePostLoginNavigation(data.user, userProfile);
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
      setError(err instanceof Error ? err.message : 'An error occurred during Google sign in');
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  // COMPLETE LOGOUT FUNCTION
  const logout = async () => {
    if (authOperationInProgress.current) {
      setError('Another operation is in progress. Please try again.');
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
      
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
      
      setUser(null);
      setProfile(null);
      setSession(null);
      window.location.href = '/login';
    } finally {
      setLoading(false);
      authOperationInProgress.current = false;
    }
  };

  // COMPLETE UPDATE PROFILE FUNCTION
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
      setError(err instanceof Error ? err.message : 'An error occurred updating profile');
    } finally {
      setLoading(false);
    }
  };

  // COMPLETE PASSWORD RESET FUNCTIONS
  const requestPasswordReset = async (email: string) => {
    if (authOperationInProgress.current) {
      setError('Another operation is in progress. Please try again.');
      return false;
    }

    try {
      authOperationInProgress.current = true;
      setError(null);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Password reset request error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred requesting password reset');
      return false;
    } finally {
      authOperationInProgress.current = false;
    }
  };

  const resetPassword = async (newPassword: string) => {
    if (authOperationInProgress.current) {
      setError('Another operation is in progress. Please try again.');
      return;
    }

    try {
      authOperationInProgress.current = true;
      setError(null);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      router.push('/login?reset=success');
    } catch (err) {
      console.error('Password reset error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred resetting password');
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
        setError: (err: string | null) => setError(err),
        updateUserRole
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