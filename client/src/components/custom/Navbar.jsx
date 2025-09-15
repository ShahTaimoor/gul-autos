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
  const [showInstallModal, setShowInstallModal] = useState(false);

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
      console.log('Deferred prompt set:', !!e);
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
      console.log('App already installed, hiding install button');
      setShowInstallButton(false);
    } else {
      // Show install button for all devices - let the browser handle the installation
      console.log('App not installed, showing install button');
      setShowInstallButton(true);
    }

    // Debug PWA support
    console.log('Service Worker support:', 'serviceWorker' in navigator);
    console.log('BeforeInstallPrompt support:', 'onbeforeinstallprompt' in window);
    console.log('Current showInstallButton state:', showInstallButton);
    console.log('Current isMobile state:', isMobile);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Fallback: Show install button after a delay if beforeinstallprompt hasn't fired
    const fallbackTimer = setTimeout(() => {
      if (!deferredPrompt && !isStandalone && !isInApp) {
        console.log('Fallback: Showing install button after timeout');
        setShowInstallButton(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkMobile);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstallClick = () => {
    console.log('Install button clicked');
    setShowInstallModal(true);
  };

  const handleInstallConfirm = async () => {
    console.log('Install confirmed');
    console.log('Deferred prompt available:', !!deferredPrompt);
    setShowInstallModal(false);

    // Check if we have a deferred prompt (Chrome, Edge, etc.)
    if (deferredPrompt) {
      try {
        console.log('Showing native install prompt');
        // Show the install prompt
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

    // Fallback for browsers that don't support beforeinstallprompt
    if (isMobile) {
      // For mobile Safari, show instructions
      alert('To install this app on your device:\n\n1. Tap the Share button\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add"');
    } else {
      // For desktop browsers, try to trigger installation
      alert('To install this app:\n\n1. Look for the install icon in your browser\'s address bar\n2. Or go to the browser menu and look for "Install" or "Add to Home Screen"');
    }
  };

  const handleInstallCancel = () => {
    console.log('Install cancelled');
    setShowInstallModal(false);
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
              <span>Install App</span>
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

export default Navbar;
