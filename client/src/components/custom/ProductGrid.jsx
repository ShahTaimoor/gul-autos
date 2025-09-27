import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import OneLoader from '../ui/OneLoader';

const ProductGrid = React.memo(({ 
  products, 
  loading, 
  gridType, 
  quantities, 
  onQuantityChange, 
  onAddToCart, 
  addingProductId, 
  cartItems, 
  cartRef, 
  onPreviewImage 
}) => {
  const isInCartMap = useMemo(() => {
    const map = new Map();
    cartItems.forEach(item => {
      const productId = item.product?._id || item.product;
      if (productId) {
        map.set(productId, true);
      }
    });
    return map;
  }, [cartItems]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <OneLoader size="large" text="Loading Products..." />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-center text-lg text-gray-500 mb-10">
        No products found for your search.
      </p>
    );
  }

  return (
    <div className={`grid px-2 sm:px-0 lg:grid-cols-4 gap-6 ${
      gridType === 'grid1' 
        ? 'grid-cols-1' 
        : gridType === 'grid2' 
          ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2' 
          : 'grid-cols-1'
    }`}>
      <AnimatePresence>
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            quantity={quantities[product._id] || 1}
            onQuantityChange={onQuantityChange}
            onAddToCart={onAddToCart}
            isAddingToCart={addingProductId === product._id}
            isInCart={isInCartMap.get(product._id) || false}
            gridType={gridType}
            cartRef={cartRef}
            setPreviewImage={onPreviewImage}
          />
        ))}
      </AnimatePresence>
    </div>
  );
});

export default ProductGrid;

