import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { addToCart } from '@/redux/slices/cart/cartSlice';
import { AllCategory } from '@/redux/slices/categories/categoriesSlice';
import SearchBar from '@/components/custom/SearchBar';
import ProductGrid from '@/components/custom/ProductGrid';
import Pagination from '@/components/custom/Pagination';
import { useSearch } from '@/hooks/use-search';
import { usePagination } from '@/hooks/use-pagination';
import { toast } from 'sonner';
import { PackageSearch, Search, TrendingUp, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthDrawer } from '@/contexts/AuthDrawerContext';

/**
 * Shopify-style Search Results Page
 * Displays search results with highlighted keywords, filters, and pagination
 */
const SearchResults = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get search query from URL
  const searchQuery = searchParams.get('q') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const sortBy = searchParams.get('sort') || 'relevance';
  
  // Redux state
  const { products, status, totalItems, totalPages } = useSelector((state) => state.products);
  const { categories } = useSelector((state) => state.categories);
  const { user } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  const { openDrawer } = useAuthDrawer();
  
  // Get totalPages from Redux or calculate from totalItems
  const calculatedTotalPages = totalPages || Math.ceil(totalItems / 24);
  
  // Use search hook
  const search = useSearch({
    initialCategory: 'all',
    initialPage: currentPage,
    initialLimit: 24,
    initialStockFilter: 'active',
    initialSortBy: sortBy
  });
  
  // Use pagination hook
  const pagination = usePagination({
    initialPage: currentPage,
    initialLimit: 24,
    totalItems,
    onPageChange: (page) => {
      search.handlePageChange(page);
      updateURLParams({ page: page === 1 ? null : page.toString() });
    }
  });
  
  // Local state
  const [quantities, setQuantities] = useState({});
  const [addingProductId, setAddingProductId] = useState(null);
  const [gridType, setGridType] = useState('grid2');
  const [previewImage, setPreviewImage] = useState(null);
  
  // Update URL params helper
  const updateURLParams = useCallback((updates) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === undefined) {
        newParams.delete(key);
      } else {
        newParams.set(key, value.toString());
      }
    });
    
    setSearchParams(newParams, { replace: true });
  }, [searchParams, setSearchParams]);
  
  // Initialize search term from URL on mount
  useEffect(() => {
    if (searchQuery && searchQuery.trim()) {
      search.handleSearchChange(searchQuery);
      search.handleSearchSubmit(searchQuery.trim());
    }
  }, []); // Only run on mount
  
  // Sync URL params with search state
  useEffect(() => {
    if (searchQuery && searchQuery !== search.activeSearchTerm) {
      search.handleSearchChange(searchQuery);
      search.handleSearchSubmit(searchQuery.trim());
    }
  }, [searchQuery]);
  
  // Sync page and sort from URL
  useEffect(() => {
    if (currentPage !== search.page) {
      search.handlePageChange(currentPage);
    }
  }, [currentPage]);
  
  useEffect(() => {
    if (sortBy !== search.sortBy) {
      search.setSortBy(sortBy);
    }
  }, [sortBy]);
  
  // Fetch categories on mount
  useEffect(() => {
    dispatch(AllCategory(''));
  }, [dispatch]);
  
  // Initialize quantities
  useEffect(() => {
    if (products.length > 0) {
      const initialQuantities = {};
      products.forEach((product) => {
        if (product && product._id) {
          initialQuantities[product._id] = product.stock > 0 ? 1 : 0;
        }
      });
      setQuantities(initialQuantities);
    }
  }, [products]);
  
  // Handlers
  const handleSearchSubmit = useCallback((term, productId, suggestionIds) => {
    if (term && term.trim()) {
      updateURLParams({ q: term.trim(), page: null });
      navigate(`/search?q=${encodeURIComponent(term.trim())}`, { replace: false });
    } else {
      navigate('/products');
    }
  }, [navigate, updateURLParams]);
  
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
      openDrawer('login');
      return;
    }
    
    const qty = parseInt(quantities[product._id]) || 1;
    if (qty <= 0) {
      toast.warning('Please select at least 1 item');
      return;
    }
    
    setAddingProductId(product._id);
    dispatch(addToCart({
      productId: product._id,
      quantity: qty
    })).then(() => {
      toast.success('Product added to cart');
    }).finally(() => setAddingProductId(null));
      }, [dispatch, navigate, quantities, user, openDrawer]);
  
  const handleSortChange = useCallback((newSortBy) => {
    updateURLParams({ sort: newSortBy });
    search.setSortBy(newSortBy);
  }, [search, updateURLParams]);
  
  const handleGridTypeChange = useCallback((type) => {
    setGridType(type);
  }, []);
  
  const handlePreviewImage = useCallback((image) => {
    setPreviewImage(image);
  }, []);
  
  // Scroll to top on page change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);
  
  const loadingProducts = status === 'loading';
  const hasResults = products.length > 0;
  const hasSearchQuery = searchQuery.trim().length > 0;
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-6 lg:py-8">
        {/* Search Bar Section */}
        <div className="mb-6">
          <SearchBar
            searchTerm={searchQuery}
            onSearchChange={(value) => {
              // Update local state but don't navigate yet
            }}
            onSearchSubmit={handleSearchSubmit}
            gridType={gridType}
            onGridTypeChange={handleGridTypeChange}
            isRedBackground={false}
          />
        </div>
        
        {/* Search Results Header */}
        {hasSearchQuery && (
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Results Count and Query */}
              <div className="flex items-center gap-3">
                {loadingProducts ? (
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-gray-600">Searching...</span>
                  </div>
                ) : (
                  <>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {hasResults ? (
                        <>
                          {totalItems} {totalItems === 1 ? 'result' : 'results'} for{' '}
                          <span className="text-primary">"{searchQuery}"</span>
                        </>
                      ) : (
                        <>
                          No results for <span className="text-primary">"{searchQuery}"</span>
                        </>
                      )}
                    </h1>
                  </>
                )}
              </div>
              
              {/* Sort and Filter Controls */}
              {hasResults && (
                <div className="flex items-center gap-3">
                  <Select value={sortBy} onValueChange={handleSortChange}>
                    <SelectTrigger className="w-[180px]">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4" />
                        <SelectValue placeholder="Sort by" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relevance">Relevance</SelectItem>
                      <SelectItem value="az">Name: A-Z</SelectItem>
                      <SelectItem value="za">Name: Z-A</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* No Results Message - Shopify Style */}
        {!loadingProducts && hasSearchQuery && !hasResults && (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
              <PackageSearch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                No products found
              </h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching <strong>"{searchQuery}"</strong>
              </p>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Try:</p>
                <ul className="text-sm text-gray-600 space-y-1 text-left">
                  <li>• Check your spelling</li>
                  <li>• Use fewer or different keywords</li>
                  <li>• Browse our categories instead</li>
                </ul>
                <div className="pt-4">
                  <Button
                    onClick={() => navigate('/products')}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    Browse All Products
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {loadingProducts && hasSearchQuery && (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Searching products...</p>
            </div>
          </div>
        )}
        
        {/* Product Grid */}
        {hasResults && (
          <>
            <ProductGrid
              products={products}
              loading={loadingProducts}
              gridType={gridType}
              quantities={quantities}
              onQuantityChange={handleQuantityChange}
              onAddToCart={handleAddToCart}
              addingProductId={addingProductId}
              cartItems={cartItems}
              onPreviewImage={handlePreviewImage}
              searchTerm={searchQuery}
            />
            
            {/* Pagination */}
            {calculatedTotalPages > 1 && (
              <div className="mt-8">
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={calculatedTotalPages}
                  onPageChange={(page) => {
                    pagination.setCurrentPage(page);
                    updateURLParams({ page: page === 1 ? null : page.toString() });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                />
              </div>
            )}
          </>
        )}
        
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
                className="absolute top-2 right-2 md:top-4 md:right-4 bg-black/70 hover:bg-primary text-white rounded-full p-1 px-2 text-sm md:text-base"
                aria-label="Close preview"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;

