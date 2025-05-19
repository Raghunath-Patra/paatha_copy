// frontend/app/components/profile/ProfileForm.tsx

import React, { useState } from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../utils/supabase';

interface ExtendedProfileData {
  institution_name?: string;
  phone_number?: string;
  mother_tongue?: string;
  primary_language?: string;
  location?: string;
  join_purpose?: string;
}

export default function ExtendedProfileForm() {
  const { profile, updateProfile } = useSupabaseAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState<ExtendedProfileData>({
    institution_name: profile?.institution_name || '',
    phone_number: profile?.phone_number || '',
    mother_tongue: profile?.mother_tongue || '',
    primary_language: profile?.primary_language || '',
    location: profile?.location || '',
    join_purpose: profile?.join_purpose || ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile?.id);

      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
      <h3 className="text-lg font-medium mb-4">Additional Profile Information</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded">
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-600 rounded">
          Profile updated successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              phone_number: e.target.value
            }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional"
          />
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
          <select
            value={formData.primary_language}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              primary_language: e.target.value
            }))}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select Language</option>
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Kannada">Kannada</option>
          </select>
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}