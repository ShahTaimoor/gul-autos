import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDebounce } from '@/hooks/use-debounce';
import { searchProducts } from '@/redux/slices/products/productSlice';
import { Input } from '../ui/input';
import { Search, X, Loader2 } from 'lucide-react';
import LazyImage from '../ui/LazyImage';

const SearchSuggestions = ({ 
  placeholder = "Search products...", 
  onSelectProduct,
  onSearch,
  className = "",
  inputClassName = "",
  showButton = false,
  buttonText = "Search",
  value,
  onChange
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Initialize state from URL if not controlled
  const initialSearchValue = value !== undefined ? value : (searchParams.get('search') || '');
  const [internalSearchQuery, setInternalSearchQuery] = useState(initialSearchValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchContainerRef = useRef(null);
  const suggestionsRef = useRef(null);
  const prevUrlSearchRef = useRef(initialSearchValue);

  // Get current search value from URL (as string for dependency tracking)
  const urlSearchValue = searchParams.get('search') || '';

  // Sync internal state with URL search param if not controlled
  useEffect(() => {
    if (value === undefined) {
      // Only update if URL value actually changed
      if (urlSearchValue !== prevUrlSearchRef.current) {
        prevUrlSearchRef.current = urlSearchValue;
        setInternalSearchQuery(urlSearchValue);
        // Hide suggestions when search is cleared
        if (!urlSearchValue) {
          setShowSuggestions(false);
          setSelectedIndex(-1);
        }
      }
    }
  }, [urlSearchValue, value]);

  // Use controlled value if provided, otherwise use internal state
  const searchQuery = value !== undefined ? value : internalSearchQuery;

  const { searchResults, searchStatus, searchQuery: reduxSearchQuery } = useSelector((state) => state.products);
  
  // Filter out duplicate products by _id
  const uniqueSearchResults = useMemo(() => {
    if (!searchResults || searchResults.length === 0) return [];
    
    const uniqueResults = [];
    const seenIds = new Set();
    
    for (const product of searchResults) {
      const productId = product._id?.toString();
      if (productId && !seenIds.has(productId)) {
        seenIds.add(productId);
        uniqueResults.push(product);
      }
    }
    
    return uniqueResults;
  }, [searchResults]);
  
  // Debounce search query for API calls (reduced delay for faster response)
  const debouncedQuery = useDebounce(searchQuery, 150);

  // Fetch suggestions when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 1) {
      dispatch(searchProducts({ query: debouncedQuery, limit: 8 }));
    }
  }, [debouncedQuery, dispatch]);

  // Show suggestions immediately when user types (not debounced)
  useEffect(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length >= 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const trimmedValue = newValue.trim();
    
    // If onChange is provided, it expects the value directly, not an event
    if (onChange && typeof onChange === 'function') {
      onChange(newValue);
    } else {
      setInternalSearchQuery(newValue);
    }
    setSelectedIndex(-1);
    
    // Show suggestions immediately when typing or backspacing (if still has text)
    // Set this immediately based on the new value, not waiting for state to update
    if (trimmedValue.length >= 1) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    // Clear internal state
    setInternalSearchQuery('');
    
    // If onChange is provided (controlled mode), call it to clear the controlled value
    if (onChange && typeof onChange === 'function') {
      onChange('');
    }
    
    // Hide suggestions
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, [onChange]);

  // Handle product selection
  const handleSelectProduct = useCallback((product) => {
    // Update internal state always
    setInternalSearchQuery(product.title);
    // If onChange is provided (controlled mode), also call it
    if (onChange && typeof onChange === 'function') {
      onChange(product.title);
    }
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      // Default behavior: navigate to products page with search
      navigate(`/products?search=${encodeURIComponent(product.title)}`);
    }
  }, [navigate, onSelectProduct, onChange]);

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || !uniqueSearchResults || uniqueSearchResults.length === 0) {
      if (e.key === 'Enter' && searchQuery.trim()) {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => 
          prev < uniqueSearchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && uniqueSearchResults[selectedIndex]) {
          handleSelectProduct(uniqueSearchResults[selectedIndex]);
        } else if (searchQuery.trim()) {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
      default:
        break;
    }
  };

  // Handle search button click
  const handleSearch = useCallback(() => {
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery.length === 0) {
      return;
    }
    setShowSuggestions(false);
    dispatch(searchProducts({ query: trimmedQuery, limit: 100 }));
    
    if (onSearch) {
      onSearch(trimmedQuery);
    } else if (!onSelectProduct) {
      navigate(`/products?search=${encodeURIComponent(trimmedQuery)}`);
    }
  }, [searchQuery, dispatch, navigate, onSelectProduct, onSearch]);

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  const isLoading = searchStatus === 'loading' && searchQuery.trim().length >= 1;
  const hasResults = uniqueSearchResults && uniqueSearchResults.length > 0;
  const showDropdown = showSuggestions && searchQuery.trim().length >= 1;

  return (
    <div className={`relative ${className}`} ref={searchContainerRef}>
      <div className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 md:h-5 md:w-5" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              const trimmedQuery = searchQuery.trim();
              if (trimmedQuery.length >= 1) {
                setShowSuggestions(true);
              }
            }}
            className={`pl-10 pr-10 ${inputClassName}`}
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 md:h-5 md:w-5" />
            </button>
          )}
        </div>
        {showButton && (
          <button
            onClick={handleSearch}
            disabled={searchStatus === 'loading' || !searchQuery.trim()}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {searchStatus === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </>
            ) : (
              buttonText
            )}
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showDropdown && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span className="ml-2 text-sm text-gray-600">Searching...</span>
            </div>
          ) : hasResults ? (
            <div ref={suggestionsRef} className="py-1">
              {uniqueSearchResults.map((product, index) => {
                const productImage = product.image || product.picture?.secure_url || '/logo.jpeg';
                const isSelected = index === selectedIndex;
                
                return (
                  <div
                    key={product._id}
                    onClick={() => handleSelectProduct(product)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-primary/10 border-l-4 border-primary'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    }`}
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-md overflow-hidden border border-gray-200 bg-gray-100">
                      <LazyImage
                        src={productImage}
                        alt={product.title}
                        className="w-full h-full object-cover"
                        fallback="/logo.jpeg"
                        quality={80}
                      />
                    </div>
                    
                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm md:text-base text-gray-900 line-clamp-2">
                        {product.title}
                      </h4>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No products found for &quot;{debouncedQuery}&quot;
            </div>
          )}
          
          {/* View All Results Link */}
          {hasResults && debouncedQuery.trim() && (
            <div className="border-t border-gray-200 p-2">
              <button
                onClick={() => {
                  setShowSuggestions(false);
                  if (onSearch) {
                    onSearch(debouncedQuery.trim());
                  } else if (!onSelectProduct) {
                    navigate(`/products?search=${encodeURIComponent(debouncedQuery.trim())}`);
                  }
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 rounded-md transition-colors flex items-center justify-between"
              >
                <span>View all results for &quot;{debouncedQuery}&quot;</span>
                <Search className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchSuggestions;
