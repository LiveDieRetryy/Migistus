// Export all designer components for easy importing
export { default as DesignerSidebar } from './DesignerSidebar';
export { default as BlockPanel } from './BlockPanel';
export { default as TopToolbar } from './TopToolbar';
export { default as DesignerCanvas } from './DesignerCanvas';
export { default as EditModal } from './EditModal';

// Export utility functions and constants
export { 
  makeAllTextAndContainersEditable,
  registerEditableTags,
  convertTextBlocksToRichText,
  enableCKEditorOnExistingElements,
  getAllPages,
  normalizeElements,
  enhancedElementProperties,
  enhancedTools
} from './DesignerUtils';
