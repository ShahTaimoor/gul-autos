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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-md border-b border-white/30 shadow-md px-2 py-2 flex items-center justify-between">
      {/* Left side: Logo + contact */}
      <div className="flex items-start flex-col">
        <Link to="/">
          <img
            src="/logos.png"
            alt="Logo"
            className="h-8 w-auto object-contain"
          />
        </Link>
        <p className="text-xs text-gray-700 mt-1 font-medium">
          Contact: +92 311 4000096
        </p>
      </div>
      <div>
        {/* PWA Install Button - Always visible on mobile */}
        {isMobile && (
          <button
            onClick={handleInstallClick}
            className="flex items-center mr-10 gap-1.5 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
            title="Install App on Home Screen"
          >
            <Smartphone size={16} />
            <span className="hidden sm:inline">Install App</span>
            <span className="sm:hidden">Install</span>
          </button>
        )}

        {/* PWA Install Button for Desktop - only when available */}
        {!isMobile && showInstallButton && (
          <button
            onClick={handleInstallClick}
            className="flex items-center mr-10 gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm font-medium"
            title="Install App"
          >
            <Download size={16} />
            <span>Install</span>
          </button>
        )}
      </div>
      {/* Right side: PWA Install + Auth controls */}
      <div className="flex items-center gap-3">
        {user == null ? (
          <Link
            to="/login"
            className="p-1.5 rounded-full hover:bg-white/70 transition"
          >
            <h1 className="text-gray-700 text-bold hover:text-gray-400">Login</h1>
          </Link>
        ) : (
          <LogoutToggle user={user} />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
