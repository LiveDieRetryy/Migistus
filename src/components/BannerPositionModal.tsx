import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, RotateCw } from 'lucide-react';

interface BannerPositionModalProps {
  image: string;
  onClose: () => void;
  onSave: (imageData: { src: string; scale: number; x: number; y: number }) => void;
  aspectRatio?: number; // 16/9 for banner, 1 for avatar
  title?: string;
}

export default function BannerPositionModal({ 
  image, 
  onClose, 
  onSave, 
  aspectRatio = 16/9,
  title = "Position Image"
}: BannerPositionModalProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleSave = async () => {
    if (!containerRef.current) return;
    
    try {
      // Create a canvas to crop the positioned image
      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // Set canvas size to match container
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      
      // Load the image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = image;
      });
      
      // Calculate the transform
      const imgWidth = img.naturalWidth;
      const imgHeight = img.naturalHeight;
      
      // Draw the image with the same transform as displayed
      ctx.save();
      ctx.translate(containerRect.width / 2, containerRect.height / 2);
      ctx.translate(position.x, position.y);
      ctx.scale(scale, scale);
      ctx.translate(-imgWidth / 2, -imgHeight / 2);
      ctx.drawImage(img, 0, 0, imgWidth, imgHeight);
      ctx.restore();
      
      // Convert canvas to data URL
      const croppedImage = canvas.toDataURL('image/jpeg', 0.9);
      
      // Save just the cropped image, no position data
      onSave({ src: croppedImage, scale: 1, x: 0, y: 0 });
    } catch (error) {
      console.error('Error cropping image:', error);
      alert('Failed to save image. Please try again.');
    }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h2 className="text-2xl font-bold text-yellow-400 flex items-center gap-2">
            <RotateCw className="w-6 h-6" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Instructions */}
        <div className="px-6 pt-4 pb-2">
          <div className="bg-zinc-800/50 border border-yellow-500/20 rounded-lg px-4 py-3 text-sm text-gray-300">
            <span className="text-yellow-400 font-semibold">💡 Tip:</span> Drag to move • Scroll to zoom • Position your image perfectly!
          </div>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-6 overflow-hidden flex items-center justify-center">
          <div 
            ref={containerRef}
            className="relative w-full bg-black rounded-lg overflow-hidden cursor-move border-2 border-yellow-500/30"
            style={{ 
              aspectRatio: `${aspectRatio}`,
              maxHeight: aspectRatio === 16/9 ? '400px' : '300px',
              maxWidth: '100%'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <img
              src={image}
              alt="Position preview"
              className="absolute"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center',
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                maxWidth: 'none',
                width: '100%',
                height: 'auto',
                left: 0,
                top: 0
              }}
              draggable={false}
            />
            
            {/* Grid overlay for reference */}
            <div className="absolute inset-0 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(rgba(255,215,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.1) 1px, transparent 1px)',
              backgroundSize: '50px 50px'
            }} />
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 space-y-4 border-t border-zinc-700">
          {/* Zoom Control */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                <span>Zoom</span>
              </div>
              <span>{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={3}
              step={0.1}
              value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold transition-all"
            >
              Reset
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-bold transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black rounded-xl font-bold transition-all transform hover:scale-105 shadow-lg hover:shadow-yellow-500/30"
            >
              Save & Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
