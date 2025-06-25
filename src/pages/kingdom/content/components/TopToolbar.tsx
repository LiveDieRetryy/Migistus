import React from "react";

interface TopToolbarProps {
  // Add any props needed for toolbar functionality
}

export default function TopToolbar({}: TopToolbarProps) {
  return (
    <div className="h-16 bg-zinc-900/90 backdrop-blur-xl border-b border-yellow-400/20 flex items-center justify-between px-6 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-yellow-300">
          <span className="fa fa-mouse-pointer text-yellow-400" />
          <span className="text-sm font-medium">Select Tool</span>
        </div>
        <div className="h-6 w-px bg-yellow-400/30"></div>
        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-yellow-400/20 rounded-lg transition-all duration-200 text-yellow-300 hover:text-yellow-400">
            <span className="fa fa-undo text-sm" />
          </button>
          <button className="p-2 hover:bg-yellow-400/20 rounded-lg transition-all duration-200 text-yellow-300 hover:text-yellow-400">
            <span className="fa fa-redo text-sm" />
          </button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1">
          <button className="px-3 py-1 bg-yellow-400/20 text-yellow-300 rounded text-xs font-medium">
            100%
          </button>
          <button className="p-1 hover:bg-yellow-400/20 rounded text-yellow-300 hover:text-yellow-400">
            <span className="fa fa-search-minus text-xs" />
          </button>
          <button className="p-1 hover:bg-yellow-400/20 rounded text-yellow-300 hover:text-yellow-400">
            <span className="fa fa-search-plus text-xs" />
          </button>
        </div>
        
        <button className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-all duration-200">
          <span className="fa fa-eye mr-1" />
          Preview
        </button>
      </div>
    </div>
  );
}
