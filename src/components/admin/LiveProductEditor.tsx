import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import AdvancedWYSIWYGEditor from './AdvancedWYSIWYGEditor';
import { getSupplierAvatar } from '../../lib/utils';
import { 
  Star, 
  Heart, 
  Share2, 
  ShoppingCart, 
  Eye, 
  Play,
  Plus, 
  Minus, 
  X,
  Upload,
  Edit3,
  Save,
  RotateCcw
} from 'lucide-react';

interface PricingTier {
  quantity: number;
  price: number;
  discount?: number;
}

interface ProductReview {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  verified: boolean;
  helpful: number;
}

interface ProductData {
  id?: string;
  name: string;
  slug?: string;
  images: string[];
  description: string;
  fullDescription: string;
  category: string;
  price: number;
  originalPrice: number;
  votes: number;
  stage: string;
  features: string[];
  specifications: { [key: string]: string };
  supplier: {
    name: string;
    rating: number;
    verified: boolean;
    location: string;
  };
  pledges: number;
  pledgeGoal: number;
  pricingTiers: PricingTier[];
  reviews: ProductReview[];
  video?: string;
  gallery: string[];
  tags: string[];
  compatibility: string[];
  warranty: string;
  shipping: {
    free: boolean;
    estimatedDays: number;
    regions: string[];
  };
  socialMetrics: {
    likes: number;
    shares: number;
    comments: number;
  };
}

interface LiveProductEditorProps {
  initialProduct?: Partial<ProductData>;
  onSave: (product: ProductData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const LiveProductEditor: React.FC<LiveProductEditorProps> = ({
  initialProduct,
  onSave,
  onCancel,
  isEditing = false
}) => {
  const [activeSection, setActiveSection] = useState('basic');
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [product, setProduct] = useState<ProductData>({
    name: '',
    images: ['/images/placeholder.png'],
    description: '',
    fullDescription: '',
    category: 'Electronics',
    price: 0,
    originalPrice: 0,
    votes: 0,
    stage: 'coming-soon',
    features: [''],
    specifications: {},
    supplier: {
      name: 'MIGISTUS Partners',
      rating: 4.8,
      verified: true,
      location: 'Global'
    },
    pledges: 0,
    pledgeGoal: 100,
    pricingTiers: [{ quantity: 1, price: 0 }],
    reviews: [],
    video: '',
    gallery: [],
    tags: [],
    compatibility: [],
    warranty: '1 Year Limited Warranty',
    shipping: {
      free: true,
      estimatedDays: 7,
      regions: ['US', 'Canada', 'EU']
    },
    socialMetrics: {
      likes: 0,
      shares: 0,
      comments: 0
    },
    ...initialProduct
  });

  const [previewMode, setPreviewMode] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const sections = [
    { id: 'basic', name: 'Basic Info', icon: '📝' },
    { id: 'media', name: 'Media & Gallery', icon: '🖼️' },
    { id: 'description', name: 'Description', icon: '📄' },
    { id: 'features', name: 'Features', icon: '⭐' },
    { id: 'specifications', name: 'Specifications', icon: '🔧' },
    { id: 'pricing', name: 'Pricing & Tiers', icon: '💰' },
    { id: 'supplier', name: 'Supplier Info', icon: '🏪' },
    { id: 'shipping', name: 'Shipping & Warranty', icon: '🚚' },
    { id: 'social', name: 'Social & Tags', icon: '🏷️' }
  ];

  const updateProduct = (field: string, value: any) => {
    setProduct(prev => ({
      ...prev,
      [field]: value
    }));
  };  const updateNestedField = (parent: string, field: string, value: any) => {
    setProduct(prev => {
      const parentObj = prev[parent as keyof ProductData] as Record<string, any> || {};
      return {
        ...prev,
        [parent]: {
          ...parentObj,
          [field]: value
        }
      };
    });
  };

  const addFeature = () => {
    setProduct(prev => ({
      ...prev,
      features: [...prev.features, '']
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setProduct(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }));
  };

  const removeFeature = (index: number) => {
    setProduct(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  const addSpecification = (key: string, value: string) => {
    if (!key.trim()) return;
    setProduct(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [key]: value
      }
    }));
  };

  const removeSpecification = (key: string) => {
    setProduct(prev => ({
      ...prev,
      specifications: Object.fromEntries(
        Object.entries(prev.specifications).filter(([k]) => k !== key)
      )
    }));
  };

  const addPricingTier = () => {
    setProduct(prev => ({
      ...prev,
      pricingTiers: [...prev.pricingTiers, { quantity: 1, price: 0 }]
    }));
  };

  const updatePricingTier = (index: number, field: keyof PricingTier, value: number) => {
    setProduct(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.map((tier, i) => 
        i === index ? { ...tier, [field]: value } : tier
      )
    }));
  };

  const removePricingTier = (index: number) => {
    setProduct(prev => ({
      ...prev,
      pricingTiers: prev.pricingTiers.filter((_, i) => i !== index)
    }));
  };

  const addImage = (url: string) => {
    setProduct(prev => ({
      ...prev,
      images: [...prev.images.filter(img => img !== '/images/placeholder.png'), url]
    }));
  };
  const removeImage = (index: number) => {
    setProduct(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  // Drag and drop handlers for images
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null) return;
    
    const newImages = [...product.images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);
    
    setProduct(prev => ({ ...prev, images: newImages }));
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // File drop handlers for new uploads
  const handleFileDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };
  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    for (const file of imageFiles) {
      await uploadAndAddImage(file);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        await uploadAndAddImage(file);
      }
    }
    
    // Reset the input
    e.target.value = '';
  };
  const uploadAndAddImage = async (file: File) => {
    try {
      // Create preview URL immediately
      const previewUrl = URL.createObjectURL(file);
      addImage(previewUrl);

      // Upload to server
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Replace preview URL with server URL
      const currentImages = product.images || [];
      const imageIndex = currentImages.findIndex((img: string) => img === previewUrl);
      if (imageIndex !== -1) {
        // Clean up preview URL
        URL.revokeObjectURL(previewUrl);
        
        // Update with server URL
        const newImages = [...currentImages];
        newImages[imageIndex] = result.url;
        setProduct(prev => ({
          ...prev,
          images: newImages
        }));
      }
      
    } catch (error) {
      console.error('Error uploading image:', error);
      // Remove the preview image on error
      const currentImages = product.images || [];
      const previewIndex = currentImages.findIndex((img: string) => img.startsWith('blob:'));
      if (previewIndex !== -1) {
        const newImages = currentImages.filter((_: string, index: number) => index !== previewIndex);
        setProduct(prev => ({
          ...prev,
          images: newImages
        }));
      }
    }
  };

  const handleSave = () => {
    onSave(product);
  };

  return (
    <div className="flex h-screen bg-zinc-900">
      {/* Editor Panel */}
      <div className="w-1/2 border-r border-zinc-700 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-yellow-400">
              {isEditing ? 'Edit Product' : 'Create Product'}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
              >
                {previewMode ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
              <button
                onClick={onCancel}
                className="bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                    activeSection === section.id
                      ? 'bg-yellow-600 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {section.icon} {section.name}
                </button>
              ))}
            </div>
          </div>

          {/* Editor Sections */}
          <div className="space-y-6">
            {/* Basic Info Section */}
            {activeSection === 'basic' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => updateProduct('name', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter product name..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Category</label>
                  <select
                    value={product.category}
                    onChange={(e) => updateProduct('category', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Home & Garden">Home & Garden</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Sports & Outdoor">Sports & Outdoor</option>
                    <option value="Automotive">Automotive</option>
                    <option value="Beauty & Health">Beauty & Health</option>
                    <option value="Toys & Games">Toys & Games</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Price ($)</label>
                    <input
                      type="number"
                      value={product.price}
                      onChange={(e) => updateProduct('price', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Original Price ($)</label>
                    <input
                      type="number"
                      value={product.originalPrice}
                      onChange={(e) => updateProduct('originalPrice', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Stage</label>
                    <select
                      value={product.stage}
                      onChange={(e) => updateProduct('stage', e.target.value)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="coming-soon">Coming Soon</option>
                      <option value="live">Live</option>
                      <option value="staff-pick">Staff Pick</option>
                      <option value="ended">Ended</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Pledge Goal</label>
                    <input
                      type="number"
                      value={product.pledgeGoal}
                      onChange={(e) => updateProduct('pledgeGoal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      min="1"
                    />
                  </div>
                </div>
              </div>
            )}            {/* Media Section */}
            {activeSection === 'media' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Media & Gallery</h3>
                  <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-zinc-300">Product Images</label>
                    <span className="text-xs text-zinc-500">Drag images to reorder • Drop files to upload</span>
                  </div>
                  
                  {/* Image Grid with Drag & Drop */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    {product.images.map((image, index) => (
                      <div
                        key={index}
                        className={`relative group cursor-move transition-all duration-200 ${
                          draggedIndex === index ? 'opacity-50 scale-95' : ''
                        } ${
                          dragOverIndex === index ? 'ring-2 ring-yellow-500 scale-105' : ''
                        }`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragEnd={handleDragEnd}
                      >
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-zinc-600"
                        />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 rounded">
                          {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Drag & Drop Upload Zone */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
                      isDragOver 
                        ? 'border-yellow-500 bg-yellow-500 bg-opacity-10' 
                        : 'border-zinc-600 hover:border-zinc-500'
                    }`}
                    onDragOver={handleFileDragOver}
                    onDragLeave={handleFileDragLeave}
                    onDrop={handleFileDrop}
                  >
                    <Upload className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                    <p className="text-zinc-400 mb-2">
                      {isDragOver ? 'Drop images here...' : 'Drag and drop images here or click to upload'}
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="inline-block bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded-lg cursor-pointer transition"
                    >
                      Choose Files
                    </label>
                  </div>

                  {/* URL Input (Alternative) */}
                  <div className="border-t border-zinc-700 pt-4">
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Or add image by URL</label>
                    <input
                      type="url"
                      placeholder="Enter image URL and press Enter"
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          const target = e.target as HTMLInputElement;
                          if (target.value.trim()) {
                            addImage(target.value.trim());
                            target.value = '';
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Product Video (Optional)</label>
                  <input
                    type="url"
                    value={product.video || ''}
                    onChange={(e) => updateProduct('video', e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    placeholder="Enter video URL (YouTube, Vimeo, etc.)"
                  />
                </div>
              </div>
            )}

            {/* Description Section */}
            {activeSection === 'description' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Product Description</h3>
                
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Short Description</label>                  <AdvancedWYSIWYGEditor
                    value={product.description}
                    onChange={(value) => updateProduct('description', value)}
                    placeholder="Enter short product description..."
                    enableImageUpload={true}
                    onImageUpload={async (file) => {
                      try {
                        const formData = new FormData();
                        formData.append('image', file);
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        if (!response.ok) throw new Error('Upload failed');
                        const result = await response.json();
                        return result.url;
                      } catch (error) {
                        console.error('Error uploading image:', error);
                        return URL.createObjectURL(file); // Fallback to blob URL
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Full Description</label>                  <AdvancedWYSIWYGEditor
                    value={product.fullDescription}
                    onChange={(value) => updateProduct('fullDescription', value)}
                    placeholder="Enter detailed product description..."
                    enableImageUpload={true}
                    onImageUpload={async (file) => {
                      try {
                        const formData = new FormData();
                        formData.append('image', file);
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        if (!response.ok) throw new Error('Upload failed');
                        const result = await response.json();
                        return result.url;
                      } catch (error) {
                        console.error('Error uploading image:', error);
                        return URL.createObjectURL(file); // Fallback to blob URL
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Features Section */}
            {activeSection === 'features' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Key Features</h3>
                
                {product.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                      placeholder="Enter feature..."
                    />
                    <button
                      onClick={() => removeFeature(index)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <button
                  onClick={addFeature}
                  className="w-full bg-zinc-700 hover:bg-zinc-600 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Feature
                </button>
              </div>
            )}

            {/* Specifications Section */}
            {activeSection === 'specifications' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Specifications</h3>
                
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key} className="flex gap-2">
                    <input
                      type="text"
                      value={key}
                      disabled
                      className="w-1/3 px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-zinc-300"
                    />
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => addSpecification(key, e.target.value)}
                      className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      onClick={() => removeSpecification(key)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Specification name"
                    className="w-1/3 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        const valueInput = target.nextElementSibling as HTMLInputElement;
                        if (target.value.trim() && valueInput.value.trim()) {
                          addSpecification(target.value.trim(), valueInput.value.trim());
                          target.value = '';
                          valueInput.value = '';
                        }
                      }
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Specification value"
                    className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-yellow-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        const nameInput = target.previousElementSibling as HTMLInputElement;
                        if (nameInput.value.trim() && target.value.trim()) {
                          addSpecification(nameInput.value.trim(), target.value.trim());
                          nameInput.value = '';
                          target.value = '';
                        }
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const container = e.currentTarget.parentElement;
                      const nameInput = container?.querySelector('input[placeholder="Specification name"]') as HTMLInputElement;
                      const valueInput = container?.querySelector('input[placeholder="Specification value"]') as HTMLInputElement;
                      if (nameInput?.value.trim() && valueInput?.value.trim()) {
                        addSpecification(nameInput.value.trim(), valueInput.value.trim());
                        nameInput.value = '';
                        valueInput.value = '';
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Continue with other sections... */}
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="w-1/2 bg-black overflow-y-auto">
        <div className="sticky top-0 bg-zinc-900 border-b border-zinc-700 p-4 z-10">
          <h3 className="text-lg font-semibold text-yellow-400">Live Preview</h3>
        </div>
        
        {/* Product Page Preview */}
        <div className="p-6 bg-gradient-to-br from-black via-zinc-900 to-black text-white">
          {/* Hero Section */}
          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-square bg-zinc-800 rounded-lg overflow-hidden">
                <img
                  src={product.images[selectedImageIndex] || '/images/placeholder.png'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.video && (
                  <button className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 hover:bg-opacity-70 transition">
                    <Play className="w-16 h-16 text-white" />
                  </button>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index ? 'border-yellow-400' : 'border-zinc-600'
                    }`}
                  >
                    <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{product.name || 'Product Name'}</h1>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="bg-zinc-800 px-2 py-1 rounded">{product.category}</span>
                  <span className={`px-2 py-1 rounded ${
                    product.stage === 'live' ? 'bg-green-900 text-green-300' :
                    product.stage === 'coming-soon' ? 'bg-blue-900 text-blue-300' :
                    product.stage === 'staff-pick' ? 'bg-yellow-900 text-yellow-300' :
                    'bg-gray-900 text-gray-300'
                  }`}>
                    {product.stage}
                  </span>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-yellow-400">${product.price}</span>
                  {product.originalPrice > product.price && (
                    <span className="text-xl text-zinc-400 line-through">${product.originalPrice}</span>
                  )}
                </div>
                {product.originalPrice > product.price && (
                  <div className="text-green-400 font-medium">
                    Save ${(product.originalPrice - product.price).toFixed(2)} 
                    ({Math.round((1 - product.price / product.originalPrice) * 100)}% off)
                  </div>
                )}
              </div>

              {/* Short Description */}
              <div 
                className="text-zinc-300 prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />

              {/* Key Features */}
              {product.features.length > 0 && product.features[0] && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
                  <ul className="space-y-2">
                    {product.features.filter(f => f.trim()).map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-zinc-300">
                        <span className="text-yellow-400 mt-1">•</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Pledge Now
                </button>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition">
                  <Heart className="w-5 h-5" />
                </button>
                <button className="bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-lg transition">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Pledge Progress */}
              <div className="bg-zinc-800 rounded-lg p-4">
                <div className="flex justify-between text-sm text-zinc-400 mb-2">
                  <span>{product.pledges} pledges</span>
                  <span>{product.pledgeGoal} goal</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-2 mb-3">
                  <div 
                    className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((product.pledges / product.pledgeGoal) * 100, 100)}%` }}
                  />
                </div>
                <div className="text-lg font-semibold text-white">
                  {Math.round((product.pledges / product.pledgeGoal) * 100)}% funded
                </div>
              </div>
            </div>
          </div>

          {/* Full Description */}
          {product.fullDescription && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Description</h2>
              <div 
                className="prose prose-invert max-w-none text-zinc-300"
                dangerouslySetInnerHTML={{ __html: product.fullDescription }}
              />
            </div>
          )}

          {/* Specifications */}
          {Object.keys(product.specifications).length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Specifications</h2>
              <div className="bg-zinc-800 rounded-lg overflow-hidden">
                {Object.entries(product.specifications).map(([key, value], index) => (
                  <div key={key} className={`flex justify-between p-4 ${index % 2 === 0 ? 'bg-zinc-800' : 'bg-zinc-750'}`}>
                    <span className="font-medium text-zinc-300">{key}</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Supplier Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Supplier Information</h2>
            <div className="bg-zinc-800 rounded-lg p-6">              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full overflow-hidden">
                  <img
                    src="/Icons/SupplierPlaceHolder.png"
                    alt={`${product.supplier.name} logo`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-white">{product.supplier.name}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(product.supplier.rating) ? 'text-yellow-400 fill-current' : 'text-zinc-600'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-zinc-400">({product.supplier.rating})</span>
                    {product.supplier.verified && (
                      <span className="text-green-400 text-sm">✓ Verified</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-zinc-300">Location: {product.supplier.location}</p>
            </div>
          </div>

          {/* Shipping & Warranty */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Shipping</h3>
              <div className="space-y-2 text-zinc-300">
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className={product.shipping.free ? 'text-green-400' : ''}>
                    {product.shipping.free ? 'Free' : 'Calculated at checkout'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated delivery:</span>
                  <span>{product.shipping.estimatedDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Ships to:</span>
                  <span>{product.shipping.regions.join(', ')}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-zinc-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-3">Warranty</h3>
              <p className="text-zinc-300">{product.warranty}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveProductEditor;
