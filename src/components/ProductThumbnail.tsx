// Universal Product Thumbnail Component with real-time updates
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { productUpdateManager } from '@/lib/productUpdateManager';

interface ThumbnailConfig {
  layout: 'standard' | 'compact' | 'detailed' | 'card' | 'list';
  showPrice: boolean;
  showVotes: boolean;
  showPledges: boolean;
  showCategory: boolean;
  showStatus: boolean;
  showProgress: boolean;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  shadow: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hoverEffect: 'none' | 'scale' | 'lift' | 'glow' | 'rotate';
  badgeStyle: 'none' | 'corner' | 'overlay' | 'floating';
  imageStyle: 'cover' | 'contain' | 'fill' | 'scale-down';
  titleFont: 'sans' | 'serif' | 'mono' | 'display';
  titleSize: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  titleWeight: 'normal' | 'medium' | 'semibold' | 'bold';
  descriptionLines: 0 | 1 | 2 | 3;
  spacing: 'tight' | 'normal' | 'relaxed' | 'loose';
  alignment: 'left' | 'center' | 'right';
  customCSS?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price?: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  category: string;
  status?: string;
  stage?: string;
  votes: number;
  pledges: number;
  featured: boolean;
  goal?: number;
  currentAmount?: number;
  endDate?: string;
  slug?: string;
  thumbnailConfig?: ThumbnailConfig;
  updatedAt?: string;
}

interface ProductThumbnailProps {
  product: Product;
  className?: string;
  overrideConfig?: Partial<ThumbnailConfig>;
  onClick?: (product: Product) => void;
  linkHref?: string;
  forceLayout?: ThumbnailConfig['layout'];
  showDebugInfo?: boolean;
}

const defaultThumbnailConfig: ThumbnailConfig = {
  layout: 'standard',
  showPrice: true,
  showVotes: true,
  showPledges: true,
  showCategory: true,
  showStatus: true,
  showProgress: true,
  backgroundColor: '#ffffff',
  textColor: '#1f2937',
  borderRadius: 8,
  shadow: 'md',
  hoverEffect: 'scale',
  badgeStyle: 'corner',
  imageStyle: 'cover',
  titleFont: 'sans',
  titleSize: 'base',
  titleWeight: 'semibold',
  descriptionLines: 2,
  spacing: 'normal',
  alignment: 'left'
};

