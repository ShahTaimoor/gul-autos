import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useState } from "react";
import { Home, LayoutDashboard, User, ShoppingBag, LogOut, ChevronDown, ChevronUp } from "lucide-react";
import axios from "axios";
import { logout } from "../../redux/slices/auth/authSlice";
import { useToast } from "@/hooks/use-toast";

const ToggleLogout = ({ user }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);

    const clearCookies = () => {
        const cookies = ['accessToken', 'refreshToken'];
        const domains = [window.location.hostname, 'localhost', '127.0.0.1'];
        const paths = ['/', '/api', '/admin'];
        
        cookies.forEach(cookieName => {
            domains.forEach(domain => {
                paths.forEach(path => {
                    // Clear with different combinations
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path};`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain};`;
                    document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=.${domain};`;
                    document.cookie = `${cookieName}=; max-age=0; path=${path};`;
                    document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=${domain};`;
                    document.cookie = `${cookieName}=; max-age=0; path=${path}; domain=.${domain};`;
                });
            });
        });
    };

    const handleLogout = () => {
        // Always clear local data first
        window.localStorage.removeItem('user');
        dispatch(logout());
        
        // Clear cookies on client side as fallback
        clearCookies();
        
        // Then try to logout from server
        axios
            .get(`${import.meta.env.VITE_API_URL}/logout`, {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            })
            .then((response) => {
                // Clear cookies again after server response
                clearCookies();
                toast.success('Logged out successfully');
                // Stay on home page
                navigate('/');
            })
            .catch((error) => {
                // Clear cookies again even if API fails
                clearCookies();
                toast.success('Logged out successfully');
                // Even if API fails, user is already logged out locally
                // Stay on home page
                navigate('/');
            });
    };

    const isAdmin = user?.role === 1 || user?.role === 2;

    return (
        <div>
        {/* Mobile: Avatar dropdown */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar>
                <AvatarFallback className="cursor-pointer">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(isAdmin ? '/admin/profile' : '/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/orders')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
  
        {/* Desktop: Dropdown menu */}
        <div className="hidden md:block">
          <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors">
                <User className="h-4 w-4 mr-2" />
                {user?.name || 'Menu'}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 ml-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 ml-2" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => navigate('/')}>
                <Home className="h-4 w-4 mr-2" />
                Home
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => navigate(isAdmin ? '/admin/profile' : '/profile')}>
                <User className="h-4 w-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/orders')}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                My Orders
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleLogout}
                className="text-red-600 focus:text-red-600 focus:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

      </div>
    );
};

export default ToggleLogout;
