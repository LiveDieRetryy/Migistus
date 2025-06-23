import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Head from "next/head";
import grapesjs from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import InlineEditor from '@ckeditor/ckeditor5-build-inline';
import { Dialog } from '@headlessui/react';

// Placeholder for admin check (replace with real auth logic)
const isAdmin = true;

// Helper: Recursively set editable: true on all text-like and container tags, preserving structure
function makeAllTextAndContainersEditable(editor: any) {
  const editableTags = ['h1','h2','h3','h4','h5','h6','p','span','label','div','section','article'];
  function walk(comps: any[]) {
    comps.forEach((comp: any) => {
      const tag = comp.get('tagName');
      if (editableTags.includes(tag)) {
        comp.set({ editable: true });
      }
      if (comp.components && comp.components().length) {
        walk(comp.components());
      }
    });
  }
  walk(editor.getComponents());
}

// Register all text-like tags as editable with GrapesJS (run once on init)
function registerEditableTags(editor: any) {
  const editableTags = ['h1','h2','h3','h4','h5','h6','p','span','label','div','section','article','a','button'];
  editableTags.forEach(tag => {
    editor.DomComponents.addType(tag, {
      isComponent: (el: HTMLElement) => el.tagName === tag.toUpperCase(),
      model: {
        defaults: {
          editable: true,
        }
      }
    });
  });
}

// Helper: Recursively convert text-like blocks to 'rich-text' component type
function convertTextBlocksToRichText(editor: any) {
  const textTags = ['div','p','h1','h2','h3','h4','h5','h6','span','label','section','article'];
  function walk(parent: any) {
    const comps = parent.components ? parent.components() : [];
    for (let i = comps.length - 1; i >= 0; i--) {
      const comp = comps.at(i);
      const tag = comp.get('tagName');
      if (textTags.includes(tag)) {
        comp.set({ type: 'rich-text' });
      }
      if (comp.components && comp.components().length) {
        walk(comp);
      }
    }
  }
  walk(editor.getWrapper());
}

