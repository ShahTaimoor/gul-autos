import { Link } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import { User } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import { useSelector } from "react-redux";
import { useRef } from "react";

const Navbar = () => {
  const user = useSelector((state) => state.auth.user);
  const cartRef = useRef(null);
 
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/40 backdrop-blur-md border-b border-white/30 shadow-md px-6 py-2 flex items-center justify-between">
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

      {/* Right side: Cart + Auth controls */}
      <div className="flex items-center gap-4">
      

       

      
        {user == null ? (
          <Link
            to="/login"
            className="p-1.5 rounded-full hover:bg-white/70 transition"
          >
            <User size={26} strokeWidth={1.4} className="text-gray-700" />
          </Link>
        ) : (
          <LogoutToggle user={user} />
        )}
      </div>
    </nav>
  );
};

export default Navbar;
