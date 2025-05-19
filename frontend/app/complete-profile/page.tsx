// frontend/app/complete-profile/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Logo from '../components/common/Logo';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useSupabaseAuth();
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Basic validation pattern for Indian numbers
  const validatePhoneNumber = (number: string) => {
    // Basic validation for 10-digit Indian numbers
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validatePhoneNumber(phoneNumber)) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateProfile({
        phone_number: phoneNumber
      });
      
      // Redirect to where the user was trying to go
      const intendedPath = sessionStorage.getItem('originalPath') || '/';
      router.push(intendedPath);
    } catch (err) {
      setError('Failed to update phone number. Please try again.');
      console.error('Phone update error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Logo className="h-12 w-12" showText={true} />
      </div>
      
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm">
        <h2 className="text-2xl font-bold mb-6 text-center">One more step!</h2>
        <p className="mb-6 text-gray-600">
          To provide you with timely updates about your learning progress and important notifications, 
          we need your phone number. This helps us ensure you never miss important information.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full p-3 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="10-digit mobile number"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              We'll only use this to send important notifications about your account.
            </p>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Paaṭha AI'}
          </button>
        </form>
      </div>
    </div>
  );
}