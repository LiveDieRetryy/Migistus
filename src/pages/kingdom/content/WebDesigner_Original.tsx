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

// Enhanced Craft.js components
const Text = ({ text, fontSize, textAlign, color, fontWeight, fontFamily }) => {
  const { connectors: { connect, drag }, selected, actions: { setProp } } = useNode((state) => ({
    selected: state.events.selected,
    dragged: state.events.dragged,
  }));

  const [editable, setEditable] = useState(false);

  useEffect(() => {
    if (selected) {
      return;
    }
    setEditable(false);
  }, [selected]);

  return (
    <div
      {...connect(drag())}
      onClick={() => selected && setEditable(true)}
      style={{
        fontSize: `${fontSize}px`,
        textAlign,
        color,
        fontWeight,
        fontFamily,
        cursor: 'pointer',
        minHeight: '20px',
        padding: '4px',
      }}
    >
      {editable ? (
        <input
          autoFocus
          defaultValue={text}
          onBlur={(e) => {
            setProp((props) => (props.text = e.target.value));
            setEditable(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setProp((props) => (props.text = e.target.value));
              setEditable(false);
            }
          }}
          style={{
            fontSize: `${fontSize}px`,
            textAlign,
            color,
            fontWeight,
            fontFamily,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            width: '100%',
          }}
        />
      ) : (
        <span>{text}</span>
      )}
    </div>
  );
};

const Button = ({ text, size, variant, onClick, backgroundColor, textColor, borderRadius, padding }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <button
      {...connect(drag())}
      onClick={onClick}
      style={{
        backgroundColor,
        color: textColor,
        borderRadius: `${borderRadius}px`,
        padding: `${padding}px ${padding * 2}px`,
        border: 'none',
        cursor: 'pointer',
        fontSize: size === 'small' ? '14px' : size === 'large' ? '18px' : '16px',
        fontWeight: '600',
        transition: 'all 0.2s ease',
        outline: selected ? '2px solid #facc15' : 'none',
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'scale(1.02)';
        e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'scale(1)';
        e.target.style.boxShadow = 'none';
      }}
    >
      {text}
    </button>
  );
};

