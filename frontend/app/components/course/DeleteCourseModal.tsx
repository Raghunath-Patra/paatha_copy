import React, { useState } from 'react';
import { AlertTriangle, X, Trash2, Users, FileText, BarChart3 } from 'lucide-react';

type DeleteCourseModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (courseId: string | number) => void;
  course: {
    id: string | number;
    name: string;
    enrollmentCount?: number;
    quizCount?: number;
    attemptCount?: number;
  } | null;
  isDeleting?: boolean;
};

const DeleteCourseModal = ({
  isOpen,
  onClose,
  onConfirm,
  course,
  isDeleting = false
}: DeleteCourseModalProps) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const isConfirmationValid = confirmationText === course?.name;

  const handleDelete = () => {
    if (isConfirmationValid) {
      if (course) {
        onConfirm(course.id);
      }
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setShowDetails(false);
    onClose();
  };

  if (!isOpen || !course) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Delete Course</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            disabled={isDeleting}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning Message */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  This action cannot be undone
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  You are about to permanently delete <strong>"{course.name}"</strong> and all associated data.
                </p>
              </div>
            </div>
          </div>

          {/* Course Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Course: {course.name}</h4>
            <div className="grid grid-cols-1 gap-3 text-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Student Enrollments</span>
                </div>
                <span className="font-medium text-gray-900">{course.enrollmentCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Quizzes</span>
                </div>
                <span className="font-medium text-gray-900">{course.quizCount || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-gray-500" />
                  <span className="text-gray-600">Quiz Attempts</span>
                </div>
                <span className="font-medium text-gray-900">{course.attemptCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Detailed Warning */}
          <div className="space-y-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showDetails ? 'Hide' : 'Show'} what will be deleted
            </button>
            
            {showDetails && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-yellow-800 mb-2">
                  The following data will be permanently deleted:
                </h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• All student enrollments and progress</li>
                  <li>• All quizzes and their questions</li>
                  <li>• All quiz attempts and responses</li>
                  <li>• All course materials and assignments</li>
                  <li>• All grades and feedback</li>
                </ul>
              </div>
            )}
          </div>

          {/* Confirmation Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Type the course name to confirm deletion:
            </label>
            <input
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={course.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
              disabled={isDeleting}
            />
            {confirmationText && !isConfirmationValid && (
              <p className="text-sm text-red-600">
                Course name doesn't match. Please type exactly: "{course.name}"
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={!isConfirmationValid || isDeleting}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Course</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCourseModal;