// frontend/app/(auth)/role-selection/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import RoleSelection from '../../components/auth/RoleSelection';
import EnhancedLogo from '../../components/common/EnhancedLogo';

export default function RoleSelectionPage() {
  const router = useRouter();
  const { user, profile, loading, updateUserRole } = useSupabaseAuth();
  const [pendingData, setPendingData] = useState<any>(null);

  // Check for pending registration data and auto-apply if available
  useEffect(() => {
    const storedPendingData = sessionStorage.getItem('pendingRegistrationData');
    if (storedPendingData) {
      try {
        const data = JSON.parse(storedPendingData);
        console.log('Found pending registration data:', data);
        setPendingData(data);
        
        // Auto-apply the pending role selection if available
        if (data.role) {
          console.log('Auto-applying pending role:', data.role);
          handleRoleSelect(data.role, data);
        }
      } catch (err) {
        console.error('Error parsing pending registration data:', err);
        sessionStorage.removeItem('pendingRegistrationData');
      }
    }
  }, []);

  // Redirect if user is not logged in or already has a role
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      
      if (profile?.role && !pendingData) {
        // User already has a role, redirect to dashboard
        if (profile.board && profile.class_level) {
          router.push(`/${profile.board}/${profile.class_level}`);
        } else {
          router.push('/');
        }
        return;
      }
    }
  }, [user, profile, loading, router, pendingData]);

  const handleRoleSelect = async (role: 'student' | 'teacher', additionalData?: any) => {
    try {
      console.log('Role selected:', role, additionalData);
      
      // Clear pending data since we're applying it now
      sessionStorage.removeItem('pendingRegistrationData');
      setPendingData(null);
      
      await updateUserRole(role, additionalData);
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect via useEffect
  }

  return (
    <>
      {/* Enhanced animations and effects */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .stagger-1 { animation-delay: 0.2s; }
        .stagger-2 { animation-delay: 0.4s; }
        .stagger-3 { animation-delay: 0.6s; }
        
        /* Gradient text effect */
        .gradient-text {
          background: linear-gradient(135deg, #dc2626, #ea580c, #d97706);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
        {/* Enhanced animated background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
               style={{animationDuration: '3s'}} />
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
               style={{animationDuration: '4s'}} />
          <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
               style={{animationDuration: '2s'}} />
          <div className="absolute top-1/4 right-1/3 w-6 h-6 sm:w-10 sm:h-10 bg-red-100/40 rounded-full animate-pulse animate-float" 
               style={{animationDuration: '3.5s', animationDelay: '2s'}} />
          <div className="absolute bottom-1/3 left-1/6 w-4 h-4 sm:w-8 sm:h-8 bg-yellow-100/30 rounded-full animate-bounce" 
               style={{animationDuration: '2.5s', animationDelay: '1.5s'}} />
          <div className="absolute top-3/4 right-1/6 w-5 h-5 sm:w-9 sm:h-9 bg-orange-100/25 rounded-full animate-ping" 
               style={{animationDuration: '4.5s', animationDelay: '3s'}} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Enhanced Logo Section */}
          <div className="text-center mb-12 sm:mb-16 opacity-0 animate-fade-in-up stagger-1">
            <EnhancedLogo 
              className="h-12 w-12 sm:h-16 sm:w-16" 
              showText={true}
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 gradient-text">
              Welcome to Paaṭha AI!
            </h1>
            <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
              {pendingData ? 
                'Completing your registration...' : 
                "You're almost done! Let us know how you'll be using Paaṭha AI to customize your experience."
              }
            </p>
          </div>

          {/* Show message if auto-applying pending data */}
          {pendingData && (
            <div className="w-full max-w-md mb-6 opacity-0 animate-fade-in stagger-2">
              <div className="bg-blue-50/90 backdrop-blur-sm text-blue-700 rounded-xl p-4 text-center border border-blue-200 shadow-lg">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="font-medium mb-1">Completing Your Setup</div>
                <div className="text-sm">
                  We're applying your registration preferences...
                </div>
              </div>
            </div>
          )}

          {/* Enhanced Role Selection Container */}
          <div className="w-full max-w-md opacity-0 animate-fade-in-up stagger-2">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/50 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 via-orange-50/20 to-yellow-50/20 opacity-50"></div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
              
              <div className="relative z-10">
                <RoleSelection onRoleSelect={handleRoleSelect} loading={loading} />
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="mt-8 text-center opacity-0 animate-fade-in stagger-3">
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Your selection helps us provide the most relevant content and features for your learning or teaching needs.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Secure & Private</span>
              <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" style={{animationDelay: '0.5s'}}></div>
              <span>You can change this later</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}