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

export default function WebDesigner() {
  const [selectedPage, setSelectedPage] = useState<string>("homepage");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const grapesRef = useRef<HTMLDivElement>(null);
  const grapesEditor = useRef<any>(null);
  const [loadingPage, setLoadingPage] = useState(false);

  // Get pages from utility function
  const pages = getAllPages();

  // --- Canvas State ---
  const [elements, setElements] = useState<DesignerElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const gridSize = 32;
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // --- Preview Mode State ---
  const [previewMode, setPreviewMode] = useState(false);
  type Breakpoint = 'desktop' | 'tablet' | 'mobile';
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [layouts, setLayouts] = useState<{ [key in Breakpoint]: DesignerElement[] }>({
    desktop: [],
    tablet: [],
    mobile: [],
  });

  // --- Modal state for block editing ---
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBlock, setModalBlock] = useState<any>(null);

  const openBlockModal = (block: any) => {
    setModalBlock(block);
    setModalOpen(true);
  };

  const closeBlockModal = () => {
    setModalOpen(false);
    setModalBlock(null);
  };

  // Load page content into GrapesJS
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
    const css = grapesEditor.current.getCss();
    
    try {
      await fetch(`/api/page-html?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, css })
      });
      console.log('Page saved successfully');
    } catch (error) {
      console.error('Error saving page:', error);
    }
  };

  // Load page content when selectedPage changes
  useEffect(() => {
    if (!selectedPage || !grapesEditor.current) return;
    loadPageContent(selectedPage);
  }, [selectedPage]);

  // Initialize GrapesJS
  useEffect(() => {
    if (!grapesRef.current || grapesEditor.current) return;

    const editor = grapesjs.init({
      container: grapesRef.current,
      fromElement: true,
      width: '100%',
      height: '100%',
      storageManager: {
        id: 'gjs-',
        type: 'local',
        autosave: true,
        autoload: true,
        stepsBeforeSave: 1,
      },
      plugins: [
        'gjs-blocks-basic',
        'grapesjs-plugin-forms',
        'grapesjs-component-countdown',
        'grapesjs-plugin-export',
        'grapesjs-tabs',
        'grapesjs-custom-code',
        'grapesjs-touch',
        'grapesjs-parser-postcss',
        'grapesjs-tooltip',
        'grapesjs-tui-image-editor',
        'grapesjs-typed',
        'grapesjs-style-bg',
        'grapesjs-preset-webpage',
      ],
      pluginsOpts: {
        'grapesjs-blocks-basic': { flexGrid: true },
        'grapesjs-plugin-forms': {
          blocks: ['form', 'input', 'textarea', 'select', 'button', 'label', 'checkbox', 'radio'],
        },
        'grapesjs-tui-image-editor': {
          script: [
            'https://uicdn.toast.com/tui.code-snippet/v1.5.2/tui-code-snippet.min.js',
            'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.min.js',
          ],
          style: [
            'https://uicdn.toast.com/tui-image-editor/latest/tui-image-editor.min.css',
          ],
        },
        'grapesjs-preset-webpage': {
          modalImportTitle: 'Import Template',
          modalImportLabel: '<div style="margin-bottom: 10px; font-size: 13px;">Paste here your HTML/CSS and click Import</div>',
          modalImportContent: function(editor: any) {
            return editor.getHtml() + '<style>' + editor.getCss() + '</style>';
          },
        },
      },
    });

    grapesEditor.current = editor;

    // Apply custom utilities
    registerEditableTags(editor);
    makeAllTextAndContainersEditable(editor);
    convertTextBlocksToRichText(editor);

    // Load initial content
    if (selectedPage) {
      loadPageContent(selectedPage);
    }

    return () => {
      if (grapesEditor.current) {
        grapesEditor.current.destroy();
        grapesEditor.current = null;
      }
    };
  }, []);

  return (
    <>
      <Head>
        <title>Web Designer - Migistus</title>
        <meta name="description" content="Visual web page designer" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>

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
