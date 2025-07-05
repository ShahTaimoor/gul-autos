import React, { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ShoppingCart, Trash2 } from 'lucide-react';
import {
  removeFromCart,
  updateCartQuantity,
} from '@/redux/slices/cartSlice';

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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import Checkout from '@/pages/Checkout';

const CartProduct = ({ _id, name, price, quantity, image, stock, onValidationChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [inputQty, setInputQty] = useState(quantity);
  const prevIsValid = useRef(true);
  useEffect(() => {
    setInputQty(quantity);
  }, [quantity]);
  useEffect(() => {
    const isValid = inputQty > 0 && inputQty <= stock && typeof inputQty === 'number';

    if (prevIsValid.current !== isValid) {
      prevIsValid.current = isValid;
      onValidationChange(_id, isValid);
    }
  }, [inputQty, stock, _id, onValidationChange]);

  const handleBuyNow = () => {
    if (inputQty > stock || inputQty <= 0) {
      toast.error('Invalid product quantity');
      return;
    }
    navigate('/');
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    dispatch(removeFromCart(_id));
    toast.success('Product removed from cart');
  };

  const handleQuantityChange = (newQty) => {
    if (newQty === '' || isNaN(newQty)) {
      setInputQty('');
      return;
    }
    let val = Math.max(1, Math.min(parseInt(newQty), stock));
    setInputQty(val);
    if (val !== quantity) {
      dispatch(updateCartQuantity({ _id, quantity: val }));
    }
  };

  const handleInputChange = (e) => {
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
  };

  const handleInputBlur = () => {
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
      dispatch(updateCartQuantity({ _id, quantity: inputQty }));
    }
  };

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
          <img
            src={image || '/fallback.jpg'}
            alt={name}
            className="w-16 h-16 object-cover rounded-lg border"
          />
          <div className="max-w-[200px]">
            <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{name}</h4>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          <div className="flex items-center gap-1 border rounded-full shadow-sm border-gray-300">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (inputQty > 1) handleQuantityChange(inputQty - 1);
                else toast.error('Quantity cannot be less than 1');
              }}
              className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold hover:bg-gray-100"
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
              className={`w-10 text-center text-sm focus:outline-none bg-transparent appearance-none
                `}
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (inputQty < stock) handleQuantityChange(inputQty + 1);
                else toast.error(`Only ${stock} items in stock`);
              }}
              className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold hover:bg-gray-100"
              disabled={inputQty >= stock}
            >
              +
            </button>
          </div>

          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-600 transition"
            title="Remove from cart"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </>
  );
};

const CartDrawer = () => {
  const { cartItems, totalQuantity } = useSelector((state) => state.cart);
  const { user } = useSelector((state) => state.auth);

  const navigate = useNavigate();

  const [stockErrors, setStockErrors] = useState([]);
  const [validationMap, setValidationMap] = useState({});

  const handleValidationChange = (id, isValid) => {
    setValidationMap((prev) => ({
      ...prev,
      [id]: isValid,
    }));
  };

  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const handleBuyNow = () => {
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

    setStockErrors([]);
    setOpenCheckoutDialog(true);
  };

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

          {stockErrors.length > 0 && (
            <div className="px-4 py-2 bg-red-50 text-red-700 mt-2 rounded">
              <p className="font-medium mb-1">Stock issues:</p>
              {stockErrors.map((error, i) => (
                <p key={i}>
                  {error.name}: Only {error.available} available
                </p>
              ))}
            </div>
          )}

          <div className="mt-4 max-h-[60vh] overflow-y-auto">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartProduct
                  key={item._id}
                  {...item}
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

      {/* Dialog placed OUTSIDE Sheet */}
      <Dialog open={openCheckoutDialog} onOpenChange={setOpenCheckoutDialog}>
  <DialogContent
    className="w-full lg:max-w-6xl h-[95vh] overflow-hidden p-0 bg-white rounded-xl shadow-xl flex flex-col"
  >
    {/* Sticky Header */}
    <div className="fixed top-0 left-0  right-0 z-9999 bg-white border-b px-4 py-3 sm:px-6">
      <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-800">
        Checkout
      </DialogTitle>
    </div>

    {/* Scrollable Content */}
    <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
      <Checkout closeModal={() => setOpenCheckoutDialog(false)} />
    </div>
  </DialogContent>
</Dialog>


    </>
  );
};
export default CartDrawer;
