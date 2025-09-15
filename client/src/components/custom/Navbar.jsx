import { Link } from "react-router-dom";
import { User, ShoppingCart } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import CartDrawer from "./CartDrawer";
import PWAInstallButton from "./PWAInstallButton";
import { useSelector } from "react-redux";
import { useRef } from "react";

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const cartItems = useSelector((state) => state.cart.items);
  const cartRef = useRef(null);

  // Calculate total cart quantity
  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);



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
        {/* Right side: PWA Install + Cart + Auth controls */}
        <div className="flex items-center gap-2">
          {/* PWA Install Button */}
          <PWAInstallButton />
          
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
