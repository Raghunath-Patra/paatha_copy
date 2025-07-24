'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Navigation from '../components/navigation/Navigation';
import EnhancedSpinner from '../components/common/EnhancedSpinner';
import { getAuthHeaders } from '../utils/auth';
import VideoProjectBrowser from './components/video-generator/VideoProjectBrowser';

// Define the Project interface
interface Project {
  projectId: string;
  title: string;
  createdAt: string;
  status: string;
  lessonStepsCount: number;
  speakers: string[];
  visualFunctions: string[];
  hasVideo: boolean;
  videoFiles: string[];
}

interface UserBalance {
  available_credits: number;
  current_package: {
    name: string;
    total_credits: number;
  } | null;
  purchased_at: string | null;
}

// Skeleton Loading Components
const ProjectCardSkeleton = () => (
  <div className="bg-white p-6 rounded-lg shadow-sm border animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
      <div className="h-8 w-8 bg-gray-200 rounded"></div>
    </div>
    <div className="space-y-2 mb-4">
      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
    </div>
    <div className="flex space-x-2">
      <div className="h-8 bg-gray-200 rounded w-16"></div>
      <div className="h-8 bg-gray-200 rounded w-16"></div>
    </div>
  </div>
);

const ProjectGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
    {[...Array(6)].map((_, i) => (
      <ProjectCardSkeleton key={i} />
    ))}
  </div>
);

// Credit Display Component
const CreditDisplay = ({ userBalance, onClick }: { userBalance: UserBalance | null, onClick: () => void }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  if (!userBalance) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm">
          <div className="w-4 h-4 bg-gray-200 rounded-full"></div>
          <div className="w-16 h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 border hover:border-blue-300 group"
    >
      <div className="w-4 h-4 bg-blue-100 rounded-full flex items-center justify-center">
        <svg className="w-2.5 h-2.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      </div>
      <div className="text-left">
        <div className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
          {formatNumber(userBalance.available_credits)} Credits
        </div>
        {userBalance.current_package && (
          <div className="text-xs text-gray-500">
            {userBalance.current_package.name}
          </div>
        )}
      </div>
      <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
};

// Animated Text Component
const AnimatedText = ({ texts, className = "" }: { texts: string[], className?: string }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % texts.length);
        setIsVisible(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, [texts.length]);

  return (
    <span className={`inline-block transition-all duration-300 ${isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'} ${className}`}>
      {texts[currentIndex]}
    </span>
  );
};

// Hero Section Component - Always show the main hero
const HeroSection = ({ onCreateNew }: { onCreateNew: () => void }) => {
  const encouragingTexts = [
    "Transform your ideas into stunning videos",
    "Create educational content in minutes",
    "AI-powered video generation at your fingertips",
    "Bring your stories to life with AI",
    "Generate engaging educational videos effortlessly"
  ];

  return (
    <div className="text-center py-16 px-8 mb-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          Create Amazing Videos with{' '}
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            AI Magic
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          <AnimatedText 
            texts={encouragingTexts}
            className="font-medium text-blue-600"
          />
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start Creating</span>
          </button>
          
          <div className="flex items-center space-x-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>No experience required</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Creation</h3>
            <p className="text-gray-600">Advanced AI transforms your ideas into professional videos automatically</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Minutes, Not Hours</h3>
            <p className="text-gray-600">Generate complete videos in minutes instead of spending days editing</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Professional Quality</h3>
            <p className="text-gray-600">Studio-quality output ready for any platform or presentation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VideoGeneratorPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user balance
  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;

        const balanceResponse = await fetch(`${API_URL}/api/video-credits/balance`, { headers });
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserBalance(balanceData);
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      fetchUserBalance();
    }
  }, [user, authLoading, API_URL]);

  const handleProjectAction = (projectId: string, action: string) => {
    switch (action) {
      case 'edit':
        router.push(`/video-generator/${projectId}/edit`);
        break;
      case 'play':
        router.push(`/video-generator/${projectId}/play`);
        break;
      case 'download':
        router.push(`/video-generator/${projectId}/download`);
        break;
      case 'continue':
        router.push(`/video-generator/${projectId}/continue`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleCreateNew = () => {
    router.push('/video-generator/create');
  };

  const handleCreditsClick = () => {
    router.push('/video-generator/video-credits');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message="Loading video generator..." />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎬 Video Generator</h1>
          <div className="flex items-center space-x-4">
            <CreditDisplay userBalance={userBalance} onClick={handleCreditsClick} />
            <Navigation />
          </div>
        </div>

        {/* Always show the main hero section */}
        <HeroSection onCreateNew={handleCreateNew} />
        
        {/* Projects section with loading states */}
        {projectsLoading ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
              </div>
              <ProjectGridSkeleton />
            </div>
          </div>
        ) : projects.length > 0 ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Your Video Projects</h2>
                <button
                  onClick={handleCreateNew}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>New Project</span>
                </button>
              </div>
              <VideoProjectBrowser
                projects={projects}
                setProjects={setProjects}
                onProjectAction={handleProjectAction}
                onCreateNew={handleCreateNew}
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}) {
    return (
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-8 rounded-xl mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="mb-6 md:mb-0">
            <h2 className="text-3xl font-bold mb-2">Welcome back! 🎬</h2>
            <p className="text-blue-100 text-lg">
              <AnimatedText texts={encouragingTexts} />
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Create New Video</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center py-16 px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
          Create Amazing Videos with{' '}
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            AI Magic
          </span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
          <AnimatedText 
            texts={encouragingTexts}
            className="font-medium text-blue-600"
          />
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <button
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center space-x-2"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M19 10a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Start Creating</span>
          </button>
          
          <div className="flex items-center space-x-2 text-gray-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>No experience required</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">AI-Powered Creation</h3>
            <p className="text-gray-600">Advanced AI transforms your ideas into professional videos automatically</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Minutes, Not Hours</h3>
            <p className="text-gray-600">Generate complete videos in minutes instead of spending days editing</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Professional Quality</h3>
            <p className="text-gray-600">Studio-quality output ready for any platform or presentation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function VideoGeneratorPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useSupabaseAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [projectsLoading, setProjectsLoading] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // Fetch user balance
  useEffect(() => {
    const fetchUserBalance = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;

        const balanceResponse = await fetch(`${API_URL}/api/video-credits/balance`, { headers });
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserBalance(balanceData);
        }
      } catch (error) {
        console.error('Error fetching user balance:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user && !authLoading) {
      fetchUserBalance();
    }
  }, [user, authLoading, API_URL]);

  const handleProjectAction = (projectId: string, action: string) => {
    switch (action) {
      case 'edit':
        router.push(`/video-generator/${projectId}/edit`);
        break;
      case 'play':
        router.push(`/video-generator/${projectId}/play`);
        break;
      case 'download':
        router.push(`/video-generator/${projectId}/download`);
        break;
      case 'continue':
        router.push(`/video-generator/${projectId}/continue`);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleCreateNew = () => {
    router.push('/video-generator/create');
  };

  const handleCreditsClick = () => {
    router.push('/video-generator/video-credits');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
        <EnhancedSpinner size="lg" message="Loading video generator..." />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎬 Video Generator</h1>
          <div className="flex items-center space-x-4">
            <CreditDisplay userBalance={userBalance} onClick={handleCreditsClick} />
            <Navigation />
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="animate-pulse">
              <div className="h-64 bg-gradient-to-r from-gray-200 to-gray-300"></div>
              <ProjectGridSkeleton />
            </div>
          </div>
        ) : (
          <>
            <HeroSection onCreateNew={handleCreateNew} hasProjects={projects.length > 0} />
            
            {projects.length > 0 && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <VideoProjectBrowser
                  projects={projects}
                  setProjects={setProjects}
                  onProjectAction={handleProjectAction}
                  onCreateNew={handleCreateNew}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}