// File: frontend/app/video-generator/page.tsx (Enhanced Landing Page)
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

// Hero Section Component - Responsive and constrained width
const HeroSection = ({ onCreateNew }: { onCreateNew: () => void }) => {
  const encouragingTexts = [
    "Transform your ideas into stunning videos",
    "Create educational content in minutes",
    "AI-powered video generation at your fingertips",
    "Bring your stories to life with AI",
    "Generate engaging educational videos effortlessly"
  ];

  return (
    <div className="w-full max-w-7xl mx-auto text-center py-12 lg:py-16 px-4 sm:px-6 lg:px-8 mb-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">
          Create Amazing Videos with{' '}
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
            AI Magic
          </span>
        </h1>
        
        <div className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed min-h-[2rem]">
          <AnimatedText 
            texts={encouragingTexts}
            className="font-medium text-blue-600"
          />
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">🎬 Video Generator</h1>
          <div className="flex items-center space-x-4">
            <CreditDisplay userBalance={userBalance} onClick={handleCreditsClick} />
            <Navigation />
          </div>
        </div>

        {/* Always show the main hero section */}
        <HeroSection onCreateNew={handleCreateNew} />
        
        {/* Projects section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <VideoProjectBrowser
            projects={projects}
            setProjects={setProjects}
            onProjectAction={handleProjectAction}
            onCreateNew={handleCreateNew}
          />
        </div>
      </div>
    </div>
  );
}