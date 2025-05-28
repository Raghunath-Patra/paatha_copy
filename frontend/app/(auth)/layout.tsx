// frontend/app/(auth)/layout.tsx

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Global auth styles */}
      <style jsx global>{`
        /* Enhanced animations for auth pages */
        @keyframes authFadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes authSlideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes authGlow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.1);
          }
          50% {
            box-shadow: 0 0 40px rgba(239, 68, 68, 0.2);
          }
        }
        
        /* Auth form animations */
        .auth-fade-in {
          animation: authFadeIn 0.6s ease-out forwards;
        }
        
        .auth-slide-in {
          animation: authSlideIn 0.5s ease-out forwards;
        }
        
        .auth-glow {
          animation: authGlow 3s ease-in-out infinite;
        }
        
        /* Custom scrollbar for auth pages */
        .auth-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .auth-scrollbar::-webkit-scrollbar-track {
          background: rgba(253, 186, 116, 0.1);
          border-radius: 3px;
        }
        
        .auth-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #dc2626, #ea580c);
          border-radius: 3px;
        }
        
        .auth-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #b91c1c, #c2410c);
        }
        
        /* Focus styles for auth forms */
        .auth-input:focus {
          outline: none;
          ring: 2px;
          ring-color: rgba(239, 68, 68, 0.5);
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }
        
        /* Auth button styles */
        .auth-button {
          background: linear-gradient(135deg, #dc2626, #ea580c, #d97706);
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        
        .auth-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
        }
        
        .auth-button:active {
          transform: translateY(0);
        }
        
        .auth-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
          transition: left 0.5s;
        }
        
        .auth-button:hover::before {
          left: 100%;
        }
      `}</style>
      
      <div className="auth-scrollbar">
        {children}
      </div>
    </>
  );
}