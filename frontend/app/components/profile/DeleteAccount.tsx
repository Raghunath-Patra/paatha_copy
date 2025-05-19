// frontend/app/components/profile/DeleteAccount.tsx

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../utils/supabase';

export default function DeleteAccount() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState('');
  const [emailConfirmation, setEmailConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOAuth, setIsOAuth] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { profile, logout } = useSupabaseAuth();

  // Check auth method when component mounts
  useEffect(() => {
    const checkAuthMethod = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getUser();
        const user = data?.user;
        
        // Check if the user signed in with a provider like Google
        const isOAuthUser = user?.app_metadata?.provider === 'google' || 
                      !!user?.identities?.some(identity => identity.provider !== 'email');
        
        setIsOAuth(isOAuthUser);
      } catch (err) {
        console.error('Error checking auth method:', err);
        setIsOAuth(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthMethod();
  }, []);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsDeleting(true);

    try {
      if (isOAuth) {
        // For OAuth users, verify using email confirmation
        if (emailConfirmation !== profile?.email) {
          throw new Error('Email confirmation does not match your account email');
        }
        
        // Delete account without password verification
        const { error: deleteError } = await supabase.rpc('delete_user_oauth', {
          user_email: profile?.email
        });
        
        if (deleteError) {
          throw deleteError;
        }
      } else {
        // For password users, verify password first
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: profile?.email || '',
          password: password
        });

        if (signInError) {
          throw new Error('Incorrect password');
        }

        // If password is correct, delete the account
        const { error: deleteError } = await supabase.rpc('delete_user');
        
        if (deleteError) {
          throw deleteError;
        }
      }

      // Sign out and redirect
      await logout();
      router.push('/login?deleted=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  // Check for premium status
  const isPremium = profile?.is_premium;

  if (!showConfirm) {
    return (
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium text-red-600 mb-4">Delete Account</h3>
        <p className="text-gray-600 mb-4">
          Once you delete your account, all of your data will be permanently removed.
          This action cannot be undone.
        </p>
        {isPremium && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <p className="text-yellow-700 font-medium">You have an active premium subscription</p>
            <p className="text-yellow-600 text-sm mt-1">
              Deleting your account will also cancel your subscription without refund. 
              Make sure you want to proceed.
            </p>
          </div>
        )}
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Delete Account
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border-t pt-6 mt-6">
        <h3 className="text-lg font-medium text-neutral-700 mb-4">Preparing Account Deletion...</h3>
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
          <span className="text-neutral-600">Loading account information</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-medium text-red-600 mb-4">Confirm Account Deletion</h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleDelete} className="space-y-4">
        {/* Render appropriate form based on authentication method */}
        {isOAuth ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter your email address to confirm deletion
            </label>
            <input
              type="email"
              value={emailConfirmation}
              onChange={(e) => setEmailConfirmation(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
              placeholder={profile?.email}
            />
            <p className="mt-1 text-sm text-gray-500">
              Since you signed in with Google, please confirm by typing your email address.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Enter your password to confirm
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-red-500 focus:border-red-500"
              required
            />
          </div>
        )}

        {isPremium && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-yellow-700 text-sm">
              <strong>Warning:</strong> By deleting your account, you acknowledge that your premium subscription will be canceled
              without refund according to our terms and conditions.
            </p>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setShowConfirm(false);
              setError(null);
              setPassword('');
              setEmailConfirmation('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting Account...' : 'Permanently Delete Account'}
          </button>
        </div>
      </form>
    </div>
  );
}