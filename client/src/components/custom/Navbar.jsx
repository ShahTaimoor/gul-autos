import { Link } from "react-router-dom";
import { User, Download, Smartphone, ShoppingCart } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import { useSelector } from "react-redux";
import { useRef, useState, useEffect, useMemo } from "react";
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
import { Dialog, DialogContent } from "../ui/dialog";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { removeFromCart, updateCartQuantity } from "../../redux/slices/cart/cartSlice";
import CartImage from "../ui/CartImage";
import Checkout from "../../pages/Checkout";

// Cart Product Component
const CartProduct = ({ product, quantity }) => {
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
        <div className="max-w-[200px]">
          <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{title}</h4>
          <p className="text-xs text-gray-500">Rs. {price}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 border rounded-full">
          <button
            onClick={handleDecrease}
            className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold hover:bg-gray-200"
            disabled={inputQty <= 1}
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-medium">{inputQty}</span>
          <button
            onClick={handleIncrease}
            className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold hover:bg-gray-200"
            disabled={inputQty >= stock}
          >
            +
          </button>
        </div>
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-600 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

const Navbar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  const cartRef = useRef(null);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);

  // Calculate total quantity
  const totalQuantity = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  useEffect(() => {
    // Check if user is on mobile/tablet (< 1024px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
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

    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

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

  return (
    <>
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

      {/* Right side: Cart + Auth controls */}
      <div className="flex items-center gap-3">
        {/* Cart Icon */}
        <Sheet>
          <SheetTrigger asChild>
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-all duration-200">
              <ShoppingCart size={24} className="text-gray-700" />
              {totalQuantity > 0 && (
                <Badge className="absolute -top-1 -right-1 text-xs px-1.5 py-0.5 bg-red-500 text-white border-0 min-w-[20px] h-[20px] flex items-center justify-center">
                  {totalQuantity}
                </Badge>
              )}
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

    {/* Checkout Dialog */}
    <Dialog open={openCheckoutDialog} onOpenChange={setOpenCheckoutDialog}>
      <DialogContent className="w-full lg:max-w-6xl h-[62vh] sm:h-[70vh] sm:w-[60vw] overflow-hidden p-0 bg-white rounded-xl shadow-xl flex flex-col">
        <Checkout closeModal={() => setOpenCheckoutDialog(false)} />
      </DialogContent>
    </Dialog>
    </>
  );
};

export default Navbar;
