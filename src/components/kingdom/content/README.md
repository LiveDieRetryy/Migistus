# WebDesigner Components

This directory contains the modularized components for the WebDesigner page. The large `WebDesigner.tsx` file has been refactored into smaller, manageable components for better maintainability and organization.

## Structure

```
/kingdom/content/components/
├── index.ts                 # Export all components and utilities
├── DesignerSidebar.tsx     # Left sidebar with page selector and tools
├── BlockPanel.tsx          # Components/blocks panel 
├── TopToolbar.tsx          # Top toolbar with undo/redo and zoom controls
├── DesignerCanvas.tsx      # Main canvas area with GrapesJS integration
├── EditModal.tsx           # Modal dialog for editing component properties
├── PropertiesPanel.tsx     # Right-side properties panel for selected elements
└── DesignerUtils.tsx       # Utility functions and configurations
```

## Components

### PropertiesPanel
**NEW FEATURE** - A right-side properties panel that appears when a block or element is selected in the designer.

**Features:**
- **Auto-show/hide**: Automatically appears when an element is selected, hides when deselected
- **Quick Style Editing**: Common properties like width, height, colors, fonts, margins, etc.
- **Attribute Management**: Edit HTML attributes directly
- **Element Actions**: Duplicate or delete elements with one click
- **Keyboard Support**: Press Escape to close the panel
- **Element Info**: Display element type, ID, and class count

**Usage:**
- Select any element in the designer canvas
- The properties panel will slide in from the right
- Make changes to styles and attributes in real-time
- Click the X button or press Escape to close

### DesignerSidebar
- **Purpose**: Main sidebar with page selection, preview toggle, and tool sections
- **Features**: 
  - Page selector dropdown
  - Preview/Edit mode toggle
  - Save button
  - Device preview controls
  - Page settings
  - Advanced tools

### BlockPanel
- **Purpose**: Panel displaying available components/blocks for dragging to canvas
- **Features**:
  - Component categories
  - Drag-and-drop blocks
  - Quick add section

### TopToolbar
- **Purpose**: Top navigation bar with editor controls
- **Features**:
  - Select tool indicator
  - Undo/Redo buttons
  - Zoom controls
  - Preview button

### DesignerCanvas
- **Purpose**: Main editing area where GrapesJS renders
- **Features**:
  - GrapesJS container
  - Custom CSS styling for enhanced UI
  - Floating action buttons
  - Canvas styling and responsive design

### EditModal
- **Purpose**: Modal dialog for editing component properties
- **Features**:
  - Text component editor (content, font, color, etc.)
  - Image component editor (URL, alt text, dimensions)
  - Animation and hover effect settings
  - Save/Cancel functionality

### DesignerUtils
- **Purpose**: Utility functions and configurations
- **Contains**:
  - GrapesJS helper functions
  - Page list generation
  - Element normalization
  - Enhanced tool palette definitions
  - Animation and effect configurations

## Usage

The main `WebDesigner.tsx` file now imports and uses these components:

```tsx
import {
  DesignerSidebar,
  BlockPanel,
  TopToolbar,
  DesignerCanvas,
  EditModal,
  PropertiesPanel,
  // ... utility functions
} from './components';
```

## Benefits of Modularization

1. **Maintainability**: Easier to find and update specific UI sections
2. **Reusability**: Components can be reused in other parts of the application
3. **Testing**: Individual components can be tested in isolation
4. **Performance**: Potential for code splitting and lazy loading
5. **Collaboration**: Multiple developers can work on different components simultaneously
6. **Organization**: Clear separation of concerns and responsibilities

## State Management

State is managed at the `WebDesigner` level and passed down to components via props. This ensures:
- Single source of truth
- Predictable data flow
- Easy debugging
- Consistent state updates

## Future Enhancements

Consider these improvements for further development:
- Add TypeScript interfaces for better type safety
- Implement React Context for complex state sharing
- Add unit tests for each component
- Create Storybook stories for component documentation
- Add error boundaries for better error handling
- Implement lazy loading for performance optimization
