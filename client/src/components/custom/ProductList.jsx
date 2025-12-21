import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, removeFromCart, updateCartQuantity } from '@/redux/slices/cart/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import CategorySwiper from './CategorySwiper';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import { usePagination } from '@/hooks/use-pagination';
import { ShoppingCart, ArrowUpDown, SortAsc, Grid3X3, List, AlertCircle, Trash2 } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose,
} from '../ui/sheet';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import CartImage from '../ui/CartImage';
import Checkout from '../../pages/Checkout';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';
import { useToast } from '@/hooks/use-toast';

// Import the optimized ProductCard component
import ProductCard from './ProductCard';

// Cart Product Component
const CartProduct = ({ product, quantity }) => {
  const dispatch = useDispatch();
  const [inputQty, setInputQty] = useState(quantity);
  const { _id, title, price, stock } = product;
  const image = product.image || product.picture?.secure_url;
  const isOutOfStock = product.isOutOfStock || stock <= 0;
  const availableStock = product.availableStock !== undefined ? product.availableStock : stock;

  const updateQuantity = (newQty) => {
    if (!isOutOfStock && newQty !== quantity && newQty > 0 && newQty <= availableStock) {
      setInputQty(newQty);
      dispatch(updateCartQuantity({ productId: _id, quantity: newQty }));
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    dispatch(removeFromCart(_id));
  };

  const handleDecrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inputQty > 1) {
      updateQuantity(inputQty - 1);
    }
  };

  const handleIncrease = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock && inputQty < availableStock) {
      updateQuantity(inputQty + 1);
    }
  };

  return (
    <div className={`flex items-center justify-between p-4 border-b transition-colors ${
      isOutOfStock 
        ? 'bg-red-50 hover:bg-red-100 opacity-75 border-red-200' 
        : 'border-gray-100 hover:bg-gray-50'
    }`}>
      <div className="flex items-center space-x-3 flex-1">
        <CartImage
          src={image}
          alt={title}
          className={`w-12 h-12 rounded-md border object-cover ${
            isOutOfStock 
              ? 'border-red-200 opacity-50' 
              : 'border-gray-200'
          }`}
          fallback="/fallback.jpg"
          quality={80}
        />
        <div className="min-w-0 flex-1">
          <h4 className={`font-medium text-sm line-clamp-2 ${
            isOutOfStock ? 'text-gray-500' : 'text-gray-900'
          }`}>
            {title}
          </h4>
          {isOutOfStock && (
            <div className="flex items-center gap-1 mt-1 text-xs text-red-600">
              <AlertCircle className="w-3 h-3" />
              <span>Out of Stock</span>
            </div>
          )}
          {!isOutOfStock && product.quantityAdjusted && (
            <div className="flex items-center gap-1 mt-1 text-xs text-orange-600">
              <AlertCircle className="w-3 h-3" />
              <span>Quantity adjusted to {availableStock}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center space-x-3">
        {isOutOfStock ? (
          <div className="text-xs text-red-600 font-medium px-2 py-1 bg-red-100 rounded">
            Unavailable
          </div>
        ) : (
          <div className="flex items-center border border-gray-200 rounded-md">
            <button
              type="button"
              onClick={handleDecrease}
              className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={inputQty <= 1}
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-medium text-gray-900">{inputQty}</span>
            <button
              type="button"
              onClick={handleIncrease}
              className="w-8 h-8 flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={inputQty >= availableStock}
            >
              +
            </button>
          </div>
        )}
        <button
          onClick={handleRemove}
          className="text-red-500 hover:text-red-700 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
          title="Remove from cart"
        >
          <Trash2 size={16} />
          <span className="hidden sm:inline">Remove</span>
        </button>
      </div>
    </div>
  );
};

const ProductList = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Read initial values from URL params
  const urlCategorySlug = searchParams.get('category') || 'all'; // Now using slug instead of ID
  const urlPage = parseInt(searchParams.get('page') || '1', 10);
  
  // Redux selectors - get categories first
  const { categories, status: categoriesStatus } = useSelector((s) => s.categories);
  
  // Convert category slug to ID
  // Find category by slug from Redux state
  const categoryBySlug = useMemo(() => {
    if (urlCategorySlug === 'all') return 'all';
    if (!categories || categories.length === 0) return 'all'; // Wait for categories to load
    const found = categories.find(cat => cat.slug === urlCategorySlug);
    return found?._id || 'all';
  }, [urlCategorySlug, categories]);

  // Local state for filters
  const [category, setCategory] = useState(categoryBySlug);
  const [page, setPage] = useState(urlPage);
  const [limit] = useState(24);
  const [stockFilter] = useState('active');
  const [sortBy, setSortBy] = useState('az'); // Default to alphabetical (A-Z) sorting

  // Update category when URL changes
  useEffect(() => {
    if (categoryBySlug !== category) {
      setCategory(categoryBySlug);
    }
  }, [categoryBySlug]);

  // Local state for UI-specific functionality
  const [quantities, setQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [previewImage, setPreviewImage] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [openCheckoutDialog, setOpenCheckoutDialog] = useState(false);
  const isCategoryChangingRef = useRef(false);
  
  const dispatch = useDispatch();
  const { openDrawer } = useAuthDrawer();
  const toast = useToast();
  
  // Update URL params when category changes
  const updateURLParams = useCallback((updates) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });
    
    // Reset page to 1 when category changes (unless explicitly set)
    if (updates.category !== undefined) {
      if (updates.page === undefined) {
        newParams.set('page', '1');
      }
    }
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  // Find category slug from ID (outside useEffect)
  const categorySlug = useMemo(() => {
    if (category === 'all') return 'all';
    const found = categories?.find(cat => cat._id === category);
    return found?.slug || 'all';
  }, [category, categories]);

  // Sync URL params with state (but avoid loops)
  useEffect(() => {
    // Skip sync if we're manually changing category
    if (isCategoryChangingRef.current) {
      isCategoryChangingRef.current = false;
      return;
    }
    
    const currentCategorySlug = searchParams.get('category') || 'all';
    const currentPage = searchParams.get('page') || '1';
    
    const updates = {};
    let hasUpdates = false;
    
    // Compare slug instead of ID
    if (categorySlug !== currentCategorySlug) {
      updates.category = categorySlug === 'all' ? null : categorySlug;
      hasUpdates = true;
    }
    
    if (page.toString() !== currentPage && page > 1) {
      updates.page = page.toString();
      hasUpdates = true;
    } else if (page === 1 && currentPage !== '1') {
      updates.page = null;
      hasUpdates = true;
    }
    
    if (hasUpdates) {
      updateURLParams(updates);
    }
  }, [category, page, categorySlug, updateURLParams, searchParams]);

  // Categories already fetched above
  const { products: productList = [], status, totalItems, currentPage, totalPages } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const { items: cartItems = [] } = useSelector((s) => s.cart);
  
  
  // Calculate total quantity
  const totalQuantity = useMemo(() => 
    cartItems.reduce((sum, item) => sum + item.quantity, 0), 
    [cartItems]
  );

  // Use pagination hook to eliminate pagination duplication
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 24,
    totalItems,
    onPageChange: (newPage) => {
      setPage(newPage);
    }
  });

  // Memoized combined categories - filter to show only active categories
  const combinedCategories = useMemo(() => {
    // Filter to show only active categories (active === true)
    const activeCategories = (categories || []).filter(cat => cat.active === true);
    const allCategories = [
      { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
      ...activeCategories
    ];
    // Sort by position if position exists, otherwise keep original order
    return allCategories.sort((a, b) => {
      if (a._id === 'all') return -1; // Keep 'All' at the beginning
      if (b._id === 'all') return 1;
      const posA = a.position ?? 999;
      const posB = b.position ?? 999;
      return posA - posB;
    });
  }, [categories]);

  // Products are now sorted on the backend, so we use them directly
  const sortedProducts = useMemo(() => {
    // The backend already handles filtering, so we just need to ensure products exist and are valid
    return productList.filter((product) => product && product._id);
  }, [productList]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);


  // Fetch products when filters change
  useEffect(() => {
    const params = {
      page,
      limit,
      stockFilter,
      sortBy
    };

    // Add category if not 'all'
    if (category && category !== 'all') {
      params.category = category;
    }

    dispatch(fetchProducts(params));
  }, [dispatch, page, limit, stockFilter, sortBy, category]);

  // Fetch categories on mount and ensure they stay loaded
  useEffect(() => {
    dispatch(AllCategory(''));
  }, [dispatch]);

  // Ensure categories are always available (refetch if empty)
  useEffect(() => {
    if ((!categories || categories.length === 0) && categoriesStatus !== 'loading') {
      dispatch(AllCategory(''));
    }
  }, [dispatch, categories, categoriesStatus]);

  // Initialize quantities when products change
  useEffect(() => {
    if (productList && productList.length > 0) {
      setQuantities((prev) => {
        const updatedQuantities = { ...prev };
        let hasChanges = false;
        
        productList.filter(product => product && product._id).forEach((product) => {
          // Only initialize if not already set (preserve user input)
          if (updatedQuantities[product._id] === undefined) {
            updatedQuantities[product._id] = 0;
            hasChanges = true;
          }
        });
        
        // Only update state if there are new products to initialize
        return hasChanges ? updatedQuantities : prev;
      });
    }
  }, [productList]);

  // Scroll detection for both desktop and mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', checkMobile);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // Optimized handlers
  const handleQuantityChange = useCallback((productId, value, stock) => {
    if (value === '') {
      return setQuantities((prev) => ({ ...prev, [productId]: '' }));
    }
    const newValue = Math.max(Math.min(parseInt(value), stock), 0);
    setQuantities((prev) => ({ ...prev, [productId]: newValue }));
  }, []);

  const handleAddToCart = useCallback((product) => {
    if (!user) {
      openDrawer('login');
      return;
    }

    // Get quantity from state, default to 0 if not set
    const qty = parseInt(quantities[product._id]) || 0;
    
    // Ensure quantity is valid and within stock limits
    if (qty <= 0 || qty > product.stock) {
      toast.error(`Please select a valid quantity. Available stock: ${product.stock}`);
      return;
    }

    setAddingProductId(product._id);
    dispatch(addToCart({
      productId: product._id,
      quantity: qty
    })).then(() => {
      toast.success(`${qty} ${qty === 1 ? 'item' : 'items'} added to cart!`);
    }).catch((error) => {
      // If user is authenticated but getting error, it might be a cookie issue
      if (!user) {
        openDrawer('login');
      } else {
        toast.error(error || 'Failed to add item to cart');
      }
    }).finally(() => setAddingProductId(null));
      }, [dispatch, navigate, quantities, user, openDrawer, toast]);

  // Memoized handlers for child components
  const handleCategorySelect = useCallback((categoryId) => {
    // Set flag to prevent sync useEffect from interfering
    isCategoryChangingRef.current = true;
    
    // Find category slug from ID
    const categorySlug = categoryId === 'all' ? 'all' : 
      (categories?.find(cat => cat._id === categoryId)?.slug || 'all');
    
    // Update category and page
    setCategory(categoryId);
    setPage(1);
    
    // Create new URL params from current URL and explicitly remove search
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.delete('search'); // Explicitly remove search parameter
    if (categorySlug === 'all') {
      currentParams.delete('category'); // Remove category param for 'all'
    } else {
      currentParams.set('category', categorySlug);
    }
    currentParams.delete('page'); // Remove page to reset to 1
    
    // Build new URL
    const newSearch = currentParams.toString();
    const newUrl = newSearch ? `/products?${newSearch}` : '/products';
    
    // Update URL using navigate to ensure it updates properly
    navigate(newUrl, { replace: true });
    
    // Scroll to top when selecting a category
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [categories, dispatch, navigate]);

  const handleGridTypeChange = useCallback((type) => {
    setGridType(type);
  }, []);

  const handleSortChange = useCallback((order) => {
    setSortBy(order);
  }, []);

  const handlePageChange = useCallback((newPage) => {
    pagination.setCurrentPage(newPage);
    // Update URL params for page
    updateURLParams({ page: newPage === 1 ? null : newPage.toString() });
  }, [pagination, updateURLParams]);
  
  const handlePreviewImage = useCallback((image) => {
    setPreviewImage(image);
  }, []);

  const handleBuyNow = useCallback(() => {
    if (!user) {
      openDrawer('login');
      return;
    }
    if (cartItems.length === 0) {
      return;
    }
    setOpenCheckoutDialog(true);
  }, [user, cartItems.length, navigate]);
  
  const loadingProducts = status === 'loading';
  
  return (
    <div className="max-w-7xl lg:mx-auto lg:px-4 py-2 lg:py-8">
      {/* Mobile Header - Only visible on mobile */}
      {isMobile && (
        <>
          {/* Logo Section - Hides on scroll */}
          <div className={`fixed top-0 left-0 right-0 z-50 ${isScrolled ? 'bg-white border-b border-gray-200' : 'bg-primary/10 border-b border-primary/20'} shadow-sm lg:hidden transition-all duration-300 ease-in-out ${isScrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
            <div className="px-4 py-3">
              <div className="flex items-center justify-center">
                <Link to="/" className="flex items-center space-x-2">
                  <div className="flex-shrink-0">
                    <img
                      src="/logo.jpeg"
                      alt="GULTRADERS Logo"
                      className="h-8 w-auto object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-primary">GULTRADERS</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>

        </>
      )}
      
      {/* Fixed Categories Container */}
      <div className={`fixed ${isMobile ? (isScrolled ? 'top-[52px]' : 'top-[112px]') : 'top-14'} left-0 right-0 z-40 ${isMobile ? (isScrolled ? 'bg-white' : 'bg-primary/10') : 'bg-white/95 border-b border-gray-200/50'} backdrop-blur-xl shadow-md pb-2 transition-all duration-300`}>
        {/* Category Swiper */}
        <div className="max-w-7xl lg:mx-auto">
          {combinedCategories && combinedCategories.length > 0 ? (
            <CategorySwiper
              categories={combinedCategories}
              selectedCategory={category}
              onCategorySelect={handleCategorySelect}
            />
          ) : (
            // Show placeholder or loading state for categories
            <div className="mt-4 pb-6">
              <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="w-14 h-14 rounded-full bg-gray-200 animate-pulse"></div>
                    <div className="h-4 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div className={isMobile ? (isScrolled ? 'h-[140px]' : 'h-[240px]') : 'h-44 lg:h-34'}></div>


      {/* Product Grid */}
      <div className={isMobile ? "mt-4" : "mt-6"}>
        <ProductGrid
          products={sortedProducts}
          loading={loadingProducts}
          gridType={gridType}
          quantities={quantities}
          onQuantityChange={handleQuantityChange}
          onAddToCart={handleAddToCart}
          addingProductId={addingProductId}
          cartItems={cartItems}
          onPreviewImage={handlePreviewImage}
        />
      </div>

      {/* Pagination */}
      <div className="px-2 sm:px-0 mt-6 mb-4">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="rounded-lg shadow-lg object-contain w-full h-auto max-h-[90vh]"
              loading="eager"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 lg:right-24 xl:right-24 bg-black/70 hover:bg-primary text-white rounded-full p-1 px-2 text-sm md:text-base"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <div className="fixed animate-bounce bottom-18 lg:bottom-5 right-0 lg:right-2 z-50">
        <Link
          to="https://wa.me/923114000096?text=Hi%20How%20Are%20you%20?"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contact us on WhatsApp"
        >
          <img
            className="w-14 h-14"
            src="/WhatsApp.svg.webp"
            alt="WhatsApp"
            loading="lazy"
            width="56"
            height="56"
          />
        </Link>
      </div>

      {/* Checkout Dialog - Professional Design */}
      <Dialog open={openCheckoutDialog} onOpenChange={setOpenCheckoutDialog}>
        <DialogContent className="w-[95vw] max-w-full sm:w-[92vw] md:w-[88vw] lg:w-[92vw] lg:max-w-7xl xl:max-w-[90vw] h-[90vh] sm:h-[88vh] md:h-[85vh] lg:h-[90vh] overflow-hidden p-0 bg-transparent border-0 shadow-2xl flex flex-col m-2 sm:m-4">
          <DialogHeader className="sr-only">
            <DialogTitle>Checkout</DialogTitle>
            <DialogDescription>Complete your order</DialogDescription>
          </DialogHeader>
          <Checkout closeModal={() => setOpenCheckoutDialog(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProductList;