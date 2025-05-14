import CheckoutProduct from '@/components/custom/CheckoutProduct';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { addOrder } from '@/redux/slices/order/orderSlice';
import { emptyCart } from '@/redux/slices/cartSlice';


const Checkout = () => {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { cartItems, totalPrice } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  console.log(user);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (address.trim() === '') {
      return toast('Please enter your address');
    }

    const productArray = cartItems.map((item) => ({
      id: item._id,
      quantity: item.quantity,
    }));

    try {
      setLoading(true);
      const orderData = {
        products: productArray,
        amount: totalPrice.toFixed(2),
        address: address,
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
      setError(err || 'Something went wrong!');
      toast.error('Something went wrong!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='mx-auto max-w-6xl px-4 sm:px-8 py-12'>
      <div className='flex flex-col sm:flex-row gap-10'>

        {/* LEFT: Order Summar */}
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

            <div className='space-y-4'>
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <Input id='name' value={user?.name} disabled placeholder='John Doe' />

             

              <Label htmlFor="address" className="text-sm">Shipping Address</Label>
              <Textarea
                id='address'
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder='Enter your full address'
                rows={4}
              />
            </div>

            <Button
              onClick={handleCheckout}
              disabled={loading || address.trim() === ''}
              className='w-full mt-4'
            >
              {loading ? <Loader2 className="animate-spin text-white mr-2" size={20} /> : 'Place Order'}
            </Button>
          </Card>

          {/* Error Message */}
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
