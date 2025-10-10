import React, { useRef, useCallback, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
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
  const ref = useRef(null);
  const clickAudioRef = useRef(null);
  const isInView = useInView(ref, { once: false });

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
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
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
        <h3 className="font-semibold text-sm line-clamp-2">
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

        <div className="flex flex-col lg:flex-row gap-1.5 mt-2">
          <div className="flex sm:flex-row items-center gap-2 justify-between">
            <div className="flex w-full lg:w-28 justify-between bg-white/40 backdrop-blur-md shadow-md border border-white/30 rounded-full overflow-hidden">
              <button
                onClick={handleDecrease}
                className="w-7 h-7 rounded-l-full flex items-center justify-center text-sm font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow"
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
                className="w-10 text-center bg-transparent focus:outline-none text-sm py-1 text-black
                appearance-none 
                [&::-webkit-outer-spin-button]:appearance-none 
                [&::-webkit-inner-spin-button]:appearance-none 
                [&::-moz-appearance]:textfield"
              />

              <button
                onClick={handleIncrease}
                className="w-7 h-7 rounded-r-full flex items-center justify-center text-sm font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow"
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
            className={`text-sm mt-2 lg:mt-0 lg:w-32 cursor-pointer px-4 md:px-5 py-1.5 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/30 ${
              isInCart
                ? 'bg-green-600 hover:bg-green-700'
                : isDisabled
                  ? 'bg-red-700 cursor-not-allowed'
                  : 'bg-black/80 hover:bg-black/90 hover:shadow-2xl'
            } text-white`}
            aria-label={isInCart ? 'Added to cart' : 'Add to cart'}
          >
            {isInCart ? (
              'Added to Cart'
            ) : isAddingToCart ? (
              <OneLoader size="small" text="Adding..." showText={false} />
            ) : (
              'Add to Cart'
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
});

ProductCard.displayName = 'ProductCard';

export default ProductCard;

