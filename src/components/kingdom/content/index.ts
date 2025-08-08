// Export all designer components for easy importing
export { DesignerSidebar } from './DesignerSidebar';
export { BlockPanel } from './BlockPanel';
export { TopToolbar } from './TopToolbar';
export { default as DesignerCanvas } from './DesignerCanvas';
export { EditModal } from './EditModal';
export { PropertiesPanel } from './PropertiesPanel';

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
