import { Link } from 'react-router-dom'

const Footer = () => {
    return (
        <footer className="border-t bg-gray-50 py-12 text-gray-700">
            <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 px-4 lg:px-0">
                {/* Company Name */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Gul Autos</h3>
                    <p className="text-sm text-gray-500">Quality Auto Accessories & Parts</p>
                </div>

                {/* Address */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Address</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                        Main Market Street,<br />
                        Block A, Sector B,<br />
                        Peshawar, KPK, Pakistan
                    </p>
                </div>

                {/* Contact */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Contact</h3>
                    <p className="text-sm text-gray-500">Phone: +92 3114000096</p>
                    <p className="text-sm text-gray-500">Email: example@gmail.com</p>
                </div>

                {/* City Info */}
                <div>
                    <h3 className="text-lg font-semibold mb-2">Location</h3>
                    <p className="text-sm text-gray-500">Peshawar, Pakistan</p>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="container mx-auto mt-12 px-4 lg:px-0 border-t pt-6">
                <p className="text-center text-gray-400 text-sm">
                    © {new Date().getFullYear()} Gul Autos. All rights reserved.
                </p>
            </div>
        </footer>

    )
}

export default Footer