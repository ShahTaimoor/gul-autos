import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Trash2 } from 'lucide-react';
import { removeFromCart, updateCartQuantity } from '@/redux/slices/cartSlice';

const CartProduct = ({ _id, name, price, quantity, image, stock }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [inputQty, setInputQty] = useState(quantity);

  useEffect(() => {
    setInputQty(quantity); // Sync with Redux
  }, [quantity]);

  const handleBuyNow = () => {
    if (quantity > stock) {
      toast.error('Product out of stock');
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
    if (newQty === '') {
      setInputQty('');
      return;
    }
    let val = parseInt(newQty);
    if (isNaN(val)) val = 1;
    val = Math.max(1, Math.min(val, stock)); // Clamp between 1 and stock
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
    if (inputQty === '' || isNaN(inputQty) || inputQty < 1) {
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
        className="flex relative justify-between items-center px-2 py-3 border-b cursor-pointer hover:bg-gray-50"
        onClick={handleBuyNow}
      >
        <div className="flex items-center">
          <img
            src={image || '/fallback.jpg'}
            alt={name}
            className="w-16 h-16 object-cover rounded-md"
          />
          <div className="ml-4">
            <h4 className="font-semibold text-sm text-gray-900">{name.slice(0, 44)}...</h4>
          </div>

          {/* Quantity Controls */}
          <div className="flex items-center gap-1 mr-6 lg:mr-1 border border-black rounded-full ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (inputQty > 1) handleQuantityChange(inputQty - 1);
                else toast.error('Quantity cannot be less than 1');
              }}
              className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold hover:bg-gray-200"
              disabled={inputQty <= 1}
              title="Decrease quantity"
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
              className="w-10 text-center focus:outline-none text-sm py-1 
                appearance-none 
                [&::-webkit-inner-spin-button]:appearance-none 
                [&::-webkit-outer-spin-button]:appearance-none"
            />

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (inputQty < stock) handleQuantityChange(inputQty + 1);
                else toast.error(`Only ${stock} items in stock`);
              }}
              className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold hover:bg-gray-200"
              disabled={inputQty >= stock}
              title="Increase quantity"
            >
              +
            </button>
          </div>
        </div>

        <div className="flex absolute top-1 right-1 items-center space-x-4">
          <button
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700 transition"
            title="Remove from cart"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </>
  );
};

export default CartProduct;
