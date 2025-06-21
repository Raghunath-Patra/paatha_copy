// app/teacher/quizzes/[qId]/edit/page.tsx - FIXED VERSION
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSupabaseAuth } from '../../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../../utils/supabase';

interface Quiz {
  id: string;
  title: string;
  description?: string;
  total_marks: number;
  passing_marks: number;
  is_published: boolean;
  course_name: string;
  total_questions: number;
}

interface QuizQuestion {
  id: string;
  question_source: string;
  marks: number;
  order_index: number;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

interface NewQuestion {
  question_text: string;
  question_type: 'mcq' | 'short_answer' | 'essay';
  options: string[];
  correct_answer: string;
  explanation: string;
  marks: number;
}

// FIXED: Corrected interface to match backend response
interface SubjectInfo {
  code: string;
  name: string; // This IS the display name from backend
  type: string;
  shared_mapping?: {
    source_board: string;
    source_class: string;
    source_subject: string;
  };
  description?: string;
  icon?: string;
}

interface ClassInfo {
  code: string;
  display_name: string;
  subjects: SubjectInfo[];
}

interface BoardInfo {
  code: string;
  display_name: string;
  classes: {
    [key: string]: ClassInfo;
  };
}

interface SubjectConfig {
  boards: {
    [key: string]: BoardInfo;
  };
}

interface BrowseQuestion {
  id: string;
  question_text: string;
  type: string;
  difficulty: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
  topic?: string;
  bloom_level?: string;
  category?: string;
  metadata?: any;
}

interface QuestionFilters {
  board: string;
  class_level: string;
  subject: string;
  chapter?: string;
  difficulty?: string;
  question_type?: string;
  category?: string;
}

export default function QuizEditor() {
  const router = useRouter();
  const params = useParams();
  const quizId = params?.qId as string;
  const { user } = useSupabaseAuth();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [showQuestionBrowser, setShowQuestionBrowser] = useState(false);

  // Question Browser State
  const [subjectConfig, setSubjectConfig] = useState<SubjectConfig | null>(null);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [browseQuestions, setBrowseQuestions] = useState<BrowseQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [addingQuestions, setAddingQuestions] = useState(false);

  const [questionFilters, setQuestionFilters] = useState<QuestionFilters>({
    board: '',
    class_level: '',
    subject: '',
    chapter: '',
    difficulty: '',
    question_type: '',
    category: ''
  });

  const [newQuestion, setNewQuestion] = useState<NewQuestion>({
    question_text: '',
    question_type: 'mcq',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    marks: 1
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch quiz details and questions
  useEffect(() => {
    const fetchQuizData = async () => {
      if (!user || !quizId) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error('No session');

        // Fetch quiz details
        const quizResponse = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!quizResponse.ok) {
          throw new Error('Failed to fetch quiz details');
        }

        const quizData = await quizResponse.json();
        setQuiz(quizData);

        // Fetch questions
        const questionsResponse = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/questions`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });

        if (questionsResponse.ok) {
          const questionsData = await questionsResponse.json();
          setQuestions(questionsData);
        }

      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError('Failed to load quiz data');
      } finally {
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [user, quizId]);

  // Fetch subject configuration
  const fetchSubjectConfig = async () => {
    if (!user) return;

    setLoadingConfig(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/subjects-config`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subject configuration');
      }

      const configData = await response.json();
      console.log('Subject config received:', configData); // Debug log
      setSubjectConfig(configData);
    } catch (err) {
      console.error('Error fetching subject config:', err);
      setError('Failed to load subject configuration');
    } finally {
      setLoadingConfig(false);
    }
  };

  // Fetch questions based on filters
  const fetchQuestions = async () => {
    if (!user || !questionFilters.board || !questionFilters.class_level || !questionFilters.subject) {
      return;
    }

    setLoadingQuestions(true);
    setBrowseQuestions([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Build query parameters
      const params = new URLSearchParams();
      if (questionFilters.difficulty) params.append('difficulty', questionFilters.difficulty);
      if (questionFilters.question_type) params.append('type', questionFilters.question_type);
      if (questionFilters.category) params.append('category', questionFilters.category);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(
        `${API_URL}/api/teacher/question-browser/${questionFilters.board}/${questionFilters.class_level}/${questionFilters.subject}${queryString}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const questionsData = await response.json();
      setBrowseQuestions(questionsData.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!user || !quiz) return;

    // Validate question
    if (!newQuestion.question_text.trim()) {
      setError('Question text is required');
      return;
    }

    if (!newQuestion.correct_answer.trim()) {
      setError('Correct answer is required');
      return;
    }

    if (newQuestion.question_type === 'mcq') {
      const validOptions = newQuestion.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        setError('MCQ questions need at least 2 options');
        return;
      }
      if (!validOptions.includes(newQuestion.correct_answer.trim())) {
        setError('Correct answer must be one of the options');
        return;
      }
    }

    setSaving(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const questionData: {
        question_type: string;
        marks: number;
        order_index: number;
        custom_question_text: string;
        custom_question_type: string;
        custom_options: string[] | null;
        custom_correct_answer: string;
        custom_explanation: string | null;
      } = {
        question_type: 'custom',
        marks: newQuestion.marks,
        order_index: questions.length + 1,
        custom_question_text: newQuestion.question_text,
        custom_question_type: newQuestion.question_type,
        custom_options: newQuestion.question_type === 'mcq' 
          ? newQuestion.options.filter(opt => opt.trim()) 
          : null,
        custom_correct_answer: newQuestion.correct_answer,
        custom_explanation: newQuestion.explanation || null
      };

      const response: Response = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(questionData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add question');
      }

      const addedQuestion: any = await response.json();
      setQuestions([...questions, addedQuestion]);

      // Reset form
      setNewQuestion({
        question_text: '',
        question_type: 'mcq',
        options: ['', '', '', ''],
        correct_answer: '',
        explanation: '',
        marks: 1
      });
      setShowAddQuestion(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add question');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSelectedQuestions = async () => {
    if (!user || selectedQuestions.size === 0) return;

    setAddingQuestions(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const addedQuestions = [];

      for (const questionId of selectedQuestions) {
        const questionData = {
          question_type: 'ai_generated',
          ai_question_id: questionId,
          marks: 1, // Default marks, teacher can edit later
          order_index: questions.length + addedQuestions.length + 1
        };

        const response = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/questions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(questionData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to add question');
        }

        const addedQuestion: any = await response.json();
        addedQuestions.push(addedQuestion);
      }

      setQuestions([...questions, ...addedQuestions]);
      setSelectedQuestions(new Set());
      setShowQuestionBrowser(false);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add questions');
    } finally {
      setAddingQuestions(false);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!user || !confirm('Are you sure you want to delete this question?')) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}/questions/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete question');
      }

      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete question');
    }
  };

  const handlePublishQuiz = async () => {
    if (!user || !quiz) return;

    if (questions.length === 0) {
      setError('Add at least one question before publishing');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/teacher/quizzes/${quizId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_published: true })
      });

      if (!response.ok) {
        throw new Error('Failed to publish quiz');
      }

      setQuiz({ ...quiz, is_published: true });
      router.push(`/teacher/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish quiz');
    } finally {
      setPublishing(false);
    }
  };

  const updateNewQuestionField = (field: keyof NewQuestion, value: any) => {
    setNewQuestion(prev => ({ ...prev, [field]: value }));
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...newQuestion.options];
    newOptions[index] = value;
    setNewQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setNewQuestion(prev => ({ 
      ...prev, 
      options: [...prev.options, ''] 
    }));
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length <= 2) return;
    const newOptions = newQuestion.options.filter((_, i) => i !== index);
    setNewQuestion(prev => ({ ...prev, options: newOptions }));
  };

  const handleOpenQuestionBrowser = () => {
    setShowQuestionBrowser(true);
    if (!subjectConfig) {
      fetchSubjectConfig();
    }
  };

  const handleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">Quiz not found</p>
          <button 
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/teacher/quizzes')}
                className="text-gray-600 hover:text-gray-900"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                <p className="text-sm text-gray-600">{quiz.course_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {questions.length} questions
              </div>
              {quiz.is_published ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Published
                </span>
              ) : (
                <button
                  onClick={handlePublishQuiz}
                  disabled={publishing || questions.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {publishing ? 'Publishing...' : 'Publish Quiz'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Quiz Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-medium text-gray-900">
                  Question {index + 1} ({question.marks} mark{question.marks !== 1 ? 's' : ''})
                </h3>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-gray-900 mb-2">{question.question_text}</p>
                  <div className="flex items-center space-x-2">
                    <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {question.question_type.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                      {question.question_source === 'ai_generated' ? 'AI Generated' : 'Custom'}
                    </span>
                  </div>
                </div>

                {question.options && question.options.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                    <ul className="space-y-1">
                      {question.options.map((option, optIndex) => (
                        <li 
                          key={optIndex}
                          className={`p-2 rounded ${
                            option === question.correct_answer 
                              ? 'bg-green-50 border border-green-200' 
                              : 'bg-gray-50'
                          }`}
                        >
                          {option}
                          {option === question.correct_answer && (
                            <span className="ml-2 text-green-600 text-sm">✓ Correct</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {question.question_type !== 'mcq' && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                    <p className="text-gray-900 bg-green-50 p-2 rounded">{question.correct_answer}</p>
                  </div>
                )}

                {question.explanation && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">Explanation:</p>
                    <p className="text-gray-600">{question.explanation}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Add Question Options */}
          <div className="flex space-x-4">
            {/* Browse Questions Button */}
            <button
              onClick={handleOpenQuestionBrowser}
              className="flex-1 py-8 border-2 border-dashed border-blue-300 rounded-lg text-blue-600 hover:border-blue-400 hover:text-blue-800 bg-blue-50"
            >
              <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Existing Questions
            </button>

            {/* Add Custom Question Button */}
            {showAddQuestion ? (
              <div className="flex-1 bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Question</h3>
                
                <div className="space-y-6">
                  {/* Question Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={newQuestion.question_type}
                      onChange={(e) => updateNewQuestionField('question_type', e.target.value)}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="mcq">Multiple Choice (MCQ)</option>
                      <option value="short_answer">Short Answer</option>
                      <option value="essay">Essay/Long Answer</option>
                    </select>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Text <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={newQuestion.question_text}
                      onChange={(e) => updateNewQuestionField('question_text', e.target.value)}
                      rows={4}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your question here..."
                    />
                  </div>

                  {/* MCQ Options */}
                  {newQuestion.question_type === 'mcq' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {newQuestion.options.map((option, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(index, e.target.value)}
                              className="flex-1 p-2 border rounded focus:ring-2 focus:ring-blue-500"
                              placeholder={`Option ${index + 1}`}
                            />
                            {newQuestion.options.length > 2 && (
                              <button
                                onClick={() => removeOption(index)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          onClick={addOption}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          + Add Option
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Correct Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Correct Answer <span className="text-red-500">*</span>
                    </label>
                    {newQuestion.question_type === 'mcq' ? (
                      <select
                        value={newQuestion.correct_answer}
                        onChange={(e) => updateNewQuestionField('correct_answer', e.target.value)}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select correct option</option>
                        {newQuestion.options.filter(opt => opt.trim()).map((option, index) => (
                          <option key={index} value={option}>{option}</option>
                        ))}
                      </select>
                    ) : (
                      <textarea
                        value={newQuestion.correct_answer}
                        onChange={(e) => updateNewQuestionField('correct_answer', e.target.value)}
                        rows={newQuestion.question_type === 'essay' ? 4 : 2}
                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter the correct answer..."
                      />
                    )}
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Explanation (Optional)
                    </label>
                    <textarea
                      value={newQuestion.explanation}
                      onChange={(e) => updateNewQuestionField('explanation', e.target.value)}
                      rows={3}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Explain why this is the correct answer..."
                    />
                  </div>

                  {/* Marks */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marks
                    </label>
                    <input
                      type="number"
                      value={newQuestion.marks}
                      onChange={(e) => updateNewQuestionField('marks', parseInt(e.target.value) || 1)}
                      min="1"
                      max="100"
                      className="w-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => setShowAddQuestion(false)}
                      className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddQuestion}
                      disabled={saving}
                      className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {saving ? 'Adding...' : 'Add Question'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddQuestion(true)}
                className="flex-1 py-8 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-800"
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Custom Question
              </button>
            )}
          </div>
        </div>

        {/* Quiz Summary */}
        {questions.length > 0 && (
          <div className="mt-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-2">Quiz Summary</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p>Total Questions: {questions.length}</p>
              <p>Total Marks: {questions.reduce((sum, q) => sum + q.marks, 0)}</p>
              <p>Passing Marks: {quiz.passing_marks}</p>
              <p>Status: {quiz.is_published ? 'Published' : 'Draft'}</p>
            </div>
          </div>
        )}
      </div>

      {/* Question Browser Modal */}
      {showQuestionBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-6xl h-5/6 overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900">Browse Questions</h2>
                <button
                  onClick={() => setShowQuestionBrowser(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto h-full">
              {/* Debug: Show loading state */}
              {loadingConfig && (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading configuration...</p>
                </div>
              )}

              {/* Filters */}
              <div className="mb-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Board Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Board</label>
                    <select
                      value={questionFilters.board}
                      onChange={(e) => setQuestionFilters(prev => ({ 
                        ...prev, 
                        board: e.target.value, 
                        class_level: '', 
                        subject: '' 
                      }))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={loadingConfig}
                    >
                      <option value="">Select Board</option>
                      {subjectConfig?.boards && Object.entries(subjectConfig.boards).map(([code, boardInfo]) => (
                        <option key={code} value={code}>{boardInfo.display_name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Class Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                    <select
                      value={questionFilters.class_level}
                      onChange={(e) => setQuestionFilters(prev => ({ 
                        ...prev, 
                        class_level: e.target.value, 
                        subject: '' 
                      }))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!questionFilters.board}
                    >
                      <option value="">Select Class</option>
                      {questionFilters.board && subjectConfig?.boards[questionFilters.board]?.classes && 
                        Object.entries(subjectConfig.boards[questionFilters.board].classes).map(([code, classInfo]) => (
                          <option key={code} value={code}>{classInfo.display_name}</option>
                        ))}
                    </select>
                  </div>

                  {/* Subject Selection - FIXED: Use subject.name instead of subject.display_name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <select
                      value={questionFilters.subject}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, subject: e.target.value }))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      disabled={!questionFilters.class_level}
                    >
                      <option value="">Select Subject</option>
                      {questionFilters.board && questionFilters.class_level && 
                        subjectConfig?.boards[questionFilters.board]?.classes[questionFilters.class_level]?.subjects?.map((subject) => (
                          <option key={subject.code} value={subject.code}>
                            {subject.name} {/* FIXED: Use subject.name instead of subject.display_name */}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Additional Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                    <select
                      value={questionFilters.difficulty}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Difficulties</option>
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                    <select
                      value={questionFilters.question_type}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, question_type: e.target.value }))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Types</option>
                      <option value="MCQ">Multiple Choice</option>
                      <option value="Short Answer">Short Answer</option>
                      <option value="Long Answer">Long Answer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={questionFilters.category}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">All Categories</option>
                      <option value="generated">Generated</option>
                      <option value="in_chapter">In-Chapter</option>
                      <option value="exercise">Exercise</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={fetchQuestions}
                      disabled={!questionFilters.board || !questionFilters.class_level || !questionFilters.subject || loadingQuestions}
                      className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loadingQuestions ? 'Loading...' : 'Search Questions'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Questions Count */}
              {selectedQuestions.size > 0 && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg flex justify-between items-center">
                  <span className="text-blue-800">
                    {selectedQuestions.size} question{selectedQuestions.size !== 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleAddSelectedQuestions}
                    disabled={addingQuestions}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {addingQuestions ? 'Adding...' : 'Add Selected Questions'}
                  </button>
                </div>
              )}

              {/* Questions List */}
              <div className="space-y-4">
                {loadingQuestions ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p>Loading questions...</p>
                  </div>
                ) : browseQuestions.length > 0 ? (
                  browseQuestions.map((question) => (
                    <div key={question.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedQuestions.has(question.id)}
                          onChange={() => handleQuestionSelection(question.id)}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              {question.type}
                            </span>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                              {question.difficulty}
                            </span>
                            {question.category && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                                {question.category}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 mb-2">{question.question_text}</p>
                          {question.options && question.options.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <strong>Options:</strong> {question.options.join(', ')}
                            </div>
                          )}
                          <div className="text-sm text-gray-600">
                            <strong>Answer:</strong> {question.correct_answer}
                          </div>
                          {question.explanation && (
                            <div className="text-sm text-gray-600">
                              <strong>Explanation:</strong> {question.explanation}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {questionFilters.board && questionFilters.class_level && questionFilters.subject 
                      ? "No questions found for the selected criteria." 
                      : "Select board, class, and subject to browse questions."
                    }
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}