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
  
  // Stock Management
  stock?: number;
  stockAvailable?: number;
  lowStockThreshold?: number;
  maxPerGuildMember?: number;
  
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
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
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

  // Text formatting helpers
  const insertTextAtCursor = (textToInsert: string) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = editedProduct.description || '';
    const scrollTop = textarea.scrollTop; // Save scroll position
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + textToInsert + after;
    
    setEditedProduct(prev => ({ ...prev, description: newText }));
    
    // Set cursor position after inserted text and restore scroll
    requestAnimationFrame(() => {
      textarea.focus();
      const newCursorPos = start + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
      textarea.scrollTop = scrollTop; // Restore scroll position
    });
  };

  const addBulletPoint = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = editedProduct.description || '';
    
    // Check if we're at the start of a line
    const beforeCursor = text.substring(0, start);
    const isStartOfLine = start === 0 || beforeCursor.endsWith('\n');
    
    if (isStartOfLine) {
      insertTextAtCursor('• ');
    } else {
      insertTextAtCursor('\n• ');
    }
  };

  const addNumberedList = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = editedProduct.description || '';
    
    // Check if we're at the start of a line
    const beforeCursor = text.substring(0, start);
    const isStartOfLine = start === 0 || beforeCursor.endsWith('\n');
    
    // Count existing numbered items to determine next number
    const lines = beforeCursor.split('\n');
    let nextNumber = 1;
    for (let i = lines.length - 1; i >= 0; i--) {
      const match = lines[i].match(/^(\d+)\.\s/);
      if (match) {
        nextNumber = parseInt(match[1]) + 1;
        break;
      }
      if (lines[i].trim() && !lines[i].match(/^(\d+)\.\s/)) {
        break; // Stop if we hit non-numbered content
      }
    }
    
    if (isStartOfLine) {
      insertTextAtCursor(`${nextNumber}. `);
    } else {
      insertTextAtCursor(`\n${nextNumber}. `);
    }
  };

  const addHeading = () => {
    const textarea = descriptionRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = editedProduct.description || '';
    
    const beforeCursor = text.substring(0, start);
    const isStartOfLine = start === 0 || beforeCursor.endsWith('\n');
    
    if (isStartOfLine) {
      insertTextAtCursor('## ');
    } else {
      insertTextAtCursor('\n\n## ');
    }
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
      <div className="bg-gradient-to-br from-black via-zinc-950 to-zinc-900 min-h-full text-white">
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
                
                <div className="text-zinc-300 mb-6 whitespace-pre-line leading-relaxed">
                  {(editedProduct.description || 'Premium gaming headset with surround sound and crystal-clear communication')
                    .split('\n')
                    .map((line, index) => {
                      // Check for heading (## )
                      if (line.startsWith('## ')) {
                        return (
                          <h3 key={index} className="text-xl font-bold text-[#FFD700] mt-4 mb-2">
                            {line.substring(3)}
                          </h3>
                        );
                      }
                      // Check for bullet point (• )
                      if (line.startsWith('• ')) {
                        return (
                          <div key={index} className="flex items-start mb-1">
                            <span className="text-[#FFD700] mr-2 mt-0.5">•</span>
                            <span>{line.substring(2)}</span>
                          </div>
                        );
                      }
                      // Check for numbered list (1. 2. etc.)
                      const numberMatch = line.match(/^(\d+)\.\s(.+)/);
                      if (numberMatch) {
                        return (
                          <div key={index} className="flex items-start mb-1">
                            <span className="text-[#FFD700] mr-2 min-w-[1.5rem]">{numberMatch[1]}.</span>
                            <span>{numberMatch[2]}</span>
                          </div>
                        );
                      }
                      // Regular line
                      return line ? <p key={index} className="mb-2">{line}</p> : <br key={index} />;
                    })
                  }
                </div>

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
              
              {/* Product Name & Short Description */}
              <div className="space-y-3">
                <h1 className="text-4xl font-bold text-white leading-tight">
                  {editedProduct.name || 'Untitled Product'}
                </h1>
                {editedProduct.shortDescription && (
                  <p className="text-lg text-zinc-400">
                    {editedProduct.shortDescription}
                  </p>
                )}
                <div className="flex items-center space-x-3 text-sm">
                  <span className={`px-3 py-1 rounded-full font-semibold ${
                    editedProduct.status === 'live' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                    editedProduct.status === 'voting' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                    editedProduct.status === 'coming-soon' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                    'bg-zinc-700/50 text-zinc-400 border border-zinc-600/50'
                  }`}>
                    {editedProduct.status?.toUpperCase() || 'DRAFT'}
                  </span>
                  <span className="text-zinc-500">•</span>
                  <span className="text-zinc-400">{editedProduct.category || 'Uncategorized'}</span>
                  {editedProduct.featured && (
                    <>
                      <span className="text-zinc-500">•</span>
                      <span className="text-yellow-400 flex items-center">
                        <span className="mr-1">⭐</span> Featured
                      </span>
                    </>
                  )}
                </div>
              </div>
              
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

                {/* Stock Availability */}
                {editedProduct.stock !== undefined && (
                  <div className={`rounded-lg p-4 mb-4 border ${
                    (editedProduct.stockAvailable ?? editedProduct.stock) === 0
                      ? 'bg-red-900/20 border-red-500/30'
                      : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                        ? 'bg-orange-900/20 border-orange-500/30'
                        : 'bg-cyan-900/20 border-cyan-500/30'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className={`mr-2 ${
                          (editedProduct.stockAvailable ?? editedProduct.stock) === 0
                            ? 'text-red-400'
                            : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                              ? 'text-orange-400'
                              : 'text-cyan-400'
                        }`}>📦</span>
                        <span className={`font-semibold ${
                          (editedProduct.stockAvailable ?? editedProduct.stock) === 0
                            ? 'text-red-300'
                            : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                              ? 'text-orange-300'
                              : 'text-cyan-300'
                        }`}>Stock Status</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        (editedProduct.stockAvailable ?? editedProduct.stock) === 0
                          ? 'bg-red-500/30 text-red-200'
                          : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                            ? 'bg-orange-500/30 text-orange-200'
                            : 'bg-cyan-500/30 text-cyan-200'
                      }`}>
                        {(editedProduct.stockAvailable ?? editedProduct.stock) === 0
                          ? 'OUT OF STOCK'
                          : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                            ? 'LOW STOCK'
                            : 'IN STOCK'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Available Units:</span>
                      <span className={`font-bold ${
                        (editedProduct.stockAvailable ?? editedProduct.stock) === 0
                          ? 'text-red-300'
                          : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                            ? 'text-orange-300'
                            : 'text-cyan-300'
                      }`}>
                        {editedProduct.stockAvailable ?? editedProduct.stock} / {editedProduct.stock}
                      </span>
                    </div>
                    {editedProduct.maxPerGuildMember && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-zinc-400">Max Per Guild Member:</span>
                        <span className="text-zinc-300 font-semibold">{editedProduct.maxPerGuildMember} units</span>
                      </div>
                    )}
                    <div className="w-full bg-zinc-700 rounded-full h-2 mt-3">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          (editedProduct.stockAvailable ?? editedProduct.stock) === 0
                            ? 'bg-red-500'
                            : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                              ? 'bg-orange-500'
                              : 'bg-cyan-500'
                        }`}
                        style={{ 
                          width: `${Math.min(((editedProduct.stockAvailable ?? editedProduct.stock) / (editedProduct.stock || 1)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Join Drop Button */}
                <button 
                  className={`w-full font-bold py-4 px-6 rounded-lg transition mb-4 ${
                    (editedProduct.stockAvailable ?? editedProduct.stock) === 0
                      ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                      : 'bg-[#FFD700] hover:bg-yellow-600 text-black'
                  }`}
                  disabled={(editedProduct.stockAvailable ?? editedProduct.stock) === 0}
                >
                  <span className="text-lg">
                    {(editedProduct.stockAvailable ?? editedProduct.stock) === 0
                      ? '❌ Out of Stock'
                      : `⚡ Join Drop - $${editedProduct.price || 139.99}`}
                  </span>
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
    <div className="fixed inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex z-50 backdrop-blur-xl">
      
      {/* Left Panel - Editing Controls */}
      <div className="w-1/3 bg-gradient-to-br from-zinc-900/90 via-zinc-900/80 to-zinc-950/90 backdrop-blur-xl border-r border-yellow-500/20 shadow-2xl flex flex-col">
        {/* Premium Header */}
        <div className="relative p-6 border-b border-yellow-500/20 bg-gradient-to-r from-zinc-900/50 to-zinc-800/50 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 animate-pulse">
                <span className="text-xl">{product.id && product.id !== 'new' ? '✏️' : '➕'}</span>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                {product.id && product.id !== 'new' ? 'Edit Product' : 'Create Product'}
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="w-10 h-10 rounded-xl bg-zinc-800/80 hover:bg-red-500/20 border border-zinc-700 hover:border-red-500/50 text-zinc-400 hover:text-red-400 text-2xl transition-all duration-300 flex items-center justify-center group shadow-lg"
            >
              <span className="group-hover:rotate-90 transition-transform duration-300">×</span>
            </button>
          </div>
        </div>

        {/* Premium Tab Navigation */}
        <div className="flex border-b border-yellow-500/20 bg-zinc-900/50 backdrop-blur-xl p-2 gap-1">
          {[
            { id: 'content', name: 'Content', icon: '📝', gradient: 'from-blue-500 to-blue-600' },
            { id: 'pricing', name: 'Pricing', icon: '💰', gradient: 'from-green-500 to-green-600' },
            { id: 'features', name: 'Features', icon: '⭐', gradient: 'from-purple-500 to-purple-600' },
            { id: 'media', name: 'Media', icon: '🖼️', gradient: 'from-pink-500 to-pink-600' },
            { id: 'settings', name: 'Settings', icon: '⚙️', gradient: 'from-orange-500 to-orange-600' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 px-2 py-3 rounded-lg text-xs font-medium transition-all duration-300 relative overflow-hidden group ${
                activeTab === tab.id
                  ? `bg-gradient-to-br ${tab.gradient} text-white shadow-lg scale-105`
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {activeTab === tab.id && (
                <div className={`absolute inset-0 bg-gradient-to-br ${tab.gradient} opacity-20 blur-xl`}></div>
              )}
              <div className="relative text-center">
                <div className={`mb-1 text-base transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {tab.icon}
                </div>
                <div className="font-semibold">{tab.name}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          
          {/* Content Tab */}
          {activeTab === 'content' && (
            <div className="space-y-6">
              {/* Product Name Input */}
              <div className="group">
                <label className="flex items-center text-yellow-500 font-semibold mb-3 text-sm">
                  <span className="mr-2">📦</span>
                  Product Name
                  <span className="text-red-400 ml-1">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editedProduct.name || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-yellow-500/50 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-yellow-500/10 group-hover:bg-zinc-800/70"
                    placeholder="Enter premium product name..."
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/0 via-yellow-500/5 to-yellow-500/0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                </div>
                {errors.name && (
                  <div className="mt-2 flex items-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span className="mr-2">⚠️</span>
                    {errors.name}
                  </div>
                )}
              </div>

              {/* Short Description */}
              <div className="group">
                <label className="flex items-center text-yellow-500 font-semibold mb-3 text-sm">
                  <span className="mr-2">✨</span>
                  Short Description
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editedProduct.shortDescription || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, shortDescription: e.target.value }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-yellow-500/50 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-yellow-500/10 group-hover:bg-zinc-800/70"
                    placeholder="Brief catchy tagline..."
                  />
                </div>
              </div>

              {/* Full Description */}
              <div className="group">
                <label className="flex items-center text-yellow-500 font-semibold mb-3 text-sm">
                  <span className="mr-2">📄</span>
                  Full Description
                  <span className="text-red-400 ml-1">*</span>
                </label>
                
                {/* Formatting Toolbar */}
                <div className="mb-2 flex items-center gap-2 p-2 bg-zinc-800/50 backdrop-blur-xl border border-zinc-700/50 rounded-xl">
                  <button
                    type="button"
                    onClick={addBulletPoint}
                    className="group/btn flex items-center space-x-1.5 px-3 py-2 bg-zinc-700/50 hover:bg-blue-500/20 border border-zinc-600 hover:border-blue-500/50 rounded-lg transition-all duration-200 text-zinc-300 hover:text-blue-400"
                    title="Add bullet point"
                  >
                    <span className="text-sm">•</span>
                    <span className="text-xs font-medium">Bullet</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={addNumberedList}
                    className="group/btn flex items-center space-x-1.5 px-3 py-2 bg-zinc-700/50 hover:bg-green-500/20 border border-zinc-600 hover:border-green-500/50 rounded-lg transition-all duration-200 text-zinc-300 hover:text-green-400"
                    title="Add numbered list"
                  >
                    <span className="text-sm">1.</span>
                    <span className="text-xs font-medium">Number</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={addHeading}
                    className="group/btn flex items-center space-x-1.5 px-3 py-2 bg-zinc-700/50 hover:bg-purple-500/20 border border-zinc-600 hover:border-purple-500/50 rounded-lg transition-all duration-200 text-zinc-300 hover:text-purple-400"
                    title="Add heading"
                  >
                    <span className="text-sm font-bold">H</span>
                    <span className="text-xs font-medium">Heading</span>
                  </button>
                  
                  <div className="flex-1"></div>
                  
                  <div className="text-xs text-zinc-500 bg-zinc-900/50 px-3 py-1.5 rounded-lg border border-zinc-700/30">
                    <span className="font-medium">Tip:</span> Use formatting buttons or type manually
                  </div>
                </div>
                
                <div className="relative">
                  <textarea
                    ref={descriptionRef}
                    value={editedProduct.description || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, description: e.target.value }))}
                    rows={8}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-yellow-500/50 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none resize-none transition-all duration-300 focus:shadow-lg focus:shadow-yellow-500/10 group-hover:bg-zinc-800/70 custom-scrollbar"
                    placeholder="Detailed product description with key benefits and specifications...&#10;&#10;Use the formatting buttons above to add:&#10;• Bullet points&#10;1. Numbered lists&#10;## Headings"
                  />
                </div>
                {errors.description && (
                  <div className="mt-2 flex items-center text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    <span className="mr-2">⚠️</span>
                    {errors.description}
                  </div>
                )}
              </div>

              {/* Category and Status Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="flex items-center text-yellow-500 font-semibold mb-3 text-sm">
                    <span className="mr-2">🏷️</span>
                    Category
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <select
                    value={editedProduct.category || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-yellow-500/50 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-white focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-yellow-500/10 group-hover:bg-zinc-800/70 cursor-pointer"
                  >
                    <option value="" className="bg-zinc-900">Select category</option>
                    <option value="electronics" className="bg-zinc-900">🔌 Electronics</option>
                    <option value="home" className="bg-zinc-900">🏠 Home & Garden</option>
                    <option value="sports" className="bg-zinc-900">⚽ Sports & Outdoors</option>
                    <option value="automotive" className="bg-zinc-900">🚗 Automotive</option>
                    <option value="beauty" className="bg-zinc-900">💄 Beauty & Health</option>
                    <option value="toys" className="bg-zinc-900">🎮 Toys & Games</option>
                    <option value="handmade" className="bg-zinc-900">✋ Handmade</option>
                  </select>
                </div>

                <div className="group">
                  <label className="flex items-center text-yellow-500 font-semibold mb-3 text-sm">
                    <span className="mr-2">🎯</span>
                    Status
                  </label>
                  <select
                    value={editedProduct.status || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-yellow-500/50 focus:border-yellow-500 rounded-xl px-4 py-3.5 text-white focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-yellow-500/10 group-hover:bg-zinc-800/70 cursor-pointer"
                  >
                    <option value="draft" className="bg-zinc-900">📝 Draft</option>
                    <option value="coming-soon" className="bg-zinc-900">⏰ Coming Soon</option>
                    <option value="live" className="bg-zinc-900">✅ Live</option>
                    <option value="voting" className="bg-zinc-900">🗳️ Voting</option>
                    <option value="ended" className="bg-zinc-900">🏁 Ended</option>
                    <option value="staff-pick" className="bg-zinc-900">⭐ Staff Pick</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {/* Price Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="flex items-center text-green-500 font-semibold mb-3 text-sm">
                    <span className="mr-2">💵</span>
                    Current Price
                    <span className="text-red-400 ml-1">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-green-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedProduct.price || ''}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-green-500/50 focus:border-green-500 rounded-xl pl-8 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-green-500/10 group-hover:bg-zinc-800/70"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="group">
                  <label className="flex items-center text-zinc-400 font-semibold mb-3 text-sm">
                    <span className="mr-2">🏷️</span>
                    Original Price (MSRP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editedProduct.originalPrice || ''}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, originalPrice: parseFloat(e.target.value) || undefined }))}
                      className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-yellow-500/50 focus:border-yellow-500 rounded-xl pl-8 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-yellow-500/10 group-hover:bg-zinc-800/70"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              {/* Stock Management Section */}
              <div className="bg-gradient-to-br from-cyan-900/20 via-blue-900/20 to-zinc-900/40 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center mb-5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 mr-3">
                    <span className="text-lg">📦</span>
                  </div>
                  <label className="text-cyan-400 font-bold text-lg">Stock Management</label>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="group">
                    <label className="flex items-center text-cyan-400 font-semibold mb-3 text-sm">
                      <span className="mr-2">📊</span>
                      Total Stock Available
                      <span className="text-red-400 ml-1">*</span>
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editedProduct.stock ?? ''}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-cyan-500/50 focus:border-cyan-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-cyan-500/10 group-hover:bg-zinc-800/70"
                      placeholder="0"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">Total units available for bulk purchase</p>
                  </div>

                  <div className="group">
                    <label className="flex items-center text-orange-400 font-semibold mb-3 text-sm">
                      <span className="mr-2">⚠️</span>
                      Low Stock Threshold
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editedProduct.lowStockThreshold ?? ''}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, lowStockThreshold: parseInt(e.target.value) || undefined }))}
                      className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-orange-500/50 focus:border-orange-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-orange-500/10 group-hover:bg-zinc-800/70"
                      placeholder="10"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">Alert when stock falls below this number</p>
                  </div>

                  <div className="group">
                    <label className="flex items-center text-purple-400 font-semibold mb-3 text-sm">
                      <span className="mr-2">🛒</span>
                      Max Per Guild Member
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editedProduct.maxPerGuildMember ?? ''}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, maxPerGuildMember: parseInt(e.target.value) || undefined }))}
                      className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-purple-500/50 focus:border-purple-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/10 group-hover:bg-zinc-800/70"
                      placeholder="100"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">Maximum units per guild member (one order per member)</p>
                  </div>

                  <div className="group">
                    <label className="flex items-center text-green-400 font-semibold mb-3 text-sm">
                      <span className="mr-2">✅</span>
                      Currently Available
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={editedProduct.stockAvailable ?? editedProduct.stock ?? ''}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, stockAvailable: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-green-500/50 focus:border-green-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-green-500/10 group-hover:bg-zinc-800/70"
                      placeholder="0"
                    />
                    <p className="text-zinc-500 text-xs mt-1.5">Remaining units after pledges/orders</p>
                  </div>
                </div>

                {/* Stock Status Indicator */}
                {editedProduct.stock !== undefined && (
                  <div className="mt-4 p-4 bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-400">Stock Status:</span>
                      <span className={`text-sm font-bold ${
                        (editedProduct.stockAvailable ?? editedProduct.stock) === 0 
                          ? 'text-red-400' 
                          : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                            ? 'text-orange-400'
                            : 'text-green-400'
                      }`}>
                        {(editedProduct.stockAvailable ?? editedProduct.stock) === 0 
                          ? 'OUT OF STOCK' 
                          : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                            ? 'LOW STOCK'
                            : 'IN STOCK'}
                      </span>
                    </div>
                    <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${
                          (editedProduct.stockAvailable ?? editedProduct.stock) === 0 
                            ? 'bg-red-500' 
                            : (editedProduct.stockAvailable ?? editedProduct.stock) <= (editedProduct.lowStockThreshold || 10)
                              ? 'bg-orange-500'
                              : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(((editedProduct.stockAvailable ?? editedProduct.stock) / (editedProduct.stock || 1)) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Pledge Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="flex items-center text-blue-400 font-semibold mb-3 text-sm">
                    <span className="mr-2">🎯</span>
                    Pledge Target
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editedProduct.pledgeTarget || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, pledgeTarget: parseInt(e.target.value) || undefined }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-blue-500/50 focus:border-blue-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10 group-hover:bg-zinc-800/70"
                    placeholder="100"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-purple-400 font-semibold mb-3 text-sm">
                    <span className="mr-2">👥</span>
                    Current Pledges
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.currentPledges || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, currentPledges: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-purple-500/50 focus:border-purple-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/10 group-hover:bg-zinc-800/70"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Pricing Tiers Section */}
              <div className="bg-gradient-to-br from-zinc-800/40 via-zinc-800/30 to-zinc-900/40 backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/20 mr-3">
                      <span className="text-lg">👑</span>
                    </div>
                    <label className="text-yellow-500 font-bold text-lg">Volume Pricing Tiers</label>
                  </div>
                  <button
                    onClick={addPricingTier}
                    className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-105"
                  >
                    <span className="mr-1">+</span> Add Tier
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(editedProduct.pricingTiers || []).map((tier, index) => (
                    <div key={tier.id} className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-700/50 hover:border-yellow-500/30 rounded-xl p-4 transition-all duration-300 hover:shadow-lg group">
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={tier.name}
                          onChange={(e) => updatePricingTier(index, { name: e.target.value })}
                          className="bg-zinc-800/50 border border-zinc-600 hover:border-yellow-500/50 focus:border-yellow-500 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none transition-all"
                          placeholder="Tier name"
                        />
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-400 font-bold">$</span>
                          <input
                            type="number"
                            step="0.01"
                            value={tier.price}
                            onChange={(e) => updatePricingTier(index, { price: parseFloat(e.target.value) || 0 })}
                            className="w-full bg-zinc-800/50 border border-zinc-600 hover:border-yellow-500/50 focus:border-yellow-500 rounded-lg pl-7 pr-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none transition-all"
                            placeholder="Price"
                          />
                        </div>
                      </div>
                      <input
                        type="text"
                        value={tier.description}
                        onChange={(e) => updatePricingTier(index, { description: e.target.value })}
                        className="w-full bg-zinc-800/50 border border-zinc-600 hover:border-yellow-500/50 focus:border-yellow-500 rounded-lg px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none mb-3 transition-all"
                        placeholder="Description"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center text-sm text-zinc-300 cursor-pointer hover:text-yellow-400 transition-colors">
                          <input
                            type="checkbox"
                            checked={tier.isCurrent || false}
                            onChange={(e) => updatePricingTier(index, { isCurrent: e.target.checked })}
                            className="mr-2 w-4 h-4 rounded border-zinc-600 text-yellow-500 focus:ring-yellow-500"
                          />
                          <span className="font-medium">Current tier</span>
                        </label>
                        <button
                          onClick={() => setEditedProduct(prev => ({
                            ...prev,
                            pricingTiers: prev.pricingTiers?.filter((_, i) => i !== index)
                          }))}
                          className="text-red-400 hover:text-red-300 text-sm font-medium bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-all"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {(!editedProduct.pricingTiers || editedProduct.pricingTiers.length === 0) && (
                    <div className="text-center py-8 text-zinc-500">
                      <div className="text-4xl mb-2">💰</div>
                      <p>No pricing tiers yet. Add one to get started!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Features Tab */}
          {activeTab === 'features' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-900/20 via-purple-800/10 to-transparent backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20 mr-3">
                      <span className="text-lg">⭐</span>
                    </div>
                    <label className="text-purple-400 font-bold text-lg">Product Features</label>
                  </div>
                  <button
                    onClick={addFeature}
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105"
                  >
                    <span className="mr-1">+</span> Add Feature
                  </button>
                </div>
                
                <div className="space-y-3">
                  {(editedProduct.features || []).map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3 group">
                      <div className="flex-1 relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-purple-400">●</div>
                        <input
                          type="text"
                          value={feature}
                          onChange={(e) => updateFeature(index, e.target.value)}
                          className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-purple-500/50 focus:border-purple-500 rounded-xl pl-10 pr-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-purple-500/10 group-hover:bg-zinc-800/70"
                          placeholder="Feature description..."
                        />
                      </div>
                      <button
                        onClick={() => removeFeature(index)}
                        className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-300 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  
                  {(!editedProduct.features || editedProduct.features.length === 0) && (
                    <div className="text-center py-12 text-zinc-500">
                      <div className="text-5xl mb-3">⭐</div>
                      <p className="text-lg font-medium">No features added yet</p>
                      <p className="text-sm mt-1">Click "Add Feature" to highlight your product's strengths!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Media Tab */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              {/* Media Type Selector */}
              <div className="flex space-x-2 bg-zinc-800/30 backdrop-blur-xl border border-pink-500/20 rounded-xl p-2">
                <button
                  onClick={() => setMediaType('image')}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    mediaType === 'image'
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/20'
                      : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                  }`}
                >
                  <span className="mr-2">📸</span> Images
                </button>
                <button
                  onClick={() => setMediaType('video')}
                  className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all duration-300 ${
                    mediaType === 'video'
                      ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/20'
                      : 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-700/50'
                  }`}
                >
                  <span className="mr-2">🎥</span> Videos
                </button>
              </div>

              {/* Upload Area */}
              <div>
                <label className="flex items-center text-pink-400 font-semibold mb-3 text-sm">
                  <span className="mr-2">☁️</span>
                  {mediaType === 'image' ? 'Upload Images' : 'Upload Videos'}
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 overflow-hidden ${
                    isDragging 
                      ? 'border-pink-500 bg-pink-500/10 scale-[1.02]' 
                      : 'border-zinc-700 hover:border-pink-500/50 bg-zinc-800/30 backdrop-blur-xl'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setIsDragging(true)}
                  onDragLeave={() => setIsDragging(false)}
                >
                  {isDragging && (
                    <div className="absolute inset-0 bg-gradient-to-br from-pink-500/20 via-pink-600/10 to-transparent animate-pulse"></div>
                  )}
                  
                  {isUploading ? (
                    <div className="text-pink-400 relative z-10">
                      <div className="w-12 h-12 mx-auto mb-3 relative">
                        <div className="absolute inset-0 border-4 border-pink-500/20 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                      <p className="font-semibold">Uploading {mediaType}...</p>
                    </div>
                  ) : (
                    <div className="relative z-10">
                      <div className={`text-6xl mb-4 transition-transform ${isDragging ? 'scale-110' : ''}`}>
                        {mediaType === 'image' ? '📸' : '🎥'}
                      </div>
                      <p className="text-zinc-300 mb-4 font-medium text-lg">
                        Drag & drop {mediaType === 'image' ? 'images' : 'videos'} here
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
                        className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-6 py-3 rounded-xl transition-all duration-300 font-bold shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 hover:scale-105"
                      >
                        Browse {mediaType === 'image' ? 'Images' : 'Videos'}
                      </button>
                      <p className="text-xs text-zinc-500 mt-4">
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
                <div className="bg-gradient-to-br from-pink-900/20 via-pink-800/10 to-transparent backdrop-blur-xl border border-pink-500/20 rounded-2xl p-6 shadow-xl">
                  <label className="flex items-center text-pink-400 font-bold text-lg mb-4">
                    <span className="mr-2">{mediaType === 'image' ? '🖼️' : '🎬'}</span>
                    {mediaType === 'image' ? 'Image Gallery' : 'Video Gallery'}
                    <span className="text-sm text-zinc-400 ml-3 font-normal">
                      (Drag to reorder)
                    </span>
                  </label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {(mediaType === 'image' ? editedProduct.images : editedProduct.videos)?.map((mediaUrl, index) => (
                      <div
                        key={index}
                        className="relative group bg-zinc-900/60 backdrop-blur-xl rounded-xl overflow-hidden border border-zinc-700 hover:border-pink-500/50 transition-all duration-300 cursor-move hover:scale-[1.02] shadow-lg hover:shadow-pink-500/20"
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
                              <div className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-yellow-500/30 flex items-center">
                                <span className="mr-1">⭐</span> MAIN
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
                              <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm border-2 border-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="text-white text-2xl ml-1">▶️</span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Media Controls */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="flex space-x-2">
                            {mediaType === 'image' && editedProduct.image !== mediaUrl && (
                              <button
                                onClick={() => setAsMainImage(mediaUrl)}
                                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg hover:scale-105"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              onClick={() => removeMediaItem(mediaType, index)}
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all shadow-lg hover:scale-105"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        
                        {/* Drag Handle */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-black/60 backdrop-blur-sm text-white p-2 rounded-lg cursor-move border border-white/10">
                            <span className="text-sm">⋮⋮</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media Summary Stats */}
              <div className="bg-gradient-to-br from-zinc-800/40 via-zinc-800/30 to-zinc-900/40 backdrop-blur-xl border border-pink-500/10 rounded-2xl p-5">
                <h4 className="text-pink-400 font-bold mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Media Summary
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="text-zinc-400 text-sm mb-1">Images</div>
                    <div className="text-2xl font-bold text-white">{editedProduct.images?.length || 0}</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="text-zinc-400 text-sm mb-1">Videos</div>
                    <div className="text-2xl font-bold text-white">{editedProduct.videos?.length || 0}</div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="text-zinc-400 text-sm mb-1">Main Image</div>
                    <div className="text-lg font-bold">
                      {editedProduct.image ? (
                        <span className="text-green-400">✓ Set</span>
                      ) : (
                        <span className="text-red-400">✗ Not set</span>
                      )}
                    </div>
                  </div>
                  <div className="bg-zinc-900/50 rounded-xl p-4 border border-zinc-700/50">
                    <div className="text-zinc-400 text-sm mb-1">Total Files</div>
                    <div className="text-2xl font-bold text-white">
                      {(editedProduct.images?.length || 0) + (editedProduct.videos?.length || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="group">
                  <label className="flex items-center text-orange-400 font-semibold mb-3 text-sm">
                    <span className="mr-2">🗳️</span>
                    Votes
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.votes || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, votes: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-orange-500/50 focus:border-orange-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-orange-500/10 group-hover:bg-zinc-800/70"
                    placeholder="0"
                  />
                </div>

                <div className="group">
                  <label className="flex items-center text-blue-400 font-semibold mb-3 text-sm">
                    <span className="mr-2">🤝</span>
                    Pledges
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editedProduct.pledges || ''}
                    onChange={(e) => setEditedProduct(prev => ({ ...prev, pledges: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-zinc-800/50 backdrop-blur-xl border border-zinc-700 hover:border-blue-500/50 focus:border-blue-500 rounded-xl px-4 py-3.5 text-white placeholder-zinc-500 focus:outline-none transition-all duration-300 focus:shadow-lg focus:shadow-blue-500/10 group-hover:bg-zinc-800/70"
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Featured Toggle */}
              <div className="bg-gradient-to-br from-yellow-900/20 via-yellow-800/10 to-transparent backdrop-blur-xl border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-500/40 transition-all duration-300 cursor-pointer group">
                <label htmlFor="featured" className="flex items-center cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={editedProduct.featured || false}
                      onChange={(e) => setEditedProduct(prev => ({ ...prev, featured: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-7 bg-zinc-700 rounded-full peer peer-checked:bg-gradient-to-r peer-checked:from-yellow-500 peer-checked:to-yellow-600 transition-all duration-300 shadow-inner"></div>
                    <div className="absolute left-1 top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 peer-checked:translate-x-7 shadow-lg"></div>
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center text-yellow-400 font-bold text-lg">
                      <span className="mr-2">⭐</span>
                      Featured Product
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">
                      Highlight this product on the homepage and featured sections
                    </p>
                  </div>
                </label>
              </div>

              {/* Product Stats Summary */}
              <div className="bg-gradient-to-br from-zinc-800/40 via-zinc-800/30 to-zinc-900/40 backdrop-blur-xl border border-orange-500/10 rounded-2xl p-6">
                <h4 className="text-orange-400 font-bold mb-4 flex items-center">
                  <span className="mr-2">📊</span>
                  Product Statistics
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-700/50">
                    <span className="text-zinc-300">Total Votes</span>
                    <span className="text-2xl font-bold text-orange-400">{editedProduct.votes || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-700/50">
                    <span className="text-zinc-300">Total Pledges</span>
                    <span className="text-2xl font-bold text-blue-400">{editedProduct.pledges || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-xl border border-zinc-700/50">
                    <span className="text-zinc-300">Featured Status</span>
                    <span className={`px-3 py-1 rounded-lg font-semibold ${
                      editedProduct.featured 
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                        : 'bg-zinc-700/50 text-zinc-400 border border-zinc-600/50'
                    }`}>
                      {editedProduct.featured ? '✓ Yes' : '✗ No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Premium Footer Buttons */}
        <div className="relative p-6 border-t border-yellow-500/20 bg-gradient-to-r from-zinc-900/80 to-zinc-800/80 backdrop-blur-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/50 to-transparent pointer-events-none"></div>
          <div className="relative flex items-center justify-between">
            <button
              onClick={onCancel}
              className="group px-6 py-3.5 border-2 border-zinc-600 hover:border-red-500/50 text-zinc-300 hover:text-white rounded-xl transition-all duration-300 font-semibold bg-zinc-800/50 hover:bg-red-500/10 shadow-lg"
            >
              <span className="flex items-center">
                <span className="mr-2 group-hover:rotate-90 transition-transform">×</span>
                Cancel
              </span>
            </button>
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  console.log('Save Draft button clicked');
                  handleSaveDraft();
                }}
                disabled={isSaving}
                className="px-6 py-3.5 bg-zinc-700/80 hover:bg-zinc-600 text-white border-2 border-zinc-600 hover:border-zinc-500 rounded-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center"
              >
                <span className="mr-2">💾</span>
                Save Draft
              </button>
              <button
                onClick={() => {
                  console.log('Save & Publish button clicked');
                  handleSaveAndPublish();
                }}
                disabled={isSaving}
                className="group px-6 py-3.5 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-yellow-500/20 hover:shadow-yellow-500/40 hover:scale-105 flex items-center"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <span className="mr-2 group-hover:scale-110 transition-transform">🚀</span>
                    Save & Publish
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Live Preview with Scrollbar */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-zinc-950">
        <div className="sticky top-0 z-10 bg-gradient-to-r from-zinc-900/95 via-zinc-800/95 to-zinc-900/95 backdrop-blur-xl border-b border-yellow-500/20 px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20 animate-pulse">
                <span className="text-sm">👁️</span>
              </div>
              <div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
                  Live Preview
                </h3>
                <p className="text-xs text-zinc-400">Real-time product page simulation</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs text-zinc-400">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>Auto-updating</span>
            </div>
          </div>
        </div>
        <CompleteProductPagePreview />
      </div>
    </div>
  );
}
