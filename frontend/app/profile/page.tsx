// frontend/app/profile/page.tsx - Themed to match your app design with centered delete account section
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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 relative">
      {/* Animated background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-4 -right-4 w-16 h-16 sm:w-24 sm:h-24 bg-red-200/30 rounded-full animate-pulse" 
             style={{animationDuration: '3s'}} />
        <div className="absolute bottom-1/4 right-1/4 w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200/25 rounded-full animate-bounce" 
             style={{animationDuration: '4s'}} />
        <div className="absolute top-1/2 left-1/4 w-8 h-8 sm:w-12 sm:h-12 bg-orange-200/20 rounded-full animate-ping" 
             style={{animationDuration: '2s'}} />
        <div className="absolute top-1/4 left-1/3 w-6 h-6 sm:w-10 sm:h-10 bg-red-100/40 rounded-full animate-pulse" 
             style={{animationDuration: '3.5s', animationDelay: '2s'}} />
        <div className="absolute bottom-1/3 left-1/6 w-4 h-4 sm:w-8 sm:h-8 bg-yellow-100/30 rounded-full animate-bounce" 
             style={{animationDuration: '2.5s', animationDelay: '1.5s'}} />
      </div>

      <div className="container-fluid px-4 sm:px-8 py-4 sm:py-6 relative z-10">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">Profile Settings</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-1">
                Manage your account information and preferences
              </p>
            </div>
            <div className="flex items-center gap-4 relative z-[100]">
              <Navigation />
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            {updateStatus.type && (
              <div className={`bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 mb-6 border border-white/50 relative overflow-hidden ${
                updateStatus.type === 'success' ? 'border-green-200' : 'border-red-200'
              }`}>
                {/* Subtle gradient overlay */}
                <div className={`absolute inset-0 opacity-20 ${
                  updateStatus.type === 'success' 
                    ? 'bg-gradient-to-r from-green-50 to-emerald-50' 
                    : 'bg-gradient-to-r from-red-50 to-pink-50'
                }`}></div>
                
                <div className={`relative z-10 text-sm font-medium ${
                  updateStatus.type === 'success' ? 'text-green-700' : 'text-red-700'
                }`}>
                  {updateStatus.message}
                </div>
              </div>
            )}

            {/* Basic Settings Form */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-white/50 relative overflow-hidden">
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/20 via-orange-50/20 to-yellow-50/20 opacity-30"></div>
              
              <div className="relative z-10">
                <h2 className="text-xl font-medium mb-6 text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  Basic Information
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profile?.email || ''}
                        disabled
                        className="w-full p-3 border border-orange-200 rounded-lg bg-gradient-to-r from-gray-50 to-orange-50/30 text-gray-600 shadow-sm"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Email cannot be changed. Contact support if needed.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profile?.full_name || ''}
                        disabled
                        className="w-full p-3 border border-orange-200 rounded-lg bg-gradient-to-r from-gray-50 to-orange-50/30 text-gray-600 shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Board
                      </label>
                      <select
                        value={formData.board}
                        onChange={(e) => setFormData(prev => ({ ...prev, board: e.target.value }))}
                        className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                      >
                        <option value="">Select Board</option>
                        <option value="cbse">CBSE</option>
                        <option value="karnataka">Karnataka State Board</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Class
                      </label>
                      <input
                        type="text"
                        value={formData.class_level}
                        onChange={(e) => setFormData(prev => ({ ...prev, class_level: e.target.value }))}
                        className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                        placeholder="Enter your class (e.g., x, 10th, 8)"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter your class level (e.g., x for 10th CBSE, 10th for Karnataka, etc.)
                      </p>
                    </div>
                  </div>

                  {/* Extended Profile Fields */}
                  <div className="pt-6 border-t border-orange-200/50">
                    <h3 className="text-lg font-medium mb-4 text-gray-800 flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      Additional Information
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Institution Name
                          </label>
                          <input
                            type="text"
                            value={formData.institution_name}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              institution_name: e.target.value
                            }))}
                            className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                            placeholder="School/College/Coaching Institute"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="tel"
                            value={formData.phone_number}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              phone_number: e.target.value
                            }))}
                            className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                            placeholder="10-digit mobile number"
                            required
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Required for important account notifications.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mother Tongue
                          </label>
                          <input
                            type="text"
                            value={formData.mother_tongue}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              mother_tongue: e.target.value
                            }))}
                            className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                            placeholder="Your native language"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Preferred Learning Language
                          </label>
                          <input
                            type="text"
                            value={formData.primary_language}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              primary_language: e.target.value
                            }))}
                            className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                            placeholder="Enter your preferred language"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Location
                          </label>
                          <input
                            type="text"
                            value={formData.location}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              location: e.target.value
                            }))}
                            className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
                            placeholder="City, State"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Purpose of Joining
                          </label>
                          <select
                            value={formData.join_purpose}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              join_purpose: e.target.value
                            }))}
                            className="w-full p-3 border border-orange-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white shadow-sm transition-all duration-200"
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
                  </div>

                  <div className="pt-6">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 px-6 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 text-white rounded-lg font-medium hover:from-red-600 hover:via-orange-600 hover:to-yellow-600 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Saving Changes...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Delete Account Section - Properly Centered */}
            <div className="mt-12">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-red-200/50 relative overflow-hidden">
                {/* Warning gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-red-50/20 to-pink-50/20 opacity-30"></div>
                
                <div className="relative z-10 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-full max-w-md mx-auto">
                    <DeleteAccount />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}