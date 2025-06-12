import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { logout } from "../../redux/slices/auth/authSlice";
import {
  FilePlus2Icon,
  ChartBarStacked,
  GalleryVerticalEnd,
  PackageSearch,
  ChartBar,
  UserCheck,
  ShoppingCart,
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
import { useState } from "react";

// Sidebar links
const items = [
  { title: "Products", url: "/admin/dashboard", icon: FilePlus2Icon },
  { title: "Create Category", url: "/admin/category", icon: ChartBarStacked },
  { title: "All Products", url: "/admin/dashboard/all-products", icon: GalleryVerticalEnd },
  { title: "Orders", url: "/admin/dashboard/orders", icon: PackageSearch, showBadge: true },
  { title: "Analytics", url: "/admin/dashboard/analytics", icon: ChartBar },
  { title: "Users", url: "/admin/dashboard/users", icon: UserCheck },
  { title: "Shop", url: "/", icon: ShoppingCart },
];

export function AppSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { orders } = useSelector((state) => state.orders);
  const [message, setMessage] = useState(null);

  // Filter pending orders safely
  const pendingOrderCount = orders?.filter(
    (o) =>
      typeof o.status === "string" &&
      o.status.toLowerCase() === "pending"
  ).length || 0;

  const handleLogout = async () => {
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/logout`, {
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      window.localStorage.removeItem("user");
      dispatch(logout());
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
      setMessage("An error occurred while logging out.");
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

              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className={`group relative transition-all duration-200 rounded-md ${
                      isActive ? "bg-zinc-100 text-primary font-medium" : "hover:bg-zinc-100"
                    }`}
                  >
                    <Link to={item.url} className="flex items-center gap-3 p-2 w-full relative">
                      <item.icon className="w-5 h-5 text-gray-700 group-hover:text-primary transition" />
                      <span className="text-sm">{item.title}</span>

                      {/* Pending Order Badge */}
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
        >
          Logout
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
