import React, { useState, useEffect } from 'react';

interface PropertiesPanelProps {
  editor: any;
  selectedComponent: any;
  isVisible: boolean;
  onClose: () => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  editor,
  selectedComponent,
  isVisible,
  onClose
}) => {
  const [properties, setProperties] = useState<Record<string, any>>({});
  const [styles, setStyles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (selectedComponent) {
      // Extract component properties
      const attrs = selectedComponent.getAttributes() || {};
      const componentStyles = selectedComponent.getStyle() || {};
      
      setProperties(attrs);
      setStyles(componentStyles);
    } else {
      setProperties({});
      setStyles({});
    }
  }, [selectedComponent]);

  const handlePropertyChange = (property: string, value: string) => {
    if (selectedComponent) {
      selectedComponent.addAttributes({ [property]: value });
      setProperties(prev => ({ ...prev, [property]: value }));
    }
  };

  const handleStyleChange = (property: string, value: string) => {
    if (selectedComponent) {
      selectedComponent.setStyle({ [property]: value });
      setStyles(prev => ({ ...prev, [property]: value }));
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-300 shadow-lg z-50 overflow-y-auto">
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Properties Panel</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {selectedComponent ? (
          <div className="space-y-6">
            {/* Component Info */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Component</h4>
              <p className="text-sm text-gray-600">
                {selectedComponent.get('tagName') || 'Unknown'}
              </p>
            </div>

            {/* Properties Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Properties</h4>
              <div className="space-y-3">
                {Object.entries(properties).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handlePropertyChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ))}
                
                {/* Add new property */}
                <div>
                  <input
                    type="text"
                    placeholder="Add property..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        const target = e.target as HTMLInputElement;
                        const [key, value] = target.value.split('=');
                        if (key && value) {
                          handlePropertyChange(key.trim(), value.trim());
                          target.value = '';
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Format: property=value
                  </p>
                </div>
              </div>
            </div>

            {/* Styles Section */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Styles</h4>
              <div className="space-y-3">
                {Object.entries(styles).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key}
                    </label>
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleStyleChange(key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                ))}
                
                {/* Common style properties */}
                <div>
                  <select
                    onChange={(e) => {
                      const property = e.target.value;
                      if (property) {
                        handleStyleChange(property, '');
                        e.target.value = '';
                      }
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Add style property...</option>
                    <option value="color">Color</option>
                    <option value="background-color">Background Color</option>
                    <option value="font-size">Font Size</option>
                    <option value="font-weight">Font Weight</option>
                    <option value="margin">Margin</option>
                    <option value="padding">Padding</option>
                    <option value="width">Width</option>
                    <option value="height">Height</option>
                    <option value="display">Display</option>
                    <option value="position">Position</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 mt-8">
            <p>Select a component to view its properties</p>
          </div>
        )}
      </div>
    </div>
  );
};
