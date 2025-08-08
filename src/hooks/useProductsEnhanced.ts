// Enhanced useProducts hook with comprehensive real-time updates
import { useState, useEffect, useCallback } from 'react';
import { appCache, cacheKeys, invalidateProductCache } from '@/lib/cache';
import { productUpdateManager } from '@/lib/productUpdateManager';

interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  image: string;
  images?: string[];
  status: string;
  stage?: string;
  votes: number;
  pledges: number;
  featured: boolean;
  slug?: string;
  originalPrice?: number;
  goal?: number;
  currentAmount?: number;
  endDate?: string;
  thumbnailConfig?: any;
  updatedAt?: string;
  [key: string]: any;
}

interface UseProductsOptions {
  autoRefresh?: boolean;
  cacheTime?: number;
  refreshInterval?: number;
  category?: string;
  status?: string;
  featured?: boolean;
}

interface UseProductsReturn {
  products: Product[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  refreshProducts: () => void;
  invalidateCache: () => void;
  lastUpdated: number;
}

export const useProductsEnhanced = (options: UseProductsOptions = {}): UseProductsReturn => {
  const { 
    autoRefresh = true, 
    cacheTime = 5 * 60 * 1000,
    refreshInterval = 30 * 1000,
    category,
    status,
    featured
  } = options;

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  // Build cache key based on filters
  const getCacheKey = useCallback(() => {
    const filters = { category, status, featured: featured ? 'true' : undefined };
    const filterString = Object.entries(filters)
      .filter(([_, value]) => value !== undefined)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
    return `${cacheKeys.PRODUCTS}${filterString ? `?${filterString}` : ''}`;
  }, [category, status, featured]);

  // Fetch products from API or cache
  const fetchProducts = useCallback(async (useCache: boolean = true): Promise<void> => {
    const cacheKey = getCacheKey();
    const now = Date.now();

    // Check cache first
    if (useCache) {
      const cachedData = appCache.get(cacheKey);
      if (cachedData && (now - lastFetch) < cacheTime) {
        setProducts(cachedData);
        setLoading(false);
        setError(null);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/products');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      
      // Handle different response formats
      let productsArray: Product[] = [];
      if (Array.isArray(data)) {
        productsArray = data;
      } else if (data.products && Array.isArray(data.products)) {
        productsArray = data.products;
      } else if (data.data && Array.isArray(data.data)) {
        productsArray = data.data;
      }

      // Apply filters
      let filteredProducts = productsArray;
      
      if (category) {
        filteredProducts = filteredProducts.filter(p => p.category === category);
      }
      
      if (status) {
        filteredProducts = filteredProducts.filter(p => p.status === status || p.stage === status);
      }
      
      if (featured !== undefined) {
        filteredProducts = filteredProducts.filter(p => Boolean(p.featured) === featured);
      }

      // Normalize product data
      const normalizedProducts = filteredProducts.map(product => ({
        ...product,
        id: String(product.id),
        votes: product.votes || 0,
        pledges: product.pledges || product.pledgeCount || 0,
        featured: Boolean(product.featured),
        image: product.image || product.imageUrl || '/placeholder-product.jpg',
        originalPrice: product.originalPrice ? Number(product.originalPrice) : undefined,
        price: Number(product.price) || 0,
        goal: product.goal || product.targetAmount,
        currentAmount: product.currentAmount || product.totalPledged || 0
      }));

      setProducts(normalizedProducts);
      setLastFetch(now);
      setLastUpdated(now);

      // Cache the results
      appCache.set(cacheKey, normalizedProducts, cacheTime);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
      console.error('Error fetching products:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getCacheKey, cacheTime, lastFetch, category, status, featured]);

  // Manual refresh function
  const refreshProducts = useCallback(async () => {
    await fetchProducts(false);
  }, [fetchProducts]);

  // Invalidate cache function
  const invalidateCache = useCallback(() => {
    invalidateProductCache();
    fetchProducts(false);
  }, [fetchProducts]);

  // Initial fetch
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Subscribe to real-time product updates
  useEffect(() => {
    if (!autoRefresh) return;

    const unsubscribe = productUpdateManager.onProductUpdate((event) => {
      console.log('Product update received in useProducts:', event);
      
      // Update specific product in state immediately for responsive UI
      if (event.data && event.type === 'update') {
        setProducts(prev => prev.map(p => 
          p.id === event.productId 
            ? { ...p, ...event.data, updatedAt: new Date().toISOString() }
            : p
        ));
        setLastUpdated(Date.now());
      }
      
      // Refresh data from server (debounced)
      setTimeout(() => {
        refreshProducts();
      }, 1000);
    });

    return unsubscribe;
  }, [autoRefresh, refreshProducts]);

  // Subscribe to cache invalidation
  useEffect(() => {
    if (!autoRefresh) return;

    const cacheKey = getCacheKey();
    const unsubscribe = appCache.subscribe(cacheKey, () => {
      console.log('Cache invalidated for key:', cacheKey);
      fetchProducts(false);
    });

    return unsubscribe;
  }, [autoRefresh, fetchProducts, getCacheKey]);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh || !refreshInterval) return;

    const interval = setInterval(() => {
      fetchProducts(true); // Use cache, but refresh if stale
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchProducts]);

  // Listen for browser focus to refresh data
  useEffect(() => {
    if (!autoRefresh) return;

    const handleFocus = () => {
      if (document.hidden === false) {
        // Refresh data when user returns to tab
        refreshProducts();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [autoRefresh, refreshProducts]);

  return {
    products,
    loading,
    error,
    refetch: refreshProducts,
    refreshProducts,
    invalidateCache,
    lastUpdated
  };
};

// Individual product hook
export const useProductEnhanced = (productId: string, options: UseProductsOptions = {}) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  const fetchProduct = useCallback(async () => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/products/${productId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setProduct(data);
      setLastUpdated(Date.now());

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch product';
      console.error('Error fetching product:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  // Initial fetch
  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Subscribe to updates for this specific product
  useEffect(() => {
    const unsubscribe = productUpdateManager.onProductUpdate((event) => {
      if (event.productId === productId) {
        if (event.data && event.type === 'update') {
          setProduct(prev => prev ? { ...prev, ...event.data } : null);
          setLastUpdated(Date.now());
        } else {
          // Refresh from server
          fetchProduct();
        }
      }
    });

    return unsubscribe;
  }, [productId, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: fetchProduct,
    lastUpdated
  };
};

// Backwards compatibility with existing useProducts hook
export const useProducts = useProductsEnhanced;
export const useProduct = useProductEnhanced;
