import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';
import { Dialog } from '@headlessui/react';

// Craft.js imports for enhanced functionality
import { Editor, Frame, Element, useNode, useEditor } from '@craftjs/core';
import { Layers } from '@craftjs/layers';

// Import extracted components
import DesignerSidebar from './components/DesignerSidebar';
import BlockPanel from './components/BlockPanel';
import TopToolbar from './components/TopToolbar';
import DesignerCanvas from './components/DesignerCanvas';
import EditModal from './components/EditModal';
import { 
  makeAllTextAndContainersEditable, 
  registerEditableTags, 
  convertTextBlocksToRichText, 
  getAllPages, 
  normalizeElements, 
  enhancedElementProperties, 
  enhancedTools 
} from './components/DesignerUtils';

// Placeholder for admin check (replace with real auth logic)
const isAdmin = true;

// Type definitions
interface DesignerElement {
  id: string;
  type: string;
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  style: any;
  parentId?: string;
  children: string[];
  src?: string;
  alt?: string;
  href?: string;
  target?: string;
  targetPage?: string;
  animation?: string;
  hoverEffect?: string;
  widgetType?: string;
  fit?: string;
  columns?: number;
}

// Main Web Designer Component
export default function WebDesigner() {
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [previewMode, setPreviewMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBlock, setModalBlock] = useState<any>(null);
  
  const grapesRef = useRef<HTMLDivElement>(null);
  const grapesEditor = useRef<any>(null);
  
  // Get pages from utility function
  const pages = getAllPages();

  // GrapesJS initialization
  useEffect(() => {
    if (!grapesRef.current || grapesEditor.current) return;

    const editor = grapesjs.init({
      container: grapesRef.current,
      fromElement: true,
      width: '100%',
      height: '100%',
      storageManager: {
        type: 'local',
        autosave: true,
        autoload: true,
        stepsBeforeSave: 1,
      },
      blockManager: {
        appendTo: '#gjs-blocks',
        blocks: [
          {
            id: 'section',
            label: '<i class="fa fa-square-o"></i><div>Section</div>',
            attributes: { class: 'gjs-block-section' },
            content: '<section class="gjs-section"><div class="gjs-container">Insert your content here</div></section>',
            category: 'Basic',
          },
          {
            id: 'text',
            label: '<i class="fa fa-text-width"></i><div>Text</div>',
            content: '<div data-gjs-type="text">Insert your text here</div>',
            category: 'Basic',
          },
          {
            id: 'image',
            label: '<i class="fa fa-picture-o"></i><div>Image</div>',
            select: true,
            content: { type: 'image' },
            activate: true,
            category: 'Basic',
          },
          {
            id: 'video',
            label: '<i class="fa fa-youtube-play"></i><div>Video</div>',
            content: {
              type: 'video',
              src: 'img/video2.webm',
              style: {
                height: '350px',
                width: '615px',
              },
            },
            category: 'Basic',
          },
          {
            id: 'map',
            label: '<i class="fa fa-map-o"></i><div>Map</div>',
            content: {
              type: 'map',
              style: { height: '350px' },
            },
            category: 'Basic',
          },
        ],
      },
      layerManager: {
        appendTo: '.layers-container',
      },
      deviceManager: {
        devices: [
          {
            name: 'Desktop',
            width: '',
          },
          {
            name: 'Mobile',
            width: '320px',
            widthMedia: '480px',
          },
        ],
      },
      pluginsOpts: {
        'gjs-blocks-basic': { flexGrid: true },
        'grapesjs-plugin-forms': {},
        'grapesjs-component-countdown': {},
        'grapesjs-plugin-export': {},
        'grapesjs-tabs': {},
        'grapesjs-custom-code': {},
        'grapesjs-touch': {},
        'grapesjs-parser-postcss': {},
        'grapesjs-tooltip': {},
        'grapesjs-tui-image-editor': {
          script: [
            'https://uicdn.toast.com/tui.code-snippet/v1.5.2/tui-code-snippet.min.js',
            'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.min.js',
          ],
          style: [
            'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.min.css',
          ],
        },
        'grapesjs-blocks-bootstrap4': {},
        'grapesjs-ui-suggest-classes': {},
      },
      canvas: {
        styles: [
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css',
        ],
        scripts: [
          'https://code.jquery.com/jquery-3.3.1.slim.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/popper.js/1.14.3/umd/popper.min.js',
          'https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/js/bootstrap.min.js',
        ],
      },
    });

    grapesEditor.current = editor;

    // Register editable tags and apply helpers
    registerEditableTags(editor);
    makeAllTextAndContainersEditable(editor);
    convertTextBlocksToRichText(editor);

    // Load page content if selected
    if (selectedPage) {
      loadPageContent(selectedPage);
    }

    return () => {
      if (grapesEditor.current) {
        grapesEditor.current.destroy();
        grapesEditor.current = null;
      }
    };
  }, [selectedPage]);

  // Load page content
  const loadPageContent = async (pagePath: string) => {
    try {
      // Here you would typically fetch the page content from your backend
      // For now, we'll just set a placeholder
      if (grapesEditor.current) {
        grapesEditor.current.setComponents('<div>Content for ' + pagePath + '</div>');
      }
    } catch (error) {
      console.error('Failed to load page content:', error);
    }
  };

  // Save page content
  const handleGrapesSave = async () => {
    if (!grapesEditor.current || !selectedPage) return;

    try {
      const html = grapesEditor.current.getHtml();
      const css = grapesEditor.current.getCss();
      
      // Here you would typically save to your backend
      console.log('Saving page:', selectedPage);
      console.log('HTML:', html);
      console.log('CSS:', css);
      
      // Show success message
      alert('Page saved successfully!');
    } catch (error) {
      console.error('Failed to save page:', error);
      alert('Failed to save page. Please try again.');
    }
  };

  // Modal functions
  const openBlockModal = (block: any) => {
    setModalBlock(block);
    setModalOpen(true);
  };

  const closeBlockModal = () => {
    setModalOpen(false);
    setModalBlock(null);
  };

  return (
    <>
      <div className="w-full h-full flex bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900">
        {/* Sidebar */}
        <DesignerSidebar
          selectedPage={selectedPage}
          setSelectedPage={setSelectedPage}
          pages={pages}
          previewMode={previewMode}
          setPreviewMode={setPreviewMode}
          handleGrapesSave={handleGrapesSave}
        />

        {/* Block Panel */}
        <BlockPanel />

        {/* Main Editor Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
          {/* Top Toolbar */}
          <TopToolbar />

          {/* Main Canvas */}
          <DesignerCanvas grapesRef={grapesRef} />
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        modalOpen={modalOpen}
        modalBlock={modalBlock}
        setModalBlock={setModalBlock}
        closeBlockModal={closeBlockModal}
        grapesEditor={grapesEditor}
      />
    </>
  );
}
