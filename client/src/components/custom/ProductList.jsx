import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/redux/slices/cart/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import CartDrawer from './CartDrawer';
import CategorySwiper from './CategorySwiper';
import SearchBar from './SearchBar';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import { useDebounce } from '@/hooks/use-debounce';

// Import the optimized ProductCard component
import ProductCard from './ProductCard';

const ProductList = () => {
  // State management
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [quantities, setQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [sortOrder, setSortOrder] = useState('az');
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);
  
  const limit = 24;
  const cartRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux selectors
  const { categories } = useSelector((s) => s.categories);
  const { products: productList = [], status, totalPages } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const { items: cartItems = [] } = useSelector((s) => s.cart);

  // Debounced search to reduce API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Memoized combined categories
  const combinedCategories = useMemo(() => [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...(categories || [])
  ], [categories]);

  // Products are now sorted on the backend, so we use them directly
  const sortedProducts = useMemo(() => {
    return productList.filter((product) => product.stock > 0);
  }, [productList]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Fetch products with debounced search
  useEffect(() => {
    dispatch(fetchProducts({ 
      category, 
      searchTerm: debouncedSearchTerm, 
      page, 
      limit, 
      stockFilter: 'active',
      sortBy: sortOrder
    })).then((res) => {
      // Go back one page if current page has no results
      if (res.payload.products?.length === 0 && page > 1) {
        setPage((prev) => prev - 1);
      }
    });
  }, [dispatch, category, debouncedSearchTerm, page, limit, sortOrder]);

  // Fetch categories
  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  // Initialize quantities when products change
  useEffect(() => {
    if (productList.length > 0) {
      const initialQuantities = {};
      productList.forEach((product) => {
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
    setCategory(categoryId);
    setPage(1); // Reset to first page when changing category
  }, []);

  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    setPage(1); // Reset to first page when searching
  }, []);

  const handleGridTypeChange = useCallback((type) => {
    setGridType(type);
  }, []);

  const handleSortChange = useCallback((order) => {
    setSortOrder(order);
    setPage(1); // Reset to first page when changing sort order
  }, []);

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handlePreviewImage = useCallback((image) => {
    setPreviewImage(image);
  }, []);

  const loadingProducts = status === 'loading';

  return (
    <div className="max-w-7xl lg:mx-auto lg:px-4 py-6">
      {/* Category Swiper */}
      <CategorySwiper
        categories={combinedCategories}
        selectedCategory={category}
        onCategorySelect={handleCategorySelect}
      />

      {/* Search and Sort Bar */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        gridType={gridType}
        onGridTypeChange={handleGridTypeChange}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
      />

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
        cartRef={cartRef}
        onPreviewImage={handlePreviewImage}
      />

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalPages={totalPages}
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
      <div className="fixed top-6 right-16 md:right-8 z-50">
        <div
          ref={cartRef}
          className={`relative transition-all duration-300 ${
            cartItems.length > 0 ? 'animate-bounce' : ''
          }`}
        >
          <CartDrawer />
        </div>
      </div>

      {/* WhatsApp Button */}
      <div className="fixed animate-bounce bottom-3 lg:bottom-5 right-0 lg:right-2 z-50">
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