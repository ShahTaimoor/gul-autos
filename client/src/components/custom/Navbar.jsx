import { Link } from "react-router-dom";
import { User, Download, Smartphone, ShoppingCart } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import CartDrawer from "./CartDrawer";
import { useSelector } from "react-redux";
import { useRef, useState, useEffect } from "react";

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);
  const cartRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showCustomInstallPrompt, setShowCustomInstallPrompt] = useState(false);

  // Calculate total cart quantity
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      console.log('Mobile check:', mobile, 'Width:', window.innerWidth, 'User Agent:', navigator.userAgent);
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
    console.log('Is standalone mode:', isStandalone);
    console.log('Is in app:', isInApp);
    
    if (isStandalone || isInApp) {
      setShowInstallButton(false);
    } else {
      // Always show install button for mobile devices
      // For desktop, show if beforeinstallprompt is supported or if we're in development
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const shouldShow = isMobileDevice || 
                        window.innerWidth <= 768 || 
                        'onbeforeinstallprompt' in window || 
                        process.env.NODE_ENV === 'development';
      
      console.log('Should show install button:', shouldShow);
      console.log('Window width:', window.innerWidth);
      console.log('Is mobile device:', isMobileDevice);
      console.log('Is mobile width:', window.innerWidth <= 768);
      
      if (shouldShow) {
        setShowInstallButton(true);
      }
    }

    // Debug PWA support
    console.log('Service Worker support:', 'serviceWorker' in navigator);
    console.log('BeforeInstallPrompt support:', 'onbeforeinstallprompt' in window);
    console.log('Current showInstallButton state:', showInstallButton);
    console.log('Current isMobile state:', isMobile);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleInstallClick = async () => {
    console.log('Install button clicked');
    console.log('Deferred prompt available:', !!deferredPrompt);
    console.log('Is mobile:', isMobile);
    console.log('User agent:', navigator.userAgent);

    // Check if we have a deferred prompt (Chrome, Edge, etc.)
    if (deferredPrompt) {
      try {
        console.log('Showing deferred prompt');
        // Show the install prompt
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

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

    // Show custom install prompt immediately
    setShowCustomInstallPrompt(true);

    // Try multiple installation methods in background
    const tryInstallMethods = () => {
      // Method 1: Try to trigger beforeinstallprompt by creating a new window
      const newWindow = window.open(window.location.href, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
      if (newWindow) {
        newWindow.focus();
        // Close after a short delay
        setTimeout(() => {
          newWindow.close();
        }, 3000);
      }

      // Method 2: Try to trigger installation by adding PWA meta tags dynamically
      const metaTags = [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'application-name', content: 'Gul Autos' }
      ];

      metaTags.forEach(tag => {
        let existingTag = document.querySelector(`meta[name="${tag.name}"]`);
        if (!existingTag) {
          existingTag = document.createElement('meta');
          existingTag.name = tag.name;
          document.head.appendChild(existingTag);
        }
        existingTag.content = tag.content;
      });

      // Method 3: Try to trigger installation by reloading with install parameters
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('install', 'true');
        url.searchParams.set('source', 'install_button');
        url.searchParams.set('timestamp', Date.now().toString());
        
        // Try to navigate to trigger install
        window.location.href = url.toString();
      }, 1000);
    };

    // Execute installation methods
    tryInstallMethods();
  };

  const handleCustomInstallConfirm = () => {
    setShowCustomInstallPrompt(false);
    
    // Try multiple aggressive installation methods
    const forceInstall = () => {
      // Method 1: Try to trigger beforeinstallprompt by creating multiple windows
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          const newWindow = window.open(window.location.href, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
          if (newWindow) {
            newWindow.focus();
            setTimeout(() => newWindow.close(), 2000);
          }
        }, i * 500);
      }

      // Method 2: Add all possible PWA meta tags
      const metaTags = [
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'application-name', content: 'Gul Autos' },
        { name: 'msapplication-TileColor', content: '#000000' },
        { name: 'msapplication-tap-highlight', content: 'no' }
      ];

      metaTags.forEach(tag => {
        let existingTag = document.querySelector(`meta[name="${tag.name}"]`);
        if (!existingTag) {
          existingTag = document.createElement('meta');
          existingTag.name = tag.name;
          document.head.appendChild(existingTag);
        }
        existingTag.content = tag.content;
      });

      // Method 3: Try to trigger installation by reloading with install parameters
      setTimeout(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('install', 'true');
        url.searchParams.set('source', 'custom_prompt');
        url.searchParams.set('timestamp', Date.now().toString());
        url.searchParams.set('force', 'true');
        
        // Try to navigate to trigger install
        window.location.href = url.toString();
      }, 1500);
    };

    forceInstall();
  };

  const handleCustomInstallCancel = () => {
    setShowCustomInstallPrompt(false);
  };

  // Only show navbar if user is logged in
  if (!user) {
    return null;
  }

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-white/30 shadow-lg px-2 py-4 flex items-center justify-between h-16">
        {/* Left side: Logo + contact */}
        <div className="flex items-center gap-3">
          <Link to="/">
            <img
              src="/logos.png"
              alt="Logo"
              className="h-6 w-auto object-contain"
            />
          </Link>
          <p className="text-xs text-gray-700 font-medium hidden sm:block">
            Contact: +92 311 4000096
          </p>
        </div>
        <div>
          {/* PWA Install Button - Show when available */}
          {showInstallButton && (
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
              <span>Install</span>
            </button>
          )}
        </div>
        {/* Right side: Cart + Auth controls */}
        <div className="flex items-center gap-2">
          {/* Cart - Always visible */}
          <div className="relative">
            <CartDrawer />
          </div>
          
          {/* Auth controls */}
          {user == null ? (
            <Link
              to="/login"
              className="px-2 py-1 rounded-md hover:bg-white/70 transition text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Login
            </Link>
          ) : (
            <LogoutToggle user={user} />
          )}
        </div>
      </nav>

      {/* Custom Install Prompt Modal */}
      {showCustomInstallPrompt && (
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
                  onClick={handleCustomInstallCancel}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCustomInstallConfirm}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Install Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
