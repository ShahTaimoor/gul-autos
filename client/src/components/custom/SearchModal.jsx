import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Search, X, Loader2 } from 'lucide-react';
import { searchProducts } from '../../redux/slices/products/productSlice';
import LazyImage from '../ui/LazyImage';
import { Badge } from '../ui/badge';
import { addToCart, updateCartQuantity } from '../../redux/slices/cart/cartSlice';
import { useAuthDrawer } from '../../contexts/AuthDrawerContext';

const SearchModal = ({ open, onOpenChange }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { openDrawer } = useAuthDrawer();
  const user = useSelector((state) => state.auth.user);
  const { searchResults, searchStatus, searchQuery } = useSelector((state) => state.products);
  const { items: cartItems } = useSelector((state) => state.cart);
  
  const [query, setQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const inputRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } else {
      setQuery('');
      setHasSearched(false);
    }
  }, [open]);

  // Initialize quantities when search results change
  // Use cart quantities if item is in cart, otherwise default to 1
  useEffect(() => {
    if (searchResults.length > 0) {
      const initialQuantities = {};
      searchResults.forEach((product) => {
        if (product && product._id) {
          const cartItem = cartItems.find(item => item.product?._id === product._id);
          if (cartItem) {
            // Use cart quantity if item is in cart
            initialQuantities[product._id] = cartItem.quantity;
          } else {
            // Default to 1 if not in cart and in stock
            initialQuantities[product._id] = product.stock > 0 ? 1 : 0;
          }
        }
      });
      setQuantities(prev => ({ ...prev, ...initialQuantities }));
    }
  }, [searchResults, cartItems]);

  const handleSearch = () => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      return;
    }
    setHasSearched(true);
    dispatch(searchProducts({ query: trimmedQuery, limit: 20 }));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleProductClick = (productId) => {
    // Close modal and navigate to products page
    onOpenChange(false);
    navigate('/products');
  };

  const handleQuantityChange = (productId, value, stock) => {
    if (value === '') {
      return setQuantities((prev) => ({ ...prev, [productId]: '' }));
    }
    const newValue = Math.max(Math.min(parseInt(value), stock), 1);
    setQuantities((prev) => ({ ...prev, [productId]: newValue }));
  };

  const handleIncrease = (e, productId, stock) => {
    e.stopPropagation();
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.min((prev[productId] || 1) + 1, stock)
    }));
  };

  const handleDecrease = (e, productId) => {
    e.stopPropagation();
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max((prev[productId] || 1) - 1, 1)
    }));
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    if (!user) {
      onOpenChange(false);
      openDrawer('login');
      return;
    }
    const qty = parseInt(quantities[product._id]) || 1;
    if (qty <= 0) {
      return;
    }
    const inCart = isInCart(product._id);
    setAddingProductId(product._id);
    
    const action = inCart
      ? dispatch(updateCartQuantity({ productId: product._id, quantity: qty }))
      : dispatch(addToCart({ productId: product._id, quantity: qty }));
    
    action.finally(() => {
      setAddingProductId(null);
    });
  };

  const isInCart = (productId) => {
    return cartItems.some(item => item.product?._id === productId);
  };

  const isLoading = searchStatus === 'loading';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl lg:max-w-6xl max-h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogHeader className="px-4 pt-4 pb-2 border-b">
          <DialogTitle className="text-xl font-semibold">Search Products</DialogTitle>
        </DialogHeader>

        {/* Search Input */}
        <div className="px-4 pt-4 pb-2">
          <div className="relative flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                ref={inputRef}
                type="text"
                placeholder="Search products... (e.g., Spoiler 2002)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10 pr-10 h-12 text-base"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <Button
              onClick={handleSearch}
              disabled={isLoading || !query.trim()}
              className="h-12 px-6 bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">Start searching for products</p>
              <p className="text-sm mt-2">Type your search query and press Enter or click Search</p>
            </div>
          ) : isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-gray-500">Searching products...</p>
            </div>
          ) : searchResults.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Search className="h-12 w-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium">No products found</p>
              <p className="text-sm mt-2">Try different keywords or check spelling</p>
            </div>
          ) : (
            <>
              <div className="py-3 text-sm text-gray-600">
                Found {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for "{searchQuery}"
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((product) => {
                  const inCart = isInCart(product._id);
                  const image = product.image || product.picture?.secure_url || '/logo.jpeg';
                  
                  return (
                    <div
                      key={product._id}
                      onClick={() => handleProductClick(product._id)}
                      className="border rounded-lg overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-white"
                    >
                      <div className="relative aspect-square overflow-hidden group">
                        {product.isFeatured && (
                          <Badge className="absolute top-2 left-2 z-10 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold shadow-lg">
                            Featured
                          </Badge>
                        )}
                        <LazyImage
                          src={image}
                          alt={product.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          fallback="/logo.jpeg"
                          quality={85}
                        />
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm line-clamp-2 mb-3 min-h-[2.5rem]">
                          {product.title}
                        </h3>
                        {/* Quantity Controls and Add/Update Cart - Side by Side */}
                        <div className="flex flex-row gap-2">
                          {/* Quantity Controls - Left Side (55% mobile, 50% desktop) */}
                          {product.stock > 0 ? (
                            <div className="flex items-center justify-center w-[55%] md:w-1/2">
                              <div className="flex w-full items-stretch h-9 sm:h-8 bg-white/40 backdrop-blur-md shadow-md border border-white/30 rounded-full overflow-hidden">
                                <button
                                  type="button"
                                  onClick={(e) => handleDecrease(e, product._id)}
                                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-l-full flex items-center justify-center text-xs font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={(quantities[product._id] || 1) <= 1}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  max={product.stock}
                                  value={quantities[product._id] || 1}
                                  onChange={(e) => handleQuantityChange(product._id, e.target.value, product.stock)}
                                  onFocus={(e) => e.target.select()}
                                  className="flex-1 min-w-6 text-center bg-transparent focus:outline-none text-xs text-black appearance-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-appearance]:textfield h-full"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => handleIncrease(e, product._id, product.stock)}
                                  className="w-9 h-9 sm:w-8 sm:h-8 rounded-r-full flex items-center justify-center text-xs font-bold text-gray-800 transition-all duration-200 hover:bg-black/90 hover:text-white hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
                                  disabled={(quantities[product._id] || 1) >= product.stock}
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="w-[55%] md:w-1/2"></div>
                          )}

                          {/* Add/Update Cart Button - Right Side (45% mobile, 50% desktop) */}
                          <button
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stock <= 0 || addingProductId === product._id}
                            className={`text-xs cursor-pointer px-2 md:px-3 h-9 sm:h-8 rounded-full transition-all shadow-lg backdrop-blur-md border border-white/30 flex items-center justify-center gap-1 md:gap-2 w-[45%] md:w-1/2 ${
                              product.stock <= 0 || addingProductId === product._id
                                ? 'bg-gray-500 cursor-not-allowed'
                                : inCart
                                  ? 'bg-black hover:bg-gray-800 text-white'
                                  : 'bg-primary hover:bg-primary/90 hover:shadow-2xl text-white'
                            }`}
                          >
                            {product.stock <= 0 ? (
                              'Out of Stock'
                            ) : addingProductId === product._id ? (
                              <>
                                <Loader2 className="w-4 h-4 md:w-3 md:h-3 animate-spin" />
                                <span className="hidden md:inline">Loading...</span>
                                <span className="inline md:hidden">...</span>
                              </>
                            ) : inCart ? (
                              <>
                                <svg className="w-5 h-5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span className="hidden md:inline">Update Cart</span>
                                <span className="inline md:hidden">Update</span>
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5 md:w-3 md:h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                                </svg>
                                <span className="inline md:hidden">Add</span>
                                <span className="hidden md:inline">Add to Cart</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SearchModal;

