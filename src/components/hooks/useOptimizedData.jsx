import { useState, useEffect, useMemo, useCallback } from 'react';

// Custom hook for optimized data fetching with caching
export const useOptimizedData = (entityClass, filters = {}, sortBy = '-created_date', limit = 50, cacheKey = null) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);

  // Create cache key from parameters
  const key = cacheKey || `${entityClass.name}_${JSON.stringify(filters)}_${sortBy}_${limit}`;

  // Check cache first
  const getCachedData = useCallback(() => {
    try {
      const cached = sessionStorage.getItem(key);
      if (cached) {
        const { data: cachedData, timestamp } = JSON.parse(cached);
        // Cache for 5 minutes
        if (Date.now() - timestamp < 300000) {
          return cachedData;
        }
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
    return null;
  }, [key]);

  // Cache data
  const setCachedData = useCallback((data) => {
    try {
      sessionStorage.setItem(key, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }, [key]);

  const loadData = useCallback(async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check cache for first page
      if (pageNumber === 1) {
        const cachedData = getCachedData();
        if (cachedData) {
          setData(cachedData);
          setHasMore(cachedData.length === limit);
          setIsLoading(false);
          return;
        }
      }

      // Calculate offset for pagination
      const offset = (pageNumber - 1) * limit;
      
      // Fetch data with pagination
      const result = await entityClass.list(sortBy, limit + 1, offset);
      
      const hasMoreData = result.length > limit;
      const pageData = hasMoreData ? result.slice(0, limit) : result;
      
      if (pageNumber === 1) {
        setData(pageData);
        setCachedData(pageData);
      } else {
        setData(prev => [...prev, ...pageData]);
      }
      
      setHasMore(hasMoreData);
      setPage(pageNumber);
    } catch (err) {
      console.error('Data loading error:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [entityClass, sortBy, limit, getCachedData, setCachedData]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadData(page + 1);
    }
  }, [isLoading, hasMore, page, loadData]);

  const refresh = useCallback(() => {
    sessionStorage.removeItem(key);
    loadData(1);
  }, [key, loadData]);

  useEffect(() => {
    loadData(1);
  }, [loadData]);

  return {
    data,
    isLoading,
    error,
    hasMore,
    loadMore,
    refresh
  };
};

// Hook for optimized filtering
export const useOptimizedFilter = (data, filterFn) => {
  return useMemo(() => {
    if (!filterFn || !data) return data;
    return data.filter(filterFn);
  }, [data, filterFn]);
};

// Hook for debounced search
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