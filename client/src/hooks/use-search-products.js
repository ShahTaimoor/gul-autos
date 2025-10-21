import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [limit] = useState(initialLimit);
  const [stockFilter, setStockFilter] = useState(initialStockFilter);
  const [sortBy, setSortBy] = useState(initialSortBy);
  const [allProducts, setAllProducts] = useState([]);
  const [enterSuggestionIds, setEnterSuggestionIds] = useState([]);

  // Fetch products for suggestions (only once on mount)
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

  // Handle search with debounced term
  const handleSearch = useCallback((searchTerm, debounceDelay = 150) => {
    // If we have explicit suggestion/product IDs, fetch strictly by those IDs
    const hasSuggestionIds = enterSuggestionIds.length > 0;
    const searchCategory = hasSuggestionIds ? 'all' : (searchTerm ? 'all' : category);
    const searchParam = hasSuggestionIds ? '' : searchTerm;
    
    const productIdsParam = hasSuggestionIds ? enterSuggestionIds.join(',') : undefined;

    dispatch(fetchProducts({ 
      category: searchCategory, 
      searchTerm: searchParam, 
      page, 
      limit, 
      stockFilter,
      sortBy,
      productIds: productIdsParam
    })).then((res) => {
      // Go back one page if current page has no results
      if (res.payload?.data?.length === 0 && page > 1) {
        setPage((prev) => prev - 1);
      }
    }).catch((error) => {
      console.error('Error fetching products:', error);
    });
  }, [dispatch, category, page, limit, sortBy, enterSuggestionIds, stockFilter]);

  // Filter products based on search term (for additional client-side filtering)
  const filterProducts = useCallback((products, searchTerm, selectedProductId) => {
    let filtered = products.filter((product) => product && product._id);
    
    // If a specific product was selected from suggestions, show only that product
    if (selectedProductId) {
      filtered = filtered.filter(product => product._id === selectedProductId);
      return filtered;
    }
    
    // Additional filtering for search precision
    if (searchTerm && searchTerm.trim()) {
      const searchWords = searchTerm.toLowerCase().split(/\s+/);
      
      // Apply comprehensive search filtering for all search terms
      filtered = filtered.filter(product => {
        const title = (product.title || '').toLowerCase();
        const description = (product.description || '').toLowerCase();
        
        // Check if all search words are present in either title or description
        return searchWords.every(word => {
          const wordEscaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('(\\b|^)' + wordEscaped, 'i');
          return regex.test(title) || regex.test(description);
        });
      });
    }
    
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
    setCategory(newCategory);
    resetPagination();
  }, [resetPagination]);

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
    setEnterSuggestionIds,
    handleSearch,
    handlePageChange,
    filterProducts,
    resetPagination
  };
};
