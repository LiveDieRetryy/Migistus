import React, { useState, useRef, useEffect } from 'react';

interface WYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const WYSIWYGEditor: React.FC<WYSIWYGEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter content...",
  className = ""
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Toolbar buttons and their commands
  const toolbarButtons = [
    { command: 'bold', icon: 'B', title: 'Bold' },
    { command: 'italic', icon: 'I', title: 'Italic' },
    { command: 'underline', icon: 'U', title: 'Underline' },
    { command: 'strikeThrough', icon: 'S', title: 'Strikethrough' },
    { command: 'separator' },
    { command: 'formatBlock', value: 'h1', icon: 'H1', title: 'Heading 1' },
    { command: 'formatBlock', value: 'h2', icon: 'H2', title: 'Heading 2' },
    { command: 'formatBlock', value: 'h3', icon: 'H3', title: 'Heading 3' },
    { command: 'formatBlock', value: 'p', icon: 'P', title: 'Paragraph' },
    { command: 'separator' },
    { command: 'insertUnorderedList', icon: '• List', title: 'Bullet List' },
    { command: 'insertOrderedList', icon: '1. List', title: 'Numbered List' },
    { command: 'separator' },
    { command: 'justifyLeft', icon: '⟵', title: 'Align Left' },
    { command: 'justifyCenter', icon: '↔', title: 'Center' },
    { command: 'justifyRight', icon: '⟶', title: 'Align Right' },
    { command: 'separator' },
    { command: 'createLink', icon: '🔗', title: 'Insert Link' },
    { command: 'unlink', icon: '🚫🔗', title: 'Remove Link' },
    { command: 'separator' },
    { command: 'removeFormat', icon: '🧹', title: 'Clear Formatting' },
  ];

  const executeCommand = (command: string, value?: string) => {
    if (command === 'createLink') {
      const url = prompt('Enter URL:');
      if (url) {
        document.execCommand(command, false, url);
      }
    } else if (command === 'formatBlock') {
      document.execCommand(command, false, value);
    } else {
      document.execCommand(command, false);
    }
    
    // Update the content after command execution
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className={`border border-gray-600 rounded-lg overflow-hidden bg-gray-700 ${className}`}>
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-800 border-b border-gray-600">
        {toolbarButtons.map((button, index) => {
          if (button.command === 'separator') {
            return <div key={index} className="w-px h-6 bg-gray-600 mx-1" />;
          }
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => executeCommand(button.command, button.value)}
              title={button.title}
              className="px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              {button.icon}
            </button>
          );
        })}
        
        {/* Preview Toggle */}
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPreview(!isPreview)}
            className="px-3 py-1 text-xs font-medium text-gray-300 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors"
          >
            {isPreview ? 'Edit' : 'Preview'}
          </button>
        </div>
      </div>

      {/* Editor/Preview Area */}
      {isPreview ? (
        <div 
          className="p-4 min-h-[200px] text-white prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          className="p-4 min-h-[200px] text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
          style={{ whiteSpace: 'pre-wrap' }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      )}

      {/* Character count and help */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-t border-gray-600 text-xs text-gray-400">
        <span>Characters: {value.replace(/<[^>]*>/g, '').length}</span>
        <span>Tip: Select text to format, use Ctrl+A to select all</span>
      </div>

      {/* Custom CSS for placeholder and styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        
        /* Style the content inside the editor */
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; }
        [contenteditable] p { margin: 0.5em 0; }
        [contenteditable] ul, [contenteditable] ol { margin: 0.5em 0; padding-left: 2em; }
        [contenteditable] li { margin: 0.25em 0; }
        [contenteditable] strong { font-weight: bold; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] u { text-decoration: underline; }
        [contenteditable] s { text-decoration: line-through; }
        [contenteditable] a { color: #fbbf24; text-decoration: underline; }
        [contenteditable] a:hover { color: #f59e0b; }
      `}</style>
    </div>
  );
};

export default WYSIWYGEditor;
