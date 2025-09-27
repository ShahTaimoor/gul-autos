import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart, Trash2 } from 'lucide-react';
import {
  removeFromCart,
  updateCartQuantity,
} from '@/redux/slices/cart/cartSlice';

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
import { Dialog, DialogContent } from '../ui/dialog';
import CartImage from '../ui/CartImage';
import Checkout from '@/pages/Checkout';

// Optimized CartProduct component with memoization
const CartProduct = React.memo(({ product, quantity, onValidationChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [inputQty, setInputQty] = useState(quantity);
  const prevIsValid = useRef(true);
  const updateTimeoutRef = useRef(null);
  const { _id, title, price, stock } = product;
  const image = product.image || product.picture?.secure_url;

  // Sync input with prop changes
  useEffect(() => {
    setInputQty(quantity);
  }, [quantity]);

  // Validation effect
  useEffect(() => {
    const isValid = inputQty > 0 && inputQty <= stock && typeof inputQty === 'number';
    if (prevIsValid.current !== isValid) {
      prevIsValid.current = isValid;
      onValidationChange(_id, isValid);
    }
  }, [inputQty, stock, _id, onValidationChange]);

  // Immediate quantity update with optimistic UI
  const updateQuantity = useCallback((newQty) => {
    if (newQty !== quantity && newQty > 0 && newQty <= stock) {
      // Immediate UI update
      setInputQty(newQty);
      // API call with shorter debounce for better responsiveness
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
      
      updateTimeoutRef.current = setTimeout(() => {
        dispatch(updateCartQuantity({ productId: _id, quantity: newQty }));
      }, 150); // Reduced to 150ms for faster response
    }
  }, [dispatch, _id, quantity, stock]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

  const handleBuyNow = useCallback(() => {
    if (inputQty > stock || inputQty <= 0) {
      toast.error('Invalid product quantity');
      return;
    }
    navigate('/');
  }, [inputQty, stock, navigate]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    dispatch(removeFromCart(_id));
    toast.success('Product removed from cart');
  }, [dispatch, _id]);

  const handleQuantityChange = useCallback((newQty) => {
    if (newQty === '' || isNaN(newQty)) {
      setInputQty('');
      return;
    }
    const val = Math.max(1, Math.min(parseInt(newQty), stock));
    updateQuantity(val);
  }, [stock, updateQuantity]);

  const handleInputChange = useCallback((e) => {
    const val = e.target.value;
    if (val === '') {
      setInputQty('');
    } else {
      const parsed = parseInt(val);
      if (!isNaN(parsed)) {
        if (parsed <= stock) {
          setInputQty(parsed);
        } else {
          toast.error(`Only ${stock} items in stock`);
          setInputQty(stock);
        }
      }
    }
  }, [stock]);

  const handleInputBlur = useCallback(() => {
    if (inputQty === '' || isNaN(inputQty) || inputQty <= 0) {
      toast.error('Quantity must be at least 1');
      setInputQty(quantity);
      return;
    }
    if (inputQty > stock) {
      toast.error(`Only ${stock} items in stock`);
      setInputQty(stock);
      return;
    }
    if (inputQty !== quantity) {
      dispatch(updateCartQuantity({ productId: _id, quantity: inputQty }));
    }
  }, [inputQty, quantity, stock, dispatch, _id]);

  const handleDecrease = useCallback((e) => {
    e.stopPropagation();
    if (inputQty > 1) {
      updateQuantity(inputQty - 1);
    } else {
      toast.error('Quantity cannot be less than 1');
    }
  }, [inputQty, updateQuantity]);

  const handleIncrease = useCallback((e) => {
    e.stopPropagation();
    if (inputQty < stock) {
      updateQuantity(inputQty + 1);
    } else {
      toast.error(`Only ${stock} items in stock`);
    }
  }, [inputQty, stock, updateQuantity]);

  return (
    <>
      <style>{`
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type='number'] {
          -moz-appearance: textfield;
        }
      `}</style>
      <div
        className="flex justify-between items-center gap-4 p-3 border-b hover:bg-gray-50 cursor-pointer transition"
        onClick={handleBuyNow}
      >
        <div className="flex items-center gap-4">
          <CartImage
            src={image}
            alt={title}
            className="w-28 h-20 rounded-lg border object-cover object-center"
            fallback="/fallback.jpg"
            quality={80}
          />
          <div className="max-w-[200px]">
            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{title}</h4>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1 border rounded-full shadow-sm border-gray-300">
            <button
              onClick={handleDecrease}
              className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 select-none"
              disabled={inputQty <= 1}
            >
              −
            </button>
            <input
              type="number"
              value={inputQty === '' ? '' : inputQty}
              onChange={(e) => {
                e.stopPropagation();
                handleInputChange(e);
              }}
              onBlur={(e) => {
                e.stopPropagation();
                handleInputBlur();
              }}
              onClick={(e) => e.stopPropagation()}
              max={stock}
              min={1}
              className="w-10 text-center text-sm focus:outline-none bg-transparent appearance-none font-medium"
            />
            <button
              onClick={handleIncrease}
              className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold hover:bg-gray-200 active:bg-gray-300 transition-all duration-150 select-none"
              disabled={inputQty >= stock}
            >
              +
            </button>
          </div>
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-600 transition-colors"
            title="Remove from cart"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </>
  );
});

CartProduct.displayName = 'CartProduct';

const CartDrawer = () => {
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  // Memoized total quantity calculation
  const totalQuantity = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  const [validationMap, setValidationMap] = useState({});
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);

  const handleValidationChange = useCallback((productId, isValid) => {
    setValidationMap((prev) => ({
      ...prev,
      [productId]: isValid,
    }));
  }, []);

  const handleRemove = useCallback((productId) => {
    dispatch(removeFromCart(productId))
      .unwrap()
      .then(() => toast.success('Product removed from cart'))
      .catch((err) => toast.error(err));
  }, [dispatch]);

  const handleBuyNow = useCallback(() => {
    if (!user) {
      return navigate('/login');
    }
    if (cartItems.length === 0) {
      toast.error('Your cart is empty.');
      return;
    }
    const hasInvalidQty = Object.values(validationMap).includes(false);
    if (hasInvalidQty) {
      toast.error('Fix invalid quantities in cart before checkout.');
      return;
    }
    setOpenCheckoutDialog(true);
  }, [user, navigate, cartItems.length, validationMap]);

  // Memoized cart items to prevent unnecessary re-renders
  const memoizedCartItems = useMemo(() => cartItems, [cartItems]);

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            {totalQuantity > 0 && (
              <Badge className="absolute -top-2 -right-2 text-xs px-1 py-0.5">
                {totalQuantity}
              </Badge>
            )}
            <ShoppingCart
              strokeWidth={1.3}
              size={28}
              className="text-gray-800 hover:scale-105 transition-all ease-in-out"
            />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">Your Cart</SheetTitle>
            <SheetDescription>Total Quantity: {totalQuantity}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {memoizedCartItems.length > 0 ? (
              memoizedCartItems.map((item) => (
                <CartProduct
                  key={item.product._id}
                  product={item.product}
                  quantity={item.quantity}
                  onValidationChange={handleValidationChange}
                />
              ))
            ) : (
              <p className="text-center text-gray-500 py-6">Your cart is empty.</p>
            )}
          </div>
          <SheetFooter className="mt-6">
            <SheetClose asChild>
              <Button
                onClick={handleBuyNow}
                disabled={
                  cartItems.length === 0 ||
                  Object.values(validationMap).includes(false)
                }
                className="w-full"
              >
                Checkout
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      
      <Dialog open={openCheckoutDialog} onOpenChange={setOpenCheckoutDialog}>
        <DialogContent className="w-full lg:max-w-6xl h-[62vh] sm:h-[70vh] sm:w-[60vw] overflow-hidden p-0 bg-white rounded-xl shadow-xl flex flex-col">
          <Checkout closeModal={() => setOpenCheckoutDialog(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CartDrawer;