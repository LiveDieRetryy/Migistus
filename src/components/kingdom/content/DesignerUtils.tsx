// Helper functions and utilities for the WebDesigner component

// Helper: Recursively set editable: true on all text-like and container tags, preserving structure
export function makeAllTextAndContainersEditable(editor: any) {
  if (!editor || !editor.getComponents) {
    console.warn('Editor not ready for makeAllTextAndContainersEditable');
    return;
  }

  try {
    const components = editor.getComponents();
    if (!components) {
      console.warn('No components found in editor');
      return;
    }

    const editableTags = ['h1','h2','h3','h4','h5','h6','p','span','label','div','section','article'];
    
    const walk = (comps: any[]) => {
      if (!comps || !Array.isArray(comps)) return;
      
      comps.forEach((comp: any) => {
        if (!comp || !comp.get) return;
        
        const tag = comp.get('tagName');
        if (editableTags.includes(tag)) {
          comp.set({ editable: true });
        }
        if (comp.components && typeof comp.components === 'function') {
          const childComponents = comp.components();
          if (childComponents && childComponents.length) {
            walk(childComponents);
          }
        }
      });
    };
    
    walk(components);
  } catch (error) {
    console.error('Error in makeAllTextAndContainersEditable:', error);
  }
}

// Register all text-like tags as editable with GrapesJS (run once on init)
export function registerEditableTags(editor: any) {
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

// Convert text blocks to rich text (simplified approach)
export function convertTextBlocksToRichText(editor: any) {
  // Apply the text editing functionality
  enableSimpleTextEditing(editor);
}

// Simple text editing function
export function enableSimpleTextEditing(editor: any) {
  if (!editor || !editor.Canvas) {
    console.warn('Editor not ready for enableSimpleTextEditing');
    return;
  }

  try {
    const canvas = editor.Canvas.getFrameEl()?.contentDocument || document;
    if (!canvas) {
      console.warn('Canvas not available for text editing');
      return;
    }

    const textElements = canvas.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, label, div, a, button');
    
    textElements.forEach((el: HTMLElement) => {
    // Add visual indicators
    el.addEventListener('mouseenter', () => {
      if (!el.getAttribute('data-editing')) {
        el.style.outline = '2px dashed #facc15';
        el.style.outlineOffset = '2px';
      }
    });
    
    el.addEventListener('mouseleave', () => {
      if (!el.getAttribute('data-editing')) {
        el.style.outline = '';
        el.style.outlineOffset = '';
      }
    });
    
    // Add click handler for simple contenteditable editing
    const activateEditor = function(ev: Event) {
      ev.stopPropagation();
      ev.preventDefault();
      
      if (el.getAttribute('data-editing')) {
        console.log('Element already being edited');
        return;
      }
      
      console.log('Activating simple editor on:', el.tagName, el.textContent?.substring(0, 50));
      el.setAttribute('data-editing', 'true');
      el.style.outline = '2px solid #facc15';
      el.style.backgroundColor = 'rgba(250, 204, 21, 0.1)';
      
      // Store original content
      const originalContent = el.innerHTML;
      
      // Make element contenteditable
      el.setAttribute('contenteditable', 'true');
      el.focus();
      
      // Select all text
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      console.log('Editor activated for:', el.tagName);
      
      // Handle keydown events
      const handleKeydown = (e: KeyboardEvent) => {
        console.log('Key pressed:', e.key);
        
        if (e.key === 'Enter') {
          // For headings, prevent line breaks
          if (['H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(el.tagName)) {
            e.preventDefault();
            el.blur();
          }
        } else if (e.key === 'Escape') {
          e.preventDefault();
          el.innerHTML = originalContent;
          el.blur();
        }
      };
      
      // Handle blur event
      const handleBlur = () => {
        exitEditor();
      };
      
      const exitEditor = () => {
        if (!el.getAttribute('data-editing')) return;
        
        console.log('Exiting editor for:', el.tagName);
        el.removeAttribute('data-editing');
        el.removeAttribute('contenteditable');
        el.style.outline = '';
        el.style.backgroundColor = '';
        
        // Remove event listeners
        el.removeEventListener('keydown', handleKeydown);
        el.removeEventListener('blur', handleBlur);
        
        // Clear selection
        window.getSelection()?.removeAllRanges();
        
        console.log('Content after editing:', el.innerHTML);
      };
      
      // Add event listeners
      el.addEventListener('keydown', handleKeydown);
      el.addEventListener('blur', handleBlur);
    };
    
    // Add both click and double-click handlers
    el.addEventListener('click', activateEditor);
    el.addEventListener('dblclick', activateEditor);
  });
  } catch (error) {
    console.error('Error in enableSimpleTextEditing:', error);
  }
}

// Legacy CKEditor function - now simplified
export function enableCKEditorOnExistingElements(editor: any) {
  // Redirect to simple text editing instead of CKEditor
  enableSimpleTextEditing(editor);
}

// Get all available pages for the page selector
export function getAllPages() {
  // List of static and dynamic pages (add more as needed)
  return [
    { name: 'Homepage', path: '/' },
    { name: 'Voting', path: '/voting' },
    { name: 'Wallet', path: '/wallet' },
    { name: 'Users', path: '/users' },
    { name: 'Terms', path: '/terms' },
    { name: 'Suppliers', path: '/suppliers' },
    { name: 'Supplier Dashboard', path: '/supplier-dashboard' },
    { name: 'Staff Picks', path: '/staff-picks' },
    { name: 'Settings', path: '/settings' },
    { name: 'Reports', path: '/reports' },
    { name: 'Refunds', path: '/refunds' },
    { name: 'Products', path: '/products' },
    { name: 'Privacy', path: '/privacy' },
    { name: 'Pledges', path: '/pledges' },
    { name: 'Live Tracking', path: '/live-tracking' },
    { name: 'Live Drops', path: '/live-drops' },
    { name: 'Kingdom', path: '/kingdom' },
    { name: 'Initiate', path: '/initiate' },
    { name: 'How It Works', path: '/how-it-works' },
    { name: 'FAQ', path: '/faq' },
    { name: 'Contact', path: '/contact' },
    { name: 'Community Drops', path: '/community-drops' },
    { name: 'Coming Soon', path: '/coming-soon' },
    { name: 'Chat', path: '/chat' },
    { name: 'Categories', path: '/categories' },
    { name: 'Admin Settings', path: '/admin-settings' },
    { name: 'About', path: '/about' },
  ];
}

// Element normalization utilities
export function normalizeElements(elements: any[]): any[] {
  return elements.map(element => ({
    ...element,
    id: element.id || `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    style: element.style || {},
    children: element.children ? normalizeElements(element.children) : []
  }));
}

// Enhanced element properties for the designer
export const enhancedElementProperties = {
  text: {
    toolbar: ['bold', 'italic', 'underline', 'strikethrough', 'color', 'fontSize', 'fontFamily'],
    placeholder: 'Enter your text here...',
    editable: true
  },
  button: {
    defaultText: 'Click me',
    styles: ['primary', 'secondary', 'success', 'warning', 'danger'],
    editable: true
  },
  image: {
    placeholder: '/placeholder-image.png',
    altText: 'Image description',
    lazyLoad: true
  },
  container: {
    layouts: ['row', 'column', 'grid'],
    spacing: ['none', 'small', 'medium', 'large'],
    background: ['none', 'color', 'gradient', 'image']
  }
};

// Enhanced tools configuration
export const enhancedTools = {
  undo: { enabled: true, icon: 'fa-undo', tooltip: 'Undo' },
  redo: { enabled: true, icon: 'fa-redo', tooltip: 'Redo' },
  preview: { enabled: true, icon: 'fa-eye', tooltip: 'Preview' },
  fullscreen: { enabled: true, icon: 'fa-expand', tooltip: 'Fullscreen' },
  export: { enabled: true, icon: 'fa-download', tooltip: 'Export' },
  import: { enabled: true, icon: 'fa-upload', tooltip: 'Import' },
  clear: { enabled: true, icon: 'fa-trash', tooltip: 'Clear Canvas' },
  save: { enabled: true, icon: 'fa-save', tooltip: 'Save' }
};