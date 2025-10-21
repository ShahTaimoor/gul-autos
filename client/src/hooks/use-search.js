import { useSearchState } from './use-search-state';
import { useSearchSuggestions } from './use-search-suggestions';
import { useSearchProducts } from './use-search-products';
import { useDebounce } from './use-debounce';
import { trackSearch } from '@/utils/searchAnalytics';

/**
 * Combined search hook that provides all search functionality
 * This is the main hook to use in components
 */
export const useSearch = (options = {}) => {
  const searchState = useSearchState();
  const searchProducts = useSearchProducts(options);
  const searchSuggestions = useSearchSuggestions(searchProducts.allProducts);
  
  const { searchTerm, activeSearchTerm, handleSearchChange, handleSearchSubmit } = searchState;
  
  // Debounced search term
  const debouncedSearchTerm = useDebounce(activeSearchTerm, 150);

  // Handle search with tracking and analytics
  const handleSearchWithTracking = (term, productId = null, suggestionIds = []) => {
    if (term && term.trim()) {
      // Track search for analytics
      trackSearch(term);
      
      // Handle search submit with history management
      handleSearchSubmit(term, productId, suggestionIds);
      
      // Set suggestion IDs for backend filtering
      if (suggestionIds.length > 0) {
        searchProducts.setEnterSuggestionIds(suggestionIds);
      }
      
      // Scroll to top to see results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Generate suggestions for current search term
  const updateSuggestions = () => {
    if (searchTerm && searchTerm.trim().length >= 2) {
      const newSuggestions = searchSuggestions.generateSuggestions(searchTerm);
      searchSuggestions.setSuggestions(newSuggestions);
    } else {
      searchSuggestions.setSuggestions([]);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
    
    // Update the search term to match the clicked suggestion
    handleSearchChange(suggestionText);
    
    // Submit the search when clicking a suggestion
    handleSearchWithTracking(suggestionText, suggestion.product?._id);
  };

  return {
    // Search state
    ...searchState,
    
    // Search products
    ...searchProducts,
    
    // Search suggestions
    ...searchSuggestions,
    
    // Combined functionality
    debouncedSearchTerm,
    handleSearchWithTracking,
    handleSuggestionClick,
    updateSuggestions,
    handleSearch: searchProducts.handleSearch, // Expose the handleSearch method
    
    // Convenience methods
    handleSearchChange,
    handleSearchSubmit: handleSearchWithTracking
  };
};
