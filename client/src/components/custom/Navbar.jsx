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
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for the appinstalled event
    const handleAppInstalled = () => {
      setShowInstallButton(false);
      setDeferredPrompt(null);
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Only show navbar if user is logged in
  if (!user) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-md border-b border-white/30 shadow-md px-2 py-4 flex items-center justify-between h-15">
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
        {/* PWA Install Button - Always visible on mobile */}
        {isMobile && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-md hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-xs font-medium shadow-md"
            title="Install App on Home Screen"
          >
            <Smartphone size={14} />
            <span className="hidden sm:inline">Install</span>
          </button>
        )}

        {/* PWA Install Button for Desktop - only when available */}
        {!isMobile && showInstallButton && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-xs font-medium"
            title="Install App"
          >
            <Download size={14} />
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