const Container = ({ children, backgroundColor, padding, borderRadius, boxShadow, flexDirection }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      {...connect(drag())}
      style={{
        backgroundColor,
        padding: `${padding}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow,
        display: 'flex',
        flexDirection,
        minHeight: '50px',
        minWidth: '50px',
        outline: selected ? '2px solid #facc15' : 'none',
      }}
    >
      {children}
    </div>
  );
};

const Image = ({ src, alt, width, height, objectFit, borderRadius }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <img
      {...connect(drag())}
      src={src}
      alt={alt}
      style={{
        width: width ? `${width}px` : '100%',
        height: height ? `${height}px` : 'auto',
        objectFit,
        borderRadius: `${borderRadius}px`,
        outline: selected ? '2px solid #facc15' : 'none',
      }}
    />
  );
};

const Card = ({ children, backgroundColor, padding, borderRadius, boxShadow }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      {...connect(drag())}
      style={{
        backgroundColor,
        padding: `${padding}px`,
        borderRadius: `${borderRadius}px`,
        boxShadow,
        minHeight: '100px',
        outline: selected ? '2px solid #facc15' : 'none',
      }}
    >
      {children}
    </div>
  );
};

// Enhanced Form Components
const Input = ({ placeholder, type, label, required, validation }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div {...connect(drag())} style={{ outline: selected ? '2px solid #facc15' : 'none' }}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
      />
    </div>
  );
};

const Select = ({ options, label, required }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div {...connect(drag())} style={{ outline: selected ? '2px solid #facc15' : 'none' }}>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select
        required={required}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400"
      >
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

// Advanced Components
const Chart = ({ type, data, width, height }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      {...connect(drag())}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        border: '2px dashed #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f9f9f9',
        outline: selected ? '2px solid #facc15' : 'none',
      }}
    >
      <div className="text-center">
        <div className="text-lg font-semibold text-gray-600">{type.toUpperCase()} CHART</div>
        <div className="text-sm text-gray-500">Chart placeholder</div>
      </div>
    </div>
  );
};

const Slider = ({ images, autoplay, duration }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (autoplay && images.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, duration * 1000);
      return () => clearInterval(interval);
    }
  }, [autoplay, duration, images.length]);

  return (
    <div
      {...connect(drag())}
      style={{
        position: 'relative',
        width: '100%',
        height: '300px',
        overflow: 'hidden',
        borderRadius: '8px',
        outline: selected ? '2px solid #facc15' : 'none',
      }}
    >
      {images.length > 0 ? (
        <img
          src={images[currentIndex]?.src || '/placeholder.jpg'}
          alt={images[currentIndex]?.alt || 'Slide'}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <span className="text-gray-500">No images added</span>
        </div>
      )}
      
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Component Settings Panels
Text.craft = {
  props: {
    text: 'Hello World',
    fontSize: 16,
    textAlign: 'left',
    color: '#333',
    fontWeight: 'normal',
    fontFamily: 'inherit',
  },
  related: {
    settings: () => (
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.text = e.target.value));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
          <input
            type="number"
            min="8"
            max="72"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.fontSize = parseInt(e.target.value)));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            type="color"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.color = e.target.value));
            }}
          />
        </div>
      </div>
    ),
  },
};

Button.craft = {
  props: {
    text: 'Button',
    size: 'medium',
    variant: 'primary',
    backgroundColor: '#facc15',
    textColor: '#000',
    borderRadius: 6,
    padding: 12,
  },
  related: {
    settings: () => (
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.text = e.target.value));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
          <input
            type="color"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.backgroundColor = e.target.value));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
          <input
            type="color"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.textColor = e.target.value));
            }}
          />
        </div>
      </div>
    ),
  },
};

Container.craft = {
  props: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexDirection: 'column',
  },
  related: {
    settings: () => (
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
          <input
            type="color"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.backgroundColor = e.target.value));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
          <input
            type="number"
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.padding = parseInt(e.target.value)));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.flexDirection = e.target.value));
            }}
          >
            <option value="column">Column</option>
            <option value="row">Row</option>
          </select>
        </div>
      </div>
    ),
  },
};

Image.craft = {
  props: {
    src: '/placeholder.jpg',
    alt: 'Image',
    width: 300,
    height: 200,
    objectFit: 'cover',
    borderRadius: 8,
  },
  related: {
    settings: () => (
      <div className="space-y-4 p-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.src = e.target.value));
            }}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            onChange={(e) => {
              const { actions: { setProp } } = useNode();
              setProp((props) => (props.alt = e.target.value));
            }}
          />
        </div>
      </div>
    ),
  },
};

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
  // Enhanced Element Types with more comprehensive functionality
  type ElementType = 'text' | 'box' | 'button' | 'heading' | 'image' | 'link' | 'divider' | 'custom' | 'card' | 'columns' | 'video' | 'form' | 'table' | 'slider' | 'chart' | 'map' | 'social' | 'icon' | 'spacer' | 'html' | 'countdown' | 'testimonial' | 'pricing' | 'gallery' | 'accordion' | 'tabs' | 'progress' | 'timeline' | 'carousel' | 'modal' | 'navbar' | 'footer' | 'breadcrumb' | 'pagination' | 'search' | 'notification' | 'grid' | 'flexbox';
  interface DesignerElement {
    id: string;
    type: ElementType;
    content: string;
    x: number;
    y: number;
    w: number;
    h: number;
    style: React.CSSProperties;
    
    // Enhanced properties for all elements
    src?: string;
    alt?: string;
    href?: string;
    target?: string;
    fit?: 'contain' | 'cover' | 'fill' | 'scale-down' | 'none';
    
    // Layout & positioning
    position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
    zIndex?: number;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
    
    // Animation & effects
    animation?: 'none' | 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'zoom-in' | 'zoom-out' | 'rotate' | 'bounce' | 'pulse' | 'shake' | 'flip';
    animationDuration?: number;
    animationDelay?: number;
    animationEasing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
    
    hoverEffect?: 'none' | 'shadow' | 'scale' | 'glow' | 'blur' | 'brightness' | 'contrast' | 'grayscale' | 'sepia' | 'rotate' | 'translate' | 'skew';
    hoverStyle?: React.CSSProperties;
    
    // Interaction
    onClick?: string; // JavaScript code to execute
    onHover?: string;
    onLoad?: string;
    
    // Responsive design
    responsive?: {
      mobile?: Partial<DesignerElement>;
      tablet?: Partial<DesignerElement>;
      desktop?: Partial<DesignerElement>;
    };
    
    // Form elements
    placeholder?: string;
    required?: boolean;
    validation?: string;
    
    // Advanced features
    conditional?: {
      show?: boolean;
      condition?: string;
    };
    
    // Data binding
    dataSource?: string;
    dataField?: string;
    
    // Accessibility
    ariaLabel?: string;
    ariaDescribedBy?: string;
    role?: string;
    tabIndex?: number;
    
    // Component-specific properties
    columns?: number;
    rows?: number;
    items?: any[];
    settings?: Record<string, any>;
    
    // Hierarchy
    parentId?: string;
    children?: string[];
    
    // Navigation
    targetPage?: string;
    
    // Widget type for custom elements
    widgetType?: string;
    
    // Advanced styling
    gradient?: {
      type: 'linear' | 'radial' | 'conic';
      direction?: string;
      colors: { color: string; stop: number }[];
    };
    
    boxShadow?: {
      x: number;
      y: number;
      blur: number;
      spread: number;
      color: string;
      inset?: boolean;
    }[];
    
    textShadow?: {
      x: number;
      y: number;
      blur: number;
      color: string;
    }[];
    
    // Transforms
    transform?: {
      rotate?: number;
      scale?: number;
      skewX?: number;
      skewY?: number;
      translateX?: number;
      translateY?: number;
    };
    
    // Filters
    filter?: {
      blur?: number;
      brightness?: number;
      contrast?: number;
      grayscale?: number;
      hueRotate?: number;
      invert?: number;
      opacity?: number;
      saturate?: number;
      sepia?: number;
    };
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
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        let html = data.html || '';
        grapesEditor.current.setComponents(html);
        setTimeout(() => {
          convertTextBlocksToRichText(grapesEditor.current);
        }, 200);
      })
      .catch(error => {
        console.error('Failed to fetch page rendered HTML:', error);
        // Set empty content on error
        if (grapesEditor.current) {
          grapesEditor.current.setComponents('');
        }
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
    try {
      const res = await fetch('/api/pages');
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      setBackendTree(data.tree || []);
    } catch (error) {
      console.error('Failed to fetch backend tree:', error);
      setBackendTree([]);
    } finally {
      setPagesLoading(false);
    }
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
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, section: folderPath })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchBackendTree();
    } catch (error) {
      console.error('Failed to add page:', error);
      alert('Failed to add page. Please check the console for details.');
    }
  }
  // Delete page via backend
  async function handleDeletePage(page: { name: string; path: string }) {
    if (!confirm(`Delete page "${page.name}"? This will remove the file.`)) return;
    try {
      const response = await fetch('/api/pages', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: page.path })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchBackendTree();
    } catch (error) {
      console.error('Failed to delete page:', error);
      alert('Failed to delete page. Please check the console for details.');
    }
  }

  // Add new folder via backend
  async function handleAddFolder(parentPath: string) {
    const name = prompt('New folder name?');
    if (!name) return;
    try {
      const response = await fetch('/api/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, section: parentPath, type: 'folder' })
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      fetchBackendTree();
    } catch (error) {
      console.error('Failed to add folder:', error);
      alert('Failed to add folder. Please check the console for details.');
    }
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
      fetch('/api/pages')
        .then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data.tree) {
            console.log('Backend tree:', data.tree);
            const folders = backendTreeToVirtualFolders(data.tree);
            console.log('Converted folders:', folders);
            setVirtualFolders(folders);
          }
        })
        .catch(error => {
          console.error('Failed to fetch pages for virtual folders:', error);
          // Set default empty folders structure
          setVirtualFolders([]);
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

  // Enhanced tool palette with comprehensive functionality
  const enhancedTools = [
    // Basic Elements
    { 
      category: 'Basic', 
      tools: [
        { type: 'text', icon: 'fa-font', label: 'Rich Text', description: 'Editable text with formatting' },
        { type: 'heading', icon: 'fa-heading', label: 'Heading', description: 'H1-H6 headings' },
        { type: 'button', icon: 'fa-mouse-pointer', label: 'Button', description: 'Interactive button' },
        { type: 'image', icon: 'fa-image', label: 'Image', description: 'Responsive image' },
        { type: 'video', icon: 'fa-video', label: 'Video', description: 'Video player' },
        { type: 'link', icon: 'fa-link', label: 'Link', description: 'Hyperlink' },
        { type: 'divider', icon: 'fa-minus', label: 'Divider', description: 'Horizontal line' },
        { type: 'spacer', icon: 'fa-arrows-alt-v', label: 'Spacer', description: 'Vertical spacing' },
      ]
    },
    // Layout Elements
    { 
      category: 'Layout', 
      tools: [
        { type: 'container', icon: 'fa-square', label: 'Container', description: 'Flex container' },
        { type: 'columns', icon: 'fa-columns', label: 'Columns', description: 'Multi-column layout' },
        { type: 'grid', icon: 'fa-th', label: 'Grid', description: 'CSS Grid layout' },
        { type: 'flexbox', icon: 'fa-arrows-alt', label: 'Flexbox', description: 'Flexible box layout' },
        { type: 'card', icon: 'fa-id-card', label: 'Card', description: 'Content card' },
        { type: 'section', icon: 'fa-window-maximize', label: 'Section', description: 'Page section' },
      ]
    },
    // Form Elements
    { 
      category: 'Forms', 
      tools: [
        { type: 'form', icon: 'fa-wpforms', label: 'Form', description: 'Form container' },
        { type: 'input', icon: 'fa-i-cursor', label: 'Input', description: 'Text input field' },
        { type: 'textarea', icon: 'fa-align-left', label: 'Textarea', description: 'Multi-line text' },
        { type: 'select', icon: 'fa-caret-square-down', label: 'Select', description: 'Dropdown menu' },
        { type: 'checkbox', icon: 'fa-check-square', label: 'Checkbox', description: 'Checkbox input' },
        { type: 'radio', icon: 'fa-dot-circle', label: 'Radio', description: 'Radio button' },
        { type: 'file', icon: 'fa-file-upload', label: 'File Upload', description: 'File input' },
        { type: 'submit', icon: 'fa-paper-plane', label: 'Submit', description: 'Submit button' },
      ]
    },
    // Interactive Elements
    { 
      category: 'Interactive', 
      tools: [
        { type: 'slider', icon: 'fa-images', label: 'Image Slider', description: 'Image carousel' },
        { type: 'accordion', icon: 'fa-list', label: 'Accordion', description: 'Collapsible content' },
        { type: 'tabs', icon: 'fa-folder', label: 'Tabs', description: 'Tabbed content' },
        { type: 'modal', icon: 'fa-window-restore', label: 'Modal', description: 'Popup modal' },
        { type: 'tooltip', icon: 'fa-question-circle', label: 'Tooltip', description: 'Hover tooltip' },
        { type: 'dropdown', icon: 'fa-angle-down', label: 'Dropdown', description: 'Dropdown menu' },
        { type: 'progress', icon: 'fa-tasks', label: 'Progress Bar', description: 'Progress indicator' },
        { type: 'rating', icon: 'fa-star', label: 'Rating', description: 'Star rating' },
      ]
    },
    // Data & Charts
    { 
      category: 'Data', 
      tools: [
        { type: 'table', icon: 'fa-table', label: 'Table', description: 'Data table' },
        { type: 'chart', icon: 'fa-chart-bar', label: 'Chart', description: 'Data visualization' },
        { type: 'counter', icon: 'fa-plus-circle', label: 'Counter', description: 'Animated counter' },
        { type: 'timeline', icon: 'fa-clock', label: 'Timeline', description: 'Event timeline' },
        { type: 'pricing', icon: 'fa-dollar-sign', label: 'Pricing Table', description: 'Pricing plans' },
        { type: 'testimonial', icon: 'fa-quote-left', label: 'Testimonial', description: 'Customer review' },
      ]
    },
    // Navigation
    { 
      category: 'Navigation', 
      tools: [
        { type: 'navbar', icon: 'fa-bars', label: 'Navigation Bar', description: 'Site navigation' },
        { type: 'breadcrumb', icon: 'fa-arrow-right', label: 'Breadcrumb', description: 'Navigation trail' },
        { type: 'pagination', icon: 'fa-ellipsis-h', label: 'Pagination', description: 'Page navigation' },
        { type: 'menu', icon: 'fa-list-ul', label: 'Menu', description: 'Navigation menu' },
        { type: 'footer', icon: 'fa-window-minimize', label: 'Footer', description: 'Page footer' },
      ]
    },
    // Media
    { 
      category: 'Media', 
      tools: [
        { type: 'gallery', icon: 'fa-th-large', label: 'Gallery', description: 'Image gallery' },
        { type: 'audio', icon: 'fa-volume-up', label: 'Audio', description: 'Audio player' },
        { type: 'embed', icon: 'fa-code', label: 'Embed', description: 'Embed code' },
        { type: 'map', icon: 'fa-map', label: 'Map', description: 'Google Maps' },
        { type: 'icon', icon: 'fa-smile', label: 'Icon', description: 'Font icon' },
      ]
    },
    // E-commerce
    { 
      category: 'E-commerce', 
      tools: [
        { type: 'product', icon: 'fa-shopping-bag', label: 'Product', description: 'Product showcase' },
        { type: 'cart', icon: 'fa-shopping-cart', label: 'Cart', description: 'Shopping cart' },
        { type: 'checkout', icon: 'fa-credit-card', label: 'Checkout', description: 'Checkout form' },
        { type: 'wishlist', icon: 'fa-heart', label: 'Wishlist', description: 'Wishlist button' },
      ]
    },
    // Advanced
    { 
      category: 'Advanced', 
      tools: [
        { type: 'code', icon: 'fa-code', label: 'Code Block', description: 'Syntax highlighted code' },
        { type: 'custom', icon: 'fa-cogs', label: 'Custom HTML', description: 'Custom HTML/CSS' },
        { type: 'animation', icon: 'fa-magic', label: 'Animation', description: 'CSS animations' },
        { type: 'parallax', icon: 'fa-mountain', label: 'Parallax', description: 'Parallax effect' },
        { type: 'countdown', icon: 'fa-stopwatch', label: 'Countdown', description: 'Countdown timer' },
      ]
    }
  ];

  // Enhanced properties for better element management
  const enhancedElementProperties = {
    // Responsive breakpoints
    responsive: {
      mobile: { maxWidth: 768 },
      tablet: { minWidth: 769, maxWidth: 1024 },
      desktop: { minWidth: 1025 }
    },
    
    // Animation presets
    animations: [
      { name: 'Fade In', class: 'animate-fadeIn', duration: '0.5s' },
      { name: 'Slide Up', class: 'animate-slideUp', duration: '0.6s' },
      { name: 'Slide Down', class: 'animate-slideDown', duration: '0.6s' },
      { name: 'Slide Left', class: 'animate-slideLeft', duration: '0.6s' },
      { name: 'Slide Right', class: 'animate-slideRight', duration: '0.6s' },
      { name: 'Zoom In', class: 'animate-zoomIn', duration: '0.5s' },
      { name: 'Zoom Out', class: 'animate-zoomOut', duration: '0.5s' },
      { name: 'Bounce', class: 'animate-bounce', duration: '1s' },
      { name: 'Pulse', class: 'animate-pulse', duration: '2s' },
      { name: 'Shake', class: 'animate-shake', duration: '0.8s' },
      { name: 'Rotate', class: 'animate-rotate', duration: '1s' },
      { name: 'Flip', class: 'animate-flip', duration: '0.8s' }
    ],
    
    // Hover effects
    hoverEffects: [
      { name: 'None', class: '' },
      { name: 'Shadow', class: 'hover:shadow-xl' },
      { name: 'Scale', class: 'hover:scale-105' },
      { name: 'Glow', class: 'hover:ring-4 hover:ring-yellow-400/40' },
      { name: 'Blur', class: 'hover:blur-sm' },
      { name: 'Brightness', class: 'hover:brightness-110' },
      { name: 'Contrast', class: 'hover:contrast-125' },
      { name: 'Grayscale', class: 'hover:grayscale' },
      { name: 'Sepia', class: 'hover:sepia' },
      { name: 'Rotate', class: 'hover:rotate-3' },
      { name: 'Translate', class: 'hover:translate-y-1' },
      { name: 'Skew', class: 'hover:skew-x-3' }
    ],
    
    // CSS filters
    filters: {
      blur: { min: 0, max: 10, unit: 'px' },
      brightness: { min: 0, max: 200, unit: '%' },
      contrast: { min: 0, max: 200, unit: '%' },
      grayscale: { min: 0, max: 100, unit: '%' },
      hueRotate: { min: 0, max: 360, unit: 'deg' },
      invert: { min: 0, max: 100, unit: '%' },
      opacity: { min: 0, max: 100, unit: '%' },
      saturate: { min: 0, max: 200, unit: '%' },
      sepia: { min: 0, max: 100, unit: '%' }
    },
    
    // Transform properties
    transforms: {
      rotate: { min: -180, max: 180, unit: 'deg' },
      scale: { min: 0.1, max: 3, unit: '' },
      skewX: { min: -45, max: 45, unit: 'deg' },
      skewY: { min: -45, max: 45, unit: 'deg' },
      translateX: { min: -500, max: 500, unit: 'px' },
      translateY: { min: -500, max: 500, unit: 'px' }
    }
  };

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
        {/* Enhanced Modern Sidebar */}
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
        {/* Enhanced Block Panel */}
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
        {/* Enhanced Main Editor Area */}
        <div className="flex-1 flex flex-col bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 relative overflow-hidden">
          {/* Top Toolbar */}
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
          
          {/* Main Canvas */}
          <div className="flex-1 relative">
            <Head>
              <title>Web Designer - Migistus</title>
              <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
              <style>{`
                /* Enhanced GrapesJS Block Styling */
                .gjs-block {
                  display: flex;
                  align-items: center;
                  gap: 12px;
                  background: linear-gradient(135deg, #27272a 0%, #18181b 100%);
                  border-radius: 12px;
                  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                  padding: 16px 20px;
                  margin-bottom: 12px;
                  cursor: grab;
                  transition: all 0.3s ease;
                  border: 2px solid transparent;
                  backdrop-filter: blur(10px);
                }
                
                .gjs-block:hover {
                  background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
                  box-shadow: 0 8px 24px rgba(250, 204, 21, 0.4);
                  border-color: #facc15;
                  transform: translateY(-2px);
                }
                
                .gjs-block.gjs-block-selected {
                  background: linear-gradient(135deg, #facc15 0%, #f59e0b 100%);
                  box-shadow: 0 8px 24px rgba(250, 204, 21, 0.5);
                  border-color: #fbbf24;
                }
                
                .gjs-block-label {
                  font-weight: 600;
                  color: #facc15;
                  font-size: 14px;
                  letter-spacing: 0.025em;
                  display: flex;
                  align-items: center;
                  gap: 8px;
                  transition: color 0.3s ease;
                }
                
                .gjs-block:hover .gjs-block-label {
                  color: #000;
                }
                
                .gjs-block-category {
                  font-size: 11px;
                  color: #facc15;
                  font-weight: 700;
                  margin: 16px 0 8px 0;
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                  padding: 8px 12px;
                  background: linear-gradient(90deg, #facc15/20 0%, transparent 100%);
                  border-left: 3px solid #facc15;
                  border-radius: 0 8px 8px 0;
                }
                
                .gjs-block .fa {
                  font-size: 18px;
                  color: #facc15;
                  margin-right: 0;
                  transition: color 0.3s ease;
                }
                
                .gjs-block:hover .fa {
                  color: #000;
                }
                
                /* Enhanced Canvas Styling */
                .gjs-cv-canvas {
                  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
                  min-height: 100vh;
                }
                
                /* Enhanced Component Selection */
                .gjs-comp-selected {
                  outline: 3px solid #facc15 !important;
                  outline-offset: 2px !important;
                  box-shadow: 0 0 0 6px rgba(250, 204, 21, 0.2) !important;
                }
                
                /* Panel Enhancements */
                .gjs-pn-panel {
                  background: rgba(39, 39, 42, 0.95);
                  backdrop-filter: blur(10px);
                  border: 1px solid rgba(250, 204, 21, 0.3);
                  border-radius: 12px;
                }
                
                .gjs-pn-btn {
                  background: transparent;
                  border: 1px solid rgba(250, 204, 21, 0.3);
                  color: #facc15;
                  border-radius: 8px;
                  margin: 2px;
                  transition: all 0.3s ease;
                }
                
                .gjs-pn-btn:hover,
                .gjs-pn-btn.gjs-pn-active {
                  background: #facc15;
                  color: #000;
                  box-shadow: 0 4px 12px rgba(250, 204, 21, 0.4);
                }
              `}</style>
            </Head>
            
            <div 
              ref={grapesRef} 
              className="w-full h-full"
              style={{ 
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
                borderRadius: '0',
                position: 'relative'
              }} 
            />
            
            {/* Floating Action Buttons */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-3 z-20">
              <button className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-300 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
                <span className="fa fa-plus text-lg" />
              </button>
              <button className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
                <span className="fa fa-layer-group text-lg" />
              </button>
              <button className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-400 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center">
                <span className="fa fa-save text-lg" />
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Enhanced Modal for block editing */}
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
                
                {/* Other component types with enhanced styling... */}
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
              onClick={() => {
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
              }} 
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-300 hover:from-yellow-300 hover:to-yellow-200 text-black rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <span className="fa fa-save mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </Dialog>
    </>
  );
}