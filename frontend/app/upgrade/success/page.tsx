// File: frontend/app/upgrade/success/page.tsx

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navigation from '../../components/navigation/Navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  
  // Redirect back to home after a delay
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      window.location.href = '/';
    }, 10000);
    
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
            
            <h1 className="text-2xl font-medium mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">
              Your premium subscription has been activated!            </p>
            
            <div className="space-y-4">
              <Link 
                href="/"
                className="block w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Continue to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}