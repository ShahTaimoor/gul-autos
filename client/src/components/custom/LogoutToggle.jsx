import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import axios from "axios";
import { logout } from "../../redux/slices/auth/authSlice";

const ToggleLogout = ({ user }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleLogout = () => {
        axios
            .get(`${import.meta.env.VITE_API_URL}/logout`, {
                withCredentials: true,
                headers: { "Content-Type": "application/json" },
            })
            .then((response) => {
                // Clear user data from localStorage
                window.localStorage.removeItem('user');

                // Dispatch the logout action to clear user data from Redux store
                dispatch(logout());

                // Redirect to the login page
                navigate('/login');
            })
            .catch((error) => {
                // In case of error, still clear the localStorage
                window.localStorage.removeItem('user');
                const errorMessage = error.response?.data || 'Logout failed, please try again.';
                console.error(errorMessage);
            });
    };

    return (
        <div>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Avatar>
                        <AvatarFallback className="cursor-pointer">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'} {/* Default to 'U' */}
                        </AvatarFallback>
                    </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>
                        {user?.role === 1 ? (
                            <Link to='/admin/dashboard'>Admin Dashboard</Link>
                        ) : (
                            <Link to='/profile'>Profile</Link>
                        )}
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>

                    <DropdownMenuItem>
                        <Link to="/orders">My Orders</Link>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
};

export default ToggleLogout;
