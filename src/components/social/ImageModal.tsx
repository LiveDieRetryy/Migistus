import { useState, useEffect } from 'react';
import Image from 'next/image';

interface ImageModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function ImageModal({ isOpen, images, initialIndex, onClose }: ImageModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' && images.length > 1) {
        nextImage();
      } else if (e.key === 'ArrowLeft' && images.length > 1) {
        prevImage();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, images.length]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative z-10 max-w-7xl max-h-[90vh] mx-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-t-xl">
          <div className="flex items-center gap-3">
            <span className="text-white font-semibold">
              Image {currentIndex + 1} of {images.length}
            </span>
            {images.length > 1 && (
              <div className="flex gap-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      index === currentIndex ? 'bg-yellow-400' : 'bg-zinc-600 hover:bg-zinc-500'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Download Button */}
            <a
              href={images[currentIndex]}
              download
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg transition-colors"
              title="Download image"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </a>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg transition-colors"
              title="Close (Esc)"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="relative bg-zinc-900/95 backdrop-blur-sm border-x border-zinc-700 flex-1 flex items-center justify-center min-h-0">          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain cursor-zoom-in hover:cursor-zoom-in transition-transform duration-200"
            style={{ maxHeight: 'calc(90vh - 120px)' }}
            onClick={(e) => {
              e.stopPropagation();
              // You can add zoom functionality here later if needed
            }}
          />
          
          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 border border-zinc-600 rounded-full transition-colors"
                title="Previous image (←)"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 border border-zinc-600 rounded-full transition-colors"
                title="Next image (→)"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        {images.length > 1 && (
          <div className="p-4 bg-zinc-900/95 backdrop-blur-sm border border-zinc-700 rounded-b-xl">
            <div className="flex justify-center gap-2">
              <span className="text-sm text-gray-400">
                Use arrow keys or click arrows to navigate • Press Esc to close
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
