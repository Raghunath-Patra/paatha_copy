// Path: frontend/app/(auth)/forgot-password/page.tsx
'use client';

import PasswordResetRequest from '../../components/auth/PasswordResetRequest';

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <PasswordResetRequest />
    </div>
  );
}