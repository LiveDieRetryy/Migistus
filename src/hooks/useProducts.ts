import { useState, useEffect, useCallback } from 'react';
import { appCache, cacheKeys } from '@/lib/cache';

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
  [key: string]: any;
}

interface UseProductsOptions {
  autoRefresh?: boolean;
  cacheTime?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const { autoRefresh = true, cacheTime = 5 * 60 * 1000 } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);

  const fetchProducts = useCallback(async (useCache: boolean = true) => {
    try {
      setLoading(true);
      setError(null);

      // Try to get from cache first
      if (useCache) {
        const cachedData = appCache.get(cacheKeys.PRODUCTS);
        if (cachedData) {
          setProducts(cachedData);
          setLoading(false);
          return;
        }
      }

      const response = await fetch('/api/products', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const data = await response.json();
      const productsList = data.products || data || [];
      
      setProducts(productsList);
      appCache.set(cacheKeys.PRODUCTS, productsList, cacheTime);
      setLastFetch(Date.now());
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [cacheTime]);

  const refreshProducts = useCallback(() => {
    return fetchProducts(false);
  }, [fetchProducts]);

  const invalidateCache = useCallback(() => {
    appCache.invalidate(cacheKeys.PRODUCTS);
    fetchProducts(false);
  }, [fetchProducts]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Subscribe to cache invalidation
  useEffect(() => {
    if (!autoRefresh) return;

    const unsubscribe = appCache.subscribe(cacheKeys.PRODUCTS, () => {
      fetchProducts();
    });

    return unsubscribe;
  }, [autoRefresh, fetchProducts]);

  // Auto refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      const timeSinceLastFetch = Date.now() - lastFetch;
      if (timeSinceLastFetch > cacheTime) {
        fetchProducts(false);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [autoRefresh, cacheTime, lastFetch, fetchProducts]);

  return {
    products,
    loading,
    error,
    refetch: refreshProducts,
    invalidateCache,
    lastFetch: new Date(lastFetch)
  };
};

export const useProduct = (productId: string, options: UseProductsOptions = {}) => {
  const { autoRefresh = true, cacheTime = 5 * 60 * 1000 } = options;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async (useCache: boolean = true) => {
    if (!productId) return;

    try {
      setLoading(true);
      setError(null);

      const cacheKey = cacheKeys.PRODUCT(productId);
      
      // Try to get from cache first
      if (useCache) {
        const cachedData = appCache.get(cacheKey);
        if (cachedData) {
          setProduct(cachedData);
          setLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/products/${productId}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const productData = await response.json();
      
      setProduct(productData);
      appCache.set(cacheKey, productData, cacheTime);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product');
      console.error('Error fetching product:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, cacheTime]);

  const refreshProduct = useCallback(() => {
    return fetchProduct(false);
  }, [fetchProduct]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // Subscribe to cache invalidation
  useEffect(() => {
    if (!autoRefresh || !productId) return;

    const cacheKey = cacheKeys.PRODUCT(productId);
    const unsubscribe = appCache.subscribe(cacheKey, () => {
      fetchProduct();
    });

    // Also subscribe to general products cache invalidation
    const unsubscribeGeneral = appCache.subscribe(cacheKeys.PRODUCTS, () => {
      fetchProduct(false);
    });

    return () => {
      unsubscribe();
      unsubscribeGeneral();
    };
  }, [autoRefresh, productId, fetchProduct]);

  return {
    product,
    loading,
    error,
    refetch: refreshProduct
  };
};
