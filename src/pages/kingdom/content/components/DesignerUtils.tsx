// Helper functions and utilities for the WebDesigner component

// Helper: Recursively set editable: true on all text-like and container tags, preserving structure
export function makeAllTextAndContainersEditable(editor: any) {
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

// Helper: Recursively convert text-like blocks to 'rich-text' component type
export function convertTextBlocksToRichText(editor: any) {
  console.log('Converting text blocks to rich-text...');
  
  // Skip component conversion for now, just enable CKEditor directly on DOM elements
  // This preserves the original content while making it editable
  enableCKEditorOnExistingElements(editor);
}

// Helper: Enable CKEditor on existing DOM text elements
export function enableCKEditorOnExistingElements(editor: any) {
  setTimeout(async () => {
    try {
      const { default: InlineEditor } = await import('@ckeditor/ckeditor5-build-inline');
      
      // Try multiple methods to get the canvas content
      let canvas: HTMLElement | null = null;
      
      // Method 1: Try getting the canvas document body
      try {
        const canvasDoc = editor.Canvas.getDocument();
        if (canvasDoc && canvasDoc.body) {
          canvas = canvasDoc.body;
          console.log('Found canvas using Canvas.getDocument().body');
        }
      } catch (e) {
        console.log('Method 1 failed:', e);
      }
      
      // Method 2: Try getting the frame element
      if (!canvas) {
        try {
          const frameEl = editor.Canvas.getFrameEl();
          if (frameEl && frameEl.contentDocument && frameEl.contentDocument.body) {
            canvas = frameEl.contentDocument.body;
            console.log('Found canvas using Canvas.getFrameEl().contentDocument.body');
          }
        } catch (e) {
          console.log('Method 2 failed:', e);
        }
      }
      
      // Method 3: Try getting the wrapper element
      if (!canvas) {
        try {
          const wrapper = editor.Canvas.getWrapper();
          if (wrapper && wrapper.getEl) {
            canvas = wrapper.getEl();
            console.log('Found canvas using Canvas.getWrapper().getEl()');
          }
        } catch (e) {
          console.log('Method 3 failed:', e);
        }
      }
      
      // Method 4: Direct DOM query as fallback
      if (!canvas) {
        const iframes = document.querySelectorAll('iframe');
        for (let i = 0; i < iframes.length; i++) {
          const iframe = iframes[i];
          try {
            if (iframe.contentDocument && iframe.contentDocument.body) {
              canvas = iframe.contentDocument.body;
              console.log('Found canvas using direct iframe query');
              break;
            }
          } catch (e) {
            // Cross-origin or other access issue, skip
          }
        }
      }
      
      if (!canvas) {
        console.warn('Could not find canvas, retrying...');
        setTimeout(() => enableCKEditorOnExistingElements(editor), 2000);
        return;
      }
      
      console.log('Canvas found:', canvas);
      enableCKEditorOnElements(canvas, InlineEditor);
      
    } catch (error) {
      console.error('Error enabling CKEditor on existing elements:', error);
    }
  }, 1000); // Increased delay to ensure content is fully loaded
}

// Helper function to enable CKEditor on elements within a container
function enableCKEditorOnElements(container: HTMLElement, InlineEditor: any) {
  // More specific selectors to avoid selecting elements that shouldn't be editable
  const textSelectors = 'h1:not([contenteditable="false"]), h2:not([contenteditable="false"]), h3:not([contenteditable="false"]), h4:not([contenteditable="false"]), h5:not([contenteditable="false"]), h6:not([contenteditable="false"]), p:not([contenteditable="false"])';
  const textElements = container.querySelectorAll(textSelectors);
  
  console.log(`Found ${textElements.length} text elements to enable CKEditor on`);
  console.log('Container:', container);
  console.log('Text elements:', textElements);
  
  textElements.forEach((element: Element) => {
    const el = element as HTMLElement;
    console.log('Processing element:', el.tagName, el.textContent?.substring(0, 50));
    
    // Skip if already has CKEditor, is empty, or has complex children
    if (el.getAttribute('data-ckeditor')) {
      console.log('Skipping - already has CKEditor');
      return;
    }
    
    if (!el.textContent?.trim()) {
      console.log('Skipping - no text content');
      return;
    }
    
    // Skip if has non-text children (images, buttons, etc.)
    const hasComplexChildren = Array.from(el.children).some(child => 
      !['SPAN', 'EM', 'STRONG', 'B', 'I', 'U'].includes(child.tagName)
    );
    if (hasComplexChildren) {
      console.log('Skipping - has complex children');
      return;
    }
    
    console.log('Adding CKEditor to:', el.tagName, el.textContent?.substring(0, 30));
    
    // Prepare element for editing (but don't make it contenteditable yet)
    el.style.cursor = 'text';
    el.setAttribute('title', 'Click to edit text');
    
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
      
      // Select all text for easy editing
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(el);
      selection?.removeAllRanges();
      selection?.addRange(range);
      
      // Handle key events
      const handleKeydown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          // Restore original content and exit
          el.innerHTML = originalContent;
          exitEditor();
        } else if (e.key === 'Enter' && !e.shiftKey) {
          // Save and exit on Enter (unless Shift+Enter for line break)
          e.preventDefault();
          exitEditor();
        }
      };
      
      // Handle blur (clicking away)
      const handleBlur = () => {
        setTimeout(exitEditor, 100); // Small delay to allow for other actions
      };
      
      // Exit editor function
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
    { name: 'Admin Settings', path: '/admin-settings' },
    { name: 'Admin Users', path: '/admin-users' },
    { name: 'Admin Users (New)', path: '/admin-users-new' },
    { name: 'Admin Wallet', path: '/admin-wallet' },
    { name: 'Admin Wallet (New)', path: '/admin-wallet-new' },
    { name: 'Chat', path: '/chat' },
    { name: 'Chat (New)', path: '/chat-new' },
    { name: 'My Chatbot', path: '/my-chatbot' },
    { name: 'My Chatbot (New)', path: '/my-chatbot-new' },
    { name: 'Chatbot Settings', path: '/chatbot-settings' },
    { name: 'Live Tracking', path: '/live-tracking' },
    { name: 'Live Tracking (New)', path: '/live-tracking-new' },
    { name: 'Locations', path: '/locations' },
    { name: 'Locations (New)', path: '/locations-new' },
    { name: 'Moderation', path: '/moderation' },
    { name: 'Moderation (New)', path: '/moderation-new' },
    { name: 'Moderation Settings', path: '/moderation-settings' },
    { name: 'AI Moderation', path: '/ai-moderation' },
    { name: 'AI Analysis', path: '/ai-analysis' },
    { name: 'AI Analysis (New)', path: '/ai-analysis-new' },
    { name: 'AI Backups', path: '/ai-backups' },
    { name: 'AI Config', path: '/ai-config' },
    { name: 'AI Config (New)', path: '/ai-config-new' },
    { name: 'AI Dashboard', path: '/ai-dashboard' },
    { name: 'AI Dashboard (New)', path: '/ai-dashboard-new' },
    { name: 'AI Management', path: '/ai-management' },
    { name: 'AI Management (New)', path: '/ai-management-new' },
    { name: 'AI Monitoring', path: '/ai-monitoring' },
    { name: 'AI Monitoring (New)', path: '/ai-monitoring-new' },
    { name: 'AI Settings', path: '/ai-settings' },
    { name: 'AI Settings (New)', path: '/ai-settings-new' },
    { name: 'AI Users', path: '/ai-users' },
    { name: 'AI Users (New)', path: '/ai-users-new' },
    { name: 'AI Wallet', path: '/ai-wallet' },
    { name: 'AI Wallet (New)', path: '/ai-wallet-new' },
    { name: 'Automated Moderation', path: '/automated-moderation' },
    { name: 'Automated Moderation (New)', path: '/automated-moderation-new' },
    { name: 'Automated Verification', path: '/automated-verification' },
    { name: 'Automated Verification (New)', path: '/automated-verification-new' },
    { name: 'Automated Workflow', path: '/automated-workflow' },
    { name: 'Automated Workflow (New)', path: '/automated-workflow-new' },
    { name: 'Automated Workflow Settings', path: '/automated-workflow-settings' },
    { name: 'Marketing', path: '/marketing' },
    { name: 'Marketing (New)', path: '/marketing-new' },
    { name: 'Marketing Settings', path: '/marketing-settings' },
    { name: 'Marketing Preferences', path: '/marketing-preferences' },
    { name: 'Marketing Preferences (New)', path: '/marketing-preferences-new' },
    { name: 'Pledges', path: '/pledges' },
    { name: 'Pledges (New)', path: '/pledges-new' },
    { name: 'Refunds', path: '/refunds' },
    { name: 'Refunds (New)', path: '/refunds-new' },
    { name: 'Reports', path: '/reports' },
    { name: 'Reports (New)', path: '/reports-new' },
    { name: 'Settings', path: '/settings' },
    { name: 'Settings (New)', path: '/settings-new' },
    { name: 'Tier Rewards', path: '/tier-rewards' },
    { name: 'Tier Rewards (New)', path: '/tier-rewards-new' },
    { name: 'User Activity', path: '/user-activity' },
    { name: 'User Activity (New)', path: '/user-activity-new' },
    { name: 'User Activity Settings', path: '/user-activity-settings' },
    { name: 'User Profiles', path: '/user-profiles' },
    { name: 'User Profiles (New)', path: '/user-profiles-new' },
    { name: 'User Sessions', path: '/user-sessions' },
    { name: 'User Sessions (New)', path: '/user-sessions-new' },
    { name: 'User Tracking', path: '/user-tracking' },
    { name: 'User Tracking (New)', path: '/user-tracking-new' },
    { name: 'User Tracking Settings', path: '/user-tracking-settings' },
    { name: 'Votes', path: '/votes' },
    { name: 'Votes (New)', path: '/votes-new' },
    { name: 'Voting Settings', path: '/voting-settings' },
    { name: 'Voting (New)', path: '/voting-new' },
    { name: 'Wallets', path: '/wallets' },
    { name: 'Wallets (New)', path: '/wallets-new' },
    { name: 'Wallets Settings', path: '/wallets-settings' },
    { name: 'Kingdom', path: '/kingdom' },
    { name: 'Kingdom Dashboard', path: '/kingdom/dashboard' },
    { name: 'Kingdom Content', path: '/kingdom/content' },
    { name: 'Kingdom Content (New)', path: '/kingdom/content-new' },
    { name: 'Kingdom Users', path: '/kingdom/users' },
    { name: 'Kingdom Users (New)', path: '/kingdom/users-new' },
    { name: 'Kingdom Settings', path: '/kingdom/settings' },
    { name: 'Kingdom Settings (New)', path: '/kingdom/settings-new' },
    { name: 'Kingdom Analytics', path: '/kingdom/analytics' },
    { name: 'Kingdom Analytics (New)', path: '/kingdom/analytics-new' },
    { name: 'Kingdom Analytics Settings', path: '/kingdom/analytics-settings' },
    { name: 'Kingdom Billing', path: '/kingdom/billing' },
    { name: 'Kingdom Billing (New)', path: '/kingdom/billing-new' },
    { name: 'Kingdom Billing Settings', path: '/kingdom/billing-settings' },
    { name: 'Kingdom Chatbot', path: '/kingdom/chatbot' },
    { name: 'Kingdom Chatbot (New)', path: '/kingdom/chatbot-new' },
    { name: 'Kingdom Chatbot Settings', path: '/kingdom/chatbot-settings' },
    { name: 'Kingdom Moderation', path: '/kingdom/moderation' },
    { name: 'Kingdom Moderation (New)', path: '/kingdom/moderation-new' },
    { name: 'Kingdom Moderation Settings', path: '/kingdom/moderation-settings' },
    { name: 'Kingdom Workflow', path: '/kingdom/workflow' },
    { name: 'Kingdom Workflow (New)', path: '/kingdom/workflow-new' },
    { name: 'Kingdom Workflow Settings', path: '/kingdom/workflow-settings' },
  ];
}

// Normalize elements from different sources
export function normalizeElements(raw: any[]): any[] {
  return raw.map((el: any) => ({
    id: el.id || `el-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type: el.type || 'text',
    content: el.content || el.text || 'Content',
    x: el.x || 0,
    y: el.y || 0,
    w: el.w || el.width || 4,
    h: el.h || el.height || 2,
    style: el.style || {},
    parentId: el.parentId || undefined,
    children: el.children || [],
    src: el.src || undefined,
    alt: el.alt || undefined,
    href: el.href || undefined,
    target: el.target || '_self',
    targetPage: el.targetPage || undefined,
    animation: el.animation || 'none',
    hoverEffect: el.hoverEffect || 'none',
    widgetType: el.widgetType || undefined,
    fit: el.fit || 'contain',
    columns: el.columns || 2,
    ...el,
  }));
}

// Enhanced properties for better element management
export const enhancedElementProperties = {
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

// Enhanced tool palette with comprehensive functionality
export const enhancedTools = [
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
