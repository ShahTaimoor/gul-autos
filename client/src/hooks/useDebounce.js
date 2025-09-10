import { useState, useEffect } from 'react';

// Custom hook for debouncing values
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Custom hook for debounced search
export const useDebouncedSearch = (initialValue = '', delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const debouncedSearchTerm = useDebounce(searchTerm, delay);

  return {
    searchTerm,
    debouncedSearchTerm,
    setSearchTerm
  };
};

// Custom hook for debounced API calls
export const useDebouncedApiCall = (apiCall, delay = 500) => {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const debouncedApiCall = useDebounce(apiCall, delay);

  useEffect(() => {
    if (debouncedApiCall) {
      setIsLoading(true);
      setError(null);
      
      debouncedApiCall()
        .then(result => {
          setData(result);
          setError(null);
        })
        .catch(err => {
          setError(err);
          setData(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [debouncedApiCall]);

  return { data, isLoading, error };
};
