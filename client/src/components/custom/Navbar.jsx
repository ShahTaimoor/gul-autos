import { Link } from "react-router-dom";
import { User, Download, ShoppingCart } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import CartDrawer from "./CartDrawer";
import InstallPrompt from "./InstallPrompt";
import { useSelector } from "react-redux";
import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);
  const cartRef = useRef(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Calculate total cart quantity
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  useEffect(() => {
    // Check if user is on mobile
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = window.navigator.standalone === true;
    
    if (!isStandalone && !isInApp) {
      // Show install button for mobile devices or if PWA is supported
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const shouldShow = isMobileDevice || window.innerWidth <= 768 || 'onbeforeinstallprompt' in window;
      
      if (shouldShow) {
        setShowInstallButton(true);
      }
    }

    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  const handleInstallClick = () => {
    setShowInstallPrompt(true);
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

        {/* Center: Install Button */}
        {showInstallButton && (
          <div className="flex-1 flex justify-center">
            <Button
              onClick={handleInstallClick}
              size="sm"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-md"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          </div>
        )}

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

      {/* Install Prompt Modal */}
      <InstallPrompt 
        isOpen={showInstallPrompt} 
        onClose={() => setShowInstallPrompt(false)} 
      />
    </>
  );
};

export default Navbar;