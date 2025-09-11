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

  // Calculate total cart quantity
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      console.log('Mobile check:', mobile, 'Width:', window.innerWidth);
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
      const shouldShow = window.innerWidth <= 768 || 
                        'onbeforeinstallprompt' in window || 
                        process.env.NODE_ENV === 'development';
      
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
    // Check if we have a deferred prompt (Chrome, Edge, etc.)
    if (deferredPrompt) {
      try {
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

    // For browsers that don't support beforeinstallprompt (Safari, some mobile browsers)
    // Try to trigger installation through other means
    if (isMobile) {
      // For iOS Safari - this will show the "Add to Home Screen" option
      if (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')) {
        // iOS Safari - show native add to home screen
        window.location.href = 'data:text/html,<script>window.close()</script>';
        return;
      }
      
      // For Android Chrome - try to trigger install banner
      if (navigator.userAgent.includes('Chrome')) {
        // Force refresh to potentially trigger install banner
        window.location.reload();
        return;
      }
    }

    // For desktop browsers without beforeinstallprompt
    // Try to open in a new window to trigger install prompt
    const newWindow = window.open(window.location.href, '_blank', 'width=400,height=600');
    if (newWindow) {
      newWindow.focus();
    }
  };

  // Only show navbar if user is logged in
  if (!user) {
    return null;
  }

  return (
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
  );
};

export default Navbar;
