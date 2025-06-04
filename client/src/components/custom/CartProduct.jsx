// CartProduct.jsx
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { X } from 'lucide-react';
import { removeFromCart, updateCartQuantity } from '@/redux/slices/cartSlice';

const CartProduct = ({ _id, name, price, quantity, image, stock }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [inputQty, setInputQty] = useState(quantity);

  useEffect(() => {
    setInputQty(quantity); // Sync when quantity updates externally
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

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (quantity < stock) {
      dispatch(updateCartQuantity({ _id, quantity: quantity + 1 }));
    } else {
      toast.error('Not enough stock');
    }
  };

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (quantity > 1) {
      dispatch(updateCartQuantity({ _id, quantity: quantity - 1 }));
    } else {
      toast.error('Quantity cannot be less than 1');
    }
  };

  const handleManualChange = (e) => {
    const newVal = parseInt(e.target.value);
    if (isNaN(newVal)) return setInputQty('');
    setInputQty(newVal);
  };

  const handleManualBlur = () => {
    if (inputQty < 1) {
      toast.error('Quantity must be at least 1');
      setInputQty(quantity);
      return;
    }
    if (inputQty > stock) {
      toast.error(`Only ${stock} items in stock`);
      setInputQty(quantity);
      return;
    }
    if (inputQty !== quantity) {
      dispatch(updateCartQuantity({ _id, quantity: inputQty }));
    }
  };

  return (
    <div
      className="flex justify-between items-center px-2 py-3 border-b cursor-pointer hover:bg-gray-50"
      onClick={handleBuyNow}
    >
      <div className="flex items-center">
        <img
          src={image || '/fallback.jpg'}
          alt={name}
          className="w-16 h-16 object-cover rounded-md"
        />
        <div className="ml-4">
          <h4 className="font-semibold text-gray-900">{name}</h4>
          <p className="text-sm text-gray-500">Qty: {quantity}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
      

        {/* Quantity Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleDecrease}
            className="text-gray-500 hover:text-gray-700"
            disabled={quantity <= 1}
            title="Decrease quantity"
          >
            -
          </button>

          <input
            type="number"
            value={inputQty}
            onChange={handleManualChange}
            onBlur={handleManualBlur}
            min="1"
            max={stock}
            className="w-16 border rounded-md text-center text-sm p-1"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={handleIncrease}
            className="text-gray-500 hover:text-gray-700"
            disabled={quantity >= stock}
            title="Increase quantity"
          >
            +
          </button>
        </div>

      <div className="flex items-center space-x-4">
        {/* Remove Button */}
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700 transition"
          title="Remove from cart"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default CartProduct;
