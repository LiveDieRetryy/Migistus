import React from "react";

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
}

export default function DesignerSidebar({
  selectedPage,
  setSelectedPage,
  pages,
  previewMode,
  setPreviewMode,
  handleGrapesSave,
}: DesignerSidebarProps) {
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
      
      {/* Tools Section */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Device Preview */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
            <span className="fa fa-devices text-yellow-400" />
            Device Preview
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <button className="px-3 py-2 bg-zinc-800 hover:bg-yellow-400/20 text-yellow-200 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 text-xs">
              <span className="fa fa-mobile-alt" />
              Mobile
            </button>
            <button className="px-3 py-2 bg-zinc-800 hover:bg-yellow-400/20 text-yellow-200 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 text-xs">
              <span className="fa fa-tablet-alt" />
              Tablet
            </button>
            <button className="px-3 py-2 bg-yellow-400/20 text-yellow-300 rounded-lg flex flex-col items-center gap-1 text-xs">
              <span className="fa fa-desktop" />
              Desktop
            </button>
          </div>
        </div>
        
        {/* Page Settings */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
            <span className="fa fa-cog text-yellow-400" />
            Page Settings
          </h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-left text-yellow-200 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span className="fa fa-palette text-yellow-400" />
              Page Background
            </button>
            <button className="w-full px-4 py-2 text-left text-yellow-200 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span className="fa fa-font text-yellow-400" />
              Typography
            </button>
            <button className="w-full px-4 py-2 text-left text-yellow-200 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span className="fa fa-code text-yellow-400" />
              Custom CSS
            </button>
          </div>
        </div>
        
        {/* Advanced Tools */}
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-yellow-300 flex items-center gap-2">
            <span className="fa fa-tools text-yellow-400" />
            Advanced Tools
          </h3>
          <div className="space-y-2">
            <button className="w-full px-4 py-2 text-left text-yellow-200 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span className="fa fa-layer-group text-yellow-400" />
              Layers Panel
            </button>
            <button className="w-full px-4 py-2 text-left text-yellow-200 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span className="fa fa-history text-yellow-400" />
              Undo/Redo
            </button>
            <button className="w-full px-4 py-2 text-left text-yellow-200 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span className="fa fa-download text-yellow-400" />
              Export HTML
            </button>
            <button className="w-full px-4 py-2 text-left text-yellow-200 hover:bg-zinc-800/50 rounded-lg transition-all duration-200 flex items-center gap-3">
              <span className="fa fa-upload text-yellow-400" />
              Import Template
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
