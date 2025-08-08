import React, { useState, useEffect, useRef } from 'react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  editor: any;
  selectedComponent: any;
}

export const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  editor,
  selectedComponent
}) => {
  const [activeTab, setActiveTab] = useState('content');
  const modalRef = useRef<HTMLDivElement>(null);
  const [componentData, setComponentData] = useState({
    tagName: '',
    content: '',
    attributes: {} as Record<string, string>,
    styles: {} as Record<string, string>,
    classes: [] as string[]
  });

  useEffect(() => {
    if (selectedComponent) {
      try {
        // Use robust data extraction similar to Properties Panel
        let tagName = 'div';
        let content = '';
        let attributes = {};
        let styles = {};
        let classes = [];

        // Extract data using GrapesJS API methods
        if (selectedComponent.get) {
          tagName = selectedComponent.get('tagName') || 'div';
          content = selectedComponent.get('content') || '';
          classes = selectedComponent.get('classes') || [];
          
          // Get attributes from GrapesJS component
          const attrs = selectedComponent.get('attributes') || {};
          attributes = { ...attrs };
          
          // Get styles from GrapesJS component
          const componentStyles = selectedComponent.get('style') || {};
          styles = { ...componentStyles };
        } else {
          // Fallback for non-GrapesJS components
          tagName = selectedComponent.tagName || 'div';
          if (selectedComponent.getAttributes) {
            attributes = selectedComponent.getAttributes() || {};
          }
          if (selectedComponent.getStyle) {
            styles = selectedComponent.getStyle() || {};
          }
        }
        
        console.log('EditModal extracted data:', { tagName, content, attributes, styles, classes });
        
        setComponentData({
          tagName,
          content,
          attributes,
          styles,
          classes
        });
      } catch (error) {
        console.error('Error extracting component data in EditModal:', error);
        setComponentData({
          tagName: 'div',
          content: '',
          attributes: {},
          styles: {},
          classes: []
        });
      }
    }
  }, [selectedComponent]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const handleContentChange = (newContent: string) => {
    if (selectedComponent) {
      try {
        if (selectedComponent.set) {
          // GrapesJS component - use set method
          selectedComponent.set('content', newContent);
        } else if (selectedComponent.getEl) {
          // DOM element - set innerHTML
          const el = selectedComponent.getEl();
          if (el) {
            el.innerHTML = newContent;
          }
        }
        
        setComponentData(prev => ({ ...prev, content: newContent }));
        
        // Trigger editor refresh if available
        if (editor && editor.trigger) {
          editor.trigger('component:update', selectedComponent);
        }
      } catch (error) {
        console.error('Error updating content in EditModal:', error);
      }
    }
  };

  const handleAttributeChange = (attrName: string, value: string) => {
    if (selectedComponent) {
      try {
        if (value.trim() === '') {
          // Remove attribute
          if (selectedComponent.get && selectedComponent.set) {
            // GrapesJS way - modify the attributes object
            const currentAttrs = selectedComponent.get('attributes') || {};
            const newAttrs = { ...currentAttrs };
            delete newAttrs[attrName];
            selectedComponent.set('attributes', newAttrs);
          } else if (selectedComponent.removeAttributes) {
            selectedComponent.removeAttributes(attrName);
          } else if (selectedComponent.getEl) {
            const el = selectedComponent.getEl();
            if (el) {
              el.removeAttribute(attrName);
            }
          }
        } else {
          // Set attribute
          if (selectedComponent.get && selectedComponent.set) {
            // GrapesJS way - modify the attributes object
            const currentAttrs = selectedComponent.get('attributes') || {};
            selectedComponent.set('attributes', { ...currentAttrs, [attrName]: value });
          } else if (selectedComponent.addAttributes) {
            selectedComponent.addAttributes({ [attrName]: value });
          } else if (selectedComponent.getEl) {
            const el = selectedComponent.getEl();
            if (el) {
              el.setAttribute(attrName, value);
            }
          }
        }
        
        setComponentData(prev => ({
          ...prev,
          attributes: { ...prev.attributes, [attrName]: value }
        }));
        
        // Trigger editor refresh if available
        if (editor && editor.trigger) {
          editor.trigger('component:update', selectedComponent);
        }
      } catch (error) {
        console.error('Error updating attribute in EditModal:', error);
      }
    }
  };

  const handleStyleChange = (styleProp: string, value: string) => {
    if (selectedComponent) {
      try {
        if (value.trim() === '') {
          // Remove style
          if (selectedComponent.get && selectedComponent.set) {
            // GrapesJS way - modify the style object
            const currentStyles = selectedComponent.get('style') || {};
            const newStyles = { ...currentStyles };
            delete newStyles[styleProp];
            selectedComponent.set('style', newStyles);
          } else if (selectedComponent.removeStyle) {
            selectedComponent.removeStyle(styleProp);
          } else if (selectedComponent.getEl) {
            const el = selectedComponent.getEl();
            if (el && el.style) {
              (el.style as any)[styleProp] = '';
            }
          }
        } else {
          // Set style
          if (selectedComponent.get && selectedComponent.set) {
            // GrapesJS way - modify the style object
            const currentStyles = selectedComponent.get('style') || {};
            selectedComponent.set('style', { ...currentStyles, [styleProp]: value });
          } else if (selectedComponent.setStyle) {
            selectedComponent.setStyle({ [styleProp]: value });
          } else if (selectedComponent.getEl) {
            const el = selectedComponent.getEl();
            if (el && el.style) {
              (el.style as any)[styleProp] = value;
            }
          }
        }
        
        setComponentData(prev => ({
          ...prev,
          styles: { ...prev.styles, [styleProp]: value }
        }));
        
        // Trigger editor refresh if available
        if (editor && editor.trigger) {
          editor.trigger('component:update', selectedComponent);
        }
      } catch (error) {
        console.error('Error updating style in EditModal:', error);
      }
    }
  };

  if (!isOpen || !selectedComponent) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-gray-900 text-white rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl border border-gray-700"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">
            Edit {componentData.tagName.toUpperCase()} Element
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-700 rounded transition-colors"
            title="Close editor"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'content', label: 'Content', icon: '📝' },
            { id: 'styles', label: 'Styles', icon: '🎨' },
            { id: 'attributes', label: 'Properties', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 p-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <span className="flex items-center justify-center space-x-2">
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === 'content' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Element Content</label>
                  <textarea
                    value={componentData.content}
                    onChange={(e) => handleContentChange(e.target.value)}
                    className="w-full h-32 p-4 bg-gray-800 border border-gray-600 rounded text-white resize-none focus:outline-none focus:border-blue-500"
                    placeholder="Enter your content here..."
                  />
                  <p className="text-xs text-gray-400 mt-2">
                    HTML content for this element
                  </p>
                </div>

                {/* Quick Content Templates */}
                <div>
                  <label className="block text-sm font-medium mb-2">Quick Templates</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Heading', content: '<h2>Your Heading Here</h2>' },
                      { label: 'Paragraph', content: '<p>Your paragraph text goes here.</p>' },
                      { label: 'Link', content: '<a href="#">Click here</a>' },
                      { label: 'List', content: '<ul><li>Item 1</li><li>Item 2</li><li>Item 3</li></ul>' }
                    ].map((template) => (
                      <button
                        key={template.label}
                        onClick={() => handleContentChange(template.content)}
                        className="p-2 bg-gray-800 hover:bg-gray-700 rounded text-sm transition-colors"
                      >
                        {template.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'styles' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-blue-300">Element Styles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { prop: 'color', label: 'Text Color', type: 'color' },
                    { prop: 'background-color', label: 'Background Color', type: 'color' },
                    { prop: 'font-size', label: 'Font Size', type: 'text', placeholder: '16px' },
                    { prop: 'font-weight', label: 'Font Weight', type: 'select', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
                    { prop: 'text-align', label: 'Text Align', type: 'select', options: ['left', 'center', 'right', 'justify'] },
                    { prop: 'padding', label: 'Padding', type: 'text', placeholder: '10px' },
                    { prop: 'margin', label: 'Margin', type: 'text', placeholder: '10px' },
                    { prop: 'border', label: 'Border', type: 'text', placeholder: '1px solid #000' },
                    { prop: 'border-radius', label: 'Border Radius', type: 'text', placeholder: '5px' },
                    { prop: 'width', label: 'Width', type: 'text', placeholder: 'auto' },
                    { prop: 'height', label: 'Height', type: 'text', placeholder: 'auto' },
                    { prop: 'display', label: 'Display', type: 'select', options: ['block', 'inline', 'inline-block', 'flex', 'grid', 'none'] }
                  ].map((style) => (
                    <div key={style.prop}>
                      <label className="block text-sm font-medium mb-1">
                        {style.label}
                      </label>
                      {style.type === 'color' ? (
                        <div className="flex space-x-2">
                          <input
                            type="color"
                            value={componentData.styles[style.prop]?.startsWith('#') ? componentData.styles[style.prop] : '#000000'}
                            onChange={(e) => handleStyleChange(style.prop, e.target.value)}
                            className="w-12 h-8 rounded border border-gray-600"
                          />
                          <input
                            type="text"
                            value={componentData.styles[style.prop] || ''}
                            onChange={(e) => handleStyleChange(style.prop, e.target.value)}
                            className="flex-1 px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ) : style.type === 'select' ? (
                        <select
                          value={componentData.styles[style.prop] || ''}
                          onChange={(e) => handleStyleChange(style.prop, e.target.value)}
                          className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                        >
                          <option value="">Default</option>
                          {style.options?.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={componentData.styles[style.prop] || ''}
                          onChange={(e) => handleStyleChange(style.prop, e.target.value)}
                          placeholder={style.placeholder}
                          className="w-full px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attributes' && (
            <div className="p-6 h-full overflow-y-auto">
              <div className="space-y-4">
                {/* Common Attributes */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-blue-300">Common Properties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: 'id', label: 'ID', placeholder: 'unique-id' },
                      { name: 'class', label: 'CSS Classes', placeholder: 'class1 class2' },
                      { name: 'title', label: 'Title', placeholder: 'Tooltip text' },
                      { name: 'alt', label: 'Alt Text', placeholder: 'Alternative text' },
                      { name: 'href', label: 'Link URL', placeholder: 'https://example.com' },
                      { name: 'src', label: 'Source URL', placeholder: 'image.jpg' }
                    ].map((attr) => (
                      <div key={attr.name}>
                        <label className="block text-sm font-medium mb-1">
                          {attr.label}
                        </label>
                        <input
                          type="text"
                          value={componentData.attributes[attr.name] || ''}
                          onChange={(e) => handleAttributeChange(attr.name, e.target.value)}
                          placeholder={attr.placeholder}
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-sm focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Element Actions */}
                <div>
                  <h3 className="text-lg font-medium mb-3 text-blue-300">Element Actions</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (selectedComponent) {
                          selectedComponent.clone();
                        }
                      }}
                      className="w-full p-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Duplicate Element</span>
                    </button>
                    <button
                      onClick={() => {
                        if (selectedComponent && confirm('Are you sure you want to delete this element?')) {
                          selectedComponent.remove();
                          onClose();
                        }
                      }}
                      className="w-full p-3 bg-red-600 hover:bg-red-700 text-white rounded transition-colors flex items-center justify-center space-x-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Element</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
