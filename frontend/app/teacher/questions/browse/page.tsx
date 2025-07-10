// app/teacher/questions/browse/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../../contexts/SupabaseAuthContext';
import { supabase } from '../../../utils/supabase';

// Static board structure
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
  chapter?: number;
  metadata?: any;
}

interface QuestionFilters {
  board: string;
  class_level: string;
  subject: string;
  chapter?: number;
  difficulty?: string;
  question_type?: string;
  category?: string;
  search?: string;
}

type ViewMode = 'grid' | 'list';

export default function QuestionBrowser() {
  const router = useRouter();
  const { user } = useSupabaseAuth();

  // Core state
  const [questions, setQuestions] = useState<BrowseQuestion[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectInfo[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectInfo | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showFilters, setShowFilters] = useState(true);
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  // Filters
  const [filters, setFilters] = useState<QuestionFilters>({
    board: '',
    class_level: '',
    subject: '',
    chapter: undefined,
    difficulty: '',
    question_type: '',
    category: '',
    search: ''
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  // Fetch subjects for selected board and class
  const fetchSubjects = async (board: string, classLevel: string) => {
    if (!user || !board || !classLevel) return;

    setLoadingSubjects(true);
    setAvailableSubjects([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch(`${API_URL}/api/subjects/${board}/${classLevel}`, {
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
      setError('Failed to load subjects');
    } finally {
      setLoadingSubjects(false);
    }
  };

  // Fetch questions based on filters
  const fetchQuestions = async () => {
    if (!user || !filters.board || !filters.class_level || !filters.subject) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.question_type) params.append('type', filters.question_type);
      if (filters.category) params.append('category', filters.category);
      if (filters.chapter) params.append('chapter', filters.chapter.toString());
      if (filters.search) params.append('search', filters.search);

      const queryString = params.toString() ? `?${params.toString()}` : '';
      
      const response = await fetch(
        `${API_URL}/api/teacher/question-browser/${filters.board}/${filters.class_level}/${filters.subject}${queryString}`,
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

      const data = await response.json();
      setQuestions(data.questions || []);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  // Handle filter changes
  const updateFilter = (key: keyof QuestionFilters, value: any) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset dependent filters
      if (key === 'board') {
        newFilters.class_level = '';
        newFilters.subject = '';
        newFilters.chapter = undefined;
        setAvailableSubjects([]);
        setSelectedSubject(null);
      } else if (key === 'class_level') {
        newFilters.subject = '';
        newFilters.chapter = undefined;
        setSelectedSubject(null);
        if (newFilters.board && value) {
          fetchSubjects(newFilters.board, value);
        } else {
          setAvailableSubjects([]);
        }
      } else if (key === 'subject') {
        newFilters.chapter = undefined;
        const subject = availableSubjects.find(s => s.code === value) || null;
        setSelectedSubject(subject);
      }
      
      return newFilters;
    });
  };

  // Handle question selection
  const toggleQuestionSelection = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAllQuestions = () => {
    setSelectedQuestions(new Set(questions.map(q => q.id)));
  };

  const clearSelection = () => {
    setSelectedQuestions(new Set());
  };

  // Export functionality
  const exportQuestions = () => {
    if (selectedQuestions.size === 0) {
      setError('Please select questions to export');
      return;
    }

    const selectedQuestionsData = questions.filter(q => selectedQuestions.has(q.id));
    const dataStr = JSON.stringify(selectedQuestionsData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `questions_${filters.board}_${filters.class_level}_${filters.subject}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Render question card
  const renderQuestionCard = (question: BrowseQuestion) => {
    const isSelected = selectedQuestions.has(question.id);
    const isExpanded = expandedQuestion === question.id;

    return (
      <div
        key={question.id}
        className={`border rounded-lg p-4 transition-all duration-200 ${
          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleQuestionSelection(question.id)}
            className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <div className="flex-1 min-w-0">
            {/* Question metadata */}
            <div className="flex items-center space-x-2 mb-2 flex-wrap">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                {question.type}
              </span>
              <span className={`px-2 py-1 text-xs rounded font-medium ${
                question.difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                question.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {question.difficulty}
              </span>
              {question.category && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded">
                  {question.category}
                </span>
              )}
              {question.chapter && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                  Chapter {question.chapter}
                </span>
              )}
              {question.bloom_level && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                  {question.bloom_level}
                </span>
              )}
            </div>

            {/* Question text */}
            <div className="mb-3">
              <p className="text-gray-900 leading-relaxed">
                {isExpanded ? question.question_text : 
                 question.question_text.length > 200 ? 
                 question.question_text.substring(0, 200) + '...' : 
                 question.question_text}
              </p>
              {question.question_text.length > 200 && (
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : question.id)}
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                >
                  {isExpanded ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Options for MCQ */}
            {question.options && question.options.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Options:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm ${
                        option === question.correct_answer
                          ? 'bg-green-50 border border-green-200 text-green-800'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                      {option === question.correct_answer && (
                        <span className="ml-2 text-green-600">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Correct answer for non-MCQ */}
            {question.type !== 'MCQ' && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">Correct Answer:</p>
                <p className="text-gray-900 bg-green-50 p-2 rounded text-sm">
                  {question.correct_answer}
                </p>
              </div>
            )}

            {/* Explanation */}
            {question.explanation && (
              <div className="mb-3">
                <p className="text-sm font-medium text-gray-700">Explanation:</p>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {question.explanation}
                </p>
              </div>
            )}

            {/* Topic */}
            {question.topic && (
              <div className="text-sm text-gray-500">
                <strong>Topic:</strong> {question.topic}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/teacher/dashboard')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Question Browser</h1>
                <p className="text-gray-600">Explore and manage your question bank</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* View mode toggle */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
                  title="List view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
                  title="Grid view"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
              </div>

              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters</h2>
            
            {/* Primary filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              {/* Board */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Board</label>
                <select
                  value={filters.board}
                  onChange={(e) => updateFilter('board', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Board</option>
                  {Object.entries(BOARD_STRUCTURE).map(([code, boardInfo]) => (
                    <option key={code} value={code}>{boardInfo.display_name}</option>
                  ))}
                </select>
              </div>

              {/* Class */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                <select
                  value={filters.class_level}
                  onChange={(e) => updateFilter('class_level', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!filters.board}
                >
                  <option value="">Select Class</option>
                  {filters.board && BOARD_STRUCTURE[filters.board as keyof typeof BOARD_STRUCTURE] && 
                    Object.entries(BOARD_STRUCTURE[filters.board as keyof typeof BOARD_STRUCTURE].classes).map(([code, classInfo]) => (
                      <option key={code} value={code}>{classInfo.display_name}</option>
                    ))}
                </select>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <select
                  value={filters.subject}
                  onChange={(e) => updateFilter('subject', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={!filters.class_level || loadingSubjects}
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
              </div>
            </div>

            {/* Chapter filter */}
            {selectedSubject && selectedSubject.chapters && selectedSubject.chapters.length > 0 && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Chapter</label>
                <select
                  value={filters.chapter || ''}
                  onChange={(e) => updateFilter('chapter', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full md:w-1/3 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Chapters</option>
                  {selectedSubject.chapters.map((chapter) => (
                    <option key={chapter.number} value={chapter.number}>
                      Chapter {chapter.number}: {chapter.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Search and additional filters */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={filters.search || ''}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder="Search questions..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty</label>
                <select
                  value={filters.difficulty || ''}
                  onChange={(e) => updateFilter('difficulty', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={filters.question_type || ''}
                  onChange={(e) => updateFilter('question_type', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="MCQ">MCQ</option>
                  <option value="Short Answer">Short Answer</option>
                  <option value="Long Answer">Long Answer</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All</option>
                  <option value="generated">Generated</option>
                  <option value="in_chapter">In-Chapter</option>
                  <option value="exercise">Exercise</option>
                </select>
              </div>

              {/* Search button */}
              <div className="flex items-end">
                <button
                  onClick={fetchQuestions}
                  disabled={!filters.board || !filters.class_level || !filters.subject || loading}
                  className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </div>
                  ) : (
                    'Search'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Results header */}
        {questions.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center space-x-4">
                <p className="text-gray-600">
                  {questions.length} question{questions.length !== 1 ? 's' : ''} found
                </p>
                {selectedQuestions.size > 0 && (
                  <p className="text-blue-600 font-medium">
                    {selectedQuestions.size} selected
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {questions.length > 0 && (
                  <>
                    <button
                      onClick={selectAllQuestions}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      Clear Selection
                    </button>
                    <button
                      onClick={exportQuestions}
                      disabled={selectedQuestions.size === 0}
                      className="px-3 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Export Selected
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Questions grid/list */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading questions...</p>
          </div>
        ) : questions.length > 0 ? (
          <div className={`space-y-4 ${viewMode === 'grid' ? 'md:grid md:grid-cols-2 md:gap-6 md:space-y-0' : ''}`}>
            {questions.map(renderQuestionCard)}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-4">
              {filters.board && filters.class_level && filters.subject
                ? "Try adjusting your filters to find more questions."
                : "Select board, class, and subject to browse questions."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}