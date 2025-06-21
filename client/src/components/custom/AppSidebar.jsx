import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { logout } from "../../redux/slices/auth/authSlice";
import { fetchOrdersAdmin } from "@/redux/slices/order/orderSlice";
import {
  FilePlus2Icon,
  ChartBarStacked,
  GalleryVerticalEnd,
  PackageSearch,
  ChartBar,
  UserCheck,

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
import { useEffect, useState } from "react";

// Sidebar links
const items = [
  { title: "Products", url: "/admin/dashboard", icon: FilePlus2Icon },
  { title: "Create Category", url: "/admin/category", icon: ChartBarStacked },
  { title: "All Products", url: "/admin/dashboard/all-products", icon: GalleryVerticalEnd },
  { title: "Orders", url: "/admin/dashboard/orders", icon: PackageSearch, showBadge: true },
  { title: "Analytics", url: "/admin/dashboard/analytics", icon: ChartBar },
  { title: "Users", url: "/admin/dashboard/users", icon: UserCheck },
  
];

export function AppSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { orders } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);  // Loading state

  // Fetch orders after login
  useEffect(() => {
    if (user) {
      dispatch(fetchOrdersAdmin());
    }
  }, [dispatch, user]);

  // Count pending orders safely
  const pendingOrderCount =
    Array.isArray(orders) && orders.length > 0
      ? orders.filter((o) => o?.status?.toLowerCase() === "pending").length
      : 0;

  // Handle logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/logout`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      localStorage.removeItem("user");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setMessage("An error occurred while logging out.");
    } finally {
      setLoading(false);
    }
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
    <Sidebar className="shadow-lg border-r bg-white">
      <SidebarHeader className="p-4 border-b">
        <h2 className="text-xl font-bold text-gray-800">Admin Panel</h2>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {items.map((item) => {
              const isActive = pathname === item.url;
              const Icon = item.icon;

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`group relative transition-all duration-200 rounded-md ${
                      isActive
                        ? "bg-zinc-100 text-primary font-semibold"
                        : "hover:bg-zinc-100"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3 p-2 w-full relative">
                      <Icon className="w-5 h-5 text-gray-700 group-hover:text-primary transition" />
                      <span className="text-sm">{item.title}</span>

                      {/* Show badge if item is orders and pending orders exist */}
                      {item.showBadge && pendingOrderCount > 0 && (
                        <span className="absolute right-2 top-2 animate-bounce inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-black rounded-full shadow-md">
                          {pendingOrderCount}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t">
        <Button
          onClick={handleLogout}
          className="w-full bg-black text-white font-semibold"
          disabled={loading}  // Disable button while loading
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              {/* You can use any spinner or icon component here */}
              <div className="w-4 h-4 border-2 border-t-2 border-gray-300 rounded-full animate-spin"></div> Logging out...
            </div>
          ) : (
            "Logout"
          )}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
