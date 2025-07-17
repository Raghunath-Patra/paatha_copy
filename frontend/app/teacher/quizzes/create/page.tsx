// frontend/app/teacher/quizzes/create/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../utils/supabase';
import Navigation from '../../../components/navigation/Navigation';

interface Course {
  id: string;
  course_name: string;
  course_code: string;
  board: string;
  class_level: string;
  subject: string;
}

interface QuizFormData {
  course_id: string;
  title: string;
  description: string;
  instructions: string;
  time_limit: number | null;
  total_marks: number;
  passing_marks: number;
  attempts_allowed: number;
  start_time: string;
  end_time: string;
  auto_grade: boolean;
}

export default function CreateQuiz() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useSupabaseAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [formData, setFormData] = useState<QuizFormData>({
    course_id: '',
    title: '',
    description: '',
    instructions: '',
    time_limit: null,
    total_marks: 100,
    passing_marks: 50,
    attempts_allowed: 1,
    start_time: '',
    end_time: '',
    auto_grade: true
  });
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [presetCourse, setPresetCourse] = useState<Course | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Get course_id from URL parameters
  const courseIdFromUrl = searchParams.get('course_id');

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/'); // Redirect non-teachers
    }
  }, [profile, router]);

  // Fetch teacher's courses
  useEffect(() => {
    const fetchCourses = async () => {
      if (!user) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const response = await fetch(`${API_URL}/api/teacher/courses/`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch courses');
        }

        const coursesData = await response.json();
        setCourses(coursesData);

        // If course_id is provided in URL, preset the form
        if (courseIdFromUrl) {
          const selectedCourse = coursesData.find((course: Course) => course.id === courseIdFromUrl);
          if (selectedCourse) {
            setPresetCourse(selectedCourse);
            setFormData(prev => ({
              ...prev,
              course_id: selectedCourse.id
            }));
          }
        }
      } catch (err) {
        console.error('Error fetching courses:', err);
        setError('Failed to load courses. Please try again.');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();
  }, [user, courseIdFromUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Prepare data for submission
      const submitData = {
        ...formData,
        start_time: formData.start_time || null,
        end_time: formData.end_time || null,
        time_limit: formData.time_limit || null
      };

      const response = await fetch(`${API_URL}/api/teacher/quizzes/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create quiz');
      }

      const quizData = await response.json();
      
      // Redirect to quiz editor to add questions
      router.push(`/teacher/quizzes/${quizData.id}/edit`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked
        : type === 'number' 
          ? (value === '' ? null : parseInt(value))
          : value
    }));
  };

  // FIXED: Better back navigation logic
  const handleBackNavigation = () => {
    // Check if we have a course ID and if it's a valid navigation
    if (courseIdFromUrl) {
      // Use router.replace to avoid adding to history stack
      router.replace(`/teacher/courses/${courseIdFromUrl}`);
    } else {
      // If no course ID, go to teacher dashboard
      router.replace('/teacher/dashboard');
    }
  };

  // FIXED: Handle browser back button to prevent infinite loop
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Prevent default back navigation if we're coming from a course page
      if (courseIdFromUrl) {
        event.preventDefault();
        router.replace(`/teacher/courses/${courseIdFromUrl}`);
      }
    };

    // Add event listener for browser back button
    window.addEventListener('popstate', handlePopState);

    // Cleanup
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [courseIdFromUrl, router]);

  if (loadingCourses) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading courses...</p>
        </div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Create Quiz</h1>
            <Navigation />
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <h2 className="text-xl font-medium text-gray-900 mb-2">No Courses Found</h2>
            <p className="text-gray-600 mb-6">You need to create a course before you can create quizzes.</p>
            <button
              onClick={() => router.push('/teacher/courses/create')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create Your First Course
            </button>
          </div>
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
              onClick={handleBackNavigation}
              className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Go back to course"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
              {presetCourse && (
                <p className="text-sm text-gray-600">
                  for <span className="font-medium">{presetCourse.course_name}</span>
                </p>
              )}
            </div>
          </div>
          <Navigation />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            {/* Course Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Course <span className="text-red-500">*</span>
              </label>
              <select
                name="course_id"
                value={formData.course_id}
                onChange={handleInputChange}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.course_name} ({course.course_code})
                  </option>
                ))}
              </select>
              {presetCourse && (
                <p className="text-sm text-green-600 mt-1">
                  ✓ Pre-selected from course page
                </p>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Chapter 1 - Introduction to Algebra"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of what this quiz covers..."
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instructions for Students
                </label>
                <textarea
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Provide any special instructions for students taking this quiz..."
                />
              </div>
            </div>

            {/* Quiz Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quiz Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time Limit (minutes)
                  </label>
                  <input
                    type="number"
                    name="time_limit"
                    value={formData.time_limit || ''}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Optional"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty for no time limit</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="total_marks"
                    value={formData.total_marks}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Passing Marks <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="passing_marks"
                    value={formData.passing_marks}
                    onChange={handleInputChange}
                    min="0"
                    max={formData.total_marks}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attempts Allowed <span className="text-red-500">*</span>
                </label>
                <select
                  name="attempts_allowed"
                  value={formData.attempts_allowed}
                  onChange={handleInputChange}
                  className="w-full md:w-1/3 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value={1}>1 attempt</option>
                  <option value={2}>2 attempts</option>
                  <option value={3}>3 attempts</option>
                  <option value={5}>5 attempts</option>
                  <option value={999}>Unlimited</option>
                </select>
              </div>
            </div>

            {/* Schedule */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <input
                    type="datetime-local"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">When students can start taking the quiz</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <input
                    type="datetime-local"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">When the quiz becomes unavailable</p>
                </div>
              </div>
            </div>

            {/* Auto-grading */}
            <div className="border-t pt-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="auto_grade"
                  checked={formData.auto_grade}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Enable automatic grading
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Quiz will be automatically graded when students submit their answers
              </p>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Next Steps</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• After creating the quiz, you'll be able to add questions</li>
                <li>• You can use AI-generated questions or create custom ones</li>
                <li>• Quiz will be saved as draft until you publish it</li>
                <li>• Students can only see published quizzes</li>
              </ul>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleBackNavigation}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Creating Quiz...' : 'Create Quiz & Add Questions'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
