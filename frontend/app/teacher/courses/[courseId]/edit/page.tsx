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
  board: string;
  class_level: string;
  subject: string;
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

// Use the same board structure as create course
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

export default function EditCourse() {
  const params = useParams();
  const router = useRouter();
  const { user, profile } = useSupabaseAuth();
  const courseId = params.courseId as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    course_name: '',
    description: '',
    board: '',
    class_level: '',
    subject: '',
    max_students: 50,
    is_active: true
  });
  const [originalData, setOriginalData] = useState<CourseFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectInfo[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
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
          board: courseData.board || '',
          class_level: courseData.class_level || '',
          subject: courseData.subject || '',
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

  // Fetch subjects when board and class are selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!formData.board || !formData.class_level || !user) return;

      setLoadingSubjects(true);
      setAvailableSubjects([]);

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

    // Only fetch if we have both board and class, and if they're different from original
    if (formData.board && formData.class_level) {
      fetchSubjects();
    }
  }, [formData.board, formData.class_level, user]);

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

    if (name === 'board') {
      // Reset class and subject when board changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        class_level: originalData?.class_level || '',
        subject: originalData?.subject || ''
      }));
      setAvailableSubjects([]);
    } else if (name === 'class_level') {
      // Reset subject when class changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        subject: originalData?.subject || ''
      }));
    } else {
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
    }
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

  // Helper functions
  const getBoardDisplayName = (boardCode: string) => {
    const board = BOARD_STRUCTURE[boardCode as keyof typeof BOARD_STRUCTURE];
    return board ? board.display_name : boardCode;
  };

  const getClassDisplayName = (boardCode: string, classCode: string) => {
    const board = BOARD_STRUCTURE[boardCode as keyof typeof BOARD_STRUCTURE];
    if (!board) return classCode;
    
    const classInfo = board.classes[classCode as keyof typeof board.classes] as { display_name: string } | undefined;
    return classInfo ? classInfo.display_name : classCode;
  };

  const getSubjectDisplayName = (subjectCode: string) => {
    const subject = availableSubjects.find(s => s.code === subjectCode);
    return subject ? subject.name : subjectCode;
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

            {/* Board and Class */}
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

            {/* Subject and Max Students */}
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
                    <RefreshCw className="animate-spin h-3 w-3 mr-2" />
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
            </div>

            {/* Warning if course has students */}
            {course && course.current_students > 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-amber-600" />
                  <div>
                    <h4 className="font-medium text-amber-900">Important Notice</h4>
                    <p className="text-sm text-amber-800">
                      This course has {course.current_students} enrolled students. 
                      Changing the board, class, or subject may affect existing quizzes and student progress.
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
                disabled={saving || !hasChanges || loadingSubjects}
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
                  <div><strong>Board:</strong> {getBoardDisplayName(course.board)}</div>
                  <div><strong>Class:</strong> {getClassDisplayName(course.board, course.class_level)}</div>
                  <div><strong>Max Students:</strong> {course.max_students}</div>
                  <div><strong>Status:</strong> {course.is_active ? 'Active' : 'Inactive'}</div>
                </div>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50">
                <h4 className="font-medium text-blue-700 mb-2">After Changes</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {formData.course_name}</div>
                  <div><strong>Description:</strong> {formData.description || 'None'}</div>
                  <div><strong>Board:</strong> {getBoardDisplayName(formData.board)}</div>
                  <div><strong>Class:</strong> {getClassDisplayName(formData.board, formData.class_level)}</div>
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