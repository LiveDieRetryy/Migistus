import React, { useState, useEffect } from 'react';
import { Trash2, HardDrive, Image as ImageIcon, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

interface ImageStats {
  total: number;
  active: number;
  unused: number;
  totalSize: number;
}

interface UnusedImage {
  id: string;
  filename: string;
  url: string;
  size: number;
  uploadedAt: string;
  usedBy: string[];
}

const ImageManagementPanel: React.FC = () => {
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [unusedImages, setUnusedImages] = useState<UnusedImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [lastCleanup, setLastCleanup] = useState<string | null>(null);

  const fetchImageStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/images/manage');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setUnusedImages(data.unusedImages || []);
      }
    } catch (error) {
      console.error('Error fetching image stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const runCleanup = async () => {
    setCleanupLoading(true);
    try {
      const response = await fetch('/api/cron/cleanup-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authKey: 'admin-cleanup-2025' })
      });
      
      if (response.ok) {
        const result = await response.json();
        setLastCleanup(new Date().toLocaleString());
        await fetchImageStats(); // Refresh stats after cleanup
        alert(`Cleanup completed! ${JSON.stringify(result.stats)}`);
      } else {
        alert('Cleanup failed');
      }
    } catch (error) {
      console.error('Error running cleanup:', error);
      alert('Error running cleanup');
    } finally {
      setCleanupLoading(false);
    }
  };

  useEffect(() => {
    fetchImageStats();
  }, []);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <ImageIcon className="w-6 h-6 text-yellow-400" />
          Image Storage Management
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchImageStats}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={runCleanup}
            disabled={cleanupLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            {cleanupLoading ? 'Cleaning...' : 'Run Cleanup'}
          </button>
        </div>
      </div>

      {/* Stats Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-blue-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Images</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.active}</div>
                <div className="text-sm text-gray-400">Active Images</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-400" />
              <div>
                <div className="text-2xl font-bold text-white">{stats.unused}</div>
                <div className="text-sm text-gray-400">Unused Images</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <HardDrive className="w-8 h-8 text-purple-400" />
              <div>
                <div className="text-2xl font-bold text-white">{formatFileSize(stats.totalSize)}</div>
                <div className="text-sm text-gray-400">Total Storage</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Last Cleanup Info */}
      {lastCleanup && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4">
          <div className="text-green-300 text-sm">
            <strong>Last cleanup:</strong> {lastCleanup}
          </div>
        </div>
      )}

      {/* Unused Images List */}
      {unusedImages.length > 0 && (
        <div className="bg-gray-700/30 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Unused Images ({unusedImages.length})
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unusedImages.map((image) => (
              <div
                key={image.id}
                className="flex items-center justify-between bg-gray-800/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={image.url}
                    alt={image.filename}
                    className="w-12 h-12 object-cover rounded border border-gray-600"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                  <div>
                    <div className="text-white font-medium">{image.filename}</div>
                    <div className="text-gray-400 text-sm">
                      {formatFileSize(image.size)} • Uploaded {new Date(image.uploadedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-red-400 text-sm">
                  Unused
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="mt-6 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
        <h4 className="text-blue-300 font-medium mb-2">How Image Cleanup Works:</h4>
        <ul className="text-blue-200 text-sm space-y-1">
          <li>• <strong>Automatic:</strong> Cleanup runs every 24 hours to remove unused images</li>
          <li>• <strong>Safe:</strong> Recent uploads (less than 24h) are preserved</li>
          <li>• <strong>Tracked:</strong> All images are registered and linked to products</li>
          <li>• <strong>Persistent:</strong> Images are stored permanently until no longer needed</li>
        </ul>
      </div>
    </div>
  );
};

export default ImageManagementPanel;
