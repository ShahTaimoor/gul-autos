import { Link } from "react-router-dom";
import { User, Download, Smartphone } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import { useSelector } from "react-redux";
import { useRef, useState, useEffect } from "react";

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const cartRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/40 shadow-lg px-4 py-3 flex items-center justify-between ${isMobile ? 'hidden' : 'block'}`}>
      {/* Left side: Logo + contact */}
      <div className="flex items-center gap-6">
        <Link to="/" className="group">
          <div className="relative">
            <img
              src="/logo.jpeg"
              alt="GULTRADERS Logo"
              className="h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        </Link>
        <div className="hidden md:block">
          <p className="text-sm text-gray-700 font-semibold">
            Contact: <span className="text-blue-600 font-bold">+92 311 4000096</span>
          </p>
          <p className="text-xs text-gray-500 font-medium">
            CAR ACCESSORIES
          </p>
        </div>
      </div>

      {/* Center: PWA Install Button */}
      <div className="flex-1 flex justify-center">
        {/* PWA Install Button - Always visible on mobile */}
        {isMobile && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm font-bold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
            title="Install App on Home Screen"
          >
            <Smartphone size={18} />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* PWA Install Button for Desktop - only when available */}
        {!isMobile && showInstallButton && (
          <button
            onClick={handleInstallClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Install App"
          >
            <Download size={16} />
            <span>Install App</span>
          </button>
        )}
      </div>

      {/* Right side: Auth controls */}
      <div className="flex items-center gap-3">
        {user == null ? (
          <Link
            to="/login"
            className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
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
