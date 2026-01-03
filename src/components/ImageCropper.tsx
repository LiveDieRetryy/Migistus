import { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Move, RotateCw, Check } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio?: number; // width / height (e.g., 3 for 3:1 banner ratio)
  onCropComplete: (croppedImageDataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function ImageCropper({ 
  imageSrc, 
  aspectRatio = 3, 
  onCropComplete, 
  onCancel,
  title = 'Adjust Image'
}: ImageCropperProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      imageRef.current = img;
      drawCanvas();
    };
  }, [imageSrc]);

  useEffect(() => {
    drawCanvas();
  }, [scale, position, rotation]);

  const drawCanvas = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container
    const width = 800;
    const height = width / aspectRatio;
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Save context state
    ctx.save();

    // Move to center
    ctx.translate(width / 2, height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply scale and position
    ctx.scale(scale, scale);
    ctx.translate(position.x, position.y);

    // Draw image centered
    const img = imageRef.current;
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    // Restore context state
    ctx.restore();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.1));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleCrop = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png', 0.95);
    onCropComplete(dataUrl);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">{title}</h2>
            <p className="text-sm text-zinc-400 mt-1">Drag to move, use controls to adjust</p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-zinc-400" />
          </button>
        </div>

        {/* Canvas Preview */}
        <div 
          ref={containerRef}
          className="relative bg-zinc-800 rounded-xl overflow-hidden mb-6 cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ maxHeight: '400px' }}
          />
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/10 border-2 border-blue-500 rounded-xl pointer-events-none" />
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Zoom Control */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <ZoomIn className="w-4 h-4 text-yellow-400" />
              Zoom: {(scale * 100).toFixed(0)}%
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleZoomOut}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ZoomOut className="w-5 h-5 text-white" />
              </button>
              <input
                type="range"
                min="10"
                max="300"
                value={scale * 100}
                onChange={(e) => setScale(Number(e.target.value) / 100)}
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <button
                onClick={handleZoomIn}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <ZoomIn className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Rotation Control */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-2">
              <RotateCw className="w-4 h-4 text-yellow-400" />
              Rotation: {rotation}°
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRotate}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <RotateCw className="w-5 h-5 text-white" />
              </button>
              <input
                type="range"
                min="0"
                max="360"
                value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer slider"
              />
              <span className="text-white font-mono w-12 text-center">{rotation}°</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
            >
              Reset
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCrop}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Apply
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #eab308;
          cursor: pointer;
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #eab308;
          cursor: pointer;
          border: none;
        }
      `}</style>
    </div>
  );
}