export default function ProductThumbnail({
  product: initialProduct,
  className = '',
  overrideConfig = {},
  onClick,
  linkHref,
  forceLayout,
  showDebugInfo = false
}: ProductThumbnailProps) {
  const [product, setProduct] = useState<Product>(initialProduct);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [isUpdating, setIsUpdating] = useState(false);

  // Merge configs with priority: override > product config > default
  const config: ThumbnailConfig = {
    ...defaultThumbnailConfig,
    ...product.thumbnailConfig,
    ...overrideConfig,
    ...(forceLayout && { layout: forceLayout })
  };

  // Helper function to safely get status
  const getProductStatus = (product: Product): string => {
    return product.status || product.stage || 'unknown';
  };

  // Subscribe to product updates
  useEffect(() => {
    const unsubscribe = productUpdateManager.onProductUpdate((event) => {
      if (event.productId === product.id) {
        setIsUpdating(true);
        
        // Update the product with new data
        if (event.data) {
          setProduct(prevProduct => ({
            ...prevProduct,
            ...event.data,
            updatedAt: new Date().toISOString()
          }));
        } else if (event.type === 'update') {
          // Fetch fresh data for this product
          fetch(`/api/products/${product.id}`)
            .then(res => res.json())
            .then(updatedProduct => {
              setProduct(updatedProduct);
            })
            .catch(console.error);
        }
        
        setLastUpdated(Date.now());
        
        // Clear updating state after animation
        setTimeout(() => setIsUpdating(false), 500);
      }
    });

    return unsubscribe;
  }, [product.id]);

  // Listen for global product updates via window events (fallback)
  useEffect(() => {
    const handleProductUpdate = (event: CustomEvent) => {
      if (event.detail?.productId === product.id && event.detail?.product) {
        setIsUpdating(true);
        setProduct(event.detail.product);
        setLastUpdated(Date.now());
        setTimeout(() => setIsUpdating(false), 500);
      }
    };

    window.addEventListener('product-updated', handleProductUpdate as EventListener);
    return () => window.removeEventListener('product-updated', handleProductUpdate as EventListener);
  }, [product.id]);

  // Generate slug for linking
  const generateSlug = (name: string): string => {
    if (!name || typeof name !== 'string') return 'unnamed-product';
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  };

  const slug = product.slug || generateSlug(product.name || 'unnamed-product');
  const href = linkHref || `/drops/${slug}`;

  // CSS Classes
  const layoutClasses = {
    standard: 'flex flex-col',
    compact: 'flex flex-row items-center space-x-3',
    detailed: 'flex flex-col space-y-3',
    card: 'bg-white rounded-lg shadow-lg p-4',
    list: 'flex flex-row items-start space-x-4'
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  const hoverClasses = {
    none: '',
    scale: 'hover:scale-105',
    lift: 'hover:-translate-y-1',
    glow: 'hover:shadow-2xl',
    rotate: 'hover:rotate-1'
  };

  const fontClasses = {
    sans: 'font-sans',
    serif: 'font-serif',
    mono: 'font-mono',
    display: 'font-display'
  };

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  };

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold'
  };

  const spacingStyles = {
    tight: '8px',
    normal: '16px',
    relaxed: '20px',
    loose: '24px'
  };

  // Component content
  const thumbnailContent = (
    <div 
      className={`
        ${layoutClasses[config.layout]} 
        ${shadowClasses[config.shadow]}
        ${hoverClasses[config.hoverEffect]}
        ${isUpdating ? 'ring-2 ring-yellow-400 ring-opacity-50' : ''}
        transition-all duration-300 cursor-pointer relative overflow-hidden
        ${className}
      `}
      style={{
        backgroundColor: config.backgroundColor,
        color: config.textColor,
        borderRadius: `${config.borderRadius}px`,
        padding: spacingStyles[config.spacing],
        ...(config.customCSS && {
          // Parse and apply custom CSS safely
          ...Object.fromEntries(
            config.customCSS
              .split(';')
              .filter(rule => rule.trim())
              .map(rule => {
                const [property, value] = rule.split(':').map(s => s?.trim());
                return [
                  property?.replace(/-(.)/g, (_, letter) => letter.toUpperCase()) || '',
                  value || ''
                ];
              })
              .filter(([property, value]) => property && value)
          )
        })
      }}
      onClick={() => onClick?.(product)}
    >
      {/* Update indicator */}
      {isUpdating && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 animate-pulse" />
      )}

      {/* Debug info */}
      {showDebugInfo && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          Updated: {new Date(lastUpdated).toLocaleTimeString()}
        </div>
      )}

      {/* Product Image */}
      <div 
        className={`relative overflow-hidden ${config.layout === 'compact' ? 'flex-shrink-0' : ''}`}
        style={{ borderRadius: `${config.borderRadius * 0.5}px` }}
      >
        <Image
          src={product.image || '/placeholder-product.jpg'}
          alt={product.name || 'Product image'}
          width={config.layout === 'compact' ? 80 : 200}
          height={config.layout === 'compact' ? 80 : 200}
          className={`${config.layout === 'compact' ? 'w-20 h-20' : 'w-full h-48'} object-${config.imageStyle}`}
          priority={product.featured}
        />
        
        {/* Status Badge */}
        {config.showStatus && config.badgeStyle !== 'none' && (
          <div className={`
            absolute ${config.badgeStyle === 'corner' ? 'top-2 right-2' : 
                      config.badgeStyle === 'overlay' ? 'bottom-0 left-0 right-0' :
                      'top-2 left-1/2 transform -translate-x-1/2'}
            px-2 py-1 rounded text-xs font-semibold
            ${getProductStatus(product) === 'live' ? 'bg-green-500 text-white' :
              getProductStatus(product) === 'coming-soon' ? 'bg-yellow-500 text-black' :
              getProductStatus(product) === 'ended' ? 'bg-gray-500 text-white' :
              getProductStatus(product) === 'voting' ? 'bg-blue-500 text-white' :
              'bg-purple-500 text-white'}
          `}>
            {getProductStatus(product).replace('-', ' ').toUpperCase()}
          </div>
        )}

        {/* Featured indicator */}
        {product.featured && (
          <div className="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold">
            ⭐ FEATURED
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className={`flex-1 ${config.alignment === 'center' ? 'text-center' : 
                             config.alignment === 'right' ? 'text-right' : 'text-left'}`}>
        {/* Category */}
        {config.showCategory && (
          <div className="text-xs uppercase tracking-wide opacity-60 mb-1">
            {product.category}
          </div>
        )}

        {/* Title */}
        <h3 className={`
          ${fontClasses[config.titleFont]}
          ${sizeClasses[config.titleSize]}
          ${weightClasses[config.titleWeight]}
          mb-2 line-clamp-2
        `}>
          {product.name || 'Unnamed Product'}
        </h3>

        {/* Description */}
        {config.descriptionLines > 0 && product.description && (
          <p className={`text-sm opacity-80 mb-2 line-clamp-${config.descriptionLines}`}>
            {product.description}
          </p>
        )}

        {/* Price */}
        {config.showPrice && product.price && (
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-lg">${product.price}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-sm line-through opacity-60">${product.originalPrice}</span>
                <span className="text-xs bg-red-500 text-white px-1 py-0.5 rounded">
                  -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                </span>
              </>
            )}
          </div>
        )}

        {/* Stats Row */}
        <div className="flex items-center justify-between text-xs opacity-70 mb-2">
          {config.showVotes && (
            <span className="flex items-center">
              🗳️ {product.votes.toLocaleString()} votes
            </span>
          )}
          {config.showPledges && (
            <span className="flex items-center">
              ⚔️ {product.pledges.toLocaleString()} joined
            </span>
          )}
        </div>

        {/* Progress Bar */}
        {config.showProgress && product.goal && (
          <div className="mt-2">
            <div className="bg-gray-200 rounded-full h-1.5 mb-1">
              <div 
                className="bg-yellow-400 h-1.5 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min((product.currentAmount || 0) / product.goal * 100, 100)}%` 
                }}
              />
            </div>
            <div className="text-xs opacity-60 flex justify-between">
              <span>${(product.currentAmount || 0).toLocaleString()}</span>
              <span>${product.goal.toLocaleString()} goal</span>
            </div>
            <div className="text-xs opacity-60 text-center mt-1">
              {Math.round((product.currentAmount || 0) / product.goal * 100)}% funded
            </div>
          </div>
        )}

        {/* End date countdown */}
        {product.endDate && new Date(product.endDate) > new Date() && (
          <div className="text-xs opacity-60 mt-2">
            Ends: {new Date(product.endDate).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );

  // Return with or without link wrapper
  if (onClick || !linkHref) {
    return thumbnailContent;
  }

  return (
    <Link href={href} className="block">
      {thumbnailContent}
    </Link>
  );
}

// Specialized variants for different use cases
export function CompactProductThumbnail(props: Omit<ProductThumbnailProps, 'forceLayout'>) {
  return <ProductThumbnail {...props} forceLayout="compact" />;
}

export function DetailedProductThumbnail(props: Omit<ProductThumbnailProps, 'forceLayout'>) {
  return <ProductThumbnail {...props} forceLayout="detailed" />;
}

export function CardProductThumbnail(props: Omit<ProductThumbnailProps, 'forceLayout'>) {
  return <ProductThumbnail {...props} forceLayout="card" />;
}

export function ListProductThumbnail(props: Omit<ProductThumbnailProps, 'forceLayout'>) {
  return <ProductThumbnail {...props} forceLayout="list" />;
}

// Grid wrapper for multiple thumbnails
interface ProductGridProps {
  products: Product[];
  columns?: 1 | 2 | 3 | 4 | 5 | 6;
  gap?: 'sm' | 'md' | 'lg';
  layout?: ThumbnailConfig['layout'];
  className?: string;
  onProductClick?: (product: Product) => void;
}

export function ProductGrid({ 
  products, 
  columns = 3, 
  gap = 'md', 
  layout = 'standard',
  className = '',
  onProductClick
}: ProductGridProps) {
  const gapClasses = {
    sm: 'gap-4',
    md: 'gap-6',
    lg: 'gap-8'
  };

  const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={`grid ${columnClasses[columns]} ${gapClasses[gap]} ${className}`}>
      {products.map(product => (
        <ProductThumbnail
          key={`${product.id}-${product.updatedAt || ''}`}
          product={product}
          forceLayout={layout}
          onClick={onProductClick}
        />
      ))}
    </div>
  );
}
