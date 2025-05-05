import { Link } from "react-router-dom";
import CartDrawer from "./CartDrawer";
import { User } from "lucide-react";
import LogoutToggle from "./LogoutToggle";
import { useSelector } from "react-redux";

const Navbar = () => {
    const user = useSelector((state) => state.auth.user);
    

    return (
        <nav className="flex justify-between items-center px-8 py-5 border-b">
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

            <Link to='/' className="text-2xl font-bold">Zaryab Auto</Link>
        </nav>
    );
}

export default Navbar;
