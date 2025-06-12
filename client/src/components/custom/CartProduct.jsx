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
  className="flex justify-between items-center gap-4 p-3 border-b hover:bg-gray-50 cursor-pointer transition"
  onClick={handleBuyNow}
>
  {/* Left Section: Image + Name */}
  <div className="flex items-center gap-4">
    <img
      src={image || '/fallback.jpg'}
      alt={name}
      className="w-16 h-16 object-cover rounded-lg border"
    />
    <div className="max-w-[200px]">
      <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
        {name}
      </h4>
    </div>
  </div>

  {/* Right Section: Quantity Controls + Delete */}
  <div className="flex items-center gap-3 ml-auto">
    {/* Quantity Controls */}
    <div className="flex items-center gap-1 border border-gray-300 rounded-full shadow-sm">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (inputQty > 1) handleQuantityChange(inputQty - 1);
          else toast.error('Quantity cannot be less than 1');
        }}
        className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold hover:bg-gray-100"
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
        className="w-10 text-center text-sm focus:outline-none bg-transparent appearance-none 
          [&::-webkit-inner-spin-button]:appearance-none 
          [&::-webkit-outer-spin-button]:appearance-none"
      />

      <button
        onClick={(e) => {
          e.stopPropagation();
          if (inputQty < stock) handleQuantityChange(inputQty + 1);
          else toast.error(`Only ${stock} items in stock`);
        }}
        className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold hover:bg-gray-100"
        disabled={inputQty >= stock}
        title="Increase quantity"
      >
        +
      </button>
    </div>

    {/* Trash Button */}
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

export default CartProduct;
