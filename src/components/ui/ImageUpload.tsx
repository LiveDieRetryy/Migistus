import React, { useState, useRef } from 'react';
import { Upload, X, Camera } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (imageUrl: string) => void;
  onRemove?: () => void;
  className?: string;
  placeholder?: string;
  aspectRatio?: 'square' | 'banner' | 'auto';
  maxSizeMB?: number;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  onRemove,
  className = '',
  placeholder = 'Upload an image',
  aspectRatio = 'auto',
  maxSizeMB = 5
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAspectRatioClasses = () => {
    switch (aspectRatio) {
      case 'square':
        return 'aspect-square';
      case 'banner':
        return 'aspect-[3/1]';
      default:
        return 'min-h-[200px]';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    // Only set drag over to false if we're leaving the drop zone entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };
  const processFile = async (file: File, productId?: string) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      alert(`File size must be less than ${maxSizeMB}MB.`);
      return;
    }

    setIsUploading(true);
    try {
      // Create preview URL immediately for better UX
      const previewUrl = URL.createObjectURL(file);
      onChange(previewUrl);

      // Upload to server with productId for tracking
      const formData = new FormData();
      formData.append('image', file);
      if (productId) {
        formData.append('productId', productId);
      }

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      // Clean up preview URL
      URL.revokeObjectURL(previewUrl);
      
      // Update with the server URL
      onChange(result.url);
      
      console.log(`✅ Image uploaded and persisted: ${result.url}`);
      
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
      // Revert to empty on error
      onChange('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await processFile(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await processFile(files[0]);
    }
    
    // Reset the input
    e.target.value = '';
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
    
    // Revoke object URL to prevent memory leaks
    if (value && value.startsWith('blob:')) {
      URL.revokeObjectURL(value);
    }
  };

  if (value) {
    return (
      <div className={`relative ${getAspectRatioClasses()} ${className}`}>
        <img
          src={value}
          alt="Uploaded"
          className="w-full h-full object-cover rounded-lg border border-zinc-700"
        />
        <button
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors"
          title="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
        <button
          onClick={handleClick}
          className="absolute top-2 left-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-1 transition-colors"
          title="Change image"
        >
          <Camera className="w-4 h-4" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <div
      className={`
        ${getAspectRatioClasses()}
        ${className}
        border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer
        ${isDragOver 
          ? 'border-yellow-500 bg-yellow-500 bg-opacity-10' 
          : 'border-zinc-600 hover:border-zinc-500'
        }
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center h-full">
        <Upload className={`w-8 h-8 text-zinc-400 mx-auto mb-2 ${isUploading ? 'animate-pulse' : ''}`} />
        <p className="text-zinc-400 mb-2">
          {isUploading 
            ? 'Uploading...' 
            : isDragOver 
              ? 'Drop image here...' 
              : placeholder
          }
        </p>
        <p className="text-xs text-zinc-500">
          {aspectRatio === 'square' ? 'Square format recommended' :
           aspectRatio === 'banner' ? 'Banner format (3:1 ratio) recommended' :
           'Any image format'}
        </p>
        <p className="text-xs text-zinc-500 mt-1">
          Max size: {maxSizeMB}MB
        </p>
      </div>
    </div>
  );
};
