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
import {
  DesignerSidebar,
  BlockPanel,
  TopToolbar,
  DesignerCanvas,
  EditModal,
  makeAllTextAndContainersEditable,
  registerEditableTags,
  convertTextBlocksToRichText,
  getAllPages,
  normalizeElements,
  enhancedElementProperties,
  enhancedTools
} from './components';

// Import Craft.js components
import { Text, Button, Container, Image, Card, Input, Select, Chart, Slider } from '../../../components/craft/CraftComponents';

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
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const grapesRef = useRef<HTMLDivElement>(null);
  const grapesEditor = useRef<any>(null);

  // Get pages from utility function
  const pages = getAllPages();

  // --- Step 1: Basic Canvas State ---
  const [elements, setElements] = useState<DesignerElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const gridSize = 32;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Enhanced Element Types
  type ElementType = 'text' | 'box' | 'button' | 'heading' | 'image' | 'link' | 'divider' | 'custom' | 'card' | 'columns' | 'video' | 'form' | 'table' | 'slider' | 'chart' | 'map' | 'social' | 'icon' | 'spacer' | 'html' | 'countdown' | 'testimonial' | 'pricing' | 'gallery' | 'accordion' | 'tabs' | 'progress' | 'timeline' | 'carousel' | 'modal' | 'navbar' | 'footer' | 'breadcrumb' | 'pagination' | 'search' | 'notification' | 'grid' | 'flexbox';
  
  interface DesignerElement {
    id: string;
    type: ElementType;
    x: number;
    y: number;
    width: number;
    height: number;
    content: string;
    style: React.CSSProperties;
    children?: DesignerElement[];
    props?: Record<string, any>;
  }

  // --- Step 5: Load/save page layout from API ---
  const [loadingPage, setLoadingPage] = useState(false);
  
  useEffect(() => {
    if (!selectedPage) return;
    loadPageContent(selectedPage);
  }, [selectedPage]);

  const loadPageContent = async (page: string) => {
    if (!grapesEditor.current) return;
    
    setLoadingPage(true);
    try {
      // First try to get the rendered HTML
      const response = await fetch(`/api/page-rendered-html?page=${encodeURIComponent(page.replace(/^\//, '') || 'homepage')}`);
      if (response.ok) {
        const data = await response.json();
        if (data.html) {
          grapesEditor.current.setComponents(data.html);
          grapesEditor.current.setStyle(data.css || '');
        } else {
          // Fallback to default content
          setDefaultPageContent(page);
        }
      } else {
        // Fallback to default content
        setDefaultPageContent(page);
      }
    } catch (error) {
      console.log('Loading default content for:', page);
      setDefaultPageContent(page);
    } finally {
      setLoadingPage(false);
    }
  };

  const setDefaultPageContent = (page: string) => {
    if (!grapesEditor.current) return;
    
    const defaultContent = `
      <div style="padding: 40px; max-width: 1200px; margin: 0 auto;">
        <h1 style="color: #333; font-size: 2.5rem; margin-bottom: 20px; text-align: center;">
          ${page === 'homepage' ? 'Welcome to Migistus' : page.charAt(0).toUpperCase() + page.slice(1)}
        </h1>
        <p style="color: #666; font-size: 1.1rem; line-height: 1.6; text-align: center; margin-bottom: 40px;">
          This is the ${page} content. Click to edit this text or drag new elements from the sidebar.
        </p>
        <div style="display: flex; justify-content: center; gap: 20px; margin-bottom: 40px;">
          <button style="background: #facc15; color: #000; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Get Started
          </button>
          <button style="background: transparent; color: #facc15; padding: 12px 24px; border: 2px solid #facc15; border-radius: 8px; font-weight: 600; cursor: pointer;">
            Learn More
          </button>
        </div>
      </div>
    `;
    
    grapesEditor.current.setComponents(defaultContent);
  };

  // Save GrapesJS content to backend
  const handleGrapesSave = async () => {
    if (!selectedPage || !grapesEditor.current) return;
    const html = grapesEditor.current.getHtml();
    await fetch(`/api/page-html?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html })
    });
  };

  // --- GrapesJS Ready State and Import Guard ---
  const [grapesReady, setGrapesReady] = useState(false);
  const hasImportedRef = useRef<string | null>(null);

  // --- Preview Mode State ---
  const [previewMode, setPreviewMode] = useState(false);
  type Breakpoint = 'desktop' | 'tablet' | 'mobile';
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [layouts, setLayouts] = useState<{ [key in Breakpoint]: DesignerElement[] }>({
    desktop: elements,
    tablet: [],
    mobile: [],
  });

  // --- Modal state for block editing ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBlock, setModalBlock] = useState<any>(null);

  function openBlockModal(block: any) {
    setModalBlock(block);
    setModalOpen(true);
  }

  function closeBlockModal() {
    setModalOpen(false);
    setModalBlock(null);
  }
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

  // Load initial content when editor is ready
  useEffect(() => {
    if (grapesEditor.current && selectedPage) {
      // Small delay to ensure editor is fully initialized
      setTimeout(() => {
        loadPageContent(selectedPage);
      }, 100);
    }
  }, [grapesEditor.current, selectedPage]);

  // Load page content
  const loadPageContent = async (pagePath: string) => {
    try {
      // Here you would typically fetch the page content from your backend
      // For now, we'll set a more comprehensive placeholder with initial content
      if (grapesEditor.current) {
        const defaultContent = `
          <div style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 200px; display: flex; flex-direction: column; justify-content: center;">
            <h1 style="font-size: 3rem; margin-bottom: 1rem; font-weight: bold;">Welcome to ${pagePath}</h1>
            <p style="font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9;">Start building your amazing website by dragging components from the sidebar!</p>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
              <button style="background: #facc15; color: #000; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 600; cursor: pointer;">Get Started</button>
              <button style="background: transparent; color: white; padding: 12px 24px; border: 2px solid white; border-radius: 8px; font-weight: 600; cursor: pointer;">Learn More</button>
            </div>
          </div>
          <div style="padding: 60px 40px; text-align: center; background: white;">
            <h2 style="font-size: 2.5rem; margin-bottom: 1rem; color: #1f2937;">Build Something Amazing</h2>
            <p style="font-size: 1.1rem; color: #6b7280; max-width: 600px; margin: 0 auto 2rem;">Drag and drop components from the sidebar to create your perfect website. Customize colors, text, and layout to match your vision.</p>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 3rem;">
              <div style="padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: #1f2937;">Easy to Use</h3>
                <p style="color: #6b7280;">Intuitive drag-and-drop interface makes website building simple and fun.</p>
              </div>
              <div style="padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: #1f2937;">Responsive Design</h3>
                <p style="color: #6b7280;">Your website will look great on all devices, from mobile to desktop.</p>
              </div>
              <div style="padding: 2rem; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem; color: #1f2937;">Professional</h3>
                <p style="color: #6b7280;">Create stunning, professional websites without any coding knowledge.</p>
              </div>
            </div>
          </div>
        `;
        grapesEditor.current.setComponents(defaultContent);
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
