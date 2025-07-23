'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/navigation/Navigation';

export default function VideoCreditsSuccessPage() {
  const router = useRouter();
  
  // Redirect back to credits page after delay
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      router.push('/video-credits');
    }, 5000);
    
    return () => clearTimeout(redirectTimer);
  }, [router]);
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-end mb-8">
            <Navigation />
          </div>
          
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-medium mb-2">Credits Added Successfully!</h1>
            <p className="text-gray-600 mb-6">
              Your video generation credits have been added to your account.
            </p>
            
            <div className="space-y-4">
              <Link 
                href="/video-credits"
                className="block w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                View My Credits
              </Link>
              
              <Link 
                href="/video-generation"
                className="block w-full py-2 px-4 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                Generate Video
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              Redirecting to credits page in 5 seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}