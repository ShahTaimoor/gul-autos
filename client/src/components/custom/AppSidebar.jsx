import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { logout } from "../../redux/slices/auth/authSlice";
import { fetchOrdersAdmin, fetchPendingOrderCount, updateOrderStatus } from "@/redux/slices/order/orderSlice";
import {
  FilePlus2Icon,
  ChartBarStacked,
  GalleryVerticalEnd,
  PackageSearch,
  ChartBar,
  UserCheck,
  ShoppingCart,
  UserCog,
  ImageIcon,
  LogOut,
  Settings,
  Bell,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "../ui/sidebar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useEffect, useState } from "react";
import { toast } from "sonner";


// Sidebar links with enhanced structure
const items = [
  { 
    title: "Products", 
    url: "/admin/dashboard/all-products", 
    icon: GalleryVerticalEnd, 
    description: "Manage Products",
    category: "main"
  },
  { 
    title: "Create Product", 
    url: "/admin/dashboard", 
    icon: FilePlus2Icon, 
    description: "Add New Product",
    category: "main"
  },
  { 
    title: "Categories", 
    url: "/admin/category", 
    icon: ChartBarStacked, 
    description: "Product Categories",
    category: "main"
  },
  { 
    title: "Media Library", 
    url: "/admin/dashboard/media", 
    icon: ImageIcon, 
    description: "Manage Assets",
    category: "main"
  },
  { 
    title: "Orders", 
    url: "/admin/dashboard/orders", 
    icon: PackageSearch, 
    showBadge: true, 
    description: "Order Management",
    category: "orders"
  },
  { 
    title: "Users", 
    url: "/admin/dashboard/users", 
    icon: UserCheck, 
    description: "User Management",
    category: "users"
  },
  { 
    title: "Customer View", 
    url: "/", 
    icon: ShoppingCart, 
    description: "View as Customer",
    category: "external"
  },
];

export function AppSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { orders } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);  // Loading state
  const pendingOrderCount = useSelector((state) => state.orders.pendingOrderCount);

  // Fetch orders after login
  useEffect(() => {
    if (user) {
      dispatch(fetchOrdersAdmin());
      dispatch(fetchPendingOrderCount());
    }
  }, [dispatch, user]);

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

  // Handle logout
  const handleLogout = async () => {
    setLoading(true);
    
    // Always clear local data first
    localStorage.removeItem("user");
    dispatch(logout());
    
    // Clear cookies on client side as fallback
    clearCookies();
    
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/logout`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      // Clear cookies again after server response
      clearCookies();
      navigate("/");
    } catch (error) {
      // Clear cookies again even if API fails
      clearCookies();
      // Even if API fails, user is already logged out locally
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    // ...existing code...
    await dispatch(updateOrderStatus({ orderId, status: newStatus, packerName: packer })).unwrap();
    toast.success(`Order marked as ${newStatus}`);
    dispatch(fetchPendingOrderCount());
  };

  if (message) {
    return (
      <div className="h-screen flex justify-center items-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <Sidebar className="shadow-xl border-r bg-slate-900 text-slate-100">
      {/* Modern Header with User Info */}
      <SidebarHeader className="p-6 border-b border-slate-800 bg-slate-900">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Admin Panel</h2>
          </div>
        </div>
        
        {/* User Profile Section */}
        {user && (
          <div className="mt-6 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
            <div className="flex items-center gap-3">
              <Avatar className="w-9 h-9 border border-slate-600">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-slate-700 text-slate-200 text-sm font-semibold">
                  {user.name?.charAt(0) || 'A'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-slate-100 font-medium text-sm truncate">{user.name || 'Admin'}</p>
                <p className="text-slate-400 text-xs truncate">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="p-4 bg-slate-900">
        {/* Main Navigation */}
        <SidebarGroup>
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Main Navigation</h3>
            <SidebarMenu className="space-y-1">
              {items.filter(item => item.category === 'main').map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group relative transition-all duration-200 rounded-lg mb-1 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3 p-2.5 w-full relative">
                        <Icon className={`w-5 h-5 transition-colors ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"
                        }`} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* Orders Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">Orders & Users</h3>
            <SidebarMenu className="space-y-1">
              {items.filter(item => item.category === 'orders' || item.category === 'users').map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group relative transition-all duration-200 rounded-lg mb-1 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3 p-2.5 w-full relative">
                        <Icon className={`w-5 h-5 transition-colors ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"
                        }`} />
                        <span className="text-sm font-medium">{item.title}</span>
                        
                        {/* Enhanced Badge for Orders */}
                        {item.showBadge && pendingOrderCount > 0 && (
                          <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold px-2 py-0.5 ml-auto border-0">
                            {pendingOrderCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>

          {/* External Links */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">External</h3>
            <SidebarMenu className="space-y-1">
              {items.filter(item => item.category === 'external').map((item) => {
                const isActive = pathname === item.url;
                const Icon = item.icon;

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`group relative transition-all duration-200 rounded-lg mb-1 ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md"
                          : "text-slate-400 hover:bg-slate-800 hover:text-slate-100"
                      }`}
                    >
                      <Link to={item.url} className="flex items-center gap-3 p-2.5 w-full relative">
                        <Icon className={`w-5 h-5 transition-colors ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-100"
                        }`} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </div>
        </SidebarGroup>
      </SidebarContent>

      {/* Modern Footer with Enhanced Logout */}
      <SidebarFooter className="p-4 border-t border-slate-800 bg-slate-900">
        <div className="space-y-2">
          {/* Admin Profile Link */}
          <Button
            asChild
            variant="ghost"
            className="w-full justify-start text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <Link to="/admin/profile" className="flex items-center gap-3">
              <UserCog className="w-4 h-4" />
              <span className="text-sm">Admin Profile</span>
            </Link>
          </Button>
          
          {/* Logout Button */}
          <Button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium shadow-sm transition-colors duration-200 border-0"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Logging out...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </div>
            )}
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
