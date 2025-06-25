import React, { useState, useEffect, useRef } from 'react';
import { useNode, useEditor, UserComponent } from '@craftjs/core';

// TypeScript interfaces for component props
interface TextProps {
  text: string;
  fontSize: number;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontFamily: string;
}

interface ButtonProps {
  text: string;
  size: 'small' | 'medium' | 'large';
  variant: 'primary' | 'secondary' | 'outline';
  onClick?: () => void;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  padding: number;
}

interface ContainerProps {
  children?: React.ReactNode;
  backgroundColor: string;
  padding: number;
  borderRadius: number;
  boxShadow: string;
  flexDirection: 'row' | 'column';
}

interface ImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  objectFit: 'cover' | 'contain' | 'fill' | 'scale-down' | 'none';
  borderRadius: number;
}

interface CardProps {
  children?: React.ReactNode;
  backgroundColor: string;
  padding: number;
  borderRadius: number;
  boxShadow: string;
}

interface InputProps {
  placeholder: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  label?: string;
  required: boolean;
  validation?: string;
}

interface SelectProps {
  options: { value: string; label: string }[];
  label?: string;
  required: boolean;
}

interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: any[];
  width: number;
  height: number;
}

interface SliderProps {
  images: { src: string; alt: string }[];
  autoplay: boolean;
  duration: number;
}

// Enhanced Craft.js Text Component
export const Text: UserComponent<TextProps> = ({ text, fontSize, textAlign, color, fontWeight, fontFamily }) => {
  const { connectors: { connect, drag }, selected, actions: { setProp } } = useNode((state) => ({
    selected: state.events.selected,
  }));

  const [editable, setEditable] = useState(false);

  useEffect(() => {
    if (!selected) {
      setEditable(false);
    }
  }, [selected]);

  return (
    <div
      ref={(ref) => {
        if (ref) {
          connect(drag(ref));
        }
      }}
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
        outline: selected ? '2px solid #facc15' : 'none',
      }}
    >
      {editable ? (
        <input
          autoFocus
          defaultValue={text}
          onBlur={(e) => {
            setProp((props: TextProps) => (props.text = e.target.value));
            setEditable(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              setProp((props: TextProps) => (props.text = (e.target as HTMLInputElement).value));
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

// Enhanced Craft.js Button Component
export const Button: UserComponent<ButtonProps> = ({ text, size, backgroundColor, textColor, borderRadius, padding, onClick }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <button
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
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
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'scale(1.02)';
        target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      }}
      onMouseLeave={(e) => {
        const target = e.target as HTMLButtonElement;
        target.style.transform = 'scale(1)';
        target.style.boxShadow = 'none';
      }}
    >
      {text}
    </button>
  );
};

// Enhanced Craft.js Container Component
export const Container: UserComponent<ContainerProps> = ({ children, backgroundColor, padding, borderRadius, boxShadow, flexDirection }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
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

// Enhanced Craft.js Image Component
export const Image: UserComponent<ImageProps> = ({ src, alt, width, height, objectFit, borderRadius }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <img
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
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

// Enhanced Craft.js Card Component
export const Card: UserComponent<CardProps> = ({ children, backgroundColor, padding, borderRadius, boxShadow }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
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
export const Input: UserComponent<InputProps> = ({ placeholder, type, label, required }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div ref={(ref) => {
      if (ref) connect(drag(ref));
    }} style={{ outline: selected ? '2px solid #facc15' : 'none' }}>
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

export const Select: UserComponent<SelectProps> = ({ options, label, required }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div ref={(ref) => {
      if (ref) connect(drag(ref));
    }} style={{ outline: selected ? '2px solid #facc15' : 'none' }}>
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
export const Chart: UserComponent<ChartProps> = ({ type, width, height }) => {
  const { connectors: { connect, drag }, selected } = useNode((state) => ({
    selected: state.events.selected,
  }));

  return (
    <div
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
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

export const Slider: UserComponent<SliderProps> = ({ images, autoplay, duration }) => {
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
      ref={(ref) => {
        if (ref) connect(drag(ref));
      }}
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

// Component Settings - these need to be added separately to each component
Text.craft = {
  props: {
    text: 'Hello World',
    fontSize: 16,
    textAlign: 'left' as const,
    color: '#333',
    fontWeight: 'normal' as const,
    fontFamily: 'inherit',
  },
  related: {
    settings: () => {
      const { actions: { setProp }, props } = useNode((node) => ({
        props: node.data.props
      }));
      
      return (
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
            <input
              type="text"
              value={props.text}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: TextProps) => (props.text = e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
            <input
              type="number"
              min="8"
              max="72"
              value={props.fontSize}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: TextProps) => (props.fontSize = parseInt(e.target.value)))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
            <input
              type="color"
              value={props.color}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: TextProps) => (props.color = e.target.value))}
            />
          </div>
        </div>
      );
    },
  },
};

Button.craft = {
  props: {
    text: 'Button',
    size: 'medium' as const,
    variant: 'primary' as const,
    backgroundColor: '#facc15',
    textColor: '#000',
    borderRadius: 6,
    padding: 12,
  },
  related: {
    settings: () => {
      const { actions: { setProp }, props } = useNode((node) => ({
        props: node.data.props
      }));
      
      return (
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Button Text</label>
            <input
              type="text"
              value={props.text}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ButtonProps) => (props.text = e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <input
              type="color"
              value={props.backgroundColor}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ButtonProps) => (props.backgroundColor = e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
            <input
              type="color"
              value={props.textColor}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ButtonProps) => (props.textColor = e.target.value))}
            />
          </div>
        </div>
      );
    },
  },
};

Container.craft = {
  props: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    flexDirection: 'column' as const,
  },
  related: {
    settings: () => {
      const { actions: { setProp }, props } = useNode((node) => ({
        props: node.data.props
      }));
      
      return (
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
            <input
              type="color"
              value={props.backgroundColor}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ContainerProps) => (props.backgroundColor = e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
            <input
              type="number"
              min="0"
              max="100"
              value={props.padding}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ContainerProps) => (props.padding = parseInt(e.target.value)))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direction</label>
            <select
              value={props.flexDirection}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ContainerProps) => (props.flexDirection = e.target.value as 'row' | 'column'))}
            >
              <option value="column">Column</option>
              <option value="row">Row</option>
            </select>
          </div>
        </div>
      );
    },
  },
};

Image.craft = {
  props: {
    src: '/placeholder.jpg',
    alt: 'Image',
    width: 300,
    height: 200,
    objectFit: 'cover' as const,
    borderRadius: 8,
  },
  related: {
    settings: () => {
      const { actions: { setProp }, props } = useNode((node) => ({
        props: node.data.props
      }));
      
      return (
        <div className="space-y-4 p-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
            <input
              type="text"
              value={props.src}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ImageProps) => (props.src = e.target.value))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
            <input
              type="text"
              value={props.alt}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={(e) => setProp((props: ImageProps) => (props.alt = e.target.value))}
            />
          </div>
        </div>
      );
    },
  },
};
