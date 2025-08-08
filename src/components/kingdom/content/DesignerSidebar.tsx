import React, { useState, useEffect } from 'react';

interface DesignerSidebarProps {
  editor: any;
  isVisible: boolean;
  onToggle: () => void;
}

export const DesignerSidebar: React.FC<DesignerSidebarProps> = ({
  editor,
  isVisible,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState('layers');
  const [deviceMode, setDeviceMode] = useState('desktop');
  const [pageTitle, setPageTitle] = useState('');
  const [pageDescription, setPageDescription] = useState('');
  const [showGrid, setShowGrid] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [snapToGuides, setSnapToGuides] = useState(true);

  useEffect(() => {
    if (editor && isVisible) {
      // Initialize panels when sidebar becomes visible
      setTimeout(() => {
        const layersPanel = editor.Panels.getPanel('views-container');
        const stylePanel = editor.Panels.getPanel('views-container');
        
        if (layersPanel) {
          layersPanel.set('appendTo', '.layers-panel');
        }
        
        if (stylePanel) {
          stylePanel.set('appendTo', '.style-panel');
        }
      }, 100);
    }
  }, [editor, isVisible]);

  const handleDeviceChange = (device: string) => {
    setDeviceMode(device);
    if (editor) {
      const deviceManager = editor.DeviceManager;
      deviceManager.select(device);
    }
  };

  const handleExport = () => {
    if (editor) {
      const html = editor.getHtml();
      const css = editor.getCss();
      const exportData = { 
        html, 
        css, 
        title: pageTitle,
        description: pageDescription,
        timestamp: new Date().toISOString()
      };
      
      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `page-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleClear = () => {
    if (editor && confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      editor.setComponents('');
      editor.setStyle('');
      setPageTitle('');
      setPageDescription('');
    }
  };

  const handleCanvasSettings = (setting: string, value: boolean) => {
    if (!editor) return;
    
    switch (setting) {
      case 'grid':
        setShowGrid(value);
        // Toggle grid in GrapesJS
        const canvas = editor.Canvas.getElement();
        if (canvas) {
          canvas.style.backgroundImage = value 
            ? 'linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)'
            : 'none';
          canvas.style.backgroundSize = value ? '20px 20px' : 'auto';
        }
        break;
      case 'rulers':
        setShowRulers(value);
        // Implement rulers logic if needed
        break;
      case 'guides':
        setSnapToGuides(value);
        // Implement snap to guides logic if needed
        break;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="designer-sidebar bg-gray-900 text-white w-80 h-full flex flex-col border-l border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Designer Tools</h3>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Close sidebar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Device Preview Controls */}
      <div className="p-4 border-b border-gray-700">
        <h4 className="text-sm font-medium mb-3">Device Preview</h4>
        <div className="flex space-x-2">
          {[
            { id: 'desktop', icon: '🖥️', label: 'Desktop' },
            { id: 'tablet', icon: '📱', label: 'Tablet' },
            { id: 'mobile', icon: '📱', label: 'Mobile' }
          ].map((device) => (
            <button
              key={device.id}
              onClick={() => handleDeviceChange(device.id)}
              className={`flex-1 p-2 text-xs rounded transition-colors ${
                deviceMode === device.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
              }`}
              title={`Switch to ${device.label} view`}
            >
              <div className="text-center">
                <div className="text-lg mb-1">{device.icon}</div>
                <div>{device.label}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-700">
        {[
          { id: 'layers', label: 'Layers', icon: '📋' },
          { id: 'styles', label: 'Styles', icon: '🎨' },
          { id: 'settings', label: 'Settings', icon: '⚙️' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 p-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title={`Switch to ${tab.label} tab`}
          >
            <div className="flex items-center justify-center space-x-2">
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'layers' && (
          <div className="h-full">
            <div className="p-4">
              <h4 className="text-sm font-medium mb-3">Page Structure</h4>
              <p className="text-xs text-gray-400 mb-3">Manage your page elements hierarchy</p>
            </div>
            <div className="layers-panel h-full"></div>
          </div>
        )}

        {activeTab === 'styles' && (
          <div className="h-full">
            <div className="p-4">
              <h4 className="text-sm font-medium mb-3">Style Manager</h4>
              <p className="text-xs text-gray-400 mb-3">Customize selected element styles</p>
            </div>
            <div className="style-panel h-full overflow-y-auto"></div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="p-4 space-y-4 overflow-y-auto">
            <h4 className="text-sm font-medium mb-3">Page Settings</h4>
            
            {/* Page Meta */}
            <div>
              <label className="block text-sm font-medium mb-2">Page Information</label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Page Title"
                  value={pageTitle}
                  onChange={(e) => setPageTitle(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                />
                <textarea
                  placeholder="Page Description"
                  value={pageDescription}
                  onChange={(e) => setPageDescription(e.target.value)}
                  className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-sm h-20 resize-none focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Canvas Settings */}
            <div>
              <label className="block text-sm font-medium mb-2">Canvas Settings</label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="grid" 
                    checked={showGrid}
                    onChange={(e) => handleCanvasSettings('grid', e.target.checked)}
                    className="rounded" 
                  />
                  <label htmlFor="grid" className="text-sm">Show Grid</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="rulers" 
                    checked={showRulers}
                    onChange={(e) => handleCanvasSettings('rulers', e.target.checked)}
                    className="rounded" 
                  />
                  <label htmlFor="rulers" className="text-sm">Show Rulers</label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="guides" 
                    checked={snapToGuides}
                    onChange={(e) => handleCanvasSettings('guides', e.target.checked)}
                    className="rounded" 
                  />
                  <label htmlFor="guides" className="text-sm">Snap to Guides</label>
                </div>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Quick Actions</label>
                <div className="space-y-2">
                  <button
                    onClick={handleExport}
                    className="w-full p-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors flex items-center justify-center space-x-2"
                    title="Export page as JSON file"
                  >
                    <span>📄</span>
                    <span>Export Page</span>
                  </button>
                  <button
                    onClick={handleClear}
                    className="w-full p-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors flex items-center justify-center space-x-2"
                    title="Clear all content from canvas"
                  >
                    <span>🗑️</span>
                    <span>Clear Canvas</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="pt-4 border-t border-gray-700">
              <label className="block text-sm font-medium mb-2">Page Statistics</label>
              <div className="text-xs text-gray-400 space-y-1">
                <div>Elements: {editor ? editor.getComponents().length : 0}</div>
                <div>Device: {deviceMode}</div>
                <div>Last Modified: {new Date().toLocaleTimeString()}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
