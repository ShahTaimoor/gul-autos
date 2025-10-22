import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { LayoutPanelLeft, Grid2x2, ChevronDown, X, Search } from 'lucide-react';
import { trackSearch } from '@/utils/searchAnalytics';

const SearchBar = React.memo(({ 
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  gridType, 
  onGridTypeChange,
  searchHistory = [],
  popularSearches = [],
  products = []
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const gridDropdownRef = useRef(null);

  // Generate product suggestions based on search term
  const generateSuggestions = useCallback((term) => {
    if (!term || term.length < 2 || !products || products.length === 0) return [];
    
    const searchTerm = term.toLowerCase().trim();
    const searchWords = searchTerm.split(/\s+/).filter(word => word.length > 0);
    
    // Filter products that match the search term with precision
    const matchingProducts = products
      .filter(product => {
        // Check if product exists, has title, and is active (stock > 0)
        if (!product || !product.title || product.stock <= 0) return false;
        const title = product.title.toLowerCase();
        const description = (product.description || '').toLowerCase();
        
        // Check if each search word exists in EITHER title OR description
        const allWordsMatch = searchWords.every(word => {
          const wordEscaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('(\\b|^)' + wordEscaped, 'i');
          // Each word can be in title OR description (not necessarily all in one)
          return regex.test(title) || regex.test(description);
        });
        
        return allWordsMatch;
      });
    
    const sortedProducts = matchingProducts.sort((a, b) => {
        const aTitle = a.title.toLowerCase();
        const bTitle = b.title.toLowerCase();
        
        // Priority 1: Exact phrase match at start
        const aStartsWithExact = aTitle.startsWith(searchTerm);
        const bStartsWithExact = bTitle.startsWith(searchTerm);
        if (aStartsWithExact && !bStartsWithExact) return -1;
        if (!aStartsWithExact && bStartsWithExact) return 1;
        
        // Priority 2: First word of search matches first word of title
        const aFirstWordMatch = aTitle.split(/\s+/)[0] === searchWords[0];
        const bFirstWordMatch = bTitle.split(/\s+/)[0] === searchWords[0];
        if (aFirstWordMatch && !bFirstWordMatch) return -1;
        if (!aFirstWordMatch && bFirstWordMatch) return 1;
        
        // Priority 3: Exact phrase anywhere in title
        const aContainsExact = aTitle.includes(searchTerm);
        const bContainsExact = bTitle.includes(searchTerm);
        if (aContainsExact && !bContainsExact) return -1;
        if (!aContainsExact && bContainsExact) return 1;
        
        // Priority 4: Shorter titles (more specific)
        return aTitle.length - bTitle.length;
      });
    
    const finalSuggestions = sortedProducts.slice(0, 10) // Limit to 10 suggestions
      .map(product => ({
        text: product.title,
        image: product.image || product.picture?.secure_url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=100&h=100&fit=crop&crop=center',
        product: product // Keep reference to full product
      }));
    
    return finalSuggestions;
  }, [products]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // Show suggestions only when actively searching (2+ characters)
    if (value.trim().length >= 2) {
      const newSuggestions = generateSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [onSearchChange, generateSuggestions]);

  const handleSearchSubmitAction = useCallback(() => {
    if (searchTerm.trim()) {
      setShowSuggestions(false);
      
      // Build current suggestions list and pass their IDs to the parent so
      // the backend can fetch exactly these products.
      const currentSuggestions = generateSuggestions(searchTerm.trim());
      const suggestionIds = currentSuggestions.map(s => s.product?._id).filter(Boolean);
      
      // Submit the search with suggestion IDs
      if (onSearchSubmit) {
        onSearchSubmit(searchTerm.trim(), null, suggestionIds);
      }
      
      // Track search for analytics
      trackSearch(searchTerm);
      
      // Add to search history
      if (searchHistory && !searchHistory.includes(searchTerm.trim())) {
        const newHistory = [searchTerm.trim(), ...searchHistory.slice(0, 4)];
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
      
      // Scroll to top to see results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [searchTerm, searchHistory, onSearchSubmit, generateSuggestions]);

  const handleSuggestionClick = useCallback((suggestion) => {
    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
    
    // Update the search term to match the clicked suggestion
    onSearchChange(suggestionText);
    setShowSuggestions(false);
    
    // Submit the search when clicking a suggestion
    if (onSearchSubmit) {
      // Pass the search term and product ID to show only that specific product
      onSearchSubmit(suggestionText, suggestion.product?._id);
    }
    
    // Scroll to top to see results
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    searchInputRef.current?.blur(); // Remove focus to hide keyboard on mobile
  }, [onSearchChange, onSearchSubmit]);

  const handleClearSearch = useCallback(() => {
    onSearchChange('');
    setShowSuggestions(false);
    setSuggestions([]);
    if (onSearchSubmit) {
      onSearchSubmit('', null, []); // Clear search with empty suggestion IDs
    }
    searchInputRef.current?.focus();
  }, [onSearchChange, onSearchSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      searchInputRef.current?.blur(); // Close keyboard
    } else if (e.key === 'Enter') {
      setShowSuggestions(false); // Hide suggestions when Enter is pressed
      handleSearchSubmitAction();
      searchInputRef.current?.blur(); // Close keyboard
    }
  }, [handleSearchSubmitAction]);

  // Close suggestions and dropdown when clicking outside
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
      <div className="flex items-center gap-2">
        {/* Search Input */}
        <div className="relative flex-1" ref={suggestionsRef}>
          <div className="relative w-full group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              ref={searchInputRef}
              id="search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder="Search products by name, description, or category"
              className="w-full pl-10 pr-8 h-12 text-base border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
              aria-label="Search products"
            />
            {/* Clear Search Button */}
            {searchTerm && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-full hover:bg-gray-100"
                aria-label="Clear search"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Product Suggestions Dropdown - Only show when actively searching */}
          {showSuggestions && searchTerm.trim().length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
              {/* Product Suggestions */}
              {suggestions.length > 0 && (
                <div className="p-2">
                  <div className="text-xs font-medium text-gray-500 px-2 py-1">Products</div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 rounded-md transition-colors duration-150 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="w-14 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        <img 
                          src={suggestion.image || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=100&h=100&fit=crop&crop=center'} 
                          alt={suggestion.text || suggestion}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=100&h=100&fit=crop&crop=center';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 text-sm line-clamp-2 leading-snug">{suggestion.text || suggestion}</div>
                        {suggestion.product && suggestion.product.description && (
                          <div className="text-xs text-gray-500 truncate mt-1 leading-relaxed">
                            {suggestion.product.description.substring(0, 65)}...
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Grid Layout Dropdown */}
        <div className="relative" ref={gridDropdownRef}>
          <button
            onClick={() => setShowGridDropdown(!showGridDropdown)}
            className="flex items-center gap-1.5 bg-white/60 shadow-sm backdrop-blur-sm px-2.5 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-200"
            aria-label="Select grid layout"
          >
            {React.createElement(currentGridButton.icon, { className: "h-4 w-4 text-gray-700" })}
            <ChevronDown className="h-3 w-3 text-gray-500" />
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
                      ? 'bg-[#FED700]/10 text-gray-900 font-medium'
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

export default SearchBar;

