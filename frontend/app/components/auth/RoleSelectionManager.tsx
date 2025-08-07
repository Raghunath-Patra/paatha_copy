'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import RoleSelectionPopup from './RoleSelectionPopup';

export default function RoleSelectionManager() {
  const { user, profile, updateProfile } = useSupabaseAuth();
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [loading, setLoading] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Only show role selection if:
    // 1. User is authenticated
    // 2. Profile exists and role is not_selected  
    // 3. Not on auth pages
    // 4. Not on admin/api routes
    const isAuthPage = pathname.startsWith('/login') || 
                      pathname.startsWith('/register') || 
                      pathname.startsWith('/auth/') ||
                      pathname.startsWith('/forgot-password') ||
                      pathname.startsWith('/reset-password') ||
                      pathname.startsWith('/verify-email');

    const isExcludedPage = pathname.startsWith('/api') || 
                          pathname.startsWith('/_next');

    if (user && profile && !isAuthPage && !isExcludedPage) {
      if (profile.role === 'not_selected') {
        setShowRoleSelection(true);
      }
    } else {
      setShowRoleSelection(false);
    }
  }, [user, profile, pathname]);

  const handleRoleSelect = async (role: 'student' | 'teacher', additionalData?: any) => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const updateData = {
        role,
        updated_at: new Date().toISOString(),
        ...additionalData
      };
      
      await updateProfile(updateData);
      setShowRoleSelection(false);
      
    } catch (error) {
      console.error('Error updating role:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Optional: allow closing without selecting
    setShowRoleSelection(false);
  };

  return (
    <RoleSelectionPopup
      isOpen={showRoleSelection}
      onRoleSelect={handleRoleSelect}
      onClose={handleClose}
      loading={loading}
    />
  );
}