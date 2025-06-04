import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addOrder } from '@/redux/slices/order/orderSlice';
import { emptyCart } from '@/redux/slices/cartSlice';
import { updateProfile } from '@/redux/slices/auth/authSlice';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CheckoutProduct from '@/components/custom/CheckoutProduct';

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

  // Sync when user updates
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
    if (address.trim() === '' || phone.trim() === '' || city.trim() === '') {
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
    <div className='mx-auto mt-20 max-w-6xl px-4 sm:px-8 py-12'>
      <div className='flex flex-col sm:flex-row gap-10'>
        {/* LEFT: Order Summary */}
        <div className='sm:w-2/3 space-y-6'>
          <h2 className='text-2xl font-semibold text-gray-800'>Order Summary</h2>
          <Card className="p-6 space-y-4">
            {cartItems.map((item) => (
              <CheckoutProduct key={item._id} {...item} />
            ))}
          </Card>
        </div>

        {/* RIGHT: Billing Information */}
        <div className='sm:w-1/3'>
          <Card className='p-6 shadow-lg rounded-lg space-y-6'>
            <h2 className='text-xl font-semibold text-gray-800'>Billing Information</h2>

            {!showForm ? (
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Full Name</Label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div>
                  <Label className="text-sm">Phone</Label>
                  <Input value={user?.phone || ''} disabled />
                </div>
                <div>
                  <Label className="text-sm">City</Label>
                  <Input value={user?.city || ''} disabled />
                </div>
                <div>
                  <Label className="text-sm">Address</Label>
                  <Textarea value={user?.address || ''} disabled rows={3} />
                </div>

                <Button variant="outline" onClick={() => setShowForm(true)} className="w-full">
                  Edit Profile Info
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone" className="text-sm">Phone</Label>
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="city" className="text-sm">City</Label>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Enter your city"
                  />
                </div>
                <div>
                  <Label htmlFor="address" className="text-sm">Address</Label>
                  <Textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Enter your address"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleProfileUpdate} disabled={status === 'loading'}>
                    {status === 'loading' ? 'Saving...' : 'Save Info'}
                  </Button>
                </div>
              </div>
            )}

            <Button
              onClick={handleCheckout}
              disabled={loading}
              className='w-full mt-6'
            >
              {loading ? <Loader2 className="animate-spin text-white mr-2" size={20} /> : 'Place Order'}
            </Button>
          </Card>

          {error && (
            <Alert variant="destructive" className="mt-6">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
