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

// FIXED: Updated RegisterData interface to include role and teacher fields
interface RegisterData {
  email: string;
  password: string;
  full_name?: string;
  role?: 'student' | 'teacher';
  // Teacher-specific fields
  teaching_experience?: number;
  qualification?: string;
  subjects_taught?: string[];
  institution_name?: string;
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
      console.log('Fetching profile for user:', userId);
      
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) {
        console.error('Profile fetch error:', fetchError);
        
        if (fetchError.code === 'PGRST116') {  // Profile not found
          console.log('Profile not found, creating new profile');
          const { data: { user: currentUser } } = await supabase.auth.getUser();
          
          if (!currentUser) {
            console.error('No current user found');
            return null;
          }
          
          const newProfileData = {
            id: userId,
            email: currentUser?.email,
            full_name: currentUser?.user_metadata?.full_name,
            is_active: true,
            is_verified: false
          };

          console.log('Creating new profile:', newProfileData);
          const { data: createdProfile, error: createError } = await supabase
            .from('profiles')
            .insert([newProfileData])
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            return null;
          }
          
          console.log('Profile created successfully:', createdProfile);
          return createdProfile;
        }
        
        // For other errors (like 406), return null and let the app handle it
        console.error('Failed to fetch profile, returning null');
        return null;
      }

      console.log('Profile fetched successfully:', existingProfile);
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
    if (authOperationInProgress.current || !session) {
      return;
    }

    try {
      authOperationInProgress.current = true;
      lastRefreshAttempt.current = Date.now();
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        // Don't throw here, let the session expire naturally
        return;
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
      // Don't show error to user, just log it
    } finally {
      authOperationInProgress.current = false;
    }
  }, [session]);

  // Helper function to handle post-login navigation
  const handlePostLoginNavigation = useCallback(async (user: User, profile: UserProfile | null) => {
    console.log('handlePostLoginNavigation called with:', { userId: user.id, profile });
    
    // Check if this was a Google registration flow
    const isGoogleRegistration = sessionStorage.getItem('isGoogleRegistration');
    
    if (isGoogleRegistration) {
      console.log('Google registration flow detected');
      sessionStorage.removeItem('isGoogleRegistration');
      
      // If user doesn't have a role, redirect to role selection
      if (!profile?.role) {
        console.log('No role in profile, redirecting to role selection');
        router.push('/role-selection');
        return;
      }
    }
    
    // For email verification flow, check if this is the first login after verification
    const isInitialLogin = sessionStorage.getItem('isInitialLogin');
    if (isInitialLogin) {
      sessionStorage.removeItem('isInitialLogin');
    }
    
    // Check for original path (for protected route redirects)
    const originalPath = sessionStorage.getItem('originalPath');
    if (originalPath && originalPath !== '/login' && originalPath !== '/register') {
      sessionStorage.removeItem('originalPath');
      console.log('Redirecting to original path:', originalPath);
      window.location.href = originalPath;
      return;
    }
    
    // Handle case where profile fetch failed or profile is null
    if (!profile) {
      console.log('Profile is null, redirecting to role selection');
      router.push('/role-selection');
      return;
    }
    
    // Direct navigation based on user profile
    if (profile.role) {
      if (profile.board && profile.class_level) {
        // Complete profile - go to dashboard
        const dashboardPath = `/${profile.board}/${profile.class_level}`;
        console.log('Complete profile found, navigating to dashboard:', dashboardPath);
        router.push(dashboardPath);
      } else {
        // Has role but incomplete profile - go to home for completion
        console.log('Profile has role but incomplete, navigating to home for completion');
        router.push('/');
      }
    } else {
      // No role - go to role selection
      console.log('Profile exists but no role, navigating to role selection');
      router.push('/role-selection');
    }
  }, [router]);

  // Update user role (for Google registration and role selection page)
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

  // IMPORTANT: Session checking with defensive logic
  useEffect(() => {
    // Only set up interval if we have a session
    if (!session) return;

    sessionCheckInterval.current = setInterval(() => {
      // Only check if we still have a session
      if (session) {
        checkSessionExpiration();
      }
    }, SESSION_CHECK_INTERVAL);

    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
    };
  }, [checkSessionExpiration, session]);

  // Initialize authentication
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    let mounted = true;

    const initializeAuth = async () => {
      try {
        setLoading(true);
        
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          // Don't throw, just continue with no session
        }

        if (currentSession?.user && mounted) {
          console.log('Existing session found:', currentSession.user.id);
          setUser(currentSession.user);
          setSession(currentSession);
          const userProfile = await fetchProfile(currentSession.user.id);
          if (mounted && userProfile) {
            setProfile(userProfile);
          }
        } else {
          console.log('No existing session found');
        }

        // Set up Supabase auth listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state change:', event, session?.user?.id);
            
            if (event === 'SIGNED_IN' && session?.user) {
              setUser(session.user);
              setSession(session);
              
              console.log('Fetching user profile...');
              let userProfile = await fetchProfile(session.user.id);
              console.log('Initial profile fetch result:', userProfile);
              
              // If profile fetch failed (likely due to 406/RLS issue), create a minimal profile
              if (!userProfile) {
                console.log('Profile fetch failed, creating minimal profile for navigation');
                userProfile = {
                  id: session.user.id,
                  email: session.user.email || '',
                  is_active: true,
                  is_verified: false
                };
                // Don't set this in state yet, just use for navigation logic
              }
              
              // Check for pending registration data (from email verification flow)
              const pendingData = sessionStorage.getItem('pendingRegistrationData');
              console.log('Pending registration data:', pendingData);
              
              if (pendingData) {
                try {
                  const registrationData = JSON.parse(pendingData);
                  console.log('Applying pending registration data:', registrationData);
                  
                  // If we have pending data, the user should go to role selection if profile operations fail
                  let shouldGoToRoleSelection = true;
                  
                  // Try to apply pending data if profile exists or can be created
                  if (userProfile && userProfile.id) {
                    // Try to update existing profile
                    const { error: updateError } = await supabase
                      .from('profiles')
                      .update({
                        ...registrationData,
                        updated_at: new Date().toISOString()
                      })
                      .eq('id', session.user.id);
                    
                    if (!updateError) {
                      // Update successful, refetch profile
                      const updatedProfile = await fetchProfile(session.user.id);
                      if (updatedProfile) {
                        userProfile = updatedProfile;
                        shouldGoToRoleSelection = false;
                        console.log('Profile updated successfully:', userProfile);
                      }
                    } else {
                      console.error('Error updating profile with pending data:', updateError);
                    }
                  }
                  
                  // If update failed, try to create profile
                  if (shouldGoToRoleSelection && userProfile && !userProfile.role) {
                    console.log('Attempting to create profile with pending data');
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    
                    const newProfileData = {
                      id: session.user.id,
                      email: currentUser?.email,
                      full_name: currentUser?.user_metadata?.full_name,
                      is_active: true,
                      is_verified: false,
                      ...registrationData,
                      created_at: new Date().toISOString()
                    };
                    
                    const { data: createdProfile, error: createError } = await supabase
                      .from('profiles')
                      .insert([newProfileData])
                      .select()
                      .single();
                    
                    if (!createError && createdProfile) {
                      userProfile = createdProfile;
                      shouldGoToRoleSelection = false;
                      console.log('Profile created with pending data:', userProfile);
                    } else {
                      console.error('Error creating profile:', createError);
                      // Keep shouldGoToRoleSelection = true
                    }
                  }
                  
                  // Clear pending data if we successfully applied it, or if we're going to role selection anyway
                  if (!shouldGoToRoleSelection || (userProfile && !userProfile.role)) {
                    sessionStorage.removeItem('pendingRegistrationData');
                    console.log('Pending data cleared');
                  }
                  
                  // If all database operations failed but we have pending role data, 
                  // ensure user goes to role selection by setting a minimal profile
                  if (shouldGoToRoleSelection && registrationData.role) {
                    console.log('Database operations failed, but ensuring role selection with pending data');
                    userProfile = {
                      id: session.user.id,
                      email: session.user.email || '',
                      is_active: true,
                      is_verified: false,
                      // Don't include role so navigation goes to role selection
                    };
                    // Keep pending data for role selection page to use
                  }
                  
                } catch (err) {
                  console.error('Error parsing or applying pending registration data:', err);
                  sessionStorage.removeItem('pendingRegistrationData');
                }
              }
              
              console.log('Final profile state before navigation:', userProfile);
              
              // Set profile in state (even if it's a minimal profile for navigation)
              if (userProfile) {
                setProfile(userProfile);
              } else {
                console.warn('No profile available - user will be directed to role selection');
                setProfile(null);
              }
              
              // Only handle navigation if this is coming from auth callback
              // Avoid navigation loops from other sign-in events
              if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const searchParams = new URLSearchParams(window.location.search);
                
                // Only navigate if we're on login, register, auth callback, or role selection pages
                if (currentPath === '/login' || 
                    currentPath === '/register' || 
                    currentPath.includes('/auth/callback') ||
                    currentPath === '/role-selection' ||
                    searchParams.has('code')) {
                  
                  console.log('Navigating from auth state change');
                  await handlePostLoginNavigation(session.user, userProfile);
                } else {
                  console.log('Skipping navigation - user already on app page');
                }
              }
              
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
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      if (authListenerRef.current) {
        authListenerRef.current.data.subscription.unsubscribe();
      }
    };
  }, [fetchProfile, handlePostLoginNavigation]);

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

  // FIXED: Updated register function to handle role and teacher data
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

      console.log('Registration successful, user ID:', data.user.id);

      // Store registration data for after email verification
      if (userData.role) {
        const pendingData = {
          role: userData.role,
          teaching_experience: userData.teaching_experience,
          qualification: userData.qualification,
          subjects_taught: userData.subjects_taught,
          institution_name: userData.institution_name
        };
        sessionStorage.setItem('pendingRegistrationData', JSON.stringify(pendingData));
        console.log('Stored pending registration data:', pendingData);
      }

      // For email registration, always show verification message
      // Don't auto-login, let the email verification process handle it
      console.log('Registration complete, redirecting to login with verification message');
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