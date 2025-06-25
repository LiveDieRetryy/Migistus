import React, { useState, useRef } from 'react';

interface Asset {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'video' | 'audio' | 'document';
  size: number;
  uploadedAt: Date;
  tags: string[];
}

interface AssetManagerProps {
  onSelectAsset: (asset: Asset) => void;
  onClose: () => void;
  isOpen: boolean;
  allowedTypes?: string[];
}

export default function AssetManager({ onSelectAsset, onClose, isOpen, allowedTypes = ['image'] }: AssetManagerProps) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach(file => {
      const newAsset: Asset = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: URL.createObjectURL(file),
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('video/') ? 'video' :
              file.type.startsWith('audio/') ? 'audio' : 'document',
        size: file.size,
        uploadedAt: new Date(),
        tags: []
      };

      setAssets(prev => [newAsset, ...prev]);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return 'fa-image';
      case 'video': return 'fa-video';
      case 'audio': return 'fa-music';
      default: return 'fa-file';
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const isAllowed = allowedTypes.includes(asset.type);
    return matchesType && matchesSearch && isAllowed;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col border border-yellow-400/20">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-700">
          <div>
            <h2 className="text-2xl font-bold text-yellow-300 flex items-center gap-2">
              <span className="fa fa-folder-open" />
              Asset Manager
            </h2>
            <p className="text-zinc-400 mt-1">Manage your images, videos, and other media files</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 text-yellow-200 rounded-lg hover:bg-zinc-700 transition"
          >
            <span className="fa fa-times text-lg" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="p-6 border-b border-zinc-700">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4 items-center">
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-300 transition flex items-center gap-2"
              >
                <span className="fa fa-upload" />
                Upload Files
              </button>

              {/* View Mode Toggle */}
              <div className="flex bg-zinc-800 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-yellow-400 text-black' : 'text-yellow-200 hover:bg-zinc-700'}`}
                >
                  <span className="fa fa-th-large" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-yellow-400 text-black' : 'text-yellow-200 hover:bg-zinc-700'}`}
                >
                  <span className="fa fa-list" />
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search assets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-4 py-2 pl-10 bg-zinc-800 text-yellow-200 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-yellow-400"
                />
                <span className="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
              </div>

              {/* Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-4 py-2 bg-zinc-800 text-yellow-200 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-yellow-400"
              >
                <option value="all">All Types</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto">
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`m-6 border-2 border-dashed rounded-lg p-8 text-center transition-all ${
              dragOver 
                ? 'border-yellow-400 bg-yellow-400/10' 
                : 'border-zinc-600 hover:border-zinc-500'
            }`}
          >
            <div className="text-4xl text-zinc-500 mb-4">
              <span className="fa fa-cloud-upload-alt" />
            </div>
            <p className="text-zinc-400 mb-2">
              Drag and drop files here, or{' '}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-yellow-400 hover:text-yellow-300 underline"
              >
                browse files
              </button>
            </p>
            <p className="text-sm text-zinc-500">
              Supports: JPG, PNG, GIF, MP4, MP3, PDF (Max 10MB)
            </p>
          </div>

          {/* Assets Display */}
          {filteredAssets.length > 0 ? (
            <div className="p-6">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => onSelectAsset(asset)}
                      className="bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 hover:border-yellow-400/50 transition-all cursor-pointer group"
                    >
                      <div className="aspect-square bg-zinc-700 flex items-center justify-center relative">
                        {asset.type === 'image' ? (
                          <img
                            src={asset.url}
                            alt={asset.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className={`fa ${getFileIcon(asset.type)} text-3xl text-zinc-500`} />
                        )}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button className="bg-yellow-400 text-black px-3 py-1 rounded text-sm font-bold">
                            Select
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className="text-xs text-yellow-200 truncate" title={asset.name}>
                          {asset.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {formatFileSize(asset.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAssets.map(asset => (
                    <div
                      key={asset.id}
                      onClick={() => onSelectAsset(asset)}
                      className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg border border-zinc-700 hover:border-yellow-400/50 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 bg-zinc-700 rounded flex items-center justify-center">
                        {asset.type === 'image' ? (
                          <img src={asset.url} alt={asset.name} className="w-full h-full object-cover rounded" />
                        ) : (
                          <span className={`fa ${getFileIcon(asset.type)} text-xl text-zinc-500`} />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-yellow-200 font-medium">{asset.name}</p>
                        <p className="text-sm text-zinc-400">
                          {asset.type.toUpperCase()} • {formatFileSize(asset.size)} • {asset.uploadedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <button className="px-4 py-2 bg-yellow-400 text-black rounded font-bold hover:bg-yellow-300 transition">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl text-zinc-600 fa fa-folder-open mb-4" />
                <h3 className="text-xl font-bold text-zinc-400 mb-2">No assets found</h3>
                <p className="text-zinc-500 mb-4">Upload some files to get started</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-yellow-400 text-black rounded-lg font-bold hover:bg-yellow-300 transition"
                >
                  <span className="fa fa-upload mr-2" />
                  Upload Your First File
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.includes('image') ? 'image/*' : ''}
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
        />

        {/* Footer */}
        <div className="p-6 border-t border-zinc-700 bg-zinc-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-zinc-400">
              <span className="fa fa-info-circle mr-2" />
              {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''} available
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition"
              >
                Cancel
              </button>
              {selectedAssets.length > 0 && (
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition">
                  <span className="fa fa-trash mr-2" />
                  Delete Selected ({selectedAssets.length})
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
