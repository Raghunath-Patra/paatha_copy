// frontend/app/try/page.tsx
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '../components/common/Logo';

export default function TryPage() {
  const router = useRouter();
  
  // Automatically redirect to the challenge page
  useEffect(() => {
    router.push('/try/challenge');
  }, [router]);
  
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center">
      <div className="container-fluid px-8 py-6 text-center">
        <div className="mx-auto w-full max-w-md">
          {/* Logo */}
          <div className="flex items-center justify-center mb-8">
            <Logo className="h-12 w-12" showText={true} />
          </div>
          
          {/* Loading state while redirecting */}
          <h1 className="text-2xl font-semibold mb-6">Loading Challenge...</h1>
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto"></div>
          
          <p className="mt-4 text-gray-600">
            Preparing your 3-question challenge...
          </p>
        </div>
      </div>
    </div>
  );
}