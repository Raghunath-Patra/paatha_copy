// frontend/app/teacher/courses/create/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../utils/supabase';
import Navigation from '../../../components/navigation/Navigation';

interface CourseFormData {
  course_name: string;
  description: string;
  board: string;
  class_level: string;
  subject: string;
  max_students: number;
}

// Use the same board structure as the quiz editor
const BOARD_STRUCTURE = {
  cbse: {
    display_name: "CBSE",
    classes: {
      viii: { display_name: "Class VIII" },
      ix: { display_name: "Class IX" },
      x: { display_name: "Class X" },
      xi: { display_name: "Class XI" },
      xii: { display_name: "Class XII" }
    }
  },
  karnataka: {
    display_name: "Karnataka State Board", 
    classes: {
      "8th": { display_name: "8th Class" },
      "9th": { display_name: "9th Class" },
      "10th": { display_name: "10th Class" },
      "puc-1": { display_name: "PUC-I" },
      "puc-2": { display_name: "PUC-II" }
    }
  }
} as const;

interface SubjectInfo {
  code: string;
  name: string;
  type: string;
  chapters?: Array<{
    number: number;
    name: string;
  }>;
  shared_mapping?: {
    source_board: string;
    source_class: string;
    source_subject: string;
  };
  description?: string;
  icon?: string;
}

export default function CreateCourse() {
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const [formData, setFormData] = useState<CourseFormData>({
    course_name: '',
    description: '',
    board: '',
    class_level: '',
    subject: '',
    max_students: 50
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectInfo[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Check if user is a teacher
  useEffect(() => {
    if (profile && profile.role !== 'teacher') {
      router.push('/'); // Redirect non-teachers
    }
  }, [profile, router]);

  // Fetch subjects when board and class are selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.board || !formData.class_level || !user) return;

      setLoadingSubjects(true);
      setAvailableSubjects([]);
      setFormData(prev => ({ ...prev, subject: '' })); // Reset subject selection

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        const subjectsUrl = `${API_URL}/api/subjects/${formData.board}/${formData.class_level}`;
        const response = await fetch(subjectsUrl, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch subjects');
        }

        const data = await response.json();
        setAvailableSubjects(data.subjects || []);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Failed to load subjects for selected board and class');
      } finally {
        setLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, [formData.board, formData.class_level, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get access token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Prepare the data with subject code
      const submitData = {
        ...formData,
        subject: formData.subject // This will be the subject code, not display name
      };

      const response = await fetch(`${API_URL}/api/teacher/courses/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create course');
      }

      const courseData = await response.json();
      
      // Show success message and redirect
      alert(`Course created successfully! Course code: ${courseData.course_code}`);
      router.push('/teacher/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'board') {
      // Reset class and subject when board changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        class_level: '',
        subject: ''
      }));
      setAvailableSubjects([]);
    } else if (name === 'class_level') {
      // Reset subject when class changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subject: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: name === 'max_students' ? parseInt(value) || 0 : value
      }));
    }
  };

  // Get the display name for the selected subject
  const getSubjectDisplayName = (subjectCode: string) => {
    const subject = availableSubjects.find(s => s.code === subjectCode);
    return subject ? subject.name : subjectCode;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
          </div>
          <Navigation />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Board <span className="text-red-500">*</span>
                </label>
                <select
                  name="board"
                  value={formData.board}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Board</option>
                  {Object.entries(BOARD_STRUCTURE).map(([code, boardInfo]) => (
                    <option key={code} value={code}>
                      {boardInfo.display_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Class Level <span className="text-red-500">*</span>
                </label>
                <select
                  name="class_level"
                  value={formData.class_level}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!formData.board}
                >
                  <option value="">Select Class</option>
                  {formData.board && BOARD_STRUCTURE[formData.board as keyof typeof BOARD_STRUCTURE] && 
                    Object.entries(BOARD_STRUCTURE[formData.board as keyof typeof BOARD_STRUCTURE].classes).map(([code, classInfo]) => (
                      <option key={code} value={code}>
                        {classInfo.display_name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject <span className="text-red-500">*</span>
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                  disabled={!formData.class_level || loadingSubjects}
                >
                  <option value="">
                    {loadingSubjects ? 'Loading subjects...' : 'Select Subject'}
                  </option>
                  {availableSubjects.map((subject) => (
                    <option key={subject.code} value={subject.code}>
                      {subject.name}
                    </option>
                  ))}
                </select>
                {loadingSubjects && (
                  <div className="mt-1 flex items-center text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-1 border-blue-500 mr-2"></div>
                    Loading available subjects...
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Students
                </label>
                <input
                  type="number"
                  name="max_students"
                  value={formData.max_students}
                  onChange={handleInputChange}
                  min="1"
                  max="500"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum number of students that can enroll
                </p>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">What happens next?</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• A unique course code will be generated automatically</li>
                <li>• Students can join using this course code</li>
                <li>• You can start creating quizzes immediately</li>
                <li>• Course will be active and visible to enrolled students</li>
              </ul>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || loadingSubjects}
                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Creating Course...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Card */}
        {formData.course_name && (
          <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
            <h3 className="font-medium text-gray-900 mb-4">Course Preview</h3>
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900">{formData.course_name}</h4>
              {formData.description && (
                <p className="text-sm text-gray-600 mt-1">{formData.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                {formData.board && (
                  <span>{BOARD_STRUCTURE[formData.board as keyof typeof BOARD_STRUCTURE]?.display_name}</span>
                )}
                {formData.class_level && formData.board && (
                  <span>
                    {BOARD_STRUCTURE[formData.board as keyof typeof BOARD_STRUCTURE]?.classes[formData.class_level as keyof typeof BOARD_STRUCTURE[keyof typeof BOARD_STRUCTURE]['classes']]?.display_name}
                  </span>
                )}
                {formData.subject && (
                  <span>{getSubjectDisplayName(formData.subject)}</span>
                )}
                <span>Max {formData.max_students} students</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}