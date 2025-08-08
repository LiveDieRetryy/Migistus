import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
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
  PropertiesPanel,
  makeAllTextAndContainersEditable,
  registerEditableTags,
  convertTextBlocksToRichText,
  getAllPages,
  normalizeElements,
  enhancedElementProperties,
  enhancedTools
} from '../../../components/kingdom/content';

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

  // --- UI State for our enhanced components ---
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [blockPanelVisible, setBlockPanelVisible] = useState(true);
  const [selectedComponent, setSelectedComponent] = useState<any>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [propertiesPanelVisible, setPropertiesPanelVisible] = useState(false);

  // Toggle functions for our enhanced UI
  const toggleSidebar = () => setSidebarVisible(!sidebarVisible);
  const toggleBlockPanel = () => setBlockPanelVisible(!blockPanelVisible);
  const togglePreview = () => setPreviewMode(!previewMode);
  const closePropertiesPanel = () => setPropertiesPanelVisible(false);

  // Test function to manually show properties panel
  const testPropertiesPanel = () => {
    console.log('🧪 Testing properties panel with REAL GrapesJS component');
    
    if (grapesEditor.current) {
      // Try to get the current selection first
      const currentSelected = grapesEditor.current.getSelected();
      
      if (currentSelected && currentSelected.get && typeof currentSelected.get === 'function') {
        console.log('✅ Found REAL GrapesJS selection for test');
        
        const realData = {
          tagName: currentSelected.get('tagName') || 'div',
          content: currentSelected.get('content') || 'Real content from GrapesJS',
          attributes: currentSelected.get('attributes') || {},
          styles: currentSelected.get('style') || {},
          classes: currentSelected.get('classes') || []
        };
        
        console.log('📊 Real GrapesJS data for test:', realData);
        
        setSelectedComponent({ 
          ...currentSelected,
          _forceUpdate: Date.now(),
          _eventSource: 'test-button-real',
          _realComponent: true,
          _testExtraction: realData
        });
        setPropertiesPanelVisible(true);
        
        alert(`✅ Test: Using REAL GrapesJS ${realData.tagName} element!`);
      } else {
        console.log('⚠️ No real GrapesJS selection found, using mock data for test');
        
        setSelectedComponent({ 
          get: (key: string) => {
            switch(key) {
              case 'tagName': return 'div';
              case 'content': return 'Test content for properties panel (MOCK DATA)';
              case 'attributes': return { class: 'test-class', id: 'test-element' };
              case 'style': return { color: 'red', fontSize: '16px', padding: '10px' };
              case 'classes': return ['test-class', 'properties-test'];
              default: return '';
            }
          },
          tagName: 'div',
          set: (key: string, value: any) => console.log('Mock set:', key, value),
          getEl: () => null,
          _forceUpdate: Date.now(),
          _eventSource: 'test-button-mock',
          _realComponent: true, // Mark as real even though it's mock for testing
          _testExtraction: {
            tagName: 'div',
            content: 'Test content for properties panel (MOCK DATA)',
            attributes: { class: 'test-class', id: 'test-element' },
            styles: { color: 'red', fontSize: '16px', padding: '10px' },
            classes: ['test-class', 'properties-test']
          }
        });
        setPropertiesPanelVisible(true);
        
        alert('⚠️ Test: Using MOCK data (no real selection found)');
      }
    } else {
      console.log('❌ GrapesJS editor not available for test');
      alert('GrapesJS editor not ready. Please wait for the editor to load.');
    }
  };

  // Function to get current GrapesJS selection
  const getCurrentSelection = () => {
    console.log('🔍 Getting current GrapesJS selection...');
    if (grapesEditor.current) {
      // Try multiple methods to get selection
      const selected = grapesEditor.current.getSelected();
      const selectedAll = grapesEditor.current.getSelectedAll ? grapesEditor.current.getSelectedAll() : [];
      const components = grapesEditor.current.getComponents ? grapesEditor.current.getComponents() : null;
      
      console.log('📋 Selection attempts:', {
        selected: !!selected,
        selectedAll: selectedAll.length,
        componentsCount: components ? components.length : 0
      });
      
      if (selected) {
        const componentId = selected.getId ? selected.getId() : selected.cid;
        console.log('📊 Selected component details:', {
          id: componentId,
          tagName: selected.get?.('tagName'),
          content: selected.get?.('content')?.substring(0, 50) + '...',
          hasAttributes: !!selected.get?.('attributes'),
          hasStyles: !!selected.get?.('style')
        });
        
        const uniqueComponent = {
          ...selected,
          _forceUpdate: Date.now(),
          _eventSource: 'manual-get-selection',
          _id: componentId,
          _realComponent: true
        };
        setSelectedComponent(uniqueComponent);
        setPropertiesPanelVisible(true);
        
        console.log('✅ Component selected and properties panel opened');
        alert(`✅ Found REAL selection: ${selected.get?.('tagName')} element!`);
      } else {
        console.log('❌ No selection found - showing test component');
        alert('❌ No selection found - try clicking on an element first');
      }
    } else {
      console.log('❌ GrapesJS editor not available');
      alert('GrapesJS editor not ready. Please wait for the editor to load.');
    }
  };

  // Enhanced debugging function for selection issues
  const debugCanvasSelection = () => {
    console.log('🐛 Starting comprehensive canvas selection debug...');
    
    if (!grapesEditor.current) {
      console.log('❌ GrapesJS editor not available');
      alert('GrapesJS editor not ready');
      return;
    }
    
    const editor = grapesEditor.current;
    
    // 1. Check current selection from GrapesJS
    const selected = editor.getSelected();
    console.log('1️⃣ GrapesJS getSelected():', selected);
    
    // 2. Check all selected components
    const allSelected = editor.getSelectedAll ? editor.getSelectedAll() : [];
    console.log('2️⃣ GrapesJS getSelectedAll():', allSelected, 'count:', allSelected.length);
    
    // 3. Check canvas state
    const canvas = editor.Canvas;
    const canvasEl = canvas.getElement();
    const canvasBody = canvas.getBody();
    console.log('3️⃣ Canvas elements:', { canvasEl: !!canvasEl, canvasBody: !!canvasBody });
    
    // 4. Check for visually selected elements
    if (canvasBody) {
      const visuallySelected = canvasBody.querySelector('.gjs-selected');
      const allVisuallySelected = canvasBody.querySelectorAll('.gjs-selected');
      console.log('4️⃣ Visually selected elements:', {
        single: !!visuallySelected,
        count: allVisuallySelected.length
      });
    }
    
    // 5. Check all components in the editor
    const components = editor.getComponents();
    console.log('5️⃣ All components:', components ? components.length : 0);
    
    // 6. Check React state
    console.log('6️⃣ React state:', {
      selectedComponent: !!selectedComponent,
      propertiesPanelVisible,
      componentEventSource: selectedComponent?._eventSource,
      componentId: selectedComponent?._id
    });
    
    // 7. Create a summary alert
    const summary = `
🐛 DEBUG SUMMARY:
- GrapesJS selected: ${selected ? '✅ ' + selected.get?.('tagName') : '❌ None'}
- All selected count: ${allSelected.length}
- Visual selection: ${canvasBody?.querySelector('.gjs-selected') ? '✅ Found' : '❌ None'}
- Total components: ${components ? components.length : 0}
- Properties panel: ${propertiesPanelVisible ? '✅ Open' : '❌ Closed'}
- React selected: ${selectedComponent ? '✅ ' + (selectedComponent.get?.('tagName') || selectedComponent.tagName) : '❌ None'}
    `;
    
    console.log(summary);
    alert(summary);
  };

  // Function to force select the first text element for testing
  const forceSelectFirstText = () => {
    console.log('🎯 Force selecting first text element...');
    
    if (!grapesEditor.current) {
      alert('GrapesJS editor not ready');
      return;
    }
    
    const editor = grapesEditor.current;
    const components = editor.getComponents();
    
    if (!components || components.length === 0) {
      alert('No components found in the editor');
      return;
    }
    
    // Find first text-like component
    let textComponent: any = null;
    const textTags = ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'span', 'div'];
    
    components.forEach((comp: any) => {
      if (!textComponent && comp.get) {
        const tagName = comp.get('tagName');
        if (textTags.includes(tagName)) {
          textComponent = comp;
        }
      }
    });
    
    if (textComponent) {
      console.log('✅ Found text component to select:', textComponent.get('tagName'));
      
      // Clear any existing selection first
      editor.select(null);
      
      // Select the component
      editor.select(textComponent);
      
      // Verify selection worked
      setTimeout(() => {
        const nowSelected = editor.getSelected();
        if (nowSelected === textComponent) {
          console.log('✅ Selection successful');
          alert(`✅ Successfully selected ${textComponent.get('tagName')} element!`);
        } else {
          console.log('❌ Selection failed');
          alert('❌ Selection failed - check console for details');
        }
      }, 100);
    } else {
      alert('No text components found to select');
    }
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
          
          // Apply contenteditable to text elements after content is loaded
          setTimeout(() => {
            convertTextBlocksToRichText(grapesEditor.current);
          }, 500);
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
    
    // Apply contenteditable to text elements after default content is loaded
    setTimeout(() => {
      convertTextBlocksToRichText(grapesEditor.current);
    }, 500);
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
      fromElement: false,
      height: '100vh',
      width: '100%',
      storageManager: false, // Disable to prevent auto-loading from localStorage
      panels: { defaults: [] },
      canvas: {
        styles: [
          '/tailwind.css',
        ],
      },
      blockManager: {
        appendTo: '#gjs-blocks',
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

    // Wait for GrapesJS to be fully ready before applying utilities and loading content
    editor.onReady(() => {
      // Apply custom utilities with contenteditable approach (no CKEditor)
      registerEditableTags(editor);
      makeAllTextAndContainersEditable(editor);
      
      // Add component selection handler for edit modal and properties panel
      editor.on('component:selected', (component: any) => {
        console.log('🎯 Component selected:', component?.get?.('tagName'));
        if (component) {
          // Create a unique component reference to force React re-render
          const uniqueComponent = {
            ...component,
            _forceUpdate: Date.now(),
            _eventSource: 'grapesjs-selection',
            _id: component.getId ? component.getId() : component.cid || Math.random(),
            _realComponent: true
          };
          
          setSelectedComponent(uniqueComponent);
          setPropertiesPanelVisible(true);
          console.log('📤 Auto-opening properties panel for selected component');
        }
      });
      
      editor.on('component:deselected', () => {
        console.log('🎯 Component deselected');
        setSelectedComponent(null);
        setPropertiesPanelVisible(false);
      });
      
      // Double-click to open edit modal
      editor.on('component:double-click', (component: any) => {
        setSelectedComponent(component);
        setEditModalOpen(true);
      });
      
      // Configure GrapesJS panels to render in our custom sidebar locations
      const layerManager = editor.LayerManager;
      const styleManager = editor.StyleManager;
      
      // Render layers panel in sidebar
      const layersContainer = document.getElementById('gjs-layers');
      if (layersContainer && layerManager) {
        layersContainer.appendChild(layerManager.render());
      }
      
      // Render style manager in sidebar
      const stylesContainer = document.getElementById('gjs-styles');
      if (stylesContainer && styleManager) {
        stylesContainer.appendChild(styleManager.render());
      }
      
      // Load initial content
      if (selectedPage) {
        loadPageContent(selectedPage);
      }
    });

    return () => {
      if (grapesEditor.current) {
        grapesEditor.current.destroy();
        grapesEditor.current = null;
      }
    };
  }, []);

  // Debug logging for state changes
  useEffect(() => {
    console.log('🔄 State changed:', {
      propertiesPanelVisible,
      hasSelectedComponent: !!selectedComponent,
      componentType: selectedComponent?.get?.('tagName') || selectedComponent?.tagName || 'none'
    });
  }, [propertiesPanelVisible, selectedComponent]);

  return (
    <>
      <Head>
        <title>Web Designer - Migistus</title>
        <meta name="description" content="Visual web page designer" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
      </Head>

      <div className="w-full h-full flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900">
        {/* Top Toolbar */}
        <TopToolbar 
          editor={grapesEditor.current}
          isPreviewMode={previewMode}
          onTogglePreview={togglePreview}
          onToggleSidebar={toggleSidebar}
          sidebarVisible={sidebarVisible}
          onToggleBlockPanel={toggleBlockPanel}
          blockPanelVisible={blockPanelVisible}
          selectedPage={selectedPage}
          onPageChange={setSelectedPage}
          pages={pages}
          onSave={handleGrapesSave}
          onTestPropertiesPanel={testPropertiesPanel}
          onGetCurrentSelection={getCurrentSelection}
          onDebugSelection={debugCanvasSelection}
          onForceSelectFirst={forceSelectFirstText}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex">
          {/* Block Panel */}
          {blockPanelVisible && (
            <BlockPanel 
              editor={grapesEditor.current}
              isVisible={blockPanelVisible}
              onToggle={toggleBlockPanel}
            />
          )}

          {/* Main Canvas */}
          <div className="flex-1 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
            <DesignerCanvas grapesRef={grapesRef} />
            
            {/* Debug Status Overlay */}
            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white p-2 rounded text-xs">
              <div>Props Panel: {propertiesPanelVisible ? '✅ Visible' : '❌ Hidden'}</div>
              <div>Selected: {selectedComponent ? '✅ Yes' : '❌ No'}</div>
              <div>Component: {selectedComponent?.get?.('tagName') || selectedComponent?.tagName || 'none'}</div>
            </div>
          </div>

          {/* Properties Panel */}
          {propertiesPanelVisible && selectedComponent && (
            <PropertiesPanel
              selectedComponent={selectedComponent}
              editor={grapesEditor.current}
              isVisible={propertiesPanelVisible}
              onClose={closePropertiesPanel}
            />
          )}

          {/* Sidebar */}
          {sidebarVisible && (
            <DesignerSidebar
              editor={grapesEditor.current}
              isVisible={sidebarVisible}
              onToggle={toggleSidebar}
            />
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        editor={grapesEditor.current}
        selectedComponent={selectedComponent}
      />
    </>
  );
}
