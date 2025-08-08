import React, { useState, useEffect } from 'react';

interface TopToolbarProps {
  editor: any;
  isPreviewMode: boolean;
  onTogglePreview: () => void;
  onToggleSidebar: () => void;
  sidebarVisible: boolean;
  onToggleBlockPanel?: () => void;
  blockPanelVisible?: boolean;
  selectedPage?: string;
  onPageChange?: (page: string) => void;
  pages?: Array<{ name: string; path: string; }>;
  onSave?: () => void;
  onTestPropertiesPanel?: () => void; // For testing
  onGetCurrentSelection?: () => void; // For manual selection
  onDebugSelection?: () => void; // For debugging selection state
  onForceSelectFirst?: () => void; // For forcing selection of first component
}

export const TopToolbar: React.FC<TopToolbarProps> = ({
  editor,
  isPreviewMode,
  onTogglePreview,
  onToggleSidebar,
  sidebarVisible,
  onToggleBlockPanel,
  blockPanelVisible = true,
  selectedPage,
  onPageChange,
  pages = [],
  onSave,
  onTestPropertiesPanel,
  onGetCurrentSelection,
  onDebugSelection,
  onForceSelectFirst
}) => {
  const [zoom, setZoom] = useState(100);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [currentDevice, setCurrentDevice] = useState('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLayoutGrid, setShowLayoutGrid] = useState(false);
  const [elementCount, setElementCount] = useState(0);

  useEffect(() => {
    if (editor) {
      // Update undo/redo state
      const updateUndoRedo = () => {
        const um = editor.UndoManager;
        setCanUndo(um.hasUndo && um.hasUndo());
        setCanRedo(um.hasRedo && um.hasRedo());
      };

      // Update element count
      const updateElementCount = () => {
        setElementCount(editor.getComponents().length);
      };

      // Listen for changes
      editor.on('component:add component:remove component:update', updateElementCount);
      editor.on('change:changesCount', updateUndoRedo);
      
      // Initial update
      updateUndoRedo();
      updateElementCount();

      // Device change listener
      editor.on('run:preview', () => setCurrentDevice(editor.getDevice()));
    }
  }, [editor]);

  const handleUndo = () => {
    if (editor && canUndo) {
      editor.UndoManager.undo();
    }
  };

  const handleRedo = () => {
    if (editor && canRedo) {
      editor.UndoManager.redo();
    }
  };

  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (editor) {
      const canvas = editor.Canvas.getFrameEl();
      if (canvas) {
        canvas.style.transform = `scale(${newZoom / 100})`;
        canvas.style.transformOrigin = 'top left';
      }
    }
  };

  const handleDeviceChange = (device: string) => {
    setCurrentDevice(device);
    if (editor) {
      editor.DeviceManager.select(device);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const toggleLayoutGrid = () => {
    setShowLayoutGrid(!showLayoutGrid);
    if (editor) {
      const canvas = editor.Canvas.getElement();
      if (canvas) {
        canvas.style.backgroundImage = !showLayoutGrid 
          ? 'linear-gradient(rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(59, 130, 246, 0.1) 1px, transparent 1px)'
          : 'none';
        canvas.style.backgroundSize = !showLayoutGrid ? '20px 20px' : 'auto';
      }
    }
  };

  const handleSave = () => {
    if (editor) {
      // Implement save functionality
      const data = {
        html: editor.getHtml(),
        css: editor.getCss(),
        components: editor.getComponents(),
        timestamp: new Date().toISOString()
      };
      
      // For now, just log the data
      console.log('Saving page data:', data);
      
      // You could implement actual save to backend here
      alert('Page saved successfully!');
    }
  };

  return (
    <div className="top-toolbar bg-gray-900 text-white border-b border-gray-700 px-4 py-2 flex items-center justify-between shadow-lg">
      {/* Left Section - Main Actions */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onToggleSidebar}
          className={`p-2 rounded transition-colors ${
            sidebarVisible 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title={sidebarVisible ? 'Hide sidebar' : 'Show sidebar'}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {onToggleBlockPanel && (
          <button
            onClick={onToggleBlockPanel}
            className={`p-2 rounded transition-colors ${
              blockPanelVisible 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={blockPanelVisible ? 'Hide blocks' : 'Show blocks'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </button>
        )}

        <div className="h-6 w-px bg-gray-600" />

        {/* Undo/Redo */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`p-2 rounded transition-colors ${
              canUndo 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`p-2 rounded transition-colors ${
              canRedo 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-800 text-gray-500 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <div className="h-6 w-px bg-gray-600" />

        {/* Save Button */}
        <button
          onClick={onSave || handleSave}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-medium"
          title="Save page (Ctrl+S)"
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            <span>Save</span>
          </span>
        </button>

        {/* Test Properties Panel Button */}
        {onTestPropertiesPanel && (
          <button
            onClick={onTestPropertiesPanel}
            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm"
            title="Test Properties Panel"
          >
            🧪 Test Props
          </button>
        )}

        {/* Get Current Selection Button */}
        {onGetCurrentSelection && (
          <button
            onClick={onGetCurrentSelection}
            className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded transition-colors text-sm"
            title="Get Current Selection"
          >
            🎯 Get Selection
          </button>
        )}

        {/* Debug Selection State Button */}
        {onDebugSelection && (
          <button
            onClick={onDebugSelection}
            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors text-sm"
            title="Debug Selection State"
          >
            🐛 Debug
          </button>
        )}

        {/* Force Select First Button */}
        {onForceSelectFirst && (
          <button
            onClick={onForceSelectFirst}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded transition-colors text-sm"
            title="Force Select First Component"
          >
            ⚡ Force Select
          </button>
        )}

        {/* Page Selector */}
        {pages.length > 0 && onPageChange && (
          <>
            <div className="h-6 w-px bg-gray-600" />
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Page:</label>
              <select
                value={selectedPage || ''}
                onChange={(e) => onPageChange(e.target.value)}
                className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select page</option>
                {pages.map((page) => (
                  <option key={page.path} value={page.path}>
                    {page.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Center Section - Device Breakpoints & Page Selector */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1 bg-gray-800 rounded-lg p-1">
          {[
            { id: 'mobile', icon: '📱', label: 'Mobile', width: '375px' },
            { id: 'tablet', icon: '📱', label: 'Tablet', width: '768px' },
            { id: 'desktop', icon: '🖥️', label: 'Desktop', width: '1200px' }
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => handleDeviceChange(device.id)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                currentDevice === device.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
              title={`${device.label} (${device.width})`}
            >
              <span className="flex items-center space-x-1">
                <span>{device.icon}</span>
                <span className="hidden md:inline">{device.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Right Section - View Controls */}
      <div className="flex items-center space-x-2">
        {/* Zoom Controls */}
        <div className="flex items-center space-x-2 bg-gray-800 rounded-lg px-3 py-1">
          <button
            onClick={() => handleZoomChange(Math.max(25, zoom - 10))}
            className="text-gray-300 hover:text-white transition-colors"
            title="Zoom out"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span className="text-sm text-gray-300 min-w-12 text-center">{zoom}%</span>
          <button
            onClick={() => handleZoomChange(Math.min(200, zoom + 10))}
            className="text-gray-300 hover:text-white transition-colors"
            title="Zoom in"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        <div className="h-6 w-px bg-gray-600" />

        {/* View Options */}
        <button
          onClick={toggleLayoutGrid}
          className={`p-2 rounded transition-colors ${
            showLayoutGrid 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
          title="Toggle layout grid"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        </button>

        <button
          onClick={toggleFullscreen}
          className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
          title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5M15 9h4.5M15 9V4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5M15 15h4.5M15 15v4.5m0-4.5l5.5 5.5" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
        </button>

        <button
          onClick={onTogglePreview}
          className={`px-4 py-2 rounded transition-colors font-medium ${
            isPreviewMode 
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
          title={isPreviewMode ? 'Exit preview mode' : 'Enter preview mode'}
        >
          <span className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isPreviewMode ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
            <span>{isPreviewMode ? 'Edit' : 'Preview'}</span>
          </span>
        </button>

        {/* Status Indicator */}
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <span>Elements: {elementCount}</span>
          <div className="w-1 h-1 bg-green-400 rounded-full" title="Auto-save enabled" />
        </div>
      </div>
    </div>
  );
};
