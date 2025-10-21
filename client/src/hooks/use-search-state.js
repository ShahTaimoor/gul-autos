import { useState, useEffect, useCallback } from 'react';
import { getPopularSearches } from '@/utils/searchAnalytics';

/**
 * Custom hook for managing search state and history
 * Eliminates duplication across components
 */
export const useSearchState = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [searchHistory, setSearchHistory] = useState([]);
  const [popularSearches, setPopularSearches] = useState([
    'toyota corolla grill',
    'honda civic bumper',
    'nissan altima headlight',
    'mazda 3 taillight',
    'hyundai elantra mirror'
  ]);

  // Load search history and popular searches from localStorage on mount
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

  // Update active search term when user types
  useEffect(() => {
    setActiveSearchTerm(searchTerm);
  }, [searchTerm]);

  // Handle search change
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value);
    // Clear selected product when search changes
    if (selectedProductId) {
      setSelectedProductId(null);
    }
  }, [selectedProductId]);

  // Handle search submit
  const handleSearchSubmit = useCallback((term, productId = null, suggestionIds = []) => {
    if (term && term.trim()) {
      const trimmedTerm = term.trim();
      
      // Add to search history
      if (!searchHistory.includes(trimmedTerm)) {
        const newHistory = [trimmedTerm, ...searchHistory.slice(0, 4)];
        setSearchHistory(newHistory);
        localStorage.setItem('searchHistory', JSON.stringify(newHistory));
      }
      
      // Set selected product if provided
      if (productId) {
        setSelectedProductId(productId);
      }
    } else {
      // Clear search
      setSelectedProductId(null);
    }
  }, [searchHistory]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchTerm('');
    setActiveSearchTerm('');
    setSelectedProductId(null);
  }, []);

  return {
    searchTerm,
    activeSearchTerm,
    selectedProductId,
    searchHistory,
    popularSearches,
    handleSearchChange,
    handleSearchSubmit,
    clearSearch,
    setSelectedProductId
  };
};
