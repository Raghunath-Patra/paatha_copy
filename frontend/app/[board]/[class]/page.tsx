// frontend/app/[board]/[class]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navigation from '../../components/navigation/Navigation';
import SubjectProgress from '../../components/progress/SubjectProgress';
import { getAuthHeaders } from '../../utils/auth';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { Home } from 'lucide-react';

interface Subject {
  name: string;
  code: string; // Make code required
  chapters: Array<{
    number: number;
    name: string;
  }>;
}

// Define a mapping for better display names
const BOARD_DISPLAY_NAMES: Record<string, string> = {
  'cbse': 'CBSE',
  'karnataka': 'Karnataka State Board'
};

const CLASS_DISPLAY_NAMES: Record<string, string> = {
  'viii': 'Class VIII',
  'ix': 'Class IX',
  'x': 'Class X',
  'xi': 'Class XI',
  'xii': 'Class XII',
  '8th': '8th Class',
  '9th': '9th Class',
  '10th': '10th Class',
  'puc-1': 'PUC-I',
  'puc-2': 'PUC-II'
};

export default function ClassPage() {
  const params = useParams();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [progress, setProgress] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { profile, loading: authLoading } = useSupabaseAuth();
  
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (authLoading) return;
        if (!profile) {
          console.log('No profile, redirecting to login');
          router.push('/login');
          return;
        }

        setLoading(true);
        setError(null);

        console.log('Fetching data for:', params);
        const authHeaders = await getAuthHeaders();
        if (!authHeaders.isAuthorized) {
          console.log('No auth headers, redirecting to login');
          router.push('/login');
          return;
        }

        // Fetch subjects
        const subjectsResponse = await fetch(
          `${API_URL}/api/subjects/${params.board}/${params.class}`,
          { headers: authHeaders.headers }
        );

        if (!subjectsResponse.ok) {
          throw new Error('Failed to fetch subjects');
        }

        const subjectsData = await subjectsResponse.json();
        console.log('Fetched subjects:', subjectsData);
        setSubjects(subjectsData.subjects);

        // Fetch progress
        try {
          const progressResponse = await fetch(
            `${API_URL}/api/progress/user/${params.board}/${params.class}`,
            { headers: authHeaders.headers }
          );

          if (progressResponse.ok) {
            const progressData = await progressResponse.json();
            console.log('Fetched progress:', progressData);
            setProgress(progressData.progress || {});
          }
        } catch (progressError) {
          console.warn('Progress fetch error:', progressError);
          setProgress({});
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    if (params.board && params.class) {
      fetchData();
    }
  }, [API_URL, params.board, params.class, router, profile, authLoading]);

  const board = typeof params.board === 'string' ? params.board.toLowerCase() : '';
  const classLevel = typeof params.class === 'string' ? params.class.toLowerCase() : '';
  
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-red-600 bg-red-50 p-4 rounded-lg max-w-md text-center">
          <h3 className="font-medium mb-2">Error Loading Data</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Get friendly display names for board and class
  const boardDisplayName = BOARD_DISPLAY_NAMES[board] || board?.toUpperCase() || '';
  const classDisplayName = CLASS_DISPLAY_NAMES[classLevel] || classLevel?.toUpperCase() || '';

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-medium">
              {boardDisplayName} {classDisplayName}
            </h1>
            <div className="flex items-center gap-4">
              <Navigation />
            </div>
          </div>
          
          <div className="max-w-5xl mx-auto overflow-y-auto">
            <SubjectProgress
              board={board}
              classLevel={classLevel}
              subjects={subjects}
              progress={progress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}