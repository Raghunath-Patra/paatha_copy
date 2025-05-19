// frontend/app/profile/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Navigation from '../components/navigation/Navigation';
import DeleteAccount from '../components/profile/DeleteAccount';
import { Alert } from '../components/ui/alert';

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useSupabaseAuth();
  const [loading, setLoading] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [formData, setFormData] = useState({
    board: profile?.board || '',
    class_level: profile?.class_level || '',
    institution_name: profile?.institution_name || '',
    phone_number: profile?.phone_number || '',
    mother_tongue: profile?.mother_tongue || '',
    primary_language: profile?.primary_language || '',
    location: profile?.location || '',
    join_purpose: profile?.join_purpose || ''
  });

  // Basic validation pattern for Indian numbers
  const validatePhoneNumber = (number: string) => {
    // Basic validation for 10-digit Indian numbers
    const phoneRegex = /^\d{10}$/;
    return phoneRegex.test(number);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setUpdateStatus({ type: null, message: '' });
    
    // Validate phone number
    if (!validatePhoneNumber(formData.phone_number)) {
      setUpdateStatus({
        type: 'error',
        message: 'Please enter a valid 10-digit phone number'
      });
      setLoading(false);
      return;
    }

    try {
      await updateProfile(formData);
      
      setUpdateStatus({
        type: 'success',
        message: 'Profile updated successfully!'
      });

      // If board or class was changed, redirect after a brief delay
      if (formData.board && formData.class_level && 
         (formData.board !== profile?.board || formData.class_level !== profile?.class_level)) {
        setTimeout(() => {
          router.push(`/${formData.board}/${formData.class_level}`);
        }, 1500);
      }
    } catch (err) {
      setUpdateStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to update profile'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-medium">Profile Settings</h1>
            <div className="flex items-center gap-4">
              <Navigation />
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {updateStatus.type && (
              <Alert 
                variant={updateStatus.type === 'success' ? 'success' : 'destructive'}
                className="mb-6"
              >
                {updateStatus.message}
              </Alert>
            )}

            {/* Basic Settings Form */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-medium mb-4">Basic Information</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full p-2 border rounded bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Email cannot be changed. Contact support if needed.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile?.full_name || ''}
                    disabled
                    className="w-full p-2 border rounded bg-gray-50 text-gray-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Board
                  </label>
                  <select
                    value={formData.board}
                    onChange={(e) => setFormData(prev => ({ ...prev, board: e.target.value }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select Board</option>
                    <option value="cbse">CBSE</option>
                    <option value="karnataka">Karnataka State Board</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class
                  </label>
                  <input
                    type="text"
                    value={formData.class_level}
                    onChange={(e) => setFormData(prev => ({ ...prev, class_level: e.target.value }))}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your class (e.g., x, 10th, 8)"
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Enter your class level (e.g., x for 10th CBSE, 10th for Karnataka, etc.)
                  </p>
                </div>

                {/* Extended Profile Fields */}
                <div className="pt-4 border-t">
                  <h3 className="text-lg font-medium mb-4">Additional Information</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Institution Name
                      </label>
                      <input
                        type="text"
                        value={formData.institution_name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          institution_name: e.target.value
                        }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="School/College/Coaching Institute"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          phone_number: e.target.value
                        }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="10-digit mobile number"
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Required for important account notifications.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mother Tongue
                      </label>
                      <input
                        type="text"
                        value={formData.mother_tongue}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          mother_tongue: e.target.value
                        }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Your native language"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferred Learning Language
                      </label>
                      <input
                        type="text"
                        value={formData.primary_language}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          primary_language: e.target.value
                        }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your preferred language"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          location: e.target.value
                        }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="City, State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Purpose of Joining
                      </label>
                      <select
                        value={formData.join_purpose}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          join_purpose: e.target.value
                        }))}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Purpose</option>
                        <option value="exam_prep">Exam Preparation</option>
                        <option value="homework">Homework Help</option>
                        <option value="self_study">Self Study</option>
                        <option value="competitive">Competitive Exams</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Delete Account Section */}
            <div className="mt-12">
              <DeleteAccount />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}