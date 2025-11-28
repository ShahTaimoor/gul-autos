import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchProducts } from '@/redux/slices/products/productSlice';
import { useDebounce } from './use-debounce';

/**
 * Custom hook for managing product search and fetching
 * Eliminates duplication across components
 */
export const useSearchProducts = ({
  initialCategory = 'all',
  initialPage = 1,
  initialLimit = 24,
  initialStockFilter = 'active',
  initialSortBy = 'az'
} = {}) => {
  const dispatch = useDispatch();
  
  const [category, setCategory] = useState(initialCategory);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [stockFilter, setStockFilter] = useState(initialStockFilter);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [allProducts, setAllProducts] = useState([]);
  const [enterSuggestionIds, setEnterSuggestionIds] = useState([]);
  const enterSuggestionIdsRef = useRef([]);
  const pendingRequestsRef = useRef(new Map());
  const lastRequestParamsRef = useRef(null);

  // Note: allProducts is kept for backward compatibility with client-side suggestions fallback
  // The backend /search-suggestions endpoint is preferred and used by default via useSearchSuggestions hook
  // This avoids fetching 2000+ products upfront, improving performance
  // If client-side suggestions are needed, fetch products on-demand instead of on mount

  // Handle search with debounced term and request deduplication
  const handleSearch = useCallback((searchTerm, debounceDelay = 150, overrideCategory = null, overridePage = null, overrideLimit = null) => {
    // Don't clear suggestion IDs here - they are managed by the caller
    // Only clear if explicitly clearing search AND no suggestion IDs are set
    if ((!searchTerm || searchTerm.trim() === '') && enterSuggestionIdsRef.current.length === 0) {
      // Only clear if there are no suggestion IDs to preserve
    }
    
    // If we have explicit suggestion/product IDs, fetch strictly by those IDs
    // Priority: If productIds are set, use them (even if search term is empty)
    const hasSuggestionIds = enterSuggestionIdsRef.current.length > 0;
    // Use override category if provided, otherwise use state category
    // Always use 'all' for search to make it category-independent when searching
    const currentCategory = overrideCategory !== null ? overrideCategory : category;
    // Normalize 'all' to lowercase string for consistency
    let searchCategory = hasSuggestionIds ? 'all' : (searchTerm ? 'all' : currentCategory);
    // Ensure 'all' is properly normalized
    if (searchCategory === 'all' || searchCategory === 'All' || searchCategory === 'ALL') {
      searchCategory = 'all';
    }
    // Use override page if provided, otherwise use state page
    const currentPage = overridePage !== null ? overridePage : page;
    const currentLimit = overrideLimit !== null ? overrideLimit : limit;
    // If we have product IDs, don't use search term - let backend filter by IDs
    const searchParam = hasSuggestionIds ? '' : (searchTerm || '');
    
    const productIdsParam = hasSuggestionIds ? enterSuggestionIdsRef.current.join(',') : undefined;

    // Create request key for deduplication
    const requestKey = `${searchCategory}-${searchParam}-${currentPage}-${currentLimit}-${stockFilter}-${sortBy}-${productIdsParam || ''}`;
    
    // Check if this exact request is already pending
    if (pendingRequestsRef.current.has(requestKey)) {
      return pendingRequestsRef.current.get(requestKey);
    }
    
    // Check if this is the same as the last request (no new data needed)
    if (lastRequestParamsRef.current === requestKey) {
      return Promise.resolve();
    }
    
    // Store request params for comparison
    lastRequestParamsRef.current = requestKey;

    // Make the API call
    const requestPromise = dispatch(fetchProducts({ 
      category: searchCategory, 
      searchTerm: searchParam, 
      page: currentPage, 
      limit: currentLimit, 
      stockFilter,
      sortBy,
      productIds: productIdsParam
    })).then((res) => {
      // Go back one page if current page has no results
      if (res.payload?.data?.length === 0 && currentPage > 1) {
        setPage((prev) => prev - 1);
      }
      // Remove from pending requests
      pendingRequestsRef.current.delete(requestKey);
    }).catch((error) => {
      console.error('Error fetching products:', error);
      // Remove from pending requests on error
      pendingRequestsRef.current.delete(requestKey);
    });
    
    // Store pending request
    pendingRequestsRef.current.set(requestKey, requestPromise);
    
    return requestPromise;
  }, [dispatch, category, page, limit, sortBy, stockFilter]);

  // Filter products - only basic validation, no search filtering (backend handles all search)
  const filterProducts = useCallback((products, searchTerm, selectedProductId) => {
    // Only filter out invalid products (no _id)
    // Backend already handles all search, category, and filtering logic
    let filtered = products.filter((product) => product && product._id);
    
    // If a specific product was selected from suggestions, show only that product
    if (selectedProductId) {
      filtered = filtered.filter(product => product._id === selectedProductId);
    }
    
    // No client-side search filtering - backend handles it all
    return filtered;
  }, []);

  // Handle page change without resetting search
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // Reset pagination when filters change
  const resetPagination = useCallback(() => {
    setPage(1);
  }, []);

  // Update category and reset pagination
  const updateCategory = useCallback((newCategory) => {
    // Ensure category is valid before updating
    if (!newCategory || newCategory === '') {
      newCategory = 'all';
    }
    setCategory(newCategory);
    resetPagination();
    // Clear suggestion IDs to ensure fresh category-based search
    setEnterSuggestionIds([]);
    enterSuggestionIdsRef.current = [];
    // Reset last request params to force new fetch
    lastRequestParamsRef.current = null;
    // Immediately trigger search with new category and page 1 to avoid stale closure issue
    // This ensures we fetch products for the new category immediately, not waiting for state updates
    handleSearch('', 0, newCategory, 1);
  }, [resetPagination, handleSearch]);

  // Update stock filter and reset pagination
  const updateStockFilter = useCallback((newStockFilter) => {
    setStockFilter(newStockFilter);
    resetPagination();
  }, [resetPagination]);

  // Update sort order and reset pagination
  const updateSortBy = useCallback((newSortBy) => {
    setSortBy(newSortBy);
    resetPagination();
  }, [resetPagination]);

  const updateLimit = useCallback((newLimit) => {
    const parsedLimit = Math.max(1, parseInt(newLimit, 10) || initialLimit);
    setLimit(parsedLimit);
    setPage(1);
    lastRequestParamsRef.current = null;
    // Fetch immediately with new page size
    handleSearch('', 0, null, 1, parsedLimit);
  }, [handleSearch, initialLimit]);

  return {
    // State
    category,
    page,
    limit,
    stockFilter,
    sortBy,
    allProducts,
    enterSuggestionIds,
    
    // Actions
    setCategory: updateCategory,
    setPage: handlePageChange,
    setStockFilter: updateStockFilter,
    setSortBy: updateSortBy,
    setLimit: updateLimit,
    setEnterSuggestionIds: (ids) => {
      setEnterSuggestionIds(ids);
      enterSuggestionIdsRef.current = ids;
      // If clearing suggestion IDs (empty array), reset last request params to force new fetch
      if (ids.length === 0) {
        lastRequestParamsRef.current = null;
      }
    },
    handleSearch,
    handlePageChange,
    filterProducts,
    resetPagination
  };
};
