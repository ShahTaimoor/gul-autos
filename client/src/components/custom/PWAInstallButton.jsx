import React, { useState, useEffect } from 'react';
import { Download, Smartphone } from 'lucide-react';

const PWAInstallButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('beforeinstallprompt event fired');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      console.log('PWA was installed');
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = window.navigator.standalone === true;
    
    console.log('PWA Detection:', {
      isStandalone,
      isInApp,
      userAgent: navigator.userAgent,
      serviceWorker: 'serviceWorker' in navigator,
      beforeInstallPrompt: 'onbeforeinstallprompt' in window
    });
    
    if (isStandalone || isInApp) {
      console.log('App already installed, hiding install button');
      setShowInstallButton(false);
    } else {
      console.log('App not installed, showing install button');
      setShowInstallButton(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback: Show install button after a delay if beforeinstallprompt hasn't fired
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && !isInApp) {
        console.log('Fallback: Showing install button after timeout');
        setShowInstallButton(true);
      }
    }, 2000);

    // Additional fallback: Try to trigger beforeinstallprompt by creating a small window
    const triggerPromptTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && !isInApp) {
        console.log('Trying to trigger beforeinstallprompt...');
        // Try to trigger the event by opening a small window
        const popup = window.open(window.location.href, '_blank', 'width=1,height=1');
        if (popup) {
          popup.close();
        }
      }
    }, 1000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkMobile);
      clearTimeout(fallbackTimer);
      clearTimeout(triggerPromptTimer);
    };
  }, [deferredPrompt]);

  const handleInstallClick = () => {
    setShowInstallModal(true);
  };

  const handleInstallConfirm = async () => {
    setShowInstallModal(false);

    if (deferredPrompt) {
      try {
        console.log('Showing native install prompt');
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log('Install prompt outcome:', outcome);
        if (outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setShowInstallButton(false);
        } else {
          console.log('User dismissed the install prompt');
        }
      } catch (error) {
        console.error('Error showing install prompt:', error);
      }
      
      setDeferredPrompt(null);
      return;
    }

    // If no deferred prompt, try to trigger it by refreshing the page
    console.log('No deferred prompt available, trying to trigger it...');
    
    // Try to trigger the beforeinstallprompt event
    const triggerInstall = () => {
      // Method 1: Try to open a new window to trigger the event
      const newWindow = window.open(window.location.href, '_blank', 'width=400,height=600');
      if (newWindow) {
        newWindow.focus();
        setTimeout(() => newWindow.close(), 2000);
      }
      
      // Method 2: Try to reload with install parameters
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('install', 'true');
        url.searchParams.set('timestamp', Date.now().toString());
        window.location.href = url.toString();
      }, 1000);
    };

    triggerInstall();
  };

  const handleInstallCancel = () => {
    setShowInstallModal(false);
  };

  if (!showInstallButton) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1 px-3 py-2 text-white rounded-md transition-all duration-200 text-xs font-medium shadow-md ${
          isMobile 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' 
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
        title={isMobile ? "Install App on Home Screen" : "Install App"}
      >
        {isMobile ? <Smartphone size={14} /> : <Download size={14} />}
        <span>Install App</span>
      </button>

      {/* Custom Install Modal */}
      {showInstallModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl p-6 mx-4 max-w-sm w-full">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Download className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Install Gul Autos App
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                {isMobile 
                  ? "Install this app on your device for a better experience. You'll be able to access it from your home screen."
                  : "Install this app on your computer for quick access and better performance."
                }
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleInstallCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInstallConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Install
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallButton;