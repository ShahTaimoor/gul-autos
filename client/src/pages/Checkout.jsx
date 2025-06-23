import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addOrder } from '@/redux/slices/order/orderSlice';
import { emptyCart } from '@/redux/slices/cartSlice';
import { updateProfile } from '@/redux/slices/auth/authSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Check,
  CreditCard,
  Edit,
  Home,
  Loader2,
  MapPin,
  Phone,
  ShoppingBag,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Checkout = () => {
  const { cartItems, totalPrice } = useSelector((state) => state.cart);
  const { user, status } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({
    address: user?.address || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });

  const [showForm, setShowForm] = useState(!user?.address || !user?.phone || !user?.city);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    setFormData({
      address: user?.address || '',
      phone: user?.phone || '',
      city: user?.city || '',
    });
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = async () => {
    try {
      await dispatch(updateProfile(formData)).unwrap();
      toast.success('Profile updated successfully');
      setShowForm(false);
    } catch (err) {
      toast.error(err?.message || 'Failed to update profile');
    }
  };

  const handleCheckout = async () => {
    const { address, phone, city } = formData;
    if (!address.trim() || !phone.trim() || !city.trim()) {
      return toast('Please fill out all fields');
    }

    const productArray = cartItems.map((item) => ({
      id: item._id,
      quantity: item.quantity,
    }));

    try {
      setLoading(true);
      await dispatch(updateProfile({ address, phone, city })).unwrap();

      const orderData = {
        products: productArray,
        amount: totalPrice.toFixed(2),
        address,
        phone,
        city,
      };

      const res = await dispatch(addOrder(orderData)).unwrap();

      if (res.success) {
        dispatch(emptyCart());
        navigate('/success');
        toast.success('Order placed successfully!');
      } else {
        toast.error('Failed to place order');
      }
    } catch (err) {
      setError(err?.message || 'Something went wrong!');
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b mt-12 from-gray-50 to-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Order Summary */}
          <div className="md:w-2/3 space-y-6">
            <div className="relative p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300">
              <div className="absolute inset-0 overflow-hidden rounded-2xl">
                <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-100 rounded-full filter blur-3xl opacity-20"></div>
              </div>

              <h2 className="relative z-10 text-2xl font-semibold text-gray-800 mb-6 flex items-center">
                <ShoppingBag className="w-6 h-6 mr-2 text-black" />
                Order Summary
              </h2>

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 space-y-4 divide-y divide-gray-100">
                {cartItems.map((item) => (
                  <div key={item._id} className="relative pb-2 pt-4 group">
                    <div className="absolute inset-0 rounded-lg bg-blue-50 opacity-0 group-hover:opacity-30 transition-opacity duration-300 -mx-2"></div>
                    <div className="relative flex items-start gap-4 z-10">
                      <div className="relative flex-shrink-0">
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-gray-200/60 group-hover:border-blue-200 transition-all shadow-sm relative">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none"></div>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">Qty: {item.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Billing Info */}
          <div className="md:w-1/3">
            <div className="sticky top-6">
              <div className="relative p-6 rounded-2xl bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 overflow-hidden rounded-2xl">
                  <div className="absolute -top-5 -left-5 w-32 h-32 bg-teal-100 rounded-full filter blur-3xl opacity-20"></div>
                </div>

                <h2 className="relative z-10 text-xl font-semibold text-gray-800 mb-6 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-teal-600" />
                  Billing Information
                </h2>

                <div className="relative z-10 space-y-6">
                  {!showForm ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-700">Contact</h3>
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-sm text-gray-600">{user?.email}</p>
                        <p className="text-sm text-gray-600">{user?.phone}</p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-700">Shipping Address</h3>
                          <Check className="w-4 h-4 text-green-500" />
                        </div>
                        <p className="text-sm text-gray-600">{user?.name}</p>
                        <p className="text-sm text-gray-600">{user?.address}</p>
                        <p className="text-sm text-gray-600">{user?.city}</p>
                      </div>

                      <Button
                        variant="outline"
                        onClick={() => setShowForm(true)}
                        className="w-full border-gray-300 hover:bg-gray-50 flex items-center justify-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile Info
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Phone */}
                      <div className="relative w-full">
                        <input
                          type="text"
                          name="phone"
                          id="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder=" "
                          required
                          className="peer w-full border border-gray-300 rounded-md pb-2 px-3 pt-3 text-sm bg-white 
        focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                        />
                        <label
                          htmlFor="phone"
                          className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
        transition-all duration-200 ease-in-out pointer-events-none
        peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 
        peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700] flex items-center gap-1"
                        >
                          <Phone className="w-4 h-4" /> Phone
                        </label>
                      </div>
                      {/* City */}
                      <div className="relative w-full">
                        <input
                          type="text"
                          name="city"
                          id="city"
                          value={formData.city}
                          onChange={handleChange}
                          placeholder=" "
                          required
                          className="peer w-full border border-gray-300 rounded-md pb-2 px-3 pt-3 text-sm bg-white 
        focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                        />
                        <label
                          htmlFor="city"
                          className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
        transition-all duration-200 ease-in-out pointer-events-none
        peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 
        peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700] flex items-center gap-1"
                        >
                          <MapPin className="w-4 h-4" /> City
                        </label>
                      </div>
                      {/* Address */}
                      <div className="relative w-full">
                        <textarea
                          name="address"
                          id="address"
                          value={formData.address}
                          onChange={handleChange}
                          placeholder=" "
                          rows={3}
                          required
                          className="peer w-full border border-gray-300 rounded-md pb-2 px-3 pt-3 text-sm bg-white 
        focus:outline-none focus:ring-2 focus:ring-[#FED700] focus:border-[#FED700]"
                        />
                        <label
                          htmlFor="address"
                          className="absolute left-2.5 -top-2.5 bg-white px-1 text-xs text-[#FED700] 
        transition-all duration-200 ease-in-out pointer-events-none
        peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 
        peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-[#FED700] flex items-center gap-1"
                        >
                          <Home className="w-4 h-4" /> Address
                        </label>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button
                          variant="outline"
                          onClick={() => setShowForm(false)}
                          className="flex-1 border-gray-300 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleProfileUpdate}
                          disabled={status === 'loading'}
                          className="flex-1 bg-black text-white"
                        >
                          {status === 'loading' ? (
                            <>
                              <Loader2 className="animate-spin w-4 h-4" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Save Info
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 text-center pt-2">
                    By placing your order, you agree to our{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-blue-600 hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </div>
                </div>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-6 animate-in fade-in">
                  <AlertCircle className="w-5 h-5" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Place Order Button */}
      <div className="fixed animate-bounce bottom-5 left-5 z-50">
        <Button
          onClick={handleCheckout}
          disabled={loading}
          className="bg-black text-white px-6 py-3 shadow-lg hover:shadow-xl flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5" />
              Processing...
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5" />
              Place Order
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default Checkout;
