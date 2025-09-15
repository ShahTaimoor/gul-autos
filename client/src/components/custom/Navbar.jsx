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
    const isInStandaloneMode = isStandalone || isInApp;
    
    console.log('Is standalone mode:', isStandalone);
    console.log('Is in app:', isInApp);
    console.log('Is in standalone mode:', isInStandaloneMode);
    
    if (isInStandaloneMode) {
      setShowInstallButton(false);
    } else {
      // Check if PWA is installable
      const checkPWAInstallability = async () => {
        try {
          // Check if service worker is registered
          const registration = await navigator.serviceWorker.getRegistration();
          const hasServiceWorker = !!registration;
          
          // Check if manifest is accessible
          const manifestResponse = await fetch('/manifest.webmanifest');
          const hasManifest = manifestResponse.ok;
          
          // Check if we're on a mobile device or have beforeinstallprompt support
          const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const hasBeforeInstallPrompt = 'onbeforeinstallprompt' in window;
          const isMobileWidth = window.innerWidth <= 768;
          
          const shouldShow = (isMobileDevice || isMobileWidth || hasBeforeInstallPrompt) && 
                           hasServiceWorker && 
                           hasManifest &&
                           !isInStandaloneMode;
          
          console.log('PWA Installability Check:');
          console.log('- Has Service Worker:', hasServiceWorker);
          console.log('- Has Manifest:', hasManifest);
          console.log('- Is Mobile Device:', isMobileDevice);
          console.log('- Is Mobile Width:', isMobileWidth);
          console.log('- Has BeforeInstallPrompt:', hasBeforeInstallPrompt);
          console.log('- Should Show Install Button:', shouldShow);
          
          setShowInstallButton(shouldShow);
        } catch (error) {
          console.error('Error checking PWA installability:', error);
          // Fallback: show install button for mobile devices
          const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const isMobileWidth = window.innerWidth <= 768;
          setShowInstallButton(isMobileDevice || isMobileWidth);
        }
      };
      
      checkPWAInstallability();
    }

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

    // Try direct installation methods
    await tryDirectInstall();
  };

  const tryDirectInstall = async () => {
    console.log('Attempting direct installation...');
    
    try {
      // For mobile, try to trigger the beforeinstallprompt event manually
      if (isMobile) {
        // Method 1: Try to trigger the beforeinstallprompt event
        const event = new Event('beforeinstallprompt');
        window.dispatchEvent(event);
        
        // Method 2: Try to trigger installation by adding PWA meta tags dynamically
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

        // Method 3: Try to trigger installation by creating a hidden iframe
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = window.location.href + '?install=iframe&timestamp=' + Date.now();
        document.body.appendChild(iframe);
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);

        // Method 4: Try to trigger installation by creating a new window (not tab)
        setTimeout(() => {
          const newWindow = window.open(window.location.href, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
          if (newWindow) {
            newWindow.focus();
            setTimeout(() => {
              try {
                newWindow.close();
              } catch (e) {
                console.log('Could not close window');
              }
            }, 2000);
          }
        }, 500);

        // Method 5: Try to trigger installation by creating a new tab
        setTimeout(() => {
          const newTab = window.open(window.location.href + '?install=tab&timestamp=' + Date.now(), '_blank');
          if (newTab) {
            newTab.focus();
            setTimeout(() => {
              try {
                newTab.close();
              } catch (e) {
                console.log('Could not close tab');
              }
            }, 1500);
          }
        }, 1000);

        // Method 6: Try to trigger installation by reloading the page with install parameters
        setTimeout(() => {
          const url = new URL(window.location.href);
          url.searchParams.set('install', 'true');
          url.searchParams.set('source', 'install_button');
          url.searchParams.set('timestamp', Date.now().toString());
          url.searchParams.set('force', 'true');
          
          // Try to navigate to trigger install
          window.location.href = url.toString();
        }, 2000);

      } else {
        // For desktop, try to trigger beforeinstallprompt by creating multiple windows
        for (let i = 0; i < 2; i++) {
          setTimeout(() => {
            const newWindow = window.open(window.location.href, '_blank', 'width=400,height=600,scrollbars=yes,resizable=yes');
            if (newWindow) {
              newWindow.focus();
              setTimeout(() => {
                try {
                  newWindow.close();
                } catch (e) {
                  console.log('Could not close window');
                }
              }, 1500);
            }
          }, i * 500);
        }
      }

    } catch (error) {
      console.error('Direct installation failed:', error);
      // Fallback: show a simple message
      alert('Installation initiated. Please follow your browser\'s prompts to complete the installation.');
    }
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

    </>
  );
};

export default Navbar;
