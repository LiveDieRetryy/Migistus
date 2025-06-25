import React from "react";

interface BlockPanelProps {
  // Add any additional props needed for the block panel functionality
}

export default function BlockPanel({}: BlockPanelProps) {
  return (
    <div className="w-72 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 border-r border-yellow-400/30 shadow-xl flex flex-col overflow-hidden">
      {/* Block Panel Header */}
      <div className="p-4 border-b border-yellow-400/20">
        <h3 className="text-xl font-bold text-yellow-300 flex items-center gap-2">
          <span className="fa fa-cubes text-yellow-400" />
          Components
        </h3>
        <p className="text-xs text-yellow-200/70 mt-1">Drag components to the canvas</p>
      </div>
      
      {/* Block Categories */}
      <div className="flex-1 overflow-y-auto">
        <div id="gjs-blocks" className="p-4 space-y-4">
          {/* GrapesJS will render blocks here, enhanced with our custom styling */}
        </div>
      </div>
      
      {/* Quick Add Section */}
      <div className="p-4 border-t border-yellow-400/20 space-y-3">
        <h4 className="text-sm font-semibold text-yellow-300 uppercase tracking-wider">Quick Add</h4>
        <div className="grid grid-cols-2 gap-2">
          <button className="p-3 bg-zinc-800/50 hover:bg-yellow-400/20 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 text-xs text-yellow-200">
            <span className="fa fa-plus-circle text-yellow-400" />
            Section
          </button>
          <button className="p-3 bg-zinc-800/50 hover:bg-yellow-400/20 rounded-lg transition-all duration-200 flex flex-col items-center gap-1 text-xs text-yellow-200">
            <span className="fa fa-th-large text-yellow-400" />
            Container
          </button>
        </div>
      </div>
    </div>
  );
}
