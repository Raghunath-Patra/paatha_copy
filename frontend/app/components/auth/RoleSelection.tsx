// frontend/app/components/auth/RoleSelection.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RoleSelectionProps {
  onRoleSelect: (role: 'student' | 'teacher', additionalData?: any) => void;
  loading?: boolean;
  showBackButton?: boolean;
  onBack?: () => void;
}

interface TeacherData {
  teaching_experience?: number;
  qualification?: string;
  subjects_taught?: string[];
  institution_name?: string;
}

export default function RoleSelection({ 
  onRoleSelect, 
  loading = false, 
  showBackButton = true,
  onBack 
}: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherData, setTeacherData] = useState<TeacherData>({
    teaching_experience: undefined,
    qualification: '',
    subjects_taught: [],
    institution_name: ''
  });

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    if (role === 'teacher') {
      setShowTeacherForm(true);
    } else {
      onRoleSelect(role);
    }
  };

  const handleTeacherSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData = {
      ...teacherData,
      subjects_taught: teacherData.subjects_taught?.filter(subject => subject.trim() !== '')
    };
    onRoleSelect('teacher', cleanedData);
  };

  const handleBack = () => {
    if (showTeacherForm) {
      setShowTeacherForm(false);
      setSelectedRole(null);
    } else if (onBack) {
      onBack();
    }
  };

  const addSubject = () => {
    setTeacherData(prev => ({
      ...prev,
      subjects_taught: [...(prev.subjects_taught || []), '']
    }));
  };

  const updateSubject = (index: number, value: string) => {
    setTeacherData(prev => ({
      ...prev,
      subjects_taught: prev.subjects_taught?.map((subject, i) => 
        i === index ? value : subject
      )
    }));
  };

  const removeSubject = (index: number) => {
    setTeacherData(prev => ({
      ...prev,
      subjects_taught: prev.subjects_taught?.filter((_, i) => i !== index)
    }));
  };

  if (showTeacherForm) {
    return (
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm">
        <div className="flex items-center mb-6">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="mr-3 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-2xl font-medium">Teacher Information</h2>
        </div>

        <form onSubmit={handleTeacherSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teaching Experience (years)
            </label>
            <input
              type="number"
              min="0"
              value={teacherData.teaching_experience || ''}
              onChange={(e) => setTeacherData(prev => ({
                ...prev,
                teaching_experience: e.target.value ? parseInt(e.target.value) : undefined
              }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., 5"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Highest Qualification
            </label>
            <input
              type="text"
              value={teacherData.qualification || ''}
              onChange={(e) => setTeacherData(prev => ({
                ...prev,
                qualification: e.target.value
              }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., M.Sc. Mathematics, B.Ed."
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Institution/School Name
            </label>
            <input
              type="text"
              value={teacherData.institution_name || ''}
              onChange={(e) => setTeacherData(prev => ({
                ...prev,
                institution_name: e.target.value
              }))}
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., ABC School"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subjects You Teach
            </label>
            <div className="space-y-2">
              {teacherData.subjects_taught?.map((subject, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => updateSubject(index, e.target.value)}
                    className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Mathematics"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => removeSubject(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addSubject}
                className="w-full p-2 border-2 border-dashed border-gray-300 rounded text-gray-600 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
                disabled={loading}
              >
                + Add Subject
              </button>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Setting up your account...' : 'Complete Setup'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm">
      {showBackButton && onBack && (
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="mr-3 text-gray-400 hover:text-gray-600"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}
      
      <h2 className="text-2xl font-medium mb-6 text-center">Choose Your Role</h2>
      <p className="text-gray-600 text-center mb-8">
        How will you be using Paaṭha AI?
      </p>

      <div className="space-y-4">
        {/* Student Option */}
        <button
          onClick={() => handleRoleSelect('student')}
          disabled={loading}
          className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
        >
          <div className="flex items-start">
            <div className="p-3 bg-blue-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Student</h3>
              <p className="text-sm text-gray-600">
                Join courses, take quizzes, and track your learning progress with AI-powered feedback.
              </p>
              <ul className="mt-3 text-xs text-gray-500 space-y-1">
                <li>• Join courses with course codes</li>
                <li>• Take interactive quizzes</li>
                <li>• Get instant AI feedback</li>
                <li>• Track your progress</li>
              </ul>
            </div>
          </div>
        </button>

        {/* Teacher Option */}
        <button
          onClick={() => handleRoleSelect('teacher')}
          disabled={loading}
          className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-left disabled:opacity-50"
        >
          <div className="flex items-start">
            <div className="p-3 bg-green-100 rounded-full mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Teacher</h3>
              <p className="text-sm text-gray-600">
                Create courses, design quizzes, and manage students with AI-generated questions.
              </p>
              <ul className="mt-3 text-xs text-gray-500 space-y-1">
                <li>• Create and manage courses</li>
                <li>• Design custom quizzes</li>
                <li>• Use AI-generated questions</li>
                <li>• Track student performance</li>
              </ul>
            </div>
          </div>
        </button>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">
          You can always change your role later in your profile settings.
        </p>
      </div>
    </div>
  );
}