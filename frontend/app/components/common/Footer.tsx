'use client';

import Link from 'next/link';
import Logo from './Logo'; // Assuming the Logo component is in the same directory

export default function Footer() {
  return (
    <footer className="bg-white border-t py-4 mt-auto">
      <div className="container-fluid px-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-6 w-6" showText={false} />
              <span className="font-medium text-sm">Paaṭha AI</span>
            </Link>
            <div className="text-sm text-gray-600 flex items-center">
              <span className="hidden sm:inline mx-2">•</span>
              © {new Date().getFullYear()} KRIONX LABS LLP. All rights reserved.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}