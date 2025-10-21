import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingCart, User, Package, Grid3x3, MessageCircle, Download, ChevronLeft, ChevronRight, LogOut } from "lucide-react";
import { useSelector } from "react-redux";
import { useIsMobile } from "../../hooks/use-mobile";
import { useState, useMemo, useEffect } from "react";
import { Badge } from "../ui/badge";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "../ui/dialog";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { removeFromCart, updateCartQuantity } from "../../redux/slices/cart/cartSlice";
import { logout } from "../../redux/slices/auth/authSlice";
import CartImage from "../ui/CartImage";
import Checkout from "../../pages/Checkout";

// Cart Product Component (simplified version for mobile)
const CartProduct = ({ product, quantity, onValidationChange }) => {
  const dispatch = useDispatch();
  const [inputQty, setInputQty] = useState(quantity);
  const { _id, title, price, stock } = product;
  const image = product.image || product.picture?.secure_url;

  const updateQuantity = (newQty) => {
    if (newQty !== quantity && newQty > 0 && newQty <= stock) {
      setInputQty(newQty);
      dispatch(updateCartQuantity({ productId: _id, quantity: newQty }));
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    dispatch(removeFromCart(_id));
    toast.success('Product removed from cart');
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (inputQty > 1) {
      updateQuantity(inputQty - 1);
    }
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (inputQty < stock) {
      updateQuantity(inputQty + 1);
    }
  };

  return (
    <div className="flex justify-between items-center gap-3 p-3 border-b">
      <div className="flex items-center gap-3">
        <CartImage
          src={image}
          alt={title}
          className="w-16 h-12 rounded-lg border object-cover"
          fallback="/fallback.jpg"
          quality={80}
        />
        <div className="max-w-[120px]">
          <h4 className="font-semibold text-xs text-gray-900 line-clamp-2">{title}</h4>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border rounded-full">
          <button
            onClick={handleDecrease}
            className="w-6 h-6 rounded-l-full flex items-center justify-center text-xs font-bold hover:bg-gray-200"
            disabled={inputQty <= 1}
          >
            −
          </button>
          <span className="w-8 text-center text-xs font-medium">{inputQty}</span>
          <button
            onClick={handleIncrease}
            className="w-6 h-6 rounded-r-full flex items-center justify-center text-xs font-bold hover:bg-gray-200"
            disabled={inputQty >= stock}
          >
            +
          </button>
        </div>
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-600 text-xs"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

const BottomNavigation = () => {
  const location = useLocation();
  const user = useSelector((state) => state.auth.user);
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  const isMobile = useIsMobile();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  // Calculate total quantity
  const totalQuantity = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  const handleBuyNow = () => {
    if (!user) {
      return navigate('/login');
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    setOpenCheckoutDialog(true);
  };

  // PWA Install functionality
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Only show install prompt if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches && 
          window.navigator.standalone !== true) {
        setShowInstallPrompt(true);
      }
    };

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          window.navigator.standalone === true) {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
      }
    };

    // Check if user has already dismissed the install prompt
    const hasUserDismissed = localStorage.getItem('pwa-install-dismissed');
    if (hasUserDismissed) {
      setShowInstallPrompt(false);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    checkIfInstalled();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstallPrompt(false);
        setDeferredPrompt(null);
        toast.success('App installed successfully!');
      } else {
        // User dismissed the install prompt, remember this choice
        localStorage.setItem('pwa-install-dismissed', 'true');
        setShowInstallPrompt(false);
      }
    } else {
      // Fallback for browsers that don't support beforeinstallprompt
      toast.info('To install this app, use your browser\'s menu and select "Add to Home Screen"');
    }
  };

  const handleDismissInstall = () => {
    localStorage.setItem('pwa-install-dismissed', 'true');
    setShowInstallPrompt(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success('Logged out successfully');
    navigate('/');
  };

  // Don't render on desktop
  if (!isMobile) return null;

  const navItems = [
    {
      path: "/",
      icon: null, // No icon, we'll use logo
      label: "Home",
      show: true,
      isLogo: true
    },
    {
      path: "/orders",
      icon: Package,
      label: "Orders",
      show: user !== null
    },
    {
      path: "/profile",
      icon: User,
      label: "Profile",
      show: user !== null
    }
  ];

  const actionItems = [
    {
      icon: LogOut,
      label: "Logout",
      show: user !== null,
      onClick: handleLogout,
      className: "text-red-600 hover:text-red-700 hover:bg-red-50"
    }
  ];

  const isActive = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
     

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          if (!item.show) return null;
          
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${
                active
                  ? "text-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-blue-600 hover:bg-gray-50"
              }`}
            >
              {item.isLogo ? (
                <div className={`w-6 h-6 rounded-full overflow-hidden transition-transform duration-200 ${
                  active ? "scale-110" : ""
                }`}>
                  <img 
                    src="/logo.jpeg" 
                    alt="Gul Autos" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <Icon 
                  size={20} 
                  className={`transition-transform duration-200 ${
                    active ? "scale-110" : ""
                  }`}
                />
              )}
              <span className={`text-xs font-medium mt-1 ${
                active ? "text-blue-600" : "text-gray-500"
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Action items (like logout) */}
        {actionItems.map((item) => {
          if (!item.show) return null;
          
          const Icon = item.icon;
          
          return (
            <button
              key={item.label}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 ${item.className || "text-gray-600 hover:text-blue-600 hover:bg-gray-50"}`}
            >
              <Icon 
                size={20} 
                className="transition-transform duration-200"
              />
              <span className="text-xs font-medium mt-1">
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Cart button - always visible */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-blue-600 hover:bg-gray-50">
              <div className="relative">
                <ShoppingCart size={20} />
                {totalQuantity > 0 && (
                  <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 bg-red-500 text-white border-0 min-w-[18px] h-[18px] flex items-center justify-center">
                    {totalQuantity}
                  </Badge>
                )}
              </div>
              <span className="text-xs font-medium mt-1 text-gray-500">
                Cart
              </span>
            </button>
          </SheetTrigger>
          <SheetContent className="w-full sm:w-[400px]">
            <SheetHeader>
              <SheetTitle className="text-lg font-bold">Your Cart</SheetTitle>
              <SheetDescription>Total Items: {totalQuantity}</SheetDescription>
            </SheetHeader>
            <div className="mt-4 max-h-[60vh] overflow-y-auto">
              {cartItems.length > 0 ? (
                cartItems.map((item) => (
                  <CartProduct
                    key={item.product._id}
                    product={item.product}
                    quantity={item.quantity}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500 py-6">Your cart is empty.</p>
              )}
            </div>
            <SheetFooter className="mt-6">
              <SheetClose asChild>
                <Button
                  onClick={handleBuyNow}
                  disabled={cartItems.length === 0}
                  className="w-full"
                >
                  Checkout
                </Button>
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Install button - only show when needed */}
        {showInstallPrompt && (
          <button
            onClick={handleInstall}
            className="flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 text-gray-600 hover:text-green-600 hover:bg-green-50"
          >
            <Download size={20} />
            <span className="text-xs font-medium mt-1 text-gray-500">
              Install
            </span>
          </button>
        )}
      </div>
      
      {/* Checkout Dialog */}
      <Dialog open={openCheckoutDialog} onOpenChange={setOpenCheckoutDialog}>
        <DialogContent className="w-full lg:max-w-6xl h-[62vh] sm:h-[70vh] sm:w-[60vw] overflow-hidden p-0 bg-white rounded-xl shadow-xl flex flex-col">
          <DialogHeader className="sr-only">
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your order</DialogDescription>
          </DialogHeader>
          <Checkout closeModal={() => setOpenCheckoutDialog(false)} />
        </DialogContent>
      </Dialog>
    </nav>
    </>
  );
};

export default BottomNavigation;
