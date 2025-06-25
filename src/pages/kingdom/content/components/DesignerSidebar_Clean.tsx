import React, { useState } from "react";

interface Page {
  name: string;
  path: string;
}

interface DesignerSidebarProps {
  selectedPage: string;
  setSelectedPage: (page: string) => void;
  pages: Page[];
  previewMode: boolean;
  setPreviewMode: (mode: boolean | ((prev: boolean) => boolean)) => void;
  handleGrapesSave: () => void;
  grapesEditor: React.RefObject<any>;
  breakpoint: 'desktop' | 'tablet' | 'mobile';
  setBreakpoint: (bp: 'desktop' | 'tablet' | 'mobile') => void;
}

export default function DesignerSidebar({
  selectedPage,
  setSelectedPage,
  pages,
  previewMode,
  setPreviewMode,
  handleGrapesSave,
  grapesEditor,
  breakpoint,
  setBreakpoint,
}: DesignerSidebarProps) {
  const [activeTab, setActiveTab] = useState<'pages' | 'layers' | 'styles' | 'settings'>('pages');

  const handleDeviceChange = (device: 'desktop' | 'tablet' | 'mobile') => {
    setBreakpoint(device);
    if (grapesEditor.current) {
      const deviceObj = grapesEditor.current.DeviceManager.get(device);
      if (deviceObj) {
        grapesEditor.current.DeviceManager.select(deviceObj);
      }
    }
  };

  const clearCanvas = () => {
    if (grapesEditor.current && confirm('Are you sure you want to clear the canvas? This action cannot be undone.')) {
      grapesEditor.current.setComponents('');
      grapesEditor.current.setStyle('');
    }
  };

  const exportCode = () => {
    if (grapesEditor.current) {
      const html = grapesEditor.current.getHtml();
      const css = grapesEditor.current.getCss();
      const fullCode = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedPage || 'Page'}</title>
  <style>
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
      
      const blob = new Blob([fullCode], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedPage || 'page'}.html`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  return (
    <aside className="h-full w-80 min-w-80 max-w-80 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 border-r border-yellow-400/30 shadow-2xl backdrop-blur-xl flex flex-col overflow-hidden z-40">
      {/* Header */}
      <div className="p-6 border-b border-yellow-400/20">
        <h2 className="text-3xl font-extrabold text-yellow-300 mb-4 tracking-wide flex items-center gap-3">
          <span className="fa fa-paint-brush text-yellow-400 text-2xl" />
          Web Designer
          <span className="text-xs bg-yellow-400/20 text-yellow-300 px-2 py-1 rounded-full">PRO</span>
        </h2>
        
        {/* Page Selector */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-yellow-200 uppercase tracking-wider">Current Page</label>
          <select 
            value={selectedPage} 
            onChange={e => setSelectedPage(e.target.value)} 
            className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 text-yellow-200 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200 backdrop-blur-sm"
          >
            <option value="">Select a page</option>
            {pages.map(p => <option key={p.path} value={p.path}>{p.name}</option>)}
          </select>
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={() => setPreviewMode((prev) => !prev)}
            className={`px-4 py-3 rounded-xl font-bold shadow-lg transition-all duration-200 flex items-center justify-center gap-2 ${
              previewMode 
                ? 'bg-yellow-900/80 text-yellow-200 hover:bg-yellow-800/80' 
                : 'bg-gradient-to-r from-yellow-400 to-yellow-300 text-black hover:from-yellow-300 hover:to-yellow-200 shadow-yellow-400/25'
            }`}
          >
            <span className={`fa ${previewMode ? 'fa-eye-slash' : 'fa-eye'}`} />
            {previewMode ? 'Edit' : 'Preview'}
          </button>
          
          <button 
            onClick={handleGrapesSave} 
            className="px-4 py-3 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-xl font-bold shadow-lg hover:from-green-400 hover:to-green-300 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-green-500/25"
            disabled={!selectedPage}
          >
            <span className="fa fa-save" />
            Save
          </button>
        </div>
      </div>

      {/* Sidebar Tabs */}
      <div className="flex border-b border-yellow-400/20 bg-zinc-800/30">
        {[
          { id: 'pages', label: 'Pages', icon: 'fa-file-alt' },
          { id: 'layers', label: 'Layers', icon: 'fa-layer-group' },
          { id: 'styles', label: 'Styles', icon: 'fa-palette' },
          { id: 'settings', label: 'Settings', icon: 'fa-cog' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 p-3 text-xs font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'text-yellow-300 bg-yellow-400/10 border-b-2 border-yellow-400'
                : 'text-yellow-200/70 hover:text-yellow-300 hover:bg-yellow-400/5'
            }`}
          >
            <span className={`fa ${tab.icon} mr-1`} />
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Pages Tab */}
        {activeTab === 'pages' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                <span className="fa fa-devices text-yellow-400" />
                Device Preview
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'mobile', icon: 'fa-mobile-alt', label: 'Mobile' },
                  { id: 'tablet', icon: 'fa-tablet-alt', label: 'Tablet' },
                  { id: 'desktop', icon: 'fa-desktop', label: 'Desktop' }
                ].map((device) => (
                  <button 
                    key={device.id}
                    onClick={() => handleDeviceChange(device.id as any)}
                    className={`px-3 py-2 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 text-xs ${
                      breakpoint === device.id 
                        ? 'bg-yellow-400/20 text-yellow-300' 
                        : 'bg-zinc-800 hover:bg-yellow-400/20 text-yellow-200'
                    }`}
                  >
                    <span className={`fa ${device.icon}`} />
                    {device.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                <span className="fa fa-tools text-yellow-400" />
                Quick Tools
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={exportCode}
                  className="w-full px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span className="fa fa-download" />
                  Export HTML
                </button>
                <button 
                  onClick={clearCanvas}
                  className="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-all duration-200 flex items-center gap-2"
                >
                  <span className="fa fa-trash" />
                  Clear Canvas
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Layers Tab */}
        {activeTab === 'layers' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
              <span className="fa fa-layer-group text-yellow-400" />
              Element Layers
            </h3>
            <div id="gjs-layers" className="bg-zinc-800/30 rounded-lg p-3 min-h-40">
              {/* GrapesJS layers will be rendered here */}
            </div>
          </div>
        )}

        {/* Styles Tab */}
        {activeTab === 'styles' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
              <span className="fa fa-palette text-yellow-400" />
              Style Manager
            </h3>
            <div id="gjs-styles" className="bg-zinc-800/30 rounded-lg p-3 min-h-40">
              {/* GrapesJS style manager will be rendered here */}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                <span className="fa fa-cog text-yellow-400" />
                Canvas Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-yellow-200 block mb-2">Canvas Width</label>
                  <input 
                    type="range" 
                    min="320" 
                    max="1920" 
                    defaultValue="1200"
                    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div>
                  <label className="text-sm text-yellow-200 block mb-2">Grid Size</label>
                  <select className="w-full px-3 py-2 bg-zinc-800 text-yellow-200 rounded-lg border border-zinc-700">
                    <option value="10">10px</option>
                    <option value="20">20px</option>
                    <option value="32">32px</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
                <span className="fa fa-globe text-yellow-400" />
                Page Meta
              </h3>
              <div className="space-y-3">
                <input 
                  type="text" 
                  placeholder="Page Title"
                  className="w-full px-3 py-2 bg-zinc-800 text-yellow-200 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                />
                <textarea 
                  placeholder="Page Description"
                  rows={3}
                  className="w-full px-3 py-2 bg-zinc-800 text-yellow-200 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-yellow-400 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
