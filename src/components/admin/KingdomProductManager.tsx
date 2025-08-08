// Enhanced Product Manager integrated with existing Kingdom Products system
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { productUpdateManager, notifyProductUpdated } from '@/lib/productUpdateManager';
import { invalidateProductCache } from '@/lib/cache';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  status: 'coming-soon' | 'live' | 'ended' | 'staff-pick' | 'pending-review' | 'rejected' | 'voting';
  createdAt: string;
  imageUrl?: string;
  image?: string;
  pledgeGoal?: number;
  currentPledges?: number;
  supplier?: {
    name: string;
    id: string;
  };
  supplierName?: string;
  submittedAt?: string;
  slug?: string;
  votes?: number;
  pledges?: number;
  featured?: boolean;
  originalPrice?: number;
  goal?: number;
  currentAmount?: number;
  endDate?: string;
  images?: string[];
  thumbnailConfig?: ThumbnailConfig;
}

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

interface KingdomProductManagerProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Product) => Promise<void>;
  mode: 'create' | 'edit';
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
  alignment: 'left',
  customCSS: ''
};

const emptyProduct: Product = {
  id: '',
  name: '',
  description: '',
  price: 0,
  category: '',
  status: 'pending-review',
  createdAt: new Date().toISOString(),
  votes: 0,
  pledges: 0,
  featured: false,
  images: [],
  thumbnailConfig: defaultThumbnailConfig
};

