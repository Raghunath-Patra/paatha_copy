// app/components/common/InstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';

export default function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show our custom install prompt
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);
  
  const handleInstallClick = () => {
    // Hide the prompt
    setShowPrompt(false);
    
    // Show the browser install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the saved prompt
      setDeferredPrompt(null);
    });
  };
  
  const dismissPrompt = () => {
    setShowPrompt(false);
    // Save to localStorage to not show again for a while
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="fixed bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-4 flex items-center justify-between">
      <div>
        <h3 className="font-medium">Install Paaṭha AI</h3>
        <p className="text-sm text-gray-600">Add to your home screen for a better experience</p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={dismissPrompt}
          className="px-3 py-1 text-gray-600"
        >
          Not now
        </button>
        <button 
          onClick={handleInstallClick}
          className="px-3 py-1 bg-blue-600 text-white rounded"
        >
          Install
        </button>
      </div>
    </div>
  );
}