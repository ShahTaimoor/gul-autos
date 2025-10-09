import React, { useCallback, useMemo, useState, useRef, useEffect } from 'react';
import { Input } from '../ui/input';
import { LayoutPanelLeft, Grid2x2, ChevronDown } from 'lucide-react';
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
    
    console.log('Generating suggestions for:', searchTerm, 'Words:', searchWords, 'Products available:', products.length);
    console.log('Sample products:', products.slice(0, 5).map(p => p.title));
    
    // Filter products that match the search term with precision
    const matchingProducts = products
      .filter(product => {
        if (!product || !product.title) return false;
        const title = product.title.toLowerCase();
        const description = (product.description || '').toLowerCase();
        
        // Check if each search word exists (flexible matching for suggestions)
        const allWordsMatchTitle = searchWords.every(word => {
          // Use word boundary OR start of string for more flexible matching
          const wordEscaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('(\\b|^)' + wordEscaped, 'i');
          return regex.test(title);
        });
        
        const allWordsMatchDesc = searchWords.every(word => {
          const wordEscaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp('(\\b|^)' + wordEscaped, 'i');
          return regex.test(description);
        });
        
        const matches = allWordsMatchTitle || allWordsMatchDesc;
        if (matches) {
          console.log('✅ Matched:', product.title);
        }
        return matches;
      });
    
    console.log('Products after filtering:', matchingProducts.length);
    if (matchingProducts.length === 0) {
      console.log('⚠️ No products matched! Check if products contain:', searchWords);
    }
    
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
    
    console.log('Products after sorting:', sortedProducts.length);
    
    const finalSuggestions = sortedProducts.slice(0, 10) // Limit to 10 suggestions
      .map(product => ({
        text: product.title,
        image: product.image || product.picture?.secure_url || 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=100&h=100&fit=crop&crop=center',
        product: product // Keep reference to full product
      }));
    
    console.log('Final suggestions:', finalSuggestions.length, finalSuggestions.map(p => p.text));
    return finalSuggestions;
  }, [products]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    onSearchChange(value);
    
    // Show suggestions only when actively searching (2+ characters)
    if (value.trim().length >= 2) {
      const newSuggestions = generateSuggestions(value);
      console.log('Search term:', value, 'Suggestions found:', newSuggestions.length);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  }, [onSearchChange, generateSuggestions]);

  const handleSearchSubmitAction = useCallback(() => {
    if (searchTerm.trim()) {
      console.log('Searching for:', searchTerm);
      setShowSuggestions(false);
      
      // Submit the search
      if (onSearchSubmit) {
        onSearchSubmit(searchTerm.trim());
      }
      
      // Track search for analytics
      trackSearch(searchTerm);
      
      // Add to search history
      if (searchHistory && !searchHistory.includes(searchTerm.trim())) {
        const newHistory = [searchTerm.trim(), ...searchHistory.slice(0, 4)];
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
    }
  }, [searchTerm, searchHistory, onSearchSubmit]);

  const handleSuggestionClick = useCallback((suggestion) => {
    const suggestionText = typeof suggestion === 'string' ? suggestion : suggestion.text;
    onSearchChange(suggestionText);
    setShowSuggestions(false);
    
    // Submit the search when clicking a suggestion
    if (onSearchSubmit) {
      onSearchSubmit(suggestionText);
    }
    
    searchInputRef.current?.focus();
  }, [onSearchChange, onSearchSubmit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    } else if (e.key === 'Enter') {
      handleSearchSubmitAction();
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
    <div className="px-2 sm:px-0">
      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1" ref={suggestionsRef}>
          <div className="relative w-full group">
            <Input
              ref={searchInputRef}
              id="search"
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              placeholder=" Search products by name or description..."
              className="w-full border-2 border-[#FED700] rounded-2xl px-4 py-3 text-sm outline-none bg-white/80 backdrop-blur-sm
              focus:outline-none focus:ring-4 focus:ring-[#EFD700] focus:border-[#FED700]
              transition-all duration-300 ease-out shadow-sm hover:shadow-md hover:border-[#EFD700]
              placeholder:text-gray-400"
              aria-label="Search products"
            />
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
            className="flex items-center gap-2 bg-white/60 shadow-sm backdrop-blur-sm px-3 py-2 rounded-full border border-gray-200 hover:bg-gray-100 transition-all duration-200"
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

