import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart } from 'lucide-react';
import CartProduct from './CartProduct';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';

const CartDrawer = () => {
  const { cartItems, totalQuantity, totalPrice } = useSelector(state => state.cart);
  const { user } = useSelector(state => state.auth);
  const navigate = useNavigate();

  const [isProcessing, setIsProcessing] = useState(false);
  const [stockErrors, setStockErrors] = useState([]);

  const handleBuyNow = () => {
    if (!user) return navigate('/login');
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    setIsProcessing(true);
    navigate('/checkout');
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          {totalQuantity > 0 && (
            <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0.5">
              {totalQuantity}
            </Badge>
          )}
          <ShoppingCart strokeWidth={1.3} size={28} className="text-gray-800 hover:scale-105 transition-all ease-in-out" />
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:w-[400px]">
        <SheetHeader>
          <SheetTitle className="text-xl font-bold">Your Cart</SheetTitle>
          <SheetDescription>Total Items: {totalQuantity}</SheetDescription>
        </SheetHeader>

        {stockErrors.length > 0 && (
          <div className="px-4 py-2 bg-red-50 text-red-700 mt-2 rounded">
            <p className="font-medium mb-1">Stock issues:</p>
            {stockErrors.map((error, i) => (
              <p key={i}>{error.name}: Only {error.available} available</p>
            ))}
          </div>
        )}

        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {cartItems.length > 0 ? (
            cartItems.map((item) => (
              <CartProduct key={item._id} {...item} />
            ))
          ) : (
            <p className="text-center text-gray-500 py-6">Your cart is empty.</p>
          )}
        </div>

        <SheetFooter className="mt-6">
          <SheetClose asChild>
            <Button
              onClick={handleBuyNow}
              disabled={cartItems.length === 0 || isProcessing || stockErrors.length > 0}
              className="w-full"
            >
              {isProcessing ? 'Processing...' : 'Checkout'}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
