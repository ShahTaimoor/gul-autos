import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/redux/slices/cart/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import CategorySwiper from './CategorySwiper';
import SearchBar from './SearchBar';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import { useSearch } from '@/hooks/use-search';
import { usePagination } from '@/hooks/use-pagination';

// Import the optimized ProductCard component
import ProductCard from './ProductCard';

const ProductList = () => {
  // Use the search hook to eliminate duplication
  const search = useSearch({
    initialCategory: 'all',
    initialPage: 1,
    initialLimit: 24,
    initialStockFilter: 'active',
    initialSortBy: 'az'
  });

  // Local state for UI-specific functionality
  const [quantities, setQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [previewImage, setPreviewImage] = useState(null);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux selectors
  const { categories } = useSelector((s) => s.categories);
  const { products: productList = [], status, totalItems } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const { items: cartItems = [] } = useSelector((s) => s.cart);

  // Use pagination hook to eliminate pagination duplication
  const pagination = usePagination({
    initialPage: 1,
    initialLimit: 24,
    totalItems,
    onPageChange: (page) => {
      search.handlePageChange(page);
    }
  });

  // Memoized combined categories
  const combinedCategories = useMemo(() => [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...(categories || [])
  ], [categories]);

  // Products are now sorted on the backend, so we use them directly
  const sortedProducts = useMemo(() => {
    // The backend already handles filtering, so we just need to ensure products exist and are valid
    return productList.filter((product) => product && product._id);
  }, [productList]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [search.page]);

  // Fetch products with debounced search using the hook
  useEffect(() => {
    search.handleSearch(search.debouncedSearchTerm);
  }, [search.debouncedSearchTerm, search.category, search.page, search.sortBy, search.enterSuggestionIds, search.handleSearch]);

  // Fetch categories
  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  // Initialize quantities when products change
  useEffect(() => {
    if (productList.length > 0) {
      const initialQuantities = {};
      productList.filter(product => product && product._id).forEach((product) => {
        initialQuantities[product._id] = product.stock > 0 ? 1 : 0;
      });
      setQuantities(initialQuantities);
    }
  }, [productList]);

  // Optimized handlers
  const handleQuantityChange = useCallback((productId, value, stock) => {
    if (value === '') {
      return setQuantities((prev) => ({ ...prev, [productId]: '' }));
    }
    const newValue = Math.max(Math.min(parseInt(value), stock), 1);
    setQuantities((prev) => ({ ...prev, [productId]: newValue }));
  }, []);

  const handleAddToCart = useCallback((product) => {
    if (!user) {
      toast.warning('You must login first');
      navigate('/login');
      return;
    }

    const qty = parseInt(quantities[product._id]);
    if (!qty || qty <= 0) {
      toast.warning('Please select at least 1 item');
      return;
    }

    setAddingProductId(product._id);
    dispatch(addToCart({
      productId: product._id,
      quantity: qty
    })).then(() => {
      toast.success('Product added to cart');
      setQuantities((prev) => ({ ...prev, [product._id]: 1 }));
    }).finally(() => setAddingProductId(null));
  }, [dispatch, navigate, quantities, user]);

  // Memoized handlers for child components
  const handleCategorySelect = useCallback((categoryId) => {
    search.setCategory(categoryId);
    search.clearSearch(); // Clear search when selecting category
    // Scroll to top when selecting a category
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [search]);

  // Add function to clear selected product and return to normal view
  const handleClearSelectedProduct = useCallback(() => {
    search.setSelectedProductId(null);
    search.clearSearch();
  }, [search]);

  const handleGridTypeChange = useCallback((type) => {
    setGridType(type);
  }, []);

  const handleSortChange = useCallback((order) => {
    search.setSortBy(order);
  }, [search]);

  const handlePageChange = useCallback((newPage) => {
    pagination.setCurrentPage(newPage);
  }, [pagination]);

  const handlePreviewImage = useCallback((image) => {
    setPreviewImage(image);
  }, []);

  const loadingProducts = status === 'loading';

  return (
    <div className="max-w-7xl lg:mx-auto lg:px-4 py-2 lg:py-8">
      {/* Fixed Search and Categories Container */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-200/50 shadow-md pb-2">
        {/* Search and Sort Bar */}
        <div className="max-w-7xl lg:mx-auto lg:px-4 pt-4 lg:mt-14">
          <SearchBar
            searchTerm={search.searchTerm}
            onSearchChange={search.handleSearchChange}
            onSearchSubmit={search.handleSearchWithTracking}
            gridType={gridType}
            onGridTypeChange={handleGridTypeChange}
            searchHistory={search.searchHistory}
            popularSearches={search.popularSearches}
            products={search.allProducts}
          />
        </div>

        {/* Category Swiper */}
        <div className="max-w-7xl lg:mx-auto lg:px-4">
          <CategorySwiper
            categories={combinedCategories}
            selectedCategory={search.category}
            onCategorySelect={search.setCategory}
          />
        </div>
      </div>

      {/* Spacer to prevent content from going under fixed header */}
      <div className="h-52"></div>

     

      {/* Product Grid */}
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
        searchTerm={search.searchTerm}
      />

      {/* Pagination */}
      <Pagination
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

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
              className="absolute top-2 right-2 md:top-4 md:right-4 lg:right-24 xl:right-24 bg-black/70 hover:bg-red-500 text-white rounded-full p-1 px-2 text-sm md:text-base"
              aria-label="Close preview"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer */}

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
    </div>
  );
};

export default ProductList;