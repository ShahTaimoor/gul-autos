import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Input } from '../ui/input';
import { LayoutPanelLeft, Grid2x2, ChevronDown, X, Search, Loader2, Package, Tag } from 'lucide-react';
import { trackSearch } from '@/utils/searchAnalytics';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchSearchSuggestions, clearSearchSuggestions } from '@/redux/slices/products/productSlice';
import { highlightKeywords } from '@/utils/highlightKeywords';
import { useDebounce } from '@/hooks/use-debounce';

const SearchBar = React.memo(({ 
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  gridType, 
  onGridTypeChange,
  searchHistory = [],
  popularSearches = [],
  products = [], // Keep for backward compatibility, but we'll use backend API
  isRedBackground = false
}) => {
  const dispatch = useDispatch();
  const { searchSuggestions, suggestionsStatus } = useSelector((state) => state.products);
  
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const gridDropdownRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Debounce search term for API calls (300ms delay)
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch suggestions from backend API when debounced search term changes
  useEffect(() => {
    // Clear previous abort controller
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Only fetch if search term is 2+ characters
    if (debouncedSearchTerm && debouncedSearchTerm.trim().length >= 2) {
      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();
      
      // Fetch suggestions from backend
      dispatch(fetchSearchSuggestions({ 
        query: debouncedSearchTerm, 
        limit: 10 
      }));
      
      setShowSuggestions(true);
    } else {
      // Clear suggestions if search term is too short
      dispatch(clearSearchSuggestions());
      setShowSuggestions(false);
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [debouncedSearchTerm, dispatch]);

  // Handle search input change
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // Show suggestions dropdown when user types (even before debounce)
    if (value.trim().length >= 2) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      dispatch(clearSearchSuggestions());
    }
  }, [onSearchChange, dispatch]);

  // Handle search submit (Enter key or button click)
  const handleSearchSubmitAction = useCallback(() => {
    setShowSuggestions(false);
    dispatch(clearSearchSuggestions());
    
    if (searchTerm.trim()) {
      // Submit the search - this will trigger navigation in ProductList
      if (onSearchSubmit) {
        onSearchSubmit(searchTerm.trim(), null, []);
      }
      
      // Track search for analytics
      trackSearch(searchTerm);
      
      // Add to search history
      if (searchHistory && !searchHistory.includes(searchTerm.trim())) {
        const newHistory = [searchTerm.trim(), ...searchHistory.slice(0, 4)];
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
    } else {
      // If search is empty, clear search and show all products
      if (onSearchSubmit) {
        onSearchSubmit('', null, []);
      }
    }
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [searchTerm, searchHistory, onSearchSubmit, dispatch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion) => {
    const suggestionText = suggestion.title || suggestion.text || suggestion;
    
    // Update the search term to match the clicked suggestion
    onSearchChange(suggestionText);
    setShowSuggestions(false);
    dispatch(clearSearchSuggestions());
    
    // Submit the search when clicking a suggestion
    if (onSearchSubmit) {
      // Pass the search term and product ID to show only that specific product
      onSearchSubmit(suggestionText, suggestion._id || suggestion.product?._id);
    }
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    searchInputRef.current?.blur(); // Remove focus to hide keyboard on mobile
  }, [onSearchChange, onSearchSubmit, dispatch]);

  // Handle clear search
  const handleClearSearch = useCallback(() => {
    onSearchChange('');
    setShowSuggestions(false);
    dispatch(clearSearchSuggestions());
    if (onSearchSubmit) {
      onSearchSubmit('', null, []);
    }
    searchInputRef.current?.focus();
  }, [onSearchChange, onSearchSubmit, dispatch]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      dispatch(clearSearchSuggestions());
      searchInputRef.current?.blur();
    } else if (e.key === 'Enter') {
      setShowSuggestions(false);
      dispatch(clearSearchSuggestions());
      handleSearchSubmitAction();
      searchInputRef.current?.blur();
    }
  }, [handleSearchSubmitAction, dispatch]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
      if (gridDropdownRef.current && !gridDropdownRef.current.contains(event.target)) {
        setShowGridDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format suggestions for display
  const formattedSuggestions = useMemo(() => {
    return searchSuggestions.map((product) => ({
      _id: product._id,
      title: product.title,
      image: product.image || product.picture?.secure_url || null,
      price: product.price,
      stock: product.stock,
      description: product.description || '',
      category: product.category?.name || product.category || 'Uncategorized'
    }));
  }, [searchSuggestions]);

  // Grid buttons configuration
  const gridButtons = useMemo(() => [
    { id: 'grid2', icon: Grid2x2, label: 'Grid 2x2' },
    { id: 'grid3', icon: LayoutPanelLeft, label: 'List View' }
  ], []);

  const currentGridButton = useMemo(() => 
    gridButtons.find(btn => btn.id === gridType) || gridButtons[0],
    [gridType, gridButtons]
  );

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mx-2 md:mx-0">
        {/* Search Input */}
        <div className="relative flex-1" ref={suggestionsRef}>
          <div className="relative w-full group">
            <Search className={`absolute left-3.5 md:left-2.5 top-1/2 transform -translate-y-1/2 h-5 w-5 md:h-4 md:w-4 ${isRedBackground ? 'text-primary' : 'text-gray-400'}`} />
            <Input
              ref={searchInputRef}
              id="search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search products by name, description, or category"
              className={`w-full pl-10 pr-8 md:pl-8 md:pr-6 h-10 md:h-8 text-sm border-2 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${isRedBackground ? 'border-red-300' : 'border-gray-200'}`}
              aria-label="Search products"
            />
            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className={`absolute right-3 md:right-2 top-1/2 -translate-y-1/2 transition-colors duration-200 p-0.5 rounded-full ${isRedBackground ? 'text-primary hover:text-primary/80 hover:bg-primary/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                aria-label="Clear search"
                type="button"
              >
                <X className="h-4 w-4 md:h-3.5 md:w-3.5" />
              </button>
            )}
          </div>

          {/* Enhanced Product Suggestions Dropdown */}
          <AnimatePresence mode="wait">
            {showSuggestions && searchTerm.trim().length >= 2 && (
              <motion.div
                initial={{ 
                  opacity: 0, 
                  y: -20, 
                  scale: 0.95,
                }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                }}
                exit={{ 
                  opacity: 0, 
                  y: -10, 
                  scale: 0.95,
                }}
                transition={{ 
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-96 overflow-hidden overflow-x-hidden"
              >
                {/* Loading State */}
                {suggestionsStatus === 'loading' && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-sm text-gray-600">Searching...</span>
                  </div>
                )}

                {/* Suggestions List */}
                {suggestionsStatus === 'succeeded' && formattedSuggestions.length > 0 && (
                  <div className="p-2 overflow-y-auto overflow-x-hidden max-h-96">
                    <div className="text-xs font-semibold text-gray-500 px-3 py-2 uppercase tracking-wide">
                      Products ({formattedSuggestions.length})
                    </div>
                    {formattedSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={`${suggestion._id || index}-${suggestion.title}`}
                        initial={{ 
                          opacity: 0, 
                          x: -20,
                        }}
                        animate={{ 
                          opacity: 1, 
                          x: 0,
                        }}
                        exit={{ 
                          opacity: 0, 
                          x: -10,
                        }}
                        transition={{ 
                          delay: index * 0.03,
                          duration: 0.2,
                          ease: [0.16, 1, 0.3, 1]
                        }}
                        whileHover={{ 
                          scale: 1.01,
                          x: 4,
                        }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full text-left px-3 py-3 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 rounded-lg transition-all duration-200 flex items-start gap-3 border-b border-gray-100 last:border-b-0 group overflow-hidden"
                      >
                        {/* Product Image */}
                        <motion.div 
                          className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200 group-hover:border-primary/30 transition-colors"
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ 
                            delay: index * 0.03 + 0.1,
                            duration: 0.3,
                          }}
                          whileHover={{ 
                            scale: 1.1, 
                            rotate: 2,
                          }}
                        >
                          {suggestion.image ? (
                            <img 
                              src={suggestion.image} 
                              alt={suggestion.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=100&h=100&fit=crop&crop=center';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </motion.div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0 space-y-1 overflow-hidden">
                          {/* Title with highlighted keywords */}
                          <div className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug">
                            {highlightKeywords(suggestion.title, searchTerm)}
                          </div>
                          
                          {/* Category Badge */}
                          <div className="flex items-center gap-2">
                            <Tag className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500 truncate">
                              {suggestion.category}
                            </span>
                          </div>

                          {/* Stock Status */}
                          <div className="flex items-center gap-3 mt-1">
                            {suggestion.stock > 0 ? (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                In Stock
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">
                                Out of Stock
                              </span>
                            )}
                          </div>

                          {/* Description with highlighted keywords */}
                          {suggestion.description && (
                            <div className="text-xs text-gray-500 line-clamp-1 mt-1">
                              {highlightKeywords(
                                suggestion.description.substring(0, 60) + '...',
                                searchTerm
                              )}
                            </div>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* No Results State */}
                {suggestionsStatus === 'succeeded' && formattedSuggestions.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <Package className="h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-600">No products found</p>
                    <p className="text-xs text-gray-500 mt-1">Try a different search term</p>
                  </div>
                )}

                {/* Error State */}
                {suggestionsStatus === 'failed' && (
                  <div className="flex flex-col items-center justify-center py-8 px-4">
                    <X className="h-12 w-12 text-red-300 mb-3" />
                    <p className="text-sm font-medium text-red-600">Error loading suggestions</p>
                    <p className="text-xs text-red-500 mt-1">Please try again</p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grid Layout Dropdown */}
        <div className="relative" ref={gridDropdownRef}>
          <button
            onClick={() => setShowGridDropdown(!showGridDropdown)}
            className={`flex items-center gap-1.5 shadow-sm backdrop-blur-sm px-4 py-2.5 md:px-2.5 md:py-1.5 h-10 md:h-auto rounded-lg border transition-all duration-200 ${isRedBackground ? 'bg-primary/10 border-primary hover:bg-primary/20' : 'bg-white/60 border-gray-200 hover:bg-gray-100'}`}
            aria-label="Select grid layout"
          >
            {React.createElement(currentGridButton.icon, { className: `h-5 w-5 md:h-4 md:w-4 ${isRedBackground ? 'text-primary' : 'text-gray-700'}` })}
            <ChevronDown className={`h-4 w-4 md:h-3 md:w-3 ${isRedBackground ? 'text-primary' : 'text-gray-500'}`} />
          </button>

          {/* Dropdown Menu */}
          {showGridDropdown && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-50 min-w-[140px] overflow-hidden">
              {gridButtons.map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => {
                    onGridTypeChange(id);
                    setShowGridDropdown(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 ${
                    gridType === id
                      ? 'bg-primary/10 text-gray-900 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SearchBar.displayName = 'SearchBar';

export default SearchBar;
