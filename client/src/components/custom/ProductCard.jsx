import React, { useRef, useCallback, useEffect } from 'react';
import OneLoader from '../ui/OneLoader';
import LazyImage from '../ui/LazyImage';
import { Badge } from '../ui/badge';
import { highlightSearchTerm, truncateAndHighlight } from '@/utils/searchHighlight.jsx';

const ProductCard = React.memo(({
  product,
  quantity,
  onQuantityChange,
  onAddToCart,
  isAddingToCart,
  isInCart,
  gridType,
  setPreviewImage,
  searchTerm = ''
}) => {
  const imgRef = useRef(null);
  const clickAudioRef = useRef(null);

  // Initialize audio only once
  useEffect(() => {
    clickAudioRef.current = new Audio('/sounds/click.mp3');
    return () => {
      if (clickAudioRef.current) {
        clickAudioRef.current.pause();
        clickAudioRef.current = null;
      }
    };
  }, []);

  const handleAddClick = useCallback(() => {
    if (clickAudioRef.current) {
      clickAudioRef.current.currentTime = 0;
      clickAudioRef.current.play();
    }
    onAddToCart(product);
  }, [onAddToCart, product]);

  const handleQuantityChange = useCallback((value) => {
    if (value === '') {
      onQuantityChange(product._id, '', product.stock);
      return;
    }
    const parsed = parseInt(value);
    if (!isNaN(parsed)) {
      onQuantityChange(product._id, parsed, product.stock);
    }
  }, [onQuantityChange, product._id, product.stock]);

  const handleDecrease = useCallback(() => {
    const newValue = Math.max((parseInt(quantity) || 1) - 1, 1);
    onQuantityChange(product._id, newValue, product.stock);
  }, [quantity, onQuantityChange, product._id, product.stock]);

  const handleIncrease = useCallback(() => {
    const newValue = Math.min((parseInt(quantity) || 1) + 1, product.stock);
    onQuantityChange(product._id, newValue, product.stock);
  }, [quantity, onQuantityChange, product._id, product.stock]);

  const handleImageClick = useCallback(() => {
    setPreviewImage(product.image || product.picture?.secure_url || '/logo.jpeg');
  }, [setPreviewImage, product.image, product.picture]);

  const handleImageError = useCallback((e) => {
    e.currentTarget.src = '/logo.jpeg';
  }, []);

  const currentQuantity = parseInt(quantity) || 1;
  const isDisabled = currentQuantity <= 0 || isAddingToCart;

  return (
    <div
      className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full ${
        gridType === 'grid3' ? 'sm:flex-col flex-row items-stretch' : ''
      }`}
    >
      <div
        className={`relative cursor-pointer overflow-hidden group ${
          gridType === 'grid3' 
            ? 'w-2/5 sm:w-full aspect-square' 
            : 'aspect-square'
        }`}
      >
        <LazyImage
          ref={imgRef}
          src={product.image || product.picture?.secure_url || '/logo.jpeg'}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
          onClick={handleImageClick}
          fallback="/logo.jpeg"
          quality={85}
         
        />


        <div
          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
          onClick={handleImageClick}
          aria-label="View product image"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
            />
          </svg>
        </div>
      </div>

      <div
        className={`p-2 flex flex-col flex-grow ${
          gridType === 'grid3' ? 'w-3/5 sm:w-full' : ''
        }`}
      >
        <h3 className="font-medium text-xs line-clamp-2 leading-tight">
          {searchTerm ? 
            highlightSearchTerm(
              product.title.split(' ').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
              ).join(' '), 
              searchTerm
            ) : 
            product.title.split(' ').map(word =>
              word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            ).join(' ')
          }
        </h3>
        
        <div className="flex-grow" />

        <div className="flex flex-row gap-2 mt-2">
          <div className="flex items-center justify-center">
            <div className="flex w-20 justify-between bg-white/40 backdrop-blur-md shadow-md border border-white/30 rounded-full overflow-hidden">
              <button
                onClick={handleDecrease}
                className="w-5 h-5 rounded-l-full flex items-center justify-center text-xs font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow"
                disabled={currentQuantity <= 1}
                aria-label="Decrease quantity"
              >
                −
              </button>

              <input
                type="number"
                max={product.stock}
                value={quantity === '' ? '' : quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                onFocus={(e) => e.target.select()}
                className="w-6 text-center bg-transparent focus:outline-none text-xs py-1 text-black
                appearance-none 
                [&::-webkit-outer-spin-button]:appearance-none 
                [&::-webkit-inner-spin-button]:appearance-none 
                [&::-moz-appearance]:textfield"
              />

              <button
                onClick={handleIncrease}
                className="w-5 h-5 rounded-r-full flex items-center justify-center text-xs font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow"
                disabled={currentQuantity >= product.stock}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          </div>

          <button
            onClick={handleAddClick}
            disabled={isDisabled}
            className={`text-xs flex-1 cursor-pointer px-2 py-1.5 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/30 flex items-center justify-center gap-1 ${
              isInCart
                ? 'bg-green-600 hover:bg-green-700'
                : isDisabled
                  ? 'bg-red-700 cursor-not-allowed'
                  : 'bg-black/80 hover:bg-black/90 hover:shadow-2xl'
            } text-white`}
            aria-label={isInCart ? 'Added to cart' : 'Add to cart'}
          >
            {isInCart ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Added to Cart</span>
                <span className="sm:hidden">Added</span>
              </>
            ) : isAddingToCart ? (
              <OneLoader size="small" text="Adding..." showText={false} />
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                </svg>
                <span className="hidden sm:inline">Add to Cart</span>
                <span className="sm:hidden">Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