export default function KingdomProductManager({ 
  product, 
  isOpen, 
  onClose, 
  onSave, 
  mode 
}: KingdomProductManagerProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'media' | 'pricing' | 'thumbnail' | 'advanced'>('basic');
  const [editedProduct, setEditedProduct] = useState<Product>(product || emptyProduct);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [thumbnailPreview, setThumbnailPreview] = useState(true);

  // Update edited product when prop changes
  useEffect(() => {
    if (product) {
      setEditedProduct({
        ...product,
        thumbnailConfig: product.thumbnailConfig || defaultThumbnailConfig
      });
    } else {
      setEditedProduct(emptyProduct);
    }
  }, [product]);

  // Update thumbnail config
  const updateThumbnailConfig = (key: keyof ThumbnailConfig, value: any) => {
    setEditedProduct(prev => ({
      ...prev,
      thumbnailConfig: {
        ...prev.thumbnailConfig!,
        [key]: value
      }
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!editedProduct.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!editedProduct.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (editedProduct.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }
    
    if (!editedProduct.category.trim()) {
      newErrors.category = 'Category is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save with real-time updates
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Generate ID for new products
      if (mode === 'create' && !editedProduct.id) {
        editedProduct.id = Date.now().toString();
      }

      // Save the product
      await onSave(editedProduct);
      
      // Trigger real-time updates across the site
      notifyProductUpdated(editedProduct.id, {
        ...editedProduct,
        updatedAt: new Date().toISOString()
      });
      
      // Invalidate cache
      invalidateProductCache();
      
      // Dispatch custom event for immediate UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('product-updated', {
          detail: { productId: editedProduct.id, product: editedProduct }
        }));
      }
      
      onClose();
      
    } catch (error) {
      console.error('Failed to save product:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Image upload handler
  const handleImageUpload = async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('images', files[i]);
    }
    
    try {
      const response = await fetch('/api/upload/images', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const { urls } = await response.json();
        setEditedProduct(prev => ({
          ...prev,
          images: [...(prev.images || []), ...urls],
          image: prev.image || urls[0],
          imageUrl: prev.imageUrl || urls[0]
        }));
      }
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  // Thumbnail preview component
  const ThumbnailPreview = () => {
    const config = editedProduct.thumbnailConfig!;
    
    return (
      <div 
        className={`
          max-w-sm transition-all duration-300 cursor-pointer
          ${config.layout === 'standard' ? 'flex flex-col' : 
            config.layout === 'compact' ? 'flex flex-row items-center space-x-3' :
            config.layout === 'detailed' ? 'flex flex-col space-y-3' :
            config.layout === 'card' ? 'bg-white rounded-lg shadow-lg p-4' :
            'flex flex-row items-start space-x-4'}
          ${config.shadow === 'sm' ? 'shadow-sm' :
            config.shadow === 'md' ? 'shadow-md' :
            config.shadow === 'lg' ? 'shadow-lg' :
            config.shadow === 'xl' ? 'shadow-xl' : ''}
          ${config.hoverEffect === 'scale' ? 'hover:scale-105' :
            config.hoverEffect === 'lift' ? 'hover:-translate-y-1' :
            config.hoverEffect === 'glow' ? 'hover:shadow-2xl' :
            config.hoverEffect === 'rotate' ? 'hover:rotate-1' : ''}
        `}
        style={{
          backgroundColor: config.backgroundColor,
          color: config.textColor,
          borderRadius: `${config.borderRadius}px`,
          padding: config.spacing === 'tight' ? '8px' : 
                   config.spacing === 'normal' ? '16px' :
                   config.spacing === 'relaxed' ? '20px' : '24px'
        }}
      >
        {/* Product Image */}
        <div className="relative overflow-hidden" style={{ borderRadius: `${config.borderRadius * 0.5}px` }}>
          <Image
            src={editedProduct.image || editedProduct.imageUrl || '/placeholder-product.jpg'}
            alt={editedProduct.name || 'Product'}
            width={config.layout === 'compact' ? 80 : 200}
            height={config.layout === 'compact' ? 80 : 200}
            className="w-full h-auto object-cover"
          />
          
          {/* Status Badge */}
          {config.showStatus && config.badgeStyle !== 'none' && (
            <div className={`
              absolute ${config.badgeStyle === 'corner' ? 'top-2 right-2' : 
                        config.badgeStyle === 'overlay' ? 'bottom-0 left-0 right-0' :
                        'top-2 left-1/2 transform -translate-x-1/2'}
              px-2 py-1 rounded text-xs font-semibold
              ${editedProduct.status === 'live' ? 'bg-green-500 text-white' :
                editedProduct.status === 'coming-soon' ? 'bg-yellow-500 text-black' :
                editedProduct.status === 'ended' ? 'bg-gray-500 text-white' :
                'bg-blue-500 text-white'}
            `}>
              {editedProduct.status.replace('-', ' ').toUpperCase()}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className={`flex-1 ${config.alignment === 'center' ? 'text-center' : 
                                 config.alignment === 'right' ? 'text-right' : 'text-left'}`}>
          {/* Category */}
          {config.showCategory && (
            <div className="text-xs uppercase tracking-wide opacity-60 mb-1">
              {editedProduct.category}
            </div>
          )}

          {/* Title */}
          <h3 className={`
            ${config.titleFont === 'serif' ? 'font-serif' :
              config.titleFont === 'mono' ? 'font-mono' :
              config.titleFont === 'display' ? 'font-display' : 'font-sans'}
            ${config.titleSize === 'xs' ? 'text-xs' :
              config.titleSize === 'sm' ? 'text-sm' :
              config.titleSize === 'base' ? 'text-base' :
              config.titleSize === 'lg' ? 'text-lg' : 'text-xl'}
            ${config.titleWeight === 'normal' ? 'font-normal' :
              config.titleWeight === 'medium' ? 'font-medium' :
              config.titleWeight === 'semibold' ? 'font-semibold' : 'font-bold'}
            mb-2 line-clamp-2
          `}>
            {editedProduct.name || 'Product Name'}
          </h3>

          {/* Description */}
          {config.descriptionLines > 0 && (
            <p className={`text-sm opacity-80 mb-2 line-clamp-${config.descriptionLines}`}>
              {editedProduct.description || 'Product description goes here...'}
            </p>
          )}

          {/* Price */}
          {config.showPrice && (
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-lg">${editedProduct.price || 0}</span>
              {editedProduct.originalPrice && editedProduct.originalPrice > editedProduct.price && (
                <span className="text-sm line-through opacity-60">${editedProduct.originalPrice}</span>
              )}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center justify-between text-xs opacity-70">
            {config.showVotes && (
              <span>🗳️ {editedProduct.votes || 0} votes</span>
            )}
            {config.showPledges && (
              <span>⚔️ {editedProduct.pledges || 0} joined</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Product' : 'Edit Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            {/* Tab Navigation */}
            <div className="flex border-b">
              {[
                { id: 'basic', label: 'Basic Info', icon: '📝' },
                { id: 'media', label: 'Media', icon: '🖼️' },
                { id: 'pricing', label: 'Pricing', icon: '💰' },
                { id: 'thumbnail', label: 'Thumbnail Style', icon: '🎨' },
                { id: 'advanced', label: 'Advanced', icon: '⚙️' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-yellow-400 text-yellow-600 bg-yellow-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={editedProduct.name}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter product name"
                    />
                    {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      value={editedProduct.description}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        errors.description ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Describe your product"
                    />
                    {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        value={editedProduct.category}
                        onChange={(e) => setEditedProduct(prev => ({ ...prev, category: e.target.value }))}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.category ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select category</option>
                        <option value="electronics">Electronics</option>
                        <option value="home">Home & Garden</option>
                        <option value="sports">Sports & Outdoors</option>
                        <option value="automotive">Automotive</option>
                        <option value="beauty">Beauty & Health</option>
                        <option value="toys">Toys & Games</option>
                      </select>
                      {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={editedProduct.status}
                        onChange={(e) => setEditedProduct(prev => ({ ...prev, status: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="voting">Voting Stage</option>
                        <option value="coming-soon">Coming Soon</option>
                        <option value="live">Live Drop</option>
                        <option value="ended">Ended</option>
                        <option value="staff-pick">Staff Pick</option>
                        <option value="pending-review">Pending Review</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Price *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editedProduct.price}
                        onChange={(e) => setEditedProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className={`w-full px-3 py-2 border rounded-lg ${
                          errors.price ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Original Price (optional)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editedProduct.originalPrice || ''}
                        onChange={(e) => setEditedProduct(prev => ({ 
                          ...prev, 
                          originalPrice: parseFloat(e.target.value) || undefined 
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'thumbnail' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Thumbnail Customization</h3>
                    <button
                      onClick={() => setThumbnailPreview(!thumbnailPreview)}
                      className="bg-yellow-400 text-black px-3 py-1 rounded text-sm hover:bg-yellow-300"
                    >
                      {thumbnailPreview ? 'Hide' : 'Show'} Preview
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-6">
                    {/* Layout Options */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Layout</label>
                      <select
                        value={editedProduct.thumbnailConfig!.layout}
                        onChange={(e) => updateThumbnailConfig('layout', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="standard">Standard</option>
                        <option value="compact">Compact</option>
                        <option value="detailed">Detailed</option>
                        <option value="card">Card</option>
                        <option value="list">List</option>
                      </select>
                    </div>

                    {/* Shadow */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shadow</label>
                      <select
                        value={editedProduct.thumbnailConfig!.shadow}
                        onChange={(e) => updateThumbnailConfig('shadow', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="none">None</option>
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                        <option value="xl">Extra Large</option>
                      </select>
                    </div>

                    {/* Hover Effect */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hover Effect</label>
                      <select
                        value={editedProduct.thumbnailConfig!.hoverEffect}
                        onChange={(e) => updateThumbnailConfig('hoverEffect', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="none">None</option>
                        <option value="scale">Scale</option>
                        <option value="lift">Lift</option>
                        <option value="glow">Glow</option>
                        <option value="rotate">Rotate</option>
                      </select>
                    </div>
                  </div>

                  {/* Show/Hide Options */}
                  <div>
                    <h4 className="font-medium mb-3">Display Options</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { key: 'showPrice', label: 'Show Price' },
                        { key: 'showVotes', label: 'Show Votes' },
                        { key: 'showPledges', label: 'Show Pledges' },
                        { key: 'showCategory', label: 'Show Category' },
                        { key: 'showStatus', label: 'Show Status' },
                        { key: 'showProgress', label: 'Show Progress' }
                      ].map(option => (
                        <label key={option.key} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={editedProduct.thumbnailConfig![option.key as keyof ThumbnailConfig] as boolean}
                            onChange={(e) => updateThumbnailConfig(option.key as keyof ThumbnailConfig, e.target.checked)}
                            className="rounded border-gray-300 text-yellow-400"
                          />
                          <span className="text-sm">{option.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Color Options */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Background Color</label>
                      <input
                        type="color"
                        value={editedProduct.thumbnailConfig!.backgroundColor}
                        onChange={(e) => updateThumbnailConfig('backgroundColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Text Color</label>
                      <input
                        type="color"
                        value={editedProduct.thumbnailConfig!.textColor}
                        onChange={(e) => updateThumbnailConfig('textColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Live Preview Sidebar */}
          {thumbnailPreview && activeTab === 'thumbnail' && (
            <div className="w-80 border-l bg-gray-50 p-6">
              <h3 className="font-semibold mb-4">Live Preview</h3>
              <div className="space-y-4">
                <ThumbnailPreview />
                <div className="text-xs text-gray-500">
                  Preview updates in real-time as you modify the settings
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-6 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 font-semibold disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}