// Main Web Designer Component
export default function WebDesigner() {
  const [selectedPage, setSelectedPage] = useState<string>("");
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const iframeRef = useRef<HTMLIFrameElement>(null); // <-- Move this to the top
  const grapesRef = useRef<HTMLDivElement>(null);
  const grapesEditor = useRef<any>(null);

  // Dynamically generate the list of pages for the page selector
  function getAllPages() {
    // List of static and dynamic pages (add more as needed)
    return [
      { name: 'Homepage', path: '/' },
      { name: 'Voting', path: '/voting' },
      { name: 'Wallet', path: '/wallet' },
      { name: 'Users', path: '/users' },
      { name: 'Terms', path: '/terms' },
      { name: 'Suppliers', path: '/suppliers' },
      { name: 'Supplier Dashboard', path: '/supplier-dashboard' },
      { name: 'Supplier Portal', path: '/supplier-portal' },
      { name: 'Supplier Portal (New)', path: '/supplier-portal-new' },
      { name: 'Supplier Registration', path: '/supplier-registration' },
      { name: 'Supplier Settings', path: '/supplier-settings' },
      { name: 'Supplier Social Dashboard', path: '/supplier-social-dashboard' },
      { name: 'Suppliers Backup', path: '/suppliers-backup' },
      { name: 'Suppliers Live', path: '/suppliers-live' },
      { name: 'Suppliers New', path: '/suppliers-new' },
      { name: 'Suppliers Tracking', path: '/suppliers-tracking' },
      { name: 'Staff Picks', path: '/staff-picks' },
      { name: 'Community Drops', path: '/community-drops' },
      { name: 'Coming Soon', path: '/coming-soon' },
      { name: 'Coming Soon (New)', path: '/coming-soon-new' },
      { name: 'Live', path: '/live' },
      { name: 'Pool', path: '/pool' },
      { name: 'Privacy', path: '/privacy' },
      { name: 'Profile', path: '/profile' },
      { name: 'Register', path: '/register' },
      { name: 'Login', path: '/login' },
      { name: 'Payment', path: '/payment' },
      { name: 'Categories', path: '/categories' },
      { name: 'Admin Dashboard', path: '/admin-dashboard' },
      { name: 'Admin Login', path: '/admin-login' },
      // Add dynamic and nested pages as needed
    ];
  }
  const pages = getAllPages();

  // --- Step 1: Basic Canvas State ---
  const [elements, setElements] = useState<DesignerElement[]>([]); // Start with no default elements
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const gridSize = 32; // px
  const canvasRef = useRef<HTMLDivElement>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // --- Step 1: Drag logic ---
  function onDragStart(e: React.DragEvent<HTMLDivElement>, id: string) {
    e.dataTransfer.setData("elementId", id);
  }
  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    const id = e.dataTransfer.getData("elementId");
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gridSize);
    const y = Math.floor((e.clientY - rect.top) / gridSize);
    setElements((els) =>
      els.map((el) =>
        el.id === id ? { ...el, x, y } : el
      )
    );
  }
  function onDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
  }

  // --- Step 2: Resizing logic ---
  const [resizing, setResizing] = useState<{ id: string; startX: number; startY: number; startW: number; startH: number } | null>(null);

  function onResizeMouseDown(e: React.MouseEvent<HTMLDivElement>, elId: string) {
    e.stopPropagation();
    const el = elements.find((el) => el.id === elId);
    if (!el) return;
    setResizing({
      id: elId,
      startX: e.clientX,
      startY: e.clientY,
      startW: el.w,
      startH: el.h,
    });
    document.body.style.cursor = 'nwse-resize';
  }

  function onMouseMove(e: MouseEvent) {
    if (!resizing) return;
    const dx = Math.round((e.clientX - resizing.startX) / gridSize);
    const dy = Math.round((e.clientY - resizing.startY) / gridSize);
    setElements((els) =>
      els.map((el) =>
        el.id === resizing.id
          ? { ...el, w: Math.max(2, resizing.startW + dx), h: Math.max(1, resizing.startH + dy) }
          : el
      )
    );
  }

  function onMouseUp() {
    if (resizing) {
      setResizing(null);
      document.body.style.cursor = '';
    }
  }

  // Attach global mousemove/mouseup listeners for resizing
  React.useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [resizing]);

  // --- Step 3: Inline editing state ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  function handleDoubleClick(el: typeof elements[number]) {
    if (el.type === "text") {
      setEditingId(el.id);
      setEditingValue(el.content);
    }
  }
  function handleEditChange(e: React.ChangeEvent<HTMLInputElement>) {
    setEditingValue(e.target.value);
  }
  function handleEditBlurOrEnter() {
    if (editingId) {
      setElements((els) =>
        els.map((el) =>
          el.id === editingId ? { ...el, content: editingValue } : el
        )
      );
      setEditingId(null);
    }
  }

  // --- Palette state and add logic ---
  const [showPalette, setShowPalette] = useState(false);
  type ElementType = 'text' | 'box' | 'button' | 'heading' | 'image' | 'link' | 'divider' | 'custom' | 'card' | 'columns' | 'video';
  interface DesignerElement {
    id: string;
    type: ElementType;
    content: string;
    x: number;
    y: number;
    w: number;
    h: number;
    style: React.CSSProperties; // Allow any CSS property
    src?: string; // Allow images to use el.src
    // Advanced/optional properties
    target?: string; // for link
    alt?: string; // for image
    fit?: 'contain' | 'cover' | 'fill'; // for image
    widgetType?: string; // for custom
    parentId?: string; // for nesting
    children?: string[]; // for rendering order
    animation?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'zoom-in';
    hoverEffect?: 'none' | 'shadow' | 'scale' | 'glow';
    targetPage?: string; // for button navigation
  }
  function handleAddElement(type: ElementType) {
    setShowPalette(false);
    const newId = `el-${Date.now()}`;
    let newElement: DesignerElement;
    if (type === 'text') {
      newElement = {
        id: newId,
        type: 'text' as ElementType,
        content: 'New Text',
        x: 4,
        y: 4,
        w: 6,
        h: 2,
        style: { fontSize: 24, color: '#fde047', background: '#00000000' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
      };
    } else if (type === 'heading') {
      newElement = {
        id: newId,
        type: 'heading' as ElementType,
        content: 'New Heading',
        x: 4,
        y: 2,
        w: 8,
        h: 2,
        style: { fontSize: 32, color: '#facc15', background: '#00000000' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
      };
    } else if (type === 'image') {
      newElement = {
        id: newId,
        type: 'image' as ElementType,
        content: '/public/images/migistus_logo.png',
        x: 6,
        y: 6,
        w: 6,
        h: 4,
        style: { fontSize: 16, color: '#fff', background: '#00000000' },
        target: undefined,
        alt: '',
        fit: 'contain',
        widgetType: undefined,
      };
    } else if (type === 'link') {
      newElement = {
        id: newId,
        type: 'link' as ElementType,
        content: 'https://migistus.com',
        x: 8,
        y: 8,
        w: 6,
        h: 2,
        style: { fontSize: 18, color: '#38bdf8', background: '#00000000' },
        target: '_blank',
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
      };
    } else if (type === 'divider') {
      newElement = {
        id: newId,
        type: 'divider' as ElementType,
        content: '',
        x: 2,
        y: 10,
        w: 12,
        h: 1,
        style: { fontSize: 1, color: '#fff', background: '#27272a' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
      };
    } else if (type === 'custom') {
      newElement = {
        id: newId,
        type: 'custom' as ElementType,
        content: 'Custom Widget',
        x: 6,
        y: 12,
        w: 6,
        h: 3,
        style: { fontSize: 18, color: '#fff', background: '#a21caf' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: '',
      };
    } else if (type === 'box') {
      newElement = {
        id: newId,
        type: 'box' as ElementType,
        content: 'New Box',
        x: 6,
        y: 6,
        w: 4,
        h: 3,
        style: { fontSize: 18, color: '#fff', background: '#18181b' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
      };
    } else if (type === 'card') {
      newElement = {
        id: newId,
        type: 'card' as ElementType,
        content: 'Card Content',
        x: 6,
        y: 6,
        w: 4,
        h: 3,
        style: { fontSize: 18, color: '#333', background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '16px' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
      };
    } else if (type === 'columns') {
      newElement = {
        id: newId,
        type: 'columns' as ElementType,
        content: 'Column Content',
        x: 6,
        y: 6,
        w: 8,
        h: 4,
        style: { display: 'flex', gap: '16px', padding: '16px', background: '#f3f4f6', borderRadius: '6px' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
      };
    } else {
      newElement = {
        id: newId,
        type: 'button' as ElementType,
        content: 'Click Me',
        x: 8,
        y: 8,
        w: 4,
        h: 2,
        style: { fontSize: 18, color: '#fff', background: '#facc15' },
        target: undefined,
        alt: undefined,
        fit: undefined,
        widgetType: undefined,
        targetPage: undefined,
      };
    }
    pushHistory([...elements, newElement]);
    setSelectedElementId(newId);
  }

  // --- Helper: Duplicate element ---
  function handleDuplicateElement(id: string) {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const newId = `el-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const clone = { ...el, id: newId, x: el.x + 1, y: el.y + 1, parentId: undefined, children: [] };
    pushHistory([...elements, clone]);
    setSelectedElementId(newId);
  }

  // --- Helper: Add element at specific grid location (for palette drag-and-drop) ---
  function handleAddElementAt(type: ElementType, x: number, y: number) {
    setShowPalette && setShowPalette(false);
    const newId = `el-${Date.now()}`;
    let newElement: DesignerElement;
    if (type === 'text') {
      newElement = {
        id: newId,
        type: 'text',
        content: 'New Text',
        x, y, w: 6, h: 2,
        style: { fontSize: 24, color: '#fde047', background: '#00000000' },
      };
    } else if (type === 'heading') {
      newElement = {
        id: newId,
        type: 'heading',
        content: 'New Heading',
        x, y, w: 8, h: 2,
        style: { fontSize: 32, color: '#facc15', background: '#00000000' },
      };
    } else if (type === 'image') {
      newElement = {
        id: newId,
        type: 'image',
        content: '/public/images/migistus_logo.png',
        x, y, w: 6, h: 4,
        style: { fontSize: 16, color: '#fff', background: '#00000000' },
        alt: '', fit: 'contain',
      };
    } else if (type === 'link') {
      newElement = {
        id: newId,
        type: 'link',
        content: 'https://migistus.com',
        x, y, w: 6, h: 2,
        style: { fontSize: 18, color: '#38bdf8', background: '#00000000' },
        target: '_blank',
      };
    } else if (type === 'divider') {
      newElement = {
        id: newId,
        type: 'divider',
        content: '',
        x, y, w: 12, h: 1,
        style: { fontSize: 1, color: '#fff', background: '#27272a' },
      };
    } else if (type === 'custom') {
      newElement = {
        id: newId,
        type: 'custom',
        content: 'Custom Widget',
        x, y, w: 6, h: 3,
        style: { fontSize: 18, color: '#fff', background: '#a21caf' },
        widgetType: '',
      };
    } else if (type === 'box') {
      newElement = {
        id: newId,
        type: 'box',
        content: 'New Box',
        x, y, w: 4, h: 3,
        style: { fontSize: 18, color: '#fff', background: '#18181b' },
      };
    } else if (type === 'card') {
      newElement = {
        id: newId,
        type: 'card',
        content: 'Card Content',
        x, y, w: 4, h: 3,
        style: { fontSize: 18, color: '#333', background: '#ffffff', border: '1px solid #eaeaea', borderRadius: '8px', padding: '16px' },
      };
    } else if (type === 'columns') {
      newElement = {
        id: newId,
        type: 'columns',
        content: 'Column Content',
        x, y, w: 8, h: 4,
        style: { display: 'flex', gap: '16px', padding: '16px', background: '#f3f4f6', borderRadius: '6px' },
      };
    } else {
      newElement = {
        id: newId,
        type: 'button',
        content: 'Click Me',
        x, y, w: 4, h: 2,
        style: { fontSize: 18, color: '#fff', background: '#facc15' },
      };
    }
    pushHistory([...elements, newElement]);
    setSelectedElementId(newId);
  }

  // --- Step 5: Load/save page layout from API ---
  useEffect(() => {
    if (!selectedPage) return;
    setLoadingPage(true);
    fetch(`/api/page-layout?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        if (data.layouts) {
          setLayouts({
            desktop: normalizeElements(data.layouts.desktop || []),
            tablet: normalizeElements(data.layouts.tablet || []),
            mobile: normalizeElements(data.layouts.mobile || []),
          });
          setElements(normalizeElements(data.layouts[breakpoint] || []));
        } else if (Array.isArray(data.elements)) {
          setLayouts({ desktop: normalizeElements(data.elements), tablet: [], mobile: [] });
          setElements(normalizeElements(data.elements));
        } else {
          // Try to import from code if no layout exists
          fetch(`/api/page-code?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`)
            .then(res => res.json())
            .then(codeData => {
              if (Array.isArray(codeData.layout)) {
                setLayouts({ desktop: normalizeElements(codeData.layout), tablet: [], mobile: [] });
                setElements(normalizeElements(codeData.layout));
              } else {
                setLayouts({ desktop: [], tablet: [], mobile: [] });
                setElements([]);
              }
            })
            .catch(() => {
              setLayouts({ desktop: [], tablet: [], mobile: [] });
              setElements([]);
            });
        }
      })
      .catch(() => {
        // Try to import from code if no layout exists
        fetch(`/api/page-code?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`)
          .then(res => res.json())
          .then(codeData => {
            if (Array.isArray(codeData.layout)) {
              setLayouts({ desktop: normalizeElements(codeData.layout), tablet: [], mobile: [] });
              setElements(normalizeElements(codeData.layout));
            } else {
              setLayouts({ desktop: [], tablet: [], mobile: [] });
              setElements([]);
            }
          })
          .catch(() => {
            setLayouts({ desktop: [], tablet: [], mobile: [] });
            setElements([]);
          });
      })
      .finally(() => setLoadingPage(false));
  }, [selectedPage]);

  function handleSavePage() {
    fetch(`/api/page-layout?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layouts }),
      }
    ).then(res => {
      if (res.ok) alert('Page saved!');
      else alert('Failed to save.');
    });
    // Also generate/update the .tsx file from layout
    fetch(`/api/page-code?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layout: layouts[breakpoint] }),
      }
    );
  }
  const [loadingPage, setLoadingPage] = useState(false);

  // Save GrapesJS content to backend
  const handleGrapesSave = async () => {
    if (!selectedPage || !grapesEditor.current) return;
    const html = grapesEditor.current.getHtml();
    const css = grapesEditor.current.getCss();
    await fetch(`/api/page-html?page=${encodeURIComponent(selectedPage.replace(/^\//, '') || 'homepage')}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ html, css })
      }
    );
    alert('Page saved!');
  };

  // --- Undo/Redo State ---
  const [history, setHistory] = useState<DesignerElement[][]>([]);
  const [future, setFuture] = useState<DesignerElement[][]>([]);

  // Call this whenever elements change (except undo/redo)
  function pushHistory(newElements: DesignerElement[]) {
    const normalized = normalizeElements(newElements);
    setHistory((h) => [...h, normalizeElements(elements)]);
    setFuture([]);
    setElements(normalized);
  }

  function handleUndo() {
    if (history.length === 0) return;
    setFuture((f) => [normalizeElements(elements), ...f]);
    setElements(normalizeElements(history[history.length - 1]));
    setHistory((h) => h.slice(0, -1));
  }

  function handleRedo() {
    if (future.length === 0) return;
    setHistory((h) => [...h, normalizeElements(elements)]);
    setElements(normalizeElements(future[0]));
    setFuture((f) => f.slice(1));
  }

  // --- Element Deletion ---
  function handleDeleteElement() {
    if (!selectedElementId) return;
    pushHistory(normalizeElements(elements.filter(el => el.id !== selectedElementId)));
    setSelectedElementId(null);
  }

  // --- Layer Controls ---
  function moveElementLayer(direction: 'forward' | 'backward') {
    if (!selectedElementId) return;
    const idx = elements.findIndex(el => el.id === selectedElementId);
    if (idx === -1) return;
    let newElements = [...elements];
    if (direction === 'forward' && idx < elements.length - 1) {
      [newElements[idx], newElements[idx + 1]] = [newElements[idx + 1], newElements[idx]];
    } else if (direction === 'backward' && idx > 0) {
      [newElements[idx], newElements[idx - 1]] = [newElements[idx - 1], newElements[idx]];
    }
    pushHistory(normalizeElements(newElements));
  }

  // --- Reusable components (symbols) state ---
  const [components, setComponents] = useState<{ id: string; name: string; rootId: string }[]>([]);

  // Save selected container as component
  function handleSaveAsComponent() {
    if (!selectedElementId) return;
    const el = elements.find(e => e.id === selectedElementId);
    if (!el || (el.type !== 'box' && el.type !== 'custom')) return;
    const name = prompt('Component name?', 'MyComponent');
    if (!name) return;
    setComponents((comps) => [...comps, { id: `comp-${Date.now()}`, name, rootId: el.id }]);
  }

  // --- Utility: Cast loaded elements to correct type ---
  function normalizeElements(raw: any[]): DesignerElement[] {
    return raw.map((el) => ({
      ...el,
      type: (['text', 'box', 'button', 'heading', 'image', 'link', 'divider', 'custom', 'card', 'columns', 'video'].includes(el.type) ? el.type : 'text') as ElementType,
      target: el.target ?? (el.type === 'link' ? '_blank' : undefined),
      alt: el.alt ?? (el.type === 'image' ? '' : undefined),
      fit: el.fit ?? (el.type === 'image' ? 'contain' : undefined),
      widgetType: el.widgetType ?? (el.type === 'custom' ? '' : undefined),
      parentId: el.parentId ?? undefined,
      children: el.children ?? [],
    }));
  }

  // --- GrapesJS Ready State and Import Guard ---
  const [grapesReady, setGrapesReady] = useState(false);
  const hasImportedRef = useRef<string | null>(null);

  // --- GrapesJS Initialization (only once) ---
  useEffect(() => {
    if (grapesRef.current && !grapesEditor.current) {
      grapesEditor.current = grapesjs.init({
        container: grapesRef.current,
        fromElement: false,
        height: '100vh',
        width: '100%',
        storageManager: false,
        panels: { defaults: [] },
        canvas: {
          styles: [
            '/tailwind.css',
          ],
        },
        blockManager: {
          appendTo: '#gjs-blocks',
        },
      });

      grapesEditor.current.onReady(async () => {
        const { default: InlineEditor } = await import('@ckeditor/ckeditor5-build-inline');
        // --- Rich Text Block (CKEditor) ---
        grapesEditor.current.DomComponents.addType('rich-text', {
          model: {
            defaults: {
              tagName: 'div',
              editable: false,
              droppable: false,
              traits: [],
              content: 'Double-click to edit rich text',
            },
            init() {},
            handleContentChange() {}
          },
          view: {
            events: { dblclick: 'onActive' },
            onActive(ev: any) {
              ev.stopPropagation();
              const self = this as any;
              const el = self.el as HTMLElement;
              if (el.getAttribute('data-ckeditor')) return;
              el.setAttribute('data-ckeditor', 'true');
              InlineEditor.create(el, {
                toolbar: [
                  'heading', '|', 'bold', 'italic', 'underline', 'link', 'bulletedList', 'numberedList', 'blockQuote', 'insertTable', 'undo', 'redo', 'imageUpload', 'mediaEmbed', 'fontColor', 'fontBackgroundColor', 'alignment', 'outdent', 'indent'
                ],
                image: { toolbar: ['imageTextAlternative', 'imageStyle:full', 'imageStyle:side'] },
                table: { contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells'] }
              })
                .then((editor: any) => {
                  self.editorInstance = editor;
                  editor.model.document.on('change:data', () => {
                    self.model.set('content', editor.getData());
                  });
                  editor.editing.view.document.on('blur', () => {
                    editor.destroy();
                    el.removeAttribute('data-ckeditor');
                    self.editorInstance = null;
                  });
                });
            },
            render() {
              const self = this as any;
              const el = self.el as HTMLElement;
              el.innerHTML = self.model.get('content') || '';
              return self;
            }
          }
        });
        // --- Rich Text Block (already editable via CKEditor) ---
        grapesEditor.current.BlockManager.add('rich-text', {
          label: '<i class="fa fa-font"></i> Rich Text',
          content: { type: 'rich-text' },
          category: 'Basic',
        });
        // --- Editable Image Block ---
        grapesEditor.current.DomComponents.addType('custom-image', {
          model: {
            defaults: {
              tagName: 'img',
              src: 'https://via.placeholder.com/400x200?text=Image',
              alt: 'Image',
              style: { width: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px #0002' },
              traits: [
                { type: 'text', label: 'Image URL', name: 'src' },
                { type: 'text', label: 'Alt Text', name: 'alt' },
                { type: 'number', label: 'Border Radius', name: 'style.borderRadius' },
                { type: 'color', label: 'Shadow Color', name: 'style.boxShadow' },
                { type: 'number', label: 'Width', name: 'style.width' },
                { type: 'number', label: 'Height', name: 'style.height' },
              ],
              resizable: true,
            },
          },
        });
        grapesEditor.current.BlockManager.add('custom-image', {
          label: '<i class="fa fa-image"></i> Image',
          content: { type: 'custom-image' },
          category: 'Basic',
        });
        // --- Editable Button Block ---
        grapesEditor.current.DomComponents.addType('custom-button', {
          model: {
            defaults: {
              tagName: 'a',
              content: 'Button',
              attributes: { class: 'gjs-btn gjs-btn--primary', href: '#' },
              style: { padding: '10px 24px', background: '#facc15', color: '#222', borderRadius: '6px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' },
              traits: [
                { type: 'text', label: 'Text', name: 'content' },
                { type: 'text', label: 'URL', name: 'attributes.href' },
                { type: 'color', label: 'Text Color', name: 'style.color' },
                { type: 'color', label: 'Background', name: 'style.background' },
                { type: 'number', label: 'Border Radius', name: 'style.borderRadius' },
                { type: 'number', label: 'Padding X', name: 'style.paddingLeft' },
                { type: 'number', label: 'Padding Y', name: 'style.paddingTop' },
                { type: 'checkbox', label: 'Open in new tab', name: 'attributes.target', valueTrue: '_blank', valueFalse: '' },
              ],
              resizable: true,
            },
          },
        });
        grapesEditor.current.BlockManager.add('custom-button', {
          label: '<i class="fa fa-square"></i> Button',
          content: { type: 'custom-button' },
          category: 'Basic',
        });
        // --- Editable Card Block ---
        grapesEditor.current.DomComponents.addType('custom-card', {
          model: {
            defaults: {
              tagName: 'div',
              attributes: { class: 'gjs-card' },
              style: { border: '1px solid #eee', borderRadius: '8px', padding: '16px', maxWidth: '340px', background: '#fff', boxShadow: '0 2px 8px #0001' },
              components:
                [
                  {
                    type: 'custom-image',
                    src: 'https://via.placeholder.com/320x160?text=Card+Image',
                    style: { width: '100%', borderRadius: '6px', marginBottom: '12px' },
                  },
                  {
                    type: 'rich-text',
                    content: '<h3 style="font-size:1.3em; margin-bottom:8px;">Card Title</h3>',
                  },
                  {
                    type: 'rich-text',
                    content: '<div style="margin-bottom:12px;">Card description goes here. Double-click to edit.</div>',
                  },
                  {
                    type: 'custom-button',
                    content: 'Button',
                    attributes: { href: '#' },
                    style: { padding: '8px 20px', background: '#facc15', color: '#222', borderRadius: '5px', fontWeight: 'bold', textDecoration: 'none', display: 'inline-block' },
                  },
                ],
              traits: [
                { type: 'color', label: 'Card Background', name: 'style.background' },
                { type: 'color', label: 'Border Color', name: 'style.border' },
                { type: 'number', label: 'Border Radius', name: 'style.borderRadius' },
                { type: 'number', label: 'Padding', name: 'style.padding' },
                { type: 'number', label: 'Max Width', name: 'style.maxWidth' },
                { type: 'text', label: 'Box Shadow', name: 'style.boxShadow' },
              ],
              resizable: true,
            },
          },
        });
        grapesEditor.current.BlockManager.add('custom-card', {
          label: '<i class="fa fa-id-card"></i> Card',
          content: { type: 'custom-card' },
          category: 'Basic',
        });
        // --- Columns Block (with traits) ---
        grapesEditor.current.DomComponents.addType('custom-columns', {
          model: {
            defaults: {
              tagName: 'div',
              attributes: { class: 'gjs-row' },
              style: { display: 'flex', gap: '16px', padding: '16px', background: '#f3f4f6', borderRadius: '6px' },
              components: [
                {
                  tagName: 'div',
                  attributes: { class: 'gjs-cell' },
                  style: { flex: 1, background: '#f3f4f6', padding: '16px', borderRadius: '6px' },
                  content: 'Column 1',
                  droppable: true,
                },
                {
                  tagName: 'div',
                  attributes: { class: 'gjs-cell' },
                  style: { flex: 1, background: '#f3f4f6', padding: '16px', borderRadius: '6px' },
                  content: 'Column 2',
                  droppable: true,
                },
              ],
              traits: [
                { type: 'number', label: 'Columns', name: 'columns', min: 1, max: 6, changeProp: 1 },
                { type: 'number', label: 'Gap (px)', name: 'style.gap' },
                { type: 'color', label: 'Background', name: 'style.background' },
                { type: 'number', label: 'Padding', name: 'style.padding' },
                { type: 'number', label: 'Border Radius', name: 'style.borderRadius' },
              ],
              resizable: true,
              columns: 2,
            },
            init() {
              (this as any).listenTo(this, 'change:columns', (this as any).handleColumnsChange);
            },
            handleColumnsChange() {
              const cols = (this as any).get('columns') || 2;
              let comps = (this as any).components();
              while (comps.length < cols) {
                comps.add({
                  tagName: 'div',
                  attributes: { class: 'gjs-cell' },
                  style: { flex: 1, background: '#f3f4f6', padding: '16px', borderRadius: '6px' },
                  content: `Column ${comps.length + 1}`,
                  droppable: true,
                });
              }
              while (comps.length > cols) {
                comps.pop();
              }
            },
          },
        });
        grapesEditor.current.BlockManager.add('custom-columns', {
          label: '<i class="fa fa-columns"></i> 2 Columns',
          content: { type: 'custom-columns' },
          category: 'Basic',
        });
        // --- Video Block (with traits) ---
        grapesEditor.current.DomComponents.addType('custom-video', {
          model: {
            defaults: {
              tagName: 'video',
              src: 'https://www.w3schools.com/html/mov_bbb.mp4',
              style: { width: '100%', height: '320px', borderRadius: '8px' },
              attributes: { controls: true },
              traits: [
                { type: 'text', label: 'Video URL', name: 'src' },
                { type: 'checkbox', label: 'Controls', name: 'attributes.controls', valueTrue: true, valueFalse: false },
                { type: 'checkbox', label: 'Autoplay', name: 'attributes.autoplay', valueTrue: true, valueFalse: false },
                { type: 'number', label: 'Width (px)', name: 'style.width' },
                { type: 'number', label: 'Height (px)', name: 'style.height' },
                { type: 'number', label: 'Border Radius', name: 'style.borderRadius' },
              ],
              resizable: true,
            },
          },
        });
        grapesEditor.current.BlockManager.add('custom-video', {
          label: '<i class="fa fa-video"></i> Video',
          content: { type: 'custom-video' },
          category: 'Basic',
        });
        // --- Export Button ---
        grapesEditor.current.Panels.addButton('options', [{
          id: 'export',
          className: 'fa fa-download',
          command: 'export-template',
          attributes: { title: 'Export HTML/CSS' }
        }]);
        // --- CKEditor Toolbar Show/Hide on Focus ---
        // (CKEditor handles this natively, but you can further customize in the CKEditor config if needed)
        setGrapesReady(true);
      });
    }
    return () => {
      if (grapesEditor.current) {
        grapesEditor.current.destroy();
        grapesEditor.current = null;
      }
    };
  }, []);

  // --- Import HTML Content Only After GrapesJS is Ready and Only Once Per Page ---
  useEffect(() => {
    if (!selectedPage || !grapesEditor.current || !grapesReady) return;
    if (hasImportedRef.current === selectedPage) return; // Prevent duplicate import
    hasImportedRef.current = selectedPage;
    let pageParam = selectedPage.replace(/^\//, '') || '';
    if (pageParam === 'homepage') pageParam = '';
    fetch(`/api/page-rendered-html?page=${encodeURIComponent(pageParam)}`)
      .then(res => res.json())
      .then(data => {
        let html = data.html || '';
        grapesEditor.current.setComponents(html);
        setTimeout(() => {
          convertTextBlocksToRichText(grapesEditor.current);
        }, 200);
      });
  }, [selectedPage, grapesReady]);

  // Reset import guard if page changes
  useEffect(() => {
    hasImportedRef.current = null;
  }, [selectedPage]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-950 text-yellow-300 text-2xl">
        Access Denied: Admins Only
      </div>
    );
  }

  // --- Preview Mode State ---
  const [previewMode, setPreviewMode] = useState(false);
  type Breakpoint = 'desktop' | 'tablet' | 'mobile';
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop');
  const [layouts, setLayouts] = useState<{ [key in Breakpoint]: DesignerElement[] }>({
    desktop: elements,
    tablet: [],
    mobile: [],
  });

  // Sync elements with current breakpoint
  useEffect(() => {
    setElements(layouts[breakpoint] || []);
  }, [breakpoint]);
  useEffect(() => {
    setLayouts((prev) => ({ ...prev, [breakpoint]: elements }));
  }, [elements]);

  // Sidebar collapse state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Sidebar width state for resizing
  const [sidebarWidth, setSidebarWidth] = useState(288); // 72 * 4 = 288px default
  const sidebarMin = 200, sidebarMax = 400;
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizingSidebar = useRef(false);

  // Sidebar resize handlers
  function onSidebarResizeMouseDown(e: React.MouseEvent) {
    resizingSidebar.current = true;
    document.body.style.cursor = 'ew-resize';
  }
  useEffect(() => {
    function onMouseMove(e: MouseEvent) {
      if (!resizingSidebar.current) return;
      const newW = Math.max(sidebarMin, Math.min(sidebarMax, e.clientX));
      setSidebarWidth(newW);
    }
    function onMouseUp() {
      resizingSidebar.current = false;
      document.body.style.cursor = '';
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  // --- Data Binding State ---
  // Example: { [elementId]: { source: 'user', field: 'name' } }
  const [dataBindings, setDataBindings] = useState<Record<string, { source: string; field: string } | undefined>>({});
  // Example data sources (in a real app, fetch from API or config)
  const dataSources = [
    { key: 'user', label: 'User', fields: ['name', 'email', 'avatar'] },
    { key: 'product', label: 'Product', fields: ['title', 'price', 'imageUrl'] },
    // Add more as needed
  ];

  // --- Page Editor State ---
  const [editingPagePath, setEditingPagePath] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState<string>('');
  const [customPages, setCustomPages] = useState<{ name: string; path: string; section: string }[]>([]);

  // --- Folder/Section Editor State ---
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  // Structure: { folders: string[], pages: { name, path, section }[] }
  useEffect(() => {
    // Load structure from localStorage (or backend in future)
    const saved = localStorage.getItem('designerPageStructure');
    if (saved) {
      const parsed = JSON.parse(saved);
      setCustomFolders(parsed.folders || []);
      setCustomPages(parsed.pages || []);
    }
  }, []);
  useEffect(() => {
    // Save structure to localStorage
    localStorage.setItem('designerPageStructure', JSON.stringify({ folders: customFolders, pages: customPages }));
  }, [customFolders, customPages]);

  // Add new folder
  function handleAddLocalFolder() {
    const name = prompt('New folder name?');
    if (!name) return;
    setCustomFolders(folders => [...folders, name]);
  }
  // Rename folder
  function handleRenameFolder(oldName: string) {
    const name = prompt('Rename folder:', oldName);
    if (!name || name === oldName) return;
    setCustomFolders(folders => folders.map(f => f === oldName ? name : f));
    setCustomPages(pgs => pgs.map(pg => pg.section === oldName ? { ...pg, section: name } : pg));
  }
  // Delete folder
  function handleDeleteFolder(name: string) {
    if (confirm(`Delete folder "${name}"? Pages will move to General.`)) {
      setCustomFolders(folders => folders.filter(f => f !== name));
      setCustomPages(pgs => pgs.map(pg => pg.section === name ? { ...pg, section: 'General' } : pg));
    }
  }

  // Drag-and-drop state
  const [draggedPage, setDraggedPage] = useState<{ name: string; path: string; section: string } | null>(null);

  // --- Backend-driven page tree ---
  const [backendTree, setBackendTree] = useState<any[]>([]);
  const [pagesLoading, setPagesLoading] = useState(false);
  async function fetchBackendTree() {
    setPagesLoading(true);
    const res = await fetch('/api/pages');
    const data = await res.json();
    setBackendTree(data.tree || []);
    setPagesLoading(false);
  }
  useEffect(() => { fetchBackendTree(); }, []);

  // Helper: flatten tree to get all pages for dropdowns, etc.
  function flattenPages(tree: any[]): { name: string; path: string }[] {
    let result: { name: string; path: string }[] = [];
    for (const node of tree) {
      if (node.type === 'page') result.push({ name: node.name, path: node.path });
      if (node.type === 'folder' && node.children) result = result.concat(flattenPages(node.children));
    }
    return result;
  }
  const allPagesFlat: { name: string; path: string }[] = flattenPages(backendTree);

  // Recursive render for folder/page tree
  function renderPageTree(tree: any[], parentPath = '') {
    return (
      <ul className="space-y-3">
        {tree.map(node => {
          if (node.type === 'folder') {
            return (
              <li key={node.path} className="group">
                <div className="flex items-center justify-between bg-zinc-800/40 rounded px-2 py-1 mb-1">
                  <button
                    className="w-full text-left font-bold text-yellow-400 flex items-center justify-between"
                    onClick={() => setOpenSections(os => ({ ...os, [node.path]: !os[node.path] }))
                    }
                    type="button"
                  >
                    <span>{node.name}</span>
                    <span>{openSections[node.path] ? '▼' : '▶'}</span>
                  </button>
                  <button
                    className="ml-2 px-2 py-1 bg-green-600 text-white rounded hover:bg-green-500 text-xs font-bold"
                    title="Add Page"
                    onClick={() => handleAddPage(node.path)}
                  >+
                  </button>
                  <button
                    className="ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-500 text-xs font-bold"
                    title="Add Folder"
                    onClick={() => handleAddFolder(node.path)}
                  >📁
                  </button>
                </div>
                {openSections[node.path] && node.children && (
                  <div className="ml-3 mt-1">{renderPageTree(node.children, node.path)}</div>
                )}
              </li>
            );
          } else if (node.type === 'page') {
            return (
              <li key={node.path} className="flex items-center group">
                <button
                  className={`w-full text-left px-4 py-2 rounded-lg transition font-semibold ${selectedPage === node.path ? "bg-yellow-400/10 text-yellow-300" : "hover:bg-zinc-800/80"}`}
                  onClick={() => setSelectedPage(node.path)}
                >
                  {node.name}
                </button>
                <button
                  className="ml-1 px-2 py-1 bg-red-600 text-white rounded hover:bg-red-500 text-xs font-bold"
                  title="Delete"
                  onClick={() => handleDeletePage(node)}
                >✕
                </button>
              </li>
            );
          }
          return null;
        })}
      </ul>
    );
  }

  // Add page via backend (now supports folder path)
  async function handleAddPage(folderPath: string) {
    const name = prompt('New page name?');
    if (!name) return;
    await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, section: folderPath })
    });
    fetchBackendTree();
  }
  // Delete page via backend
  async function handleDeletePage(page: { name: string; path: string }) {
    if (!confirm(`Delete page "${page.name}"? This will remove the file.`)) return;
    await fetch('/api/pages', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: page.path })
    });
    fetchBackendTree();
  }

  // Add new folder via backend
  async function handleAddFolder(parentPath: string) {
    const name = prompt('New folder name?');
    if (!name) return;
    await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, section: parentPath, type: 'folder' })
    });
    fetchBackendTree();
  }

  // --- Virtual Folders/Sections State (localStorage + backend fallback) ---
  const [virtualFolders, setVirtualFolders] = useState<{ name: string; id: string; pages: string[] }[]>([]);
  // Helper to convert backend tree to virtualFolders format
  function backendTreeToVirtualFolders(tree: any[]): { name: string; id: string; pages: string[] }[] {
    const folders: { name: string; id: string; pages: string[] }[] = [];
    // Helper to recursively collect all descendant pages for a folder
    function collectPages(nodes: any[]): string[] {
      let pages: string[] = [];
      for (const node of nodes) {
        if (node.type === 'page') {
          pages.push(node.path);
        } else if (node.type === 'folder' && node.children) {
          pages = pages.concat(collectPages(node.children));
        }
      }
      return pages;
    }
    // Helper to recursively walk the tree and build folders
    function walk(nodes: any[]) {
      for (const node of nodes) {
        if (node.type === 'folder') {
          const id = node.path || `${node.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
          const pages = node.children ? collectPages(node.children) : [];
          folders.push({ name: node.name, id, pages });
          if (node.children) walk(node.children);
        }
      }
    }
    walk(tree);
    // Add a General folder for root-level pages only
    const rootPages = tree.filter((n: any) => n.type === 'page').map((n: any) => n.path);
    if (rootPages.length) {
      folders.unshift({ name: 'General', id: 'general', pages: rootPages });
    }
    return folders;
  }

  // Load virtual folders from localStorage or backend
  useEffect(() => {
    const saved = localStorage.getItem('designerVirtualFolders');
    if (saved) {
      setVirtualFolders(JSON.parse(saved));
    } else {
      // Fetch backend tree and convert to virtualFolders
      fetch('/api/pages').then(res => res.json()).then(data => {
        if (data.tree) {
          console.log('Backend tree:', data.tree);
          const folders = backendTreeToVirtualFolders(data.tree);
          console.log('Converted folders:', folders);
          setVirtualFolders(folders);
        }
      });
    }
  }, []);

  // Only assign unassigned pages to General if there are any truly unassigned and folders are not empty
  useEffect(() => {
    if (!allPagesFlat.length || !virtualFolders.length) return;
    setVirtualFolders(folders => {
      const assigned = new Set(folders.flatMap(f => f.pages));
      const unassigned = allPagesFlat.filter(p => !assigned.has(p.path));
      if (!unassigned.length) return folders; // All assigned, do nothing
      let updated = [...folders];
      let general = updated.find(f => f.name === 'General');
      if (!general) {
        general = { name: 'General', id: 'general', pages: [] };
        updated.push(general);
      }
      general.pages = [...general.pages, ...unassigned.map(p => p.path)];
      // Remove deleted pages from folders
      updated = updated.map(f => ({ ...f, pages: f.pages.filter(p => allPagesFlat.some(ap => ap.path === p)) }));
      return updated;
    });
  }, [allPagesFlat, virtualFolders]);

  // Add/rename/delete/reorder folders
  function handleAddVirtualFolder() {
    const name = prompt('New folder name?');
    if (!name) return;
    setVirtualFolders(folders => [...folders, { name, id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`, pages: [] }]);
  }
  function handleRenameVirtualFolder(id: string) {
    const name = prompt('Rename folder?');
    if (!name) return;
    setVirtualFolders(folders => folders.map(f => f.id === id ? { ...f, name } : f));
  }
  function handleDeleteVirtualFolder(id: string) {
    if (!confirm('Delete this folder? Pages will move to General.')) return;
    setVirtualFolders(folders => {
      const toDelete = folders.find(f => f.id === id);
      if (!toDelete) return folders;
      const general = folders.find(f => f.name === 'General') || { name: 'General', id: 'general', pages: [] };
      general.pages = [...general.pages, ...toDelete.pages];
      return folders.filter(f => f.id !== id).map(f => f.id === 'general' ? general : f);
    });
  }
  // Drag-and-drop page between folders
  function handleMovePageToFolder(pagePath: string, folderId: string) {
    setVirtualFolders(folders => {
      let updated = folders.map(f => ({ ...f, pages: f.pages.filter(p => p !== pagePath) }));
      const idx = updated.findIndex(f => f.id === folderId);
      if (idx !== -1) updated[idx].pages.push(pagePath);
      return updated;
    });
  }

  // Drag-and-drop folder reordering
  const [draggedFolderId, setDraggedFolderId] = useState<string | null>(null);
  function handleMoveFolder(draggedId: string, targetId: string) {
    setVirtualFolders(folders => {
      const fromIdx = folders.findIndex(f => f.id === draggedId);
      const toIdx = folders.findIndex(f => f.id === targetId);
      if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return folders;
      const updated = [...folders];
      const [removed] = updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, removed);
      return updated;
    });
  }

  // Save structure to localStorage on demand
  function handleSaveFolderStructure() {
    localStorage.setItem('designerVirtualFolders', JSON.stringify(virtualFolders));
    alert('Folder structure saved!');
  }

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

  // --- Helper: Render elements recursively (must be above return) ---
  function renderElement(el: DesignerElement) {
    const childEls = elements.filter((e) => e.parentId === el.id);
    const isDropTarget = dropTargetId === el.id;
    const isContainer = el.type === 'box' || el.type === 'custom';
    const isSelected = selectedElementId === el.id;
    return (
      <div
        key={el.id}
        draggable
        onDragStart={(e) => onDragStart(e, el.id)}
        onClick={() => {
          setSelectedElementId(el.id);
          if (!previewMode) openBlockModal(el);
        }}
        className={`absolute cursor-move select-none border-2 transition-all group ${isSelected ? "border-yellow-400 ring-4 ring-yellow-400/30 shadow-xl" : isDropTarget && isContainer ? "border-blue-500 ring-4 ring-blue-400/60" : "border-transparent"}
          ${el.animation === 'fade' ? 'animate-fade-in' : ''}
          ${el.animation === 'slide-up' ? 'animate-slide-up' : ''}
          ${el.animation === 'slide-down' ? 'animate-slide-down' : ''}
          ${el.animation === 'zoom-in' ? 'animate-zoom-in' : ''}
          ${el.hoverEffect === 'shadow' ? 'hover:shadow-2xl hover:shadow-yellow-400/30' : ''}
          ${el.hoverEffect === 'scale' ? 'hover:scale-105' : ''}
          ${el.hoverEffect === 'glow' ? 'hover:ring-4 hover:ring-yellow-400/40' : ''}
        `}
        style={{
          left: el.x * gridSize,
          top: el.y * gridSize,
          width: el.w * gridSize,
          height: el.h * gridSize,
          ...el.style,
          zIndex: 11,
          padding: 8,
          pointerEvents: 'auto',
          background: isDropTarget && isContainer ? '#2563eb33' : el.style.background,
        }}
        onDragLeave={() => setDropTargetId(null)}
      >
        {el.type === "text" ? (
          editingId === el.id ? (
            <input
              autoFocus
              className="bg-zinc-800 text-yellow-200 font-bold rounded px-2 py-1 w-full outline-none"
              value={editingValue}
              onChange={handleEditChange}
              onBlur={handleEditBlurOrEnter}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEditBlurOrEnter();
              }}
            />
          ) : (
            <span
              style={{ fontSize: el.style.fontSize, color: el.style.color }}
              onDoubleClick={() => handleDoubleClick(el)}
            >
              {el.content}
            </span>
          )
        ) : el.type === 'heading' ? (
          <h2 style={{ fontSize: el.style.fontSize, color: el.style.color, fontWeight: 800 }}>{el.content}</h2>
        ) : el.type === 'image' ? (
          <img src={el.src || el.content} alt={el.alt || ''} style={{ width: '100%', height: '100%', objectFit: el.fit || 'contain' }} />
        ) : el.type === 'link' ? (
          <a
            href={el.content}
            target={el.target || '_self'}
            rel="noopener noreferrer"
            style={{ color: el.style.color, fontSize: el.style.fontSize, textDecoration: 'underline', cursor: 'pointer' }}
            onClick={e => {
              e.preventDefault();
              // Find best-matching backend page for this link
              const normalizedHref = (el.content || '').replace(/\/$/, '');
              const match = allPagesFlat.find(p => {
                const normalizedPath = (p.path || '').replace(/\/$/, '');
                return normalizedPath === normalizedHref;
              });
              if (match) {
                setSelectedPage(match.path);
              } else {
                setSelectedPage(el.content);
              }
            }}
          >
            {el.content}
          </a>
        ) : el.type === 'divider' ? (
          <hr style={{ borderColor: String(el.style.background), borderWidth: 2, width: '100%' }} />
        ) : el.type === 'custom' ? (
          <div className="w-full h-full flex items-center justify-center bg-purple-800/30 rounded-lg text-white font-bold">{el.widgetType || el.content}</div>
        ) : el.type === 'button' ? (
          <button
            className="w-full h-full bg-yellow-400 text-black font-bold rounded-lg shadow hover:bg-yellow-300 transition"
            style={{ fontSize: el.style.fontSize }}
            onClick={e => {
              e.preventDefault();
              if (el.targetPage) {
                // Find best-matching backend page for this targetPage
                const normalizedTarget = el.targetPage.replace(/\/$/, '');
                const match = allPagesFlat.find(p => (p.path || '').replace(/\/$/, '') === normalizedTarget);
                if (match) {
                  setSelectedPage(match.path);
                } else {
                  setSelectedPage(el.targetPage);
                }
              }
            }}
          >
            {el.content}
          </button>
        ) : el.type === 'card' ? (
          <div className="gjs-card" style={{ border: '1px solid #eee', borderRadius: '8px', padding: '16px', maxWidth: '340px', background: '#fff', boxShadow: '0 2px 8px #0001' }}>
            <img src="https://via.placeholder.com/320x160?text=Card+Image" style={{ width: '100%', borderRadius: '6px', marginBottom: '12px' }} />
            <h3 style={{ fontSize: '1.3em', marginBottom: '8px' }}>Card Title</h3>
            <div style={{ marginBottom: '12px' }}>Card description goes here. Double-click to edit.</div>
            <a href="#" className="gjs-btn gjs-btn--primary" style={{ padding: '8px 20px', background: '#facc15', color: '#222', borderRadius: '5px', fontWeight: 'bold', textDecoration: 'none' }}>Button</a>
          </div>
        ) : el.type === 'columns' ? (
          <div className="gjs-row" style={{ display: 'flex', gap: '16px' }}>
            <div className="gjs-cell" style={{ flex: 1, background: '#f3f4f6', padding: '16px', borderRadius: '6px' }}>Column 1</div>
            <div className="gjs-cell" style={{ flex: 1, background: '#f3f4f6', padding: '16px', borderRadius: '6px' }}>Column 2</div>
          </div>
        ) : el.type === 'video' ? (
          <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
            <iframe
              src={el.src}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                borderRadius: '8px',
              }}
            />
          </div>
        ) : (
          <div style={{ background: el.style.background, color: el.style.color }}>{el.content}</div>
        )}
        {/* Render children recursively */}
        {childEls.map(renderElement)}
        {/* Resize handle (bottom-right) */}
        {selectedElementId === el.id && !previewMode && (
          <div
            onMouseDown={(e) => onResizeMouseDown(e, el.id)}
            className="absolute right-0 bottom-0 w-4 h-4 bg-yellow-400 rounded-full border-2 border-zinc-900 cursor-nwse-resize z-20"
            style={{ transform: 'translate(50%, 50%)' }}
          />
        )}
        {/* Quick actions overlay, now shown on .group:hover */}
        {/* Removed Edit button; block itself opens modal */}
        {!previewMode && (
          <div className="absolute top-1 right-1 flex flex-col gap-1 z-30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto">
            <button title="Duplicate" onClick={e => { e.stopPropagation(); handleDuplicateElement(el.id); }} className="bg-yellow-400 text-black rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-yellow-300 transition text-lg font-bold">⧉</button>
            <button title="Delete" onClick={e => { e.stopPropagation(); handleDeleteElement(); }} className="bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-red-400 transition text-lg font-bold">✕</button>
            <button title="Send Backward" onClick={e => { e.stopPropagation(); moveElementLayer('backward'); }} className="bg-zinc-700 text-yellow-200 rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-zinc-800 transition text-lg font-bold">↓</button>
            <button title="Bring Forward" onClick={e => { e.stopPropagation(); moveElementLayer('forward'); }} className="bg-zinc-700 text-yellow-200 rounded-full w-7 h-7 flex items-center justify-center shadow hover:bg-zinc-800 transition text-lg font-bold">↑</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full flex bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900">
        {/* Modern Sidebar */}
        <aside className="h-full w-60 min-w-60 max-w-60 bg-gradient-to-b from-zinc-900 via-zinc-800 to-zinc-900 border-r border-yellow-400/20 shadow-2xl rounded-tr-2xl rounded-br-2xl flex flex-col gap-8 overflow-y-auto z-40">
          <div className="flex flex-col p-6 gap-6">
            <h2 className="text-2xl font-extrabold text-yellow-300 mb-2 tracking-wide flex items-center gap-2">
              <span className="fa fa-paint-brush text-yellow-400" />
              Web Designer
            </h2>
            <select value={selectedPage} onChange={e => setSelectedPage(e.target.value)} className="px-4 py-2 rounded-lg bg-zinc-800 text-yellow-200 mb-4 shadow-inner border border-zinc-700 focus:ring-2 focus:ring-yellow-400">
              <option value="">Select a page</option>
              {pages.map(p => <option key={p.path} value={p.path}>{p.name}</option>)}
            </select>
            <button
              onClick={() => setPreviewMode((prev) => !prev)}
              className={`px-4 py-2 rounded-xl font-bold shadow-lg mb-2 transition ${previewMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-400 text-black hover:bg-yellow-300'}`}
            >
              {previewMode ? (
                <><span className="fa fa-eye-slash mr-2" />Exit Preview</>
              ) : (
                <><span className="fa fa-eye mr-2" />Preview</>
              )}
            </button>
            <button onClick={handleGrapesSave} className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black rounded-xl font-bold shadow-lg hover:from-yellow-300 hover:to-yellow-200 transition mb-4" disabled={!selectedPage}>
              <span className="fa fa-save mr-2" />Save
            </button>
          </div>
        </aside>
        {/* Modern Block Panel */}
        <div id="gjs-blocks" style={{ width: 200, background: 'linear-gradient(180deg, #23232b 0%, #18181b 100%)', borderRight: '2px solid #facc15', padding: 16, overflowY: 'auto', borderRadius: '0 1.5rem 1.5rem 0', boxShadow: '2px 0 16px #0002' }} className="flex flex-col gap-4">
          {/* GrapesJS will render blocks here, but you can style .gjs-block for modern look in global CSS */}
        </div>
        {/* Main GrapesJS Editor */}
        <div style={{ flex: 1, height: '100vh', background: 'linear-gradient(135deg, #18181b 60%, #23232b 100%)', borderRadius: '1.5rem', margin: 16, boxShadow: '0 4px 32px #0004' }}>
          <Head>
            <title>Web Designer</title>
            {/* FontAwesome for icons */}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
            <style>{`
              .gjs-block {
                display: flex;
                align-items: center;
                gap: 12px;
                background: linear-gradient(90deg, #23232b 60%, #18181b 100%);
                border-radius: 0.75rem;
                box-shadow: 0 2px 8px #0001;
                padding: 12px 18px;
                margin-bottom: 10px;
                cursor: grab;
                transition: box-shadow 0.2s, background 0.2s;
                border: 1.5px solid #23232b;
              }
              .gjs-block:hover, .gjs-block.gjs-block-selected {
                background: linear-gradient(90deg, #facc15 10%, #23232b 100%);
                box-shadow: 0 4px 16px #facc1533;
                border-color: #facc15;
              }
              .gjs-block-label {
                font-weight: 600;
                color: #facc15;
                font-size: 1.1em;
                letter-spacing: 0.02em;
                display: flex;
                align-items: center;
                gap: 8px;
              }
              .gjs-block-category {
                font-size: 0.95em;
                color: #a1a1aa;
                font-weight: 700;
                margin: 10px 0 4px 0;
                text-transform: uppercase;
                letter-spacing: 0.08em;
              }
              .gjs-block .fa {
                font-size: 1.3em;
                color: #facc15;
                margin-right: 8px;
              }
            `}</style>
          </Head>
          <div ref={grapesRef} style={{ width: '100%', height: '100vh', borderRadius: '1.5rem' }} />
        </div>
      </div>
      {/* Modal for block editing (must be inside the return fragment) */}
      <Dialog open={modalOpen} onClose={closeBlockModal} className="fixed z-50 inset-0 flex items-center justify-center">
        <div className="fixed inset-0 bg-black/60" />
        <div className="relative bg-zinc-900 rounded-xl shadow-2xl p-8 w-full max-w-lg mx-auto">
          <Dialog.Title className="text-xl font-bold text-yellow-300 mb-4">Edit Block</Dialog.Title>
          {modalBlock && (
            <div className="flex flex-col gap-4">
              {/* Text Block Controls */}
              {modalBlock.type === 'text' && (
                <>
                  <label className="text-yellow-200 font-semibold">Text</label>
                  <input type="text" value={modalBlock.content} onChange={e => setModalBlock({ ...modalBlock, content: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Font Size</label>
                  <input type="number" value={modalBlock.style.fontSize || 16} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, fontSize: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Font Family</label>
                  <input type="text" value={modalBlock.style.fontFamily || ''} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, fontFamily: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Text Color</label>
                  <input type="color" value={modalBlock.style.color || '#fde047'} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, color: e.target.value } })} className="w-12 h-8 rounded" />
                  <label className="text-yellow-200 font-semibold">Background/Gradient</label>
                  <input type="text" value={modalBlock.style.background || ''} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, background: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" placeholder="linear-gradient(...) or #hex" />
                  <label className="text-yellow-200 font-semibold">Box Shadow</label>
                  <input type="text" value={modalBlock.style.boxShadow || ''} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, boxShadow: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" placeholder="e.g. 0 2px 8px #0003" />
                  <label className="text-yellow-200 font-semibold">Animation</label>
                  <select value={modalBlock.animation || 'none'} onChange={e => setModalBlock({ ...modalBlock, animation: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100">
                    <option value="none">None</option>
                    <option value="fade">Fade In</option>
                    <option value="slide-up">Slide Up</option>
                    <option value="slide-down">Slide Down</option>
                    <option value="zoom-in">Zoom In</option>
                  </select>
                  <label className="text-yellow-200 font-semibold">Hover Effect</label>
                  <select value={modalBlock.hoverEffect || 'none'} onChange={e => setModalBlock({ ...modalBlock, hoverEffect: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100">
                    <option value="none">None</option>
                    <option value="shadow">Shadow</option>
                    <option value="scale">Scale</option>
                    <option value="glow">Glow</option>
                  </select>
                  <label className="text-yellow-200 font-semibold">Custom CSS</label>
                  <input type="text" value={modalBlock.style.custom || ''} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, custom: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" placeholder="Any CSS (advanced)" />
                </>
              )}
              {/* Image Block Controls */}
              {modalBlock.type === 'image' && (
                <>
                  <label className="text-yellow-200 font-semibold">Image URL</label>
                  <input type="text" value={modalBlock.src || modalBlock.content} onChange={e => setModalBlock({ ...modalBlock, src: e.target.value, content: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Alt Text</label>
                  <input type="text" value={modalBlock.alt || ''} onChange={e => setModalBlock({ ...modalBlock, alt: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Width</label>
                  <input type="number" value={modalBlock.style.width || 320} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, width: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Height</label>
                  <input type="number" value={modalBlock.style.height || 160} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, height: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Border Radius</label>
                  <input type="number" value={modalBlock.style.borderRadius || 8} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, borderRadius: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Box Shadow</label>
                  <input type="text" value={modalBlock.style.boxShadow || ''} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, boxShadow: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                </>
              )}
              {/* Button Block Controls */}
              {modalBlock.type === 'button' && (
                <>
                  <label className="text-yellow-200 font-semibold">Button Text</label>
                  <input type="text" value={modalBlock.content} onChange={e => setModalBlock({ ...modalBlock, content: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Link URL</label>
                  <input type="text" value={modalBlock.targetPage || ''} onChange={e => setModalBlock({ ...modalBlock, targetPage: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Font Size</label>
                  <input type="number" value={modalBlock.style.fontSize || 18} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, fontSize: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Text Color</label>
                  <input type="color" value={modalBlock.style.color || '#fff'} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, color: e.target.value } })} className="w-12 h-8 rounded" />
                  <label className="text-yellow-200 font-semibold">Background</label>
                  <input type="text" value={modalBlock.style.background || '#facc15'} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, background: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Border Radius</label>
                  <input type="number" value={modalBlock.style.borderRadius || 6} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, borderRadius: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Box Shadow</label>
                  <input type="text" value={modalBlock.style.boxShadow || ''} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, boxShadow: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                </>
              )}
              {/* Columns Block Controls */}
              {modalBlock.type === 'columns' && (
                <>
                  <label className="text-yellow-200 font-semibold">Number of Columns</label>
                  <input type="number" min={1} max={6} value={modalBlock.columns || 2} onChange={e => setModalBlock({ ...modalBlock, columns: Number(e.target.value) })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Gap (px)</label>
                  <input type="number" value={modalBlock.style.gap || 16} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, gap: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Background</label>
                  <input type="text" value={modalBlock.style.background || '#f3f4f6'} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, background: e.target.value } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Border Radius</label>
                  <input type="number" value={modalBlock.style.borderRadius || 6} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, borderRadius: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                </>
              )}
              {/* Video Block Controls */}
              {modalBlock.type === 'video' && (
                <>
                  <label className="text-yellow-200 font-semibold">Video URL</label>
                  <input type="text" value={modalBlock.src || ''} onChange={e => setModalBlock({ ...modalBlock, src: e.target.value })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Width</label>
                  <input type="number" value={modalBlock.style.width || 640} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, width: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Height</label>
                  <input type="number" value={modalBlock.style.height || 360} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, height: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                  <label className="text-yellow-200 font-semibold">Border Radius</label>
                  <input type="number" value={modalBlock.style.borderRadius || 8} onChange={e => setModalBlock({ ...modalBlock, style: { ...modalBlock.style, borderRadius: Number(e.target.value) } })} className="px-3 py-2 rounded bg-zinc-800 text-yellow-100" />
                </>
              )}
              {/* Save/Cancel Buttons */}
              <button onClick={() => {
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
              }} className="mt-4 px-4 py-2 bg-yellow-400 text-black rounded font-bold">Save</button>
              <button onClick={closeBlockModal} className="mt-2 px-4 py-2 bg-zinc-700 text-yellow-200 rounded font-bold">Cancel</button>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
}