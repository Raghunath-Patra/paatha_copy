import React, { useState, useEffect } from 'react';

// Define interfaces
interface RoleSelectionPopupProps {
  isOpen: boolean;
  onRoleSelect: (role: 'student' | 'teacher', additionalData?: any) => void;
  onClose: () => void;
  loading?: boolean;
  showSuccess?: boolean;
  successData?: { role: string; message: string } | null;
}

interface TeacherData {
  teaching_experience?: number;
  qualification?: string;
  subjects_taught?: string[];
  institution_name?: string;
}

// Main Role Selection Popup Component
const RoleSelectionPopup = ({ 
  isOpen, 
  onRoleSelect, 
  onClose, 
  loading = false,
  showSuccess = false,
  successData = null
}: RoleSelectionPopupProps) => {
  const [selectedRole, setSelectedRole] = useState<'student' | 'teacher' | null>(null);
  const [showTeacherForm, setShowTeacherForm] = useState(false);
  const [teacherData, setTeacherData] = useState<TeacherData>({
    teaching_experience: undefined,
    qualification: '',
    subjects_taught: [],
    institution_name: ''
  });
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    if (isOpen && !showSuccess) {
      setAnimationPhase(0);
      setSelectedRole(null);
      setShowTeacherForm(false);
      
      const timer1 = setTimeout(() => setAnimationPhase(1), 300);
      const timer2 = setTimeout(() => setAnimationPhase(2), 800);
      const timer3 = setTimeout(() => setAnimationPhase(3), 1300);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, showSuccess]);

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    setSelectedRole(role);
    if (role === 'teacher') {
      setShowTeacherForm(true);
    } else {
      onRoleSelect(role);
    }
  };

  const handleTeacherSubmit = () => {
    const cleanedData = {
      ...teacherData,
      subjects_taught: teacherData.subjects_taught?.filter(subject => subject.trim() !== '')
    };
    onRoleSelect('teacher', cleanedData);
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

  const goBack = () => {
    setShowTeacherForm(false);
    setSelectedRole(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 sm:p-6 lg:p-8 z-50">
      <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 w-full max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl max-h-[85vh] sm:max-h-[80vh] overflow-y-auto relative my-4 sm:my-8">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 opacity-50 rounded-xl sm:rounded-2xl"></div>
        
        {!showSuccess ? (
          <>
            {showTeacherForm ? (
              /* Teacher Information Form */
              <div className="relative z-10">
                <div className="flex items-center mb-4 sm:mb-6">
                  <button
                    onClick={goBack}
                    className="mr-2 sm:mr-3 text-gray-400 hover:text-gray-600 transition-colors p-1"
                    disabled={loading}
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex-1">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                      👨‍🏫 Teacher Details
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                      Help us personalize your experience (all fields are optional)
                    </p>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Teaching Experience (years) <span className="text-gray-400 text-xs">- Optional</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={teacherData.teaching_experience ?? ''}
                      onChange={(e) => setTeacherData(prev => ({
                        ...prev,
                        teaching_experience: e.target.value ? parseInt(e.target.value) : undefined
                      }))}
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 5"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Highest Qualification <span className="text-gray-400 text-xs">- Optional</span>
                    </label>
                    <input
                      type="text"
                      value={teacherData.qualification || ''}
                      onChange={(e) => setTeacherData(prev => ({
                        ...prev,
                        qualification: e.target.value
                      }))}
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., M.Sc. Mathematics, B.Ed."
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Institution/School Name <span className="text-gray-400 text-xs">- Optional</span>
                    </label>
                    <input
                      type="text"
                      value={teacherData.institution_name || ''}
                      onChange={(e) => setTeacherData(prev => ({
                        ...prev,
                        institution_name: e.target.value
                      }))}
                      className="w-full p-2 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., ABC School"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Subjects You Teach <span className="text-gray-400 text-xs">- Optional</span>
                    </label>
                    <div className="space-y-2">
                      {teacherData.subjects_taught?.map((subject, index) => (
                        <div key={index} className="flex gap-2">
                          <input
                            type="text"
                            value={subject}
                            onChange={(e) => updateSubject(index, e.target.value)}
                            className="flex-1 p-2 sm:p-3 text-sm sm:text-base border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Mathematics"
                            disabled={loading}
                          />
                          <button
                            onClick={() => removeSubject(index)}
                            className="p-2 sm:p-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            disabled={loading}
                          >
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addSubject}
                        className="w-full p-2 sm:p-3 border-2 border-dashed border-gray-300 rounded-lg text-xs sm:text-sm text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
                        disabled={loading}
                      >
                        + Add Subject
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 sm:pt-4 space-y-3">
                    <button
                      onClick={handleTeacherSubmit}
                      disabled={loading}
                      className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-2 border-white border-t-transparent"></div>
                          <span>Setting up your profile...</span>
                        </>
                      ) : (
                        <span>Complete Setup</span>
                      )}
                    </button>
                    
                    <button
                      onClick={() => onRoleSelect('teacher', {})}
                      disabled={loading}
                      className="w-full py-2 sm:py-3 px-3 sm:px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm sm:text-base font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Skip Details & Continue as Teacher
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Role Selection */
              <div className="relative z-10">
                {/* Floating Emojis - Responsive positioning */}
                <div className="absolute top-1 left-1 sm:top-2 sm:left-2 lg:top-4 lg:left-4 text-sm sm:text-lg lg:text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🎓</div>
                <div className="absolute top-1 right-1 sm:top-3 sm:right-3 lg:top-6 lg:right-6 text-xs sm:text-base lg:text-xl animate-bounce" style={{ animationDelay: '0.5s' }}>📚</div>
                <div className="absolute bottom-1 left-1 sm:bottom-3 sm:left-3 lg:bottom-6 lg:left-6 text-xs sm:text-base lg:text-xl animate-bounce" style={{ animationDelay: '1s' }}>✨</div>
                <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 lg:bottom-4 lg:right-4 text-sm sm:text-lg lg:text-2xl animate-bounce" style={{ animationDelay: '1.5s' }}>🚀</div>

                {/* Welcome Message */}
                <div className={`text-center mb-4 sm:mb-6 transition-all duration-500 ${animationPhase >= 1 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                  <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-2 sm:mb-3 lg:mb-4 animate-pulse">🎯</div>
                  <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
                    Welcome to Paaṭha AI!
                  </h2>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-600">
                    Let's personalize your learning experience
                  </p>
                </div>

                {/* Role Selection Cards */}
                <div className={`space-y-3 sm:space-y-4 transition-all duration-500 ${animationPhase >= 2 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                  {/* Student Option */}
                  <button
                    onClick={() => handleRoleSelect('student')}
                    disabled={loading}
                    className="w-full p-3 sm:p-4 lg:p-6 border-2 border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start">
                      <div className="p-2 sm:p-3 bg-blue-100 rounded-full mr-3 sm:mr-4 group-hover:bg-blue-200 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-blue-700 transition-colors">
                          🎓 I'm a Student
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                          Join courses, take quizzes, and track your learning progress with AI-powered feedback.
                        </p>
                        <ul className="text-xs text-gray-500 space-y-0.5 sm:space-y-1">
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
                    className="w-full p-3 sm:p-4 lg:p-6 border-2 border-gray-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                  >
                    <div className="flex items-start">
                      <div className="p-2 sm:p-3 bg-green-100 rounded-full mr-3 sm:mr-4 group-hover:bg-green-200 transition-colors flex-shrink-0">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 mb-1 sm:mb-2 group-hover:text-green-700 transition-colors">
                          👨‍🏫 I'm a Teacher
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                          Create courses, design quizzes, and manage students with AI-generated questions.
                        </p>
                        <ul className="text-xs text-gray-500 space-y-0.5 sm:space-y-1">
                          <li>• Create and manage courses</li>
                          <li>• Design custom quizzes</li>
                          <li>• Use AI-generated questions</li>
                          <li>• Track student performance</li>
                        </ul>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Skip Option */}
                <div className={`text-center mt-4 sm:mt-6 transition-all duration-500 ${animationPhase >= 3 ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                  {/* <button
                    onClick={onClose}
                    className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading}
                  >
                    Skip for now (you can set this later in profile settings)
                  </button> */}
                </div>
              </div>
            )}
          </>
        ) : (
          /* Success Animation */
          <div className="relative z-10 text-center">
            {/* Confetti Rain */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(15)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-bounce text-xs sm:text-sm lg:text-base"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  {['🎉', '🎊', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
                </div>
              ))}
            </div>

            <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl mb-3 sm:mb-4 animate-pulse">
              {successData?.role === 'teacher' ? '👨‍🏫' : '🎓'}
            </div>

            <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-3 sm:mb-4 animate-pulse">
              Profile Setup Complete! 🎊
            </h2>
            
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm sm:text-base lg:text-lg font-bold py-2 sm:py-3 px-4 sm:px-6 rounded-xl mb-3 sm:mb-4 animate-bounce shadow-lg">
              Welcome, {successData?.role === 'teacher' ? 'Teacher' : 'Student'}!
            </div>
            
            <p className="text-xs sm:text-sm lg:text-base text-gray-600 mb-4 sm:mb-6">
              {successData?.message || 'Your personalized learning experience is now ready! 🚀'}
            </p>
            
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white text-sm sm:text-base font-semibold rounded-lg transition-all transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              Start Learning! 🎬
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Demo component to show usage
const RoleSelectionDemo = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<{ role: string; message: string } | null>(null);

  const handleRoleSelect = async (role: 'student' | 'teacher', additionalData?: any) => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('Selected role:', role);
    console.log('Additional data:', additionalData);
    
    // Show success animation
    setSuccessData({
      role,
      message: role === 'teacher' 
        ? 'Your teacher profile has been set up successfully!'
        : 'Your student profile is ready to go!'
    });
    setShowSuccess(true);
    setLoading(false);
  };

  const handleClose = () => {
    setShowPopup(false);
    setShowSuccess(false);
    setSuccessData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6 sm:mb-8">
          Role Selection Popup Demo
        </h1>
        <button
          onClick={() => setShowPopup(true)}
          className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm sm:text-base font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
        >
          Show Role Selection Popup
        </button>
      </div>

      <RoleSelectionPopup
        isOpen={showPopup}
        onRoleSelect={handleRoleSelect}
        onClose={handleClose}
        loading={loading}
        showSuccess={showSuccess}
        successData={successData}
      />
    </div>
  );
};

export default RoleSelectionPopup;