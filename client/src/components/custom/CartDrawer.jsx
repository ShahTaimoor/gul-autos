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
import Checkout from '@/pages/Checkout';

// Optimized CartProduct component with optimistic updates
const CartProduct = React.memo(({ product, quantity, onValidationChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [localQuantity, setLocalQuantity] = useState(quantity);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateTimeoutRef = useRef(null);
  const prevIsValid = useRef(true);
  const { _id, title, picture, stock } = product; // Removed price

  // Get the correct image URL
  const imageUrl = picture?.secure_url || product.image || '/fallback.jpg';

  useEffect(() => {
    setLocalQuantity(quantity);
  }, [quantity]);

  useEffect(() => {
    const isValid = localQuantity > 0 && localQuantity <= stock && typeof localQuantity === 'number';
    if (prevIsValid.current !== isValid) {
      prevIsValid.current = isValid;
      onValidationChange(_id, isValid);
    }
  }, [localQuantity, stock, _id, onValidationChange]);

  // Debounced update function
  const debouncedUpdate = useCallback((newQuantity) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    updateTimeoutRef.current = setTimeout(() => {
      if (newQuantity !== quantity && newQuantity > 0 && newQuantity <= stock) {
        setIsUpdating(true);
        dispatch(updateCartQuantity({ productId: _id, quantity: newQuantity }))
          .unwrap()
          .catch((err) => {
            toast.error(err);
            setLocalQuantity(quantity); // Revert on error
          })
          .finally(() => setIsUpdating(false));
      }
    }, 500); // Increased to 500ms for better UX
  }, [dispatch, _id, quantity, stock]);

  const handleQuantityChange = useCallback((newQty) => {
    if (newQty === '' || isNaN(newQty)) {
      setLocalQuantity('');
      return;
    }
    let val = Math.max(1, Math.min(parseInt(newQty), stock));
    setLocalQuantity(val);
    debouncedUpdate(val);
  }, [stock, debouncedUpdate]);

  const handleRemove = useCallback((e) => {
    e.stopPropagation();
    dispatch(removeFromCart(_id));
    toast.success('Product removed from cart');
  }, [dispatch, _id]);

  const handleBuyNow = useCallback(() => {
    if (localQuantity > stock || localQuantity <= 0) {
      toast.error('Invalid product quantity');
      return;
    }
    navigate('/');
  }, [localQuantity, stock, navigate]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, []);

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
        className="flex justify-between items-center gap-4 p-3 border-b hover:bg-gray-50 cursor-pointer transition-all duration-200 ease-in-out"
        onClick={handleBuyNow}
      >
        <div className="flex items-center gap-4">
          <img
            src={imageUrl}
            alt={title}
            className="w-16 h-16 object-cover rounded-lg border transition-transform duration-200 hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = '/fallback.jpg';
            }}
          />
          <div className="max-w-[200px]">
            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{title}</h4>
            {/* Price removed */}
          </div>
        </div>
        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1 border rounded-full shadow-sm border-gray-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (localQuantity > 1) handleQuantityChange(localQuantity - 1);
                else toast.error('Quantity cannot be less than 1');
              }}
              className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition-colors duration-200"
              disabled={localQuantity <= 1 || isUpdating}
            >
              −
            </button>
            <input
              type="number"
              value={localQuantity === '' ? '' : localQuantity}
              onChange={(e) => {
                e.stopPropagation();
                const val = e.target.value;
                if (val === '') {
                  setLocalQuantity('');
                } else {
                  const parsed = parseInt(val);
                  if (!isNaN(parsed)) {
                    if (parsed <= stock) {
                      setLocalQuantity(parsed);
                      debouncedUpdate(parsed);
                    } else {
                      toast.error(`Only ${stock} items in stock`);
                      setLocalQuantity(stock);
                      debouncedUpdate(stock);
                    }
                  }
                }
              }}
              onBlur={(e) => {
                e.stopPropagation();
                if (localQuantity === '' || isNaN(localQuantity) || localQuantity <= 0) {
                  toast.error('Quantity must be at least 1');
                  setLocalQuantity(quantity);
                  return;
                }
                if (localQuantity > stock) {
                  toast.error(`Only ${stock} items in stock`);
                  setLocalQuantity(stock);
                  debouncedUpdate(stock);
                  return;
                }
              }}
              onClick={(e) => e.stopPropagation()}
              max={stock}
              min={1}
              disabled={isUpdating}
              className={`w-10 text-center text-sm focus:outline-none bg-transparent appearance-none transition-opacity duration-200 ${isUpdating ? 'opacity-50' : ''}`}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (localQuantity < stock) handleQuantityChange(localQuantity + 1);
                else toast.error(`Only ${stock} items in stock`);
              }}
              className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold hover:bg-gray-100 transition-colors duration-200"
              disabled={localQuantity >= stock || isUpdating}
            >
              +
            </button>
          </div>
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-600 transition-colors duration-200"
            title="Remove from cart"
            disabled={isUpdating}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </>
  );
});

// Optimized CartDrawer component
const CartDrawer = () => {
  const { items: cartItems = [] } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
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
              className="text-gray-800 hover:scale-105 transition-all duration-200 ease-in-out"
            />
          </Button>
        </SheetTrigger>
        <SheetContent className="w-full sm:w-[400px]">
          <SheetHeader>
            <SheetTitle className="text-xl font-bold">Your Cart</SheetTitle>
            <SheetDescription>Total Quantity: {totalQuantity}</SheetDescription>
          </SheetHeader>
          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
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
