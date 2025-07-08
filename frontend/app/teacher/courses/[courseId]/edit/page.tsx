// frontend/app/teacher/courses/[courseId]/edit/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../../utils/supabase';
import Navigation from '../../../../components/navigation/Navigation';
import { ArrowLeft, Save, AlertCircle, RefreshCw } from 'lucide-react';

interface CourseFormData {
  course_name: string;
  description: string;
  max_students: number;
  is_active: boolean;
}

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  description?: string;
  board: string;
  class_level: string;
  subject: string;
  is_active: boolean;
  max_students: number;
  current_students: number;
  created_at: string;
}

export default function EditCourse() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    course_name: '',
    description: '',
    max_students: 50,
    is_active: true
  });
  const [originalData, setOriginalData] = useState<CourseFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/'); // Redirect non-teachers
    }
  }, [profile, router]);

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      if (!user || !courseId) return;

      try {
        setLoading(true);
        setError(null);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const headers = {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        };

        const response = await fetch(`${API_URL}/api/teacher/courses/${courseId}`, {
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to fetch course details');
        }

        const courseData = await response.json();
        setCourse(courseData);

        // Initialize form data
        const initialData: CourseFormData = {
          course_name: courseData.course_name || '',
          description: courseData.description || '',
          max_students: courseData.max_students || 50,
          is_active: courseData.is_active !== undefined ? courseData.is_active : true
        };

        setFormData(initialData);
        setOriginalData(initialData);

      } catch (err) {
        console.error('Error loading course:', err);
        setError(err instanceof Error ? err.message : 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [user, courseId]);

  // Check for changes
  useEffect(() => {
    if (!originalData) return;

    const hasChanges = Object.keys(formData).some(key => {
      const formValue = formData[key as keyof CourseFormData];
      const originalValue = originalData[key as keyof CourseFormData];
      return formValue !== originalValue;
    });

    setHasChanges(hasChanges);
  }, [formData, originalData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Clear messages when user starts typing
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);

    let processedValue: string | number | boolean = value;
    
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'max_students') {
      processedValue = parseInt(value) || 0;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!hasChanges) {
      setError('No changes to save');
      return;
    }

    // Validate max_students vs current_students
    if (course && formData.max_students < course.current_students) {
      setError(`Maximum students cannot be less than current enrolled students (${course.current_students})`);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/teacher/courses/${courseId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update course');
      }

      const updatedCourse = await response.json();
      setCourse(updatedCourse);
      setOriginalData(formData);
      setSuccessMessage('Course updated successfully!');

      // Auto-hide success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      const confirm = window.confirm('You have unsaved changes. Are you sure you want to cancel?');
      if (!confirm) return;
    }
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="space-y-6">
                {[...Array(5)].map((_, i) => (
                  <div key={i}>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
          >
            Go Back
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Course</h1>
              {course && (
                <p className="text-sm text-gray-600">
                  {course.course_name} ({course.course_code})
                </p>
              )}
            </div>
          </div>
          <Navigation />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Messages */}
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center space-x-2">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-4 bg-green-50 text-green-700 rounded-lg flex items-center space-x-2">
                <div className="w-5 h-5 bg-green-200 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                </div>
                <span>{successMessage}</span>
              </div>
            )}

            {/* Course Status */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Course Status</h3>
                <p className="text-sm text-gray-600">
                  {course?.current_students || 0} students enrolled
                </p>
              </div>
              <label className="flex items-center space-x-3">
                <span className="text-sm font-medium text-gray-700">Active</span>
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </label>
            </div>

            {/* Course Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="course_name"
                value={formData.course_name}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Mathematics for Class 10"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Brief description of the course..."
              />
            </div>

            {/* Max Students */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Students
              </label>
              <input
                type="number"
                name="max_students"
                value={formData.max_students}
                onChange={handleInputChange}
                min={course?.current_students || 1}
                max="500"
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {course?.current_students || 0} enrolled
                {course && course.current_students > 0 && (
                  <span className="text-amber-600">
                    {' '}(minimum {course.current_students})
                  </span>
                )}
              </p>
            </div>

            {/* Course Information Display */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Course Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Board</p>
                  <p className="font-medium">{course?.board?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Class</p>
                  <p className="font-medium">Class {course?.class_level}</p>
                </div>
                <div>
                  <p className="text-gray-600">Subject</p>
                  <p className="font-medium">{course?.subject}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Board, class, and subject cannot be changed after course creation
              </p>
            </div>

            {/* Warning if course has students */}
            {course && course.current_students > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900">Active Course</h4>
                    <p className="text-sm text-amber-800">
                      This course has {course.current_students} enrolled students. 
                      Deactivating the course will prevent new enrollments but won't affect existing students.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !hasChanges}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {saving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>

            {/* Changes Indicator */}
            {hasChanges && (
              <div className="text-center text-sm text-amber-600">
                You have unsaved changes
              </div>
            )}
          </form>
        </div>

        {/* Preview Card */}
        {course && hasChanges && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Preview Changes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border rounded-lg p-4 bg-gray-50">
                <h4 className="font-medium text-gray-700 mb-2">Current</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {course.course_name}</div>
                  <div><strong>Description:</strong> {course.description || 'None'}</div>
                  <div><strong>Max Students:</strong> {course.max_students}</div>
                  <div><strong>Status:</strong> {course.is_active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-700 mb-2">After Changes</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {formData.course_name}</div>
                  <div><strong>Description:</strong> {formData.description || 'None'}</div>
                  <div><strong>Max Students:</strong> {formData.max_students}</div>
                  <div><strong>Status:</strong> {formData.is_active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}