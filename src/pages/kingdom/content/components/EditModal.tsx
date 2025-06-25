import React from "react";
import { Dialog } from '@headlessui/react';

interface EditModalProps {
  modalOpen: boolean;
  modalBlock: any;
  setModalBlock: (block: any) => void;
  closeBlockModal: () => void;
  grapesEditor: React.RefObject<any>;
}

export default function EditModal({
  modalOpen,
  modalBlock,
  setModalBlock,
  closeBlockModal,
  grapesEditor,
}: EditModalProps) {
  const handleSaveChanges = () => {
    // Save changes to GrapesJS or local state
    if (modalBlock && grapesEditor.current) {
      const comp = grapesEditor.current.getSelected();
      if (comp) {
        comp.set('content', modalBlock.content);
        comp.set('style', modalBlock.style);
        if (modalBlock.src) comp.set('src', modalBlock.src);
        if (modalBlock.alt) comp.set('alt', modalBlock.alt);
        if (modalBlock.targetPage) comp.set('targetPage', modalBlock.targetPage);
        if (modalBlock.columns) comp.set('columns', modalBlock.columns);
        if (modalBlock.animation) comp.set('animation', modalBlock.animation);
        if (modalBlock.hoverEffect) comp.set('hoverEffect', modalBlock.hoverEffect);
      }
    }
    closeBlockModal();
  };

  return (
    <Dialog open={modalOpen} onClose={closeBlockModal} className="fixed z-50 inset-0 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl shadow-2xl border border-yellow-400/30 w-full max-w-2xl mx-auto overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-yellow-400/20 bg-gradient-to-r from-zinc-900 to-zinc-800">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-2xl font-bold text-yellow-300 flex items-center gap-3">
              <span className="fa fa-edit text-yellow-400" />
              Edit Component
              {modalBlock && (
                <span className="text-sm bg-yellow-400/20 text-yellow-300 px-3 py-1 rounded-full capitalize">
                  {modalBlock.type}
                </span>
              )}
            </Dialog.Title>
            <button 
              onClick={closeBlockModal}
              className="p-2 hover:bg-zinc-700 rounded-lg transition-all duration-200 text-zinc-400 hover:text-white"
            >
              <span className="fa fa-times text-lg" />
            </button>
          </div>
        </div>
        
        {/* Modal Content */}
        <div className="max-h-96 overflow-y-auto">
          {modalBlock && (
            <div className="p-6 space-y-6">
              {/* Text Block Controls */}
              {modalBlock.type === 'text' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-yellow-200 mb-2 uppercase tracking-wider">Text Content</label>
                      <textarea 
                        value={modalBlock.content} 
                        onChange={e => setModalBlock({ ...modalBlock, content: e.target.value })} 
                        className="w-full px-4 py-3 rounded-xl bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all duration-200 resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-yellow-200 mb-2">Font Size</label>
                        <input 
                          type="number" 
                          value={modalBlock.style.fontSize || 16} 
                          onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, fontSize: Number(e.target.value) } })} 
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-yellow-200 mb-2">Text Color</label>
                        <div className="flex gap-2">
                          <input 
                            type="color" 
                            value={modalBlock.style.color || '#fde047'} 
                            onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, color: e.target.value } })} 
                            className="w-12 h-10 rounded-lg border border-zinc-700/50"
                          />
                          <input 
                            type="text" 
                            value={modalBlock.style.color || '#fde047'} 
                            onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, color: e.target.value } })} 
                            className="flex-1 px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent text-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-yellow-200 mb-2">Font Family</label>
                      <select 
                        value={modalBlock.style.fontFamily || ''} 
                        onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, fontFamily: e.target.value } })} 
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      >
                        <option value="">Default</option>
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Poppins, sans-serif">Poppins</option>
                        <option value="Roboto, sans-serif">Roboto</option>
                        <option value="Open Sans, sans-serif">Open Sans</option>
                        <option value="Montserrat, sans-serif">Montserrat</option>
                        <option value="Georgia, serif">Georgia</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-semibold text-yellow-200 mb-2">Background</label>
                      <input 
                        type="text" 
                        value={modalBlock.style.background || ''} 
                        onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, background: e.target.value } })} 
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        placeholder="linear-gradient(...) or #hex"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-yellow-200 mb-2">Animation</label>
                        <select 
                          value={modalBlock.animation || 'none'} 
                          onChange={e => setModalBlock({ ...modalBlock, animation: e.target.value })} 
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        >
                          <option value="none">None</option>
                          <option value="fade">Fade In</option>
                          <option value="slide-up">Slide Up</option>
                          <option value="slide-down">Slide Down</option>
                          <option value="zoom-in">Zoom In</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-yellow-200 mb-2">Hover Effect</label>
                        <select 
                          value={modalBlock.hoverEffect || 'none'} 
                          onChange={e => setModalBlock({ ...modalBlock, hoverEffect: e.target.value })} 
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        >
                          <option value="none">None</option>
                          <option value="shadow">Shadow</option>
                          <option value="scale">Scale</option>
                          <option value="glow">Glow</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Image Block Controls */}
              {modalBlock.type === 'image' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-yellow-200 mb-2">Image URL</label>
                      <input 
                        type="text" 
                        value={modalBlock.src || modalBlock.content} 
                        onChange={e => setModalBlock({ ...modalBlock, src: e.target.value, content: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-yellow-200 mb-2">Alt Text</label>
                      <input 
                        type="text" 
                        value={modalBlock.alt || ''} 
                        onChange={e => setModalBlock({ ...modalBlock, alt: e.target.value })} 
                        className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-yellow-200 mb-2">Width</label>
                        <input 
                          type="number" 
                          value={modalBlock.style.width || 320} 
                          onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, width: Number(e.target.value) } })} 
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-yellow-200 mb-2">Height</label>
                        <input 
                          type="number" 
                          value={modalBlock.style.height || 160} 
                          onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, height: Number(e.target.value) } })} 
                          className="w-full px-3 py-2 rounded-lg bg-zinc-800/80 text-yellow-100 border border-zinc-700/50 focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Continue with other component types... */}
            </div>
          )}
        </div>
        
        {/* Modal Footer */}
        <div className="p-6 border-t border-yellow-400/20 bg-gradient-to-r from-zinc-900 to-zinc-800 flex justify-end gap-3">
          <button 
            onClick={closeBlockModal} 
            className="px-6 py-3 bg-zinc-700/80 hover:bg-zinc-600/80 text-zinc-300 hover:text-white rounded-xl font-semibold transition-all duration-200"
          >
            Cancel
          </button>
          <button 
            onClick={handleSaveChanges} 
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-200 text-black rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <span className="fa fa-save mr-2" />
            Save Changes
          </button>
        </div>
      </div>
    </Dialog>
  );
}
