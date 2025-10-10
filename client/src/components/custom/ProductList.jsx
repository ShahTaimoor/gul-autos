import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '@/redux/slices/cart/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import CategorySwiper from './CategorySwiper';
import SearchBar from './SearchBar';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import { useDebounce } from '@/hooks/use-debounce';
import { getPopularSearches } from '@/utils/searchAnalytics';

// Import the optimized ProductCard component
import ProductCard from './ProductCard';

const ProductList = () => {
  // State management
  const [category, setCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState(''); // For actual search
  const [quantities, setQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [sortOrder, setSortOrder] = useState('az');
  const [page, setPage] = useState(1);
  const [previewImage, setPreviewImage] = useState(null);
  
  const limit = 24;
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux selectors
  const { categories } = useSelector((s) => s.categories);
  const { products: productList = [], status, totalPages } = useSelector((s) => s.products);
  const { user } = useSelector((s) => s.auth);
  const { items: cartItems = [] } = useSelector((s) => s.cart);

  // State for all products (for suggestions)
  const [allProducts, setAllProducts] = useState([]);

  // Debounced search to reduce API calls - reduced delay for better responsiveness
  const debouncedSearchTerm = useDebounce(activeSearchTerm, 150);

  // Search history and popular searches
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([
    'toyota corolla grill',
    'honda civic bumper',
    'nissan altima headlight',
    'mazda 3 taillight',
    'hyundai elantra mirror'
  ]);

  // Memoized combined categories
  const combinedCategories = useMemo(() => [
    { _id: 'all', name: 'All', image: 'https://cdn.pixabay.com/photo/2023/07/19/12/16/car-8136751_1280.jpg' },
    ...(categories || [])
  ], [categories]);

  // Load search history and popular searches from localStorage on component mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error parsing search history:', error);
        setSearchHistory([]);
      }
    }
    
    // Load popular searches from analytics
    const analyticsPopularSearches = getPopularSearches();
    if (analyticsPopularSearches.length > 0) {
      setPopularSearches(analyticsPopularSearches);
    }
  }, []);

  // Products are now sorted on the backend, so we use them directly
  const sortedProducts = useMemo(() => {
    let filtered = productList.filter((product) => product && product._id && product.stock > 0);
    
    // Additional filtering for search precision
    if (searchTerm && searchTerm.trim()) {
      const searchWords = searchTerm.toLowerCase().split(/\s+/);
      
      // If searching for specific parts, prioritize exact matches
      if (searchWords.includes('grill') || searchWords.includes('grille')) {
        // Prioritize products that actually contain "grill" in title or description
        filtered = filtered.sort((a, b) => {
          const aTitle = (a.title || '').toLowerCase();
          const bTitle = (b.title || '').toLowerCase();
          const aDesc = (a.description || '').toLowerCase();
          const bDesc = (b.description || '').toLowerCase();
          
          const aHasGrill = aTitle.includes('grill') || aTitle.includes('grille') || 
                           aDesc.includes('grill') || aDesc.includes('grille');
          const bHasGrill = bTitle.includes('grill') || bTitle.includes('grille') || 
                           bDesc.includes('grill') || bDesc.includes('grille');
          
          if (aHasGrill && !bHasGrill) return -1;
          if (!aHasGrill && bHasGrill) return 1;
          return 0;
        });
      }
    }
    
    return filtered;
  }, [productList, searchTerm]);

  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  // Fetch products with debounced search
  useEffect(() => {
    // When searching, ignore category filter to show all products
    const searchCategory = debouncedSearchTerm ? 'all' : category;
    
    // Reset to page 1 when search term changes
    if (debouncedSearchTerm !== activeSearchTerm && page > 1) {
      setPage(1);
      return;
    }
    
    dispatch(fetchProducts({ 
      category: searchCategory, 
      searchTerm: debouncedSearchTerm, 
      page, 
      limit, 
      stockFilter: 'active',
      sortBy: sortOrder
    })).then((res) => {
      // Go back one page if current page has no results
      if (res.payload?.data?.length === 0 && page > 1) {
        setPage((prev) => prev - 1);
      }
    }).catch((error) => {
      console.error('Error fetching products:', error);
    });
  }, [dispatch, category, debouncedSearchTerm, page, limit, sortOrder, activeSearchTerm]);

  // Fetch categories
  useEffect(() => {
    dispatch(AllCategory());
  }, [dispatch]);

  // Fetch products for suggestions (only once on mount) - increased limit for better suggestions
  useEffect(() => {
    const fetchSuggestions = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL;
        const response = await fetch(`${API_URL}/get-products?limit=2000&stockFilter=active&sortBy=az`);
        const data = await response.json();
        if (data?.data) {
          setAllProducts(data.data);
        }
      } catch (error) {
        console.error('Error fetching products for suggestions:', error);
      }
    };
    fetchSuggestions();
  }, []);

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
    setCategory(categoryId);
    setSearchTerm(''); // Clear search when selecting category
    setActiveSearchTerm(''); // Clear active search
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

  // Handle search submission
  const handleSearchSubmit = useCallback((term) => {
    setActiveSearchTerm(term);
    setPage(1); // Reset to first page when searching
  }, []);

  const loadingProducts = status === 'loading';

  return (
    <div className="max-w-7xl lg:mx-auto lg:px-4 py-6">
      {/* Search and Sort Bar */}
      <SearchBar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        onSearchSubmit={handleSearchSubmit}
        gridType={gridType}
        onGridTypeChange={handleGridTypeChange}
        searchHistory={searchHistory}
        popularSearches={popularSearches}
        products={allProducts}
      />

      {/* Category Swiper */}
      <CategorySwiper
        categories={combinedCategories}
        selectedCategory={category}
        onCategorySelect={handleCategorySelect}
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