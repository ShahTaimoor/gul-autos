import { Link } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import { User } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import { useSelector } from "react-redux";

const Navbar = () => {
    const user = useSelector((state) => state.auth.user);


    return (
        <nav className="flex right-0 z-50 bg-white shadow-sm justify-between  fixed top-0 left-0 items-center px-8 py-2 border-b">
            {/* Icons */}
            <div className="flex gap-4">
                <CartDrawer />
                {user == null ? (
                    <Link to='/login'>
                        <User size={28} strokeWidth={1.3} />
                    </Link>
                ) : (
                    <LogoutToggle user={user} />
                )}
            </div>

            <div>
                <Link to='/'><img className=" w-30 h-8 " src="/logos.png" alt="" /></Link>
                <p className="text-sm text-gray-600 mt-1 font-semibold">Contact: +92 3114000096</p>
            </div>
        </nav>
    );
}

export default Navbar;
