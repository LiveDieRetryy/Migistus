// Enhanced Product Manager with Complete WYSIWYG Product Page Editing
import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface PricingTier {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  description: string;
  isCurrent?: boolean;
}

interface Product {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  videos?: string[]; // Add video support
  category: string;
  status: string;
  votes: number;
  pledges: number;
  featured: boolean;
  goal?: number;
  currentAmount?: number;
  endDate?: string;
  slug?: string;
  
  // Extended fields for complete product page
  features?: string[];
  specifications?: Record<string, string>;
  pricingTiers?: PricingTier[];
  dropEndTime?: string;
  pledgeTarget?: number;
  currentPledges?: number;
  minimumOrderQuantity?: number;
  maxDiscountPercent?: number;
  nextPriceDropTier?: number;
  nextPriceDropAmount?: number;
  warrantyInfo?: string;
  shippingInfo?: string;
  returnPolicy?: string;
  tags?: string[];
}

interface EnhancedProductManagerProps {
  product: Product;
  onSave: (updatedProduct: Product) => Promise<void>;
  onCancel: () => void;
}

export default function EnhancedProductManager({ product, onSave, onCancel }: EnhancedProductManagerProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'pricing' | 'features' | 'media' | 'settings'>('content');
  const [editedProduct, setEditedProduct] = useState<Product>({ 
    ...product,
    features: product.features || [],
    specifications: product.specifications || {},
    images: product.images || [],
    videos: product.videos || [],
    pricingTiers: product.pricingTiers || [
      {
        id: 'tier1',
        name: 'Tier 1',
        price: product.price || 0,
        originalPrice: product.originalPrice,
        description: 'Early Bird',
        isCurrent: true
      }
    ],
    pledgeTarget: product.pledgeTarget || 100,
    currentPledges: product.currentPledges || 42,
    minimumOrderQuantity: product.minimumOrderQuantity || 58,
    maxDiscountPercent: product.maxDiscountPercent || 7,
    nextPriceDropTier: product.nextPriceDropTier || 120.99,
    nextPriceDropAmount: product.nextPriceDropAmount || 500
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedMediaIndex, setDraggedMediaIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  // Calculate time remaining for demo
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 11,
    minutes: 59,
    seconds: 52
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Form validation
  const validateForm = () => {
    console.log('Validating form with product:', editedProduct);
    const newErrors: Record<string, string> = {};

    if (!editedProduct.name?.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (!editedProduct.description?.trim()) {
      newErrors.description = 'Description is required';
    }

    if (!editedProduct.category) {
      newErrors.category = 'Category is required';
    }

    if (!editedProduct.price || editedProduct.price <= 0) {
      newErrors.price = 'Valid price is required';
    }

    setErrors(newErrors);
    console.log('Validation errors:', newErrors);
    const isValid = Object.keys(newErrors).length === 0;
    console.log('Form is valid:', isValid);
    return isValid;
  };

  // Save product as draft
  const handleSaveDraft = async () => {
    console.log('Save Draft clicked', editedProduct);
    if (!validateForm()) {
      console.log('Validation failed', errors);
      return;
    }
    
    setIsSaving(true);
    try {
      const draftProduct = {
        ...editedProduct,
        status: 'draft' // Ensure it's saved as draft
      };
      console.log('Saving draft product:', draftProduct);
      await onSave(draftProduct);
      console.log('Draft saved successfully');
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Save and publish product
  const handleSaveAndPublish = async () => {
    console.log('Save and Publish clicked', editedProduct);
    if (!validateForm()) {
      console.log('Validation failed', errors);
      return;
    }
    
    setIsSaving(true);
    try {
      const publishedProduct = {
        ...editedProduct,
        status: editedProduct.status === 'draft' ? 'live' : editedProduct.status // Change draft to live, keep other statuses
      };
      console.log('Saving published product:', publishedProduct);
      await onSave(publishedProduct);
      console.log('Product published successfully');
    } catch (error) {
      console.error('Failed to save and publish:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle file upload for images and videos
  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setIsUploading(true);
    try {
      const newFiles: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        newFiles.push(url);
      }
      
      setEditedProduct(prev => ({
        ...prev,
        images: [...(prev.images || []), ...newFiles],
        image: prev.image || newFiles[0] // Set first image as main if no main image
      }));
    } catch (error) {
      console.error('Failed to upload images:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle video upload
  const handleVideoUpload = async (files: FileList) => {
    if (!files.length) return;
    
    setIsUploading(true);
    try {
      const newVideos: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = URL.createObjectURL(file);
        newVideos.push(url);
      }
      
      setEditedProduct(prev => ({
        ...prev,
        videos: [...(prev.videos || []), ...newVideos]
      }));
    } catch (error) {
      console.error('Failed to upload videos:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length) {
      if (mediaType === 'image') {
        handleImageUpload(files);
      } else {
        handleVideoUpload(files);
      }
    }
  };

  // Remove media item
  const removeMediaItem = (type: 'image' | 'video', index: number) => {
    if (type === 'image') {
      setEditedProduct(prev => ({
        ...prev,
        images: prev.images?.filter((_, i) => i !== index) || [],
        // If removing the main image, set a new one
        image: prev.image === prev.images?.[index] ? (prev.images?.[0] !== prev.images?.[index] ? prev.images?.[0] || '' : prev.images?.[1] || '') : prev.image
      }));
    } else {
      setEditedProduct(prev => ({
        ...prev,
        videos: prev.videos?.filter((_, i) => i !== index) || []
      }));
    }
  };

  // Set as main image
  const setAsMainImage = (imageUrl: string) => {
    setEditedProduct(prev => ({ ...prev, image: imageUrl }));
  };

  // Drag and drop reordering
  const handleMediaDragStart = (e: React.DragEvent, index: number) => {
    setDraggedMediaIndex(index);
  };

  const handleMediaDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMediaDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    
    if (draggedMediaIndex === null || draggedMediaIndex === dropIndex) return;

    const mediaArray = mediaType === 'image' ? editedProduct.images || [] : editedProduct.videos || [];
    const newMediaArray = [...mediaArray];
    const draggedItem = newMediaArray[draggedMediaIndex];
    
    // Remove dragged item and insert at new position
    newMediaArray.splice(draggedMediaIndex, 1);
    newMediaArray.splice(dropIndex, 0, draggedItem);

    if (mediaType === 'image') {
      setEditedProduct(prev => ({ ...prev, images: newMediaArray }));
    } else {
      setEditedProduct(prev => ({ ...prev, videos: newMediaArray }));
    }
    
    setDraggedMediaIndex(null);
  };

  // Add feature
  const addFeature = () => {
    setEditedProduct(prev => ({
      ...prev,
      features: [...(prev.features || []), '']
    }));
  };

  // Update feature
  const updateFeature = (index: number, value: string) => {
    setEditedProduct(prev => ({
      ...prev,
      features: prev.features?.map((f, i) => i === index ? value : f) || []
    }));
  };

  // Remove feature
  const removeFeature = (index: number) => {
    setEditedProduct(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== index) || []
    }));
  };

  // Add pricing tier
  const addPricingTier = () => {
    const newTier: PricingTier = {
      id: `tier${Date.now()}`,
      name: `Tier ${(editedProduct.pricingTiers?.length || 0) + 1}`,
      price: editedProduct.price || 0,
      description: 'New tier',
      isCurrent: false
    };
    
    setEditedProduct(prev => ({
      ...prev,
      pricingTiers: [...(prev.pricingTiers || []), newTier]
    }));
  };

  // Update pricing tier
  const updatePricingTier = (index: number, updates: Partial<PricingTier>) => {
    setEditedProduct(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers?.map((tier, i) => 
        i === index ? { ...tier, ...updates } : tier
      ) || []
    }));
  };

  // Complete Product Page Preview Component
  const CompleteProductPagePreview = () => {
    const discountPercent = editedProduct.originalPrice && editedProduct.price 
      ? Math.round(((editedProduct.originalPrice - editedProduct.price) / editedProduct.originalPrice) * 100)
      : editedProduct.maxDiscountPercent || 7;

    const pledgeProgress = editedProduct.pledgeTarget 
      ? Math.round(((editedProduct.currentPledges || 0) / editedProduct.pledgeTarget) * 100)
      : 42;

    return (
      <div className="bg-black min-h-screen text-white overflow-y-auto">
        <div className="max-w-6xl mx-auto p-6">
          {/* Main Product Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            
            {/* Left Column - Product Media */}
            <div className="space-y-4">
              {/* Main Image/Video Display */}
              <div className="aspect-square rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
                <img
                  src={editedProduct.image || editedProduct.images?.[0] || '/placeholder-product.jpg'}
                  alt={editedProduct.name || 'Product'}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Media Thumbnails */}
              {((editedProduct.images?.length || 0) > 1 || (editedProduct.videos?.length || 0) > 0) && (
                <div className="grid grid-cols-4 gap-2">
                  {editedProduct.images?.slice(1, 4).map((imageUrl, index) => (
                    <div key={index} className="aspect-square rounded overflow-hidden border border-zinc-600 hover:border-[#FFD700] transition cursor-pointer">
                      <img
                        src={imageUrl}
                        alt={`Product ${index + 2}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                  {editedProduct.videos?.slice(0, 4 - (editedProduct.images?.slice(1, 4).length || 0)).map((videoUrl, index) => (
                    <div key={`video-${index}`} className="aspect-square rounded overflow-hidden border border-zinc-600 hover:border-[#FFD700] transition cursor-pointer relative">
                      <video
                        src={videoUrl}
                        className="w-full h-full object-cover"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black bg-opacity-50 rounded-full p-1">
                          <span className="text-white text-xs">▶️</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {/* Show more indicator */}
                  {((editedProduct.images?.length || 0) + (editedProduct.videos?.length || 0)) > 4 && (
                    <div className="aspect-square rounded border border-zinc-600 bg-zinc-800 flex items-center justify-center cursor-pointer hover:border-[#FFD700] transition">
                      <div className="text-center">
                        <div className="text-[#FFD700] text-lg">+{((editedProduct.images?.length || 0) + (editedProduct.videos?.length || 0)) - 4}</div>
                        <div className="text-xs text-zinc-400">more</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Product Details Card */}
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                <div className="flex items-center mb-4">
                  <span className="text-[#FFD700] text-2xl mr-2">📦</span>
                  <h3 className="text-xl font-bold text-[#FFD700]">Product Details</h3>
                </div>
                
                <p className="text-zinc-300 mb-6">
                  {editedProduct.description || 'Premium gaming headset with surround sound and crystal-clear communication'}
                </p>

                {/* Features Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {(editedProduct.features || [
                    'Active Noise Cancellation',
                    '30-Hour Battery Life',
                    'Premium Sound Quality',
                    'Wireless Charging Case',
                    'IPX4 Water Resistance',
                    'Touch Controls'
                  ]).map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <span className="text-[#FFD700] mr-2">●</span>
                      <span className="text-sm text-zinc-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Product Info & Purchase */}
            <div className="space-y-6">
              
              {/* Drop Timer Card */}
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="w-4 h-4 bg-[#FFD700] rounded-full mr-3"></span>
                    <div>
                      <h3 className="text-[#FFD700] font-semibold">Drop Ends In</h3>
                      <p className="text-zinc-400 text-sm">Limited time offer</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[#FFD700]">
                      {timeRemaining.hours}h {timeRemaining.minutes}m {timeRemaining.seconds}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Pledge Progress Card */}
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-blue-400 text-xl mr-2">👥</span>
                    <div>
                      <h3 className="text-white font-semibold">{editedProduct.currentPledges || 42} Pledged</h3>
                      <p className="text-zinc-400 text-sm">Current tier</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">Target</div>
                    <div className="text-[#FFD700]">{editedProduct.pledgeTarget || 100}</div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-zinc-400 mb-1">
                    <span>Progress</span>
                    <span>{pledgeProgress}%</span>
                  </div>
                  <div className="w-full bg-zinc-700 rounded-full h-2">
                    <div 
                      className="bg-[#FFD700] h-2 rounded-full transition-all duration-300"
                      style={{ width: `${pledgeProgress}%` }}
                    ></div>
                  </div>
                </div>
                
                <p className="text-zinc-400 text-sm">
                  {editedProduct.minimumOrderQuantity || 58} more pledges needed to reach minimum order quantity
                </p>
              </div>

              {/* Pricing Card */}
              <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl font-bold text-[#FFD700]">
                        ${editedProduct.price || 139.99}
                      </span>
                      <span className="text-green-400 text-sm">📉</span>
                    </div>
                    <div className="text-zinc-400 text-sm">
                      Current price (Early Bird)
                    </div>
                    {editedProduct.originalPrice && (
                      <div className="text-zinc-500 text-sm line-through">
                        MSRP: ${editedProduct.originalPrice}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-400">
                      {discountPercent}% OFF
                    </div>
                    <div className="text-green-400">You save</div>
                    <div className="text-green-400 font-bold">
                      ${((editedProduct.originalPrice || 149.99) - (editedProduct.price || 139.99)).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Next Price Drop */}
                <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <span className="text-[#FFD700] mr-2">👑</span>
                    <span className="text-[#FFD700] font-semibold">Next Price Drop</span>
                  </div>
                  <p className="text-yellow-200 text-sm">
                    Reach tier at ${editedProduct.nextPriceDropTier || 120.99} when pledges unite
                  </p>
                  <p className="text-yellow-200 text-sm">
                    {editedProduct.nextPriceDropAmount || 500} more pledges needed
                  </p>
                </div>

                {/* Join Drop Button */}
                <button className="w-full bg-[#FFD700] hover:bg-yellow-600 text-black font-bold py-4 px-6 rounded-lg transition mb-4">
                  <span className="text-lg">⚡ Join Drop - ${editedProduct.price || 139.99}</span>
                </button>

                {/* Action Buttons */}
                <div className="flex items-center justify-between text-sm">
                  <button className="flex items-center text-zinc-400 hover:text-white transition">
                    <span className="mr-1">♡</span> Wishlist
                  </button>
                  <button className="flex items-center text-zinc-400 hover:text-white transition">
                    <span className="mr-1">↗</span> Share
                  </button>
                  <button className="flex items-center text-zinc-400 hover:text-white transition">
                    <span className="mr-1">💬</span> Discuss
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Pricing Tiers */}
          <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
            <div className="flex items-center mb-6">
              <span className="text-[#FFD700] text-2xl mr-2">👑</span>
              <h3 className="text-xl font-bold text-[#FFD700]">Volume Pricing Tiers</h3>
            </div>
            
            <div className="space-y-3">
              {(editedProduct.pricingTiers || []).map((tier, index) => (
                <div 
                  key={tier.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    tier.isCurrent 
                      ? 'border-[#FFD700] bg-yellow-900 bg-opacity-20' 
                      : 'border-zinc-600 bg-zinc-700'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-white">{tier.name}</div>
                    <div className="text-zinc-400 text-sm">{tier.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-[#FFD700]">
                      ${tier.price}
                    </div>
                    {tier.isCurrent && (
                      <div className="text-[#FFD700] text-sm">Current ●</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex z-50">
      
      {/* Left Panel - Editing Controls */}
      <div className="w-1/3 bg-zinc-900 border-r border-[#FFD700] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-xl font-bold text-[#FFD700]">
            {product.id && product.id !== 'new' ? 'Edit Product' : 'Create Product'}
          </h2>
          <button
            onClick={onCancel}
            className="text-zinc-400 hover:text-[#FFD700] text-2xl transition"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-700">
          {[
            { id: 'content', name: 'Content', icon: '📝' },
            { id: 'pricing', name: 'Pricing', icon: '💰' },
            { id: 'features', name: 'Features', icon: '⭐' },
            { id: 'media', name: 'Media', icon: '🖼️' },
            { id: 'settings', name: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-2 py-3 text-xs font-medium border-r border-zinc-700 last:border-r-0 transition ${
                activeTab === tab.id
                  ? 'bg-[#FFD700] text-black'
                  : 'text-zinc-400 hover:text-[#FFD700] hover:bg-zinc-800'
              }`}
            >
              <div className="text-center">
                <div className="mb-1">{tab.icon}</div>
                <div>{tab.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Product Name *</label>
                <input
                  type="text"
                  value={editedProduct.name || ''}
                  onChange={(e) => setEditedProduct(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                  placeholder="Enter product name"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Short Description</label>
                <input
                  type="text"
                  value={editedProduct.shortDescription || ''}
                  onChange={(e) => setEditedProduct(prev => ({ ...prev, shortDescription: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                  placeholder="Brief product tagline"
                />
              </div>

              <div>
                <label className="block text-[#FFD700] font-medium mb-2">Full Description *</label>
                <textarea
                  value={editedProduct.description || ''}
                  onChange={(e) => setEditedProduct(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none resize-none transition"
                  placeholder="Detailed product description..."
                />
                {errors.description && <p className="text-red-400 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Category *</label>
                  <select
                    value={editedProduct.category || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-[#FFD700] focus:outline-none transition"
                  >
                    <option value="">Select category</option>
                    <option value="electronics">Electronics</option>
                    <option value="home">Home & Garden</option>
                    <option value="sports">Sports & Outdoors</option>
                    <option value="automotive">Automotive</option>
                    <option value="beauty">Beauty & Health</option>
                    <option value="toys">Toys & Games</option>
                    <option value="handmade">Handmade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Status</label>
                  <select
                    value={editedProduct.status || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white focus:border-[#FFD700] focus:outline-none transition"
                  >
                    <option value="draft">Draft</option>
                    <option value="coming-soon">Coming Soon</option>
                    <option value="live">Live</option>
                    <option value="voting">Voting</option>
                    <option value="ended">Ended</option>
                    <option value="staff-pick">Staff Pick</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Current Price *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedProduct.price || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Original Price (MSRP)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editedProduct.originalPrice || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || undefined }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Pledge Target</label>
                  <input
                    type="number"
                    min="1"
                    value={editedProduct.pledgeTarget || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, pledgeTarget: parseInt(e.target.value) || undefined }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                    placeholder="100"
                  />
                </div>

                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Current Pledges</label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.currentPledges || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, currentPledges: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Pricing Tiers */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[#FFD700] font-medium">Pricing Tiers</label>
                  <button
                    onClick={addPricingTier}
                    className="bg-[#FFD700] hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium transition"
                  >
                    + Add Tier
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(editedProduct.pricingTiers || []).map((tier, index) => (
                    <div key={tier.id} className="bg-zinc-800 border border-zinc-600 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => updatePricingTier(index, { name: e.target.value })}
                          className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none"
                          placeholder="Tier name"
                        />
                        <input
                          type="number"
                          step="0.01"
                          value={tier.price}
                          onChange={(e) => updatePricingTier(index, { price: parseFloat(e.target.value) || 0 })}
                          className="bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none"
                          placeholder="Price"
                        />
                      </div>
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) => updatePricingTier(index, { description: e.target.value })}
                        className="w-full bg-zinc-700 border border-zinc-600 rounded px-3 py-2 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none mb-3"
                        placeholder="Description"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center text-sm text-zinc-300">
                          <input
                            type="checkbox"
                            checked={tier.isCurrent || false}
                            onChange={(e) => updatePricingTier(index, { isCurrent: e.target.checked })}
                            className="mr-2"
                          />
                          Current tier
                        </label>
                        <button
                          onClick={() => setEditedProduct(prev => ({
                            ...prev,
                            pricingTiers: prev.pricingTiers?.filter((_, i) => i !== index)
                          }))}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-[#FFD700] font-medium">Product Features</label>
                  <button
                    onClick={addFeature}
                    className="bg-[#FFD700] hover:bg-yellow-600 text-black px-3 py-1 rounded text-sm font-medium transition"
                  >
                    + Add Feature
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(editedProduct.features || []).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                        placeholder="Feature description"
                      />
                      <button
                        onClick={() => removeFeature(index)}
                        className="text-red-400 hover:text-red-300 px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Media Type Selector */}
              <div className="flex space-x-2 border-b border-zinc-700 pb-4">
                <button
                  onClick={() => setMediaType('image')}
                  className={`px-4 py-2 rounded-lg transition ${
                    mediaType === 'image'
                      ? 'bg-[#FFD700] text-black'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  📸 Images
                </button>
                <button
                  onClick={() => setMediaType('video')}
                  className={`px-4 py-2 rounded-lg transition ${
                    mediaType === 'video'
                      ? 'bg-[#FFD700] text-black'
                      : 'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'
                  }`}
                >
                  🎥 Videos
                </button>
              </div>

              {/* Upload Area */}
              <div>
                <label className="block text-[#FFD700] font-medium mb-2">
                  {mediaType === 'image' ? 'Upload Images' : 'Upload Videos'}
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                    isDragging 
                      ? 'border-[#FFD700] bg-yellow-500 bg-opacity-10' 
                      : 'border-zinc-600 hover:border-[#FFD700]'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                >
                  {isUploading ? (
                    <div className="text-[#FFD700]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700] mx-auto mb-2"></div>
                      Uploading {mediaType}...
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2 text-zinc-400">
                        {mediaType === 'image' ? '📸' : '🎥'}
                      </div>
                      <p className="text-zinc-400 mb-2">
                        Drag & drop {mediaType === 'image' ? 'images' : 'videos'} here or
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          if (mediaType === 'image') {
                            fileInputRef.current?.click();
                          } else {
                            videoInputRef.current?.click();
                          }
                        }}
                        className="bg-[#FFD700] hover:bg-yellow-600 text-black px-4 py-2 rounded-lg transition font-medium"
                      >
                        Browse {mediaType === 'image' ? 'Images' : 'Videos'}
                      </button>
                      <p className="text-xs text-zinc-500 mt-2">
                        {mediaType === 'image' 
                          ? 'Supports: JPG, PNG, GIF, WEBP' 
                          : 'Supports: MP4, WEBM, MOV'}
                      </p>
                    </div>
                  )}
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  multiple
                  onChange={(e) => e.target.files && handleVideoUpload(e.target.files)}
                  className="hidden"
                />
              </div>

              {/* Media Gallery */}
              {((mediaType === 'image' && editedProduct.images?.length) || 
                (mediaType === 'video' && editedProduct.videos?.length)) && (
                <div>
                  <label className="block text-[#FFD700] font-medium mb-4">
                    {mediaType === 'image' ? 'Image Gallery' : 'Video Gallery'}
                    <span className="text-sm text-zinc-400 ml-2">
                      (Drag to reorder)
                    </span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {(mediaType === 'image' ? editedProduct.images : editedProduct.videos)?.map((mediaUrl, index) => (
                      <div
                        key={index}
                        className="relative group bg-zinc-800 rounded-lg overflow-hidden border border-zinc-600 hover:border-[#FFD700] transition cursor-move"
                        draggable
                        onDragStart={(e) => handleMediaDragStart(e, index)}
                        onDragOver={handleMediaDragOver}
                        onDrop={(e) => handleMediaDrop(e, index)}
                      >
                        {mediaType === 'image' ? (
                          <div className="aspect-square">
                            <img
                              src={mediaUrl}
                              alt={`Product ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {editedProduct.image === mediaUrl && (
                              <div className="absolute top-2 left-2 bg-[#FFD700] text-black px-2 py-1 rounded text-xs font-semibold">
                                MAIN
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video">
                            <video
                              src={mediaUrl}
                              className="w-full h-full object-cover"
                              controls={false}
                              muted
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-black bg-opacity-50 rounded-full p-3">
                                <span className="text-white text-2xl">▶️</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Media Controls */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex space-x-2">
                            {mediaType === 'image' && editedProduct.image !== mediaUrl && (
                              <button
                                onClick={() => setAsMainImage(mediaUrl)}
                                className="bg-[#FFD700] hover:bg-yellow-600 text-black px-3 py-2 rounded text-sm font-medium transition"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              onClick={() => removeMediaItem(mediaType, index)}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-medium transition"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        
                        {/* Drag Handle */}
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                          <div className="bg-black bg-opacity-50 text-white p-1 rounded cursor-move">
                            <span className="text-xs">⋮⋮</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Info */}
              <div className="bg-zinc-800 border border-zinc-600 rounded-lg p-4">
                <h4 className="text-[#FFD700] font-medium mb-2">Media Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-400">Images:</span>
                    <span className="text-white ml-2">{editedProduct.images?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Videos:</span>
                    <span className="text-white ml-2">{editedProduct.videos?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Main Image:</span>
                    <span className="text-white ml-2">
                      {editedProduct.image ? '✓ Set' : '✗ Not set'}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-400">Total Files:</span>
                    <span className="text-white ml-2">
                      {(editedProduct.images?.length || 0) + (editedProduct.videos?.length || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Votes</label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.votes || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, votes: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-[#FFD700] font-medium mb-2">Pledges</label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.pledges || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, pledges: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-4 py-3 text-white placeholder-zinc-400 focus:border-[#FFD700] focus:outline-none transition"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="featured"
                  checked={editedProduct.featured || false}
                  onChange={(e) => setEditedProduct(prev => ({ ...prev, featured: e.target.checked }))}
                  className="h-4 w-4 text-[#FFD700] focus:ring-[#FFD700] border-zinc-600 rounded"
                />
                <label htmlFor="featured" className="ml-2 text-zinc-300">
                  Featured Product
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between p-6 border-t border-zinc-700">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-zinc-600 text-zinc-400 rounded-lg hover:border-zinc-500 hover:text-zinc-300 transition"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                console.log('Save Draft button clicked');
                handleSaveDraft();
              }}
              disabled={isSaving}
              className="px-6 py-3 bg-zinc-700 text-white border border-zinc-600 rounded-lg hover:bg-zinc-600 transition disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => {
                console.log('Save & Publish button clicked');
                handleSaveAndPublish();
              }}
              disabled={isSaving}
              className="px-6 py-3 bg-[#FFD700] hover:bg-yellow-600 text-black font-bold rounded-lg transition disabled:opacity-50"
            >
              {isSaving ? 'Publishing...' : 'Save & Publish'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1">
        <CompleteProductPagePreview />
      </div>
    </div>
  );
}
