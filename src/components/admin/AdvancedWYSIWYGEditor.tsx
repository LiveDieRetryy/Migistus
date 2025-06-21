import React, { useState, useRef, useEffect } from 'react';

interface AdvancedWYSIWYGEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  enableImageUpload?: boolean;
  onImageUpload?: (file: File) => Promise<string>; // Returns image URL
}

const AdvancedWYSIWYGEditor: React.FC<AdvancedWYSIWYGEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = "Enter content...",
  className = "",
  enableImageUpload = false,
  onImageUpload
}) => {
  const [isPreview, setIsPreview] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Enhanced toolbar buttons
  const toolbarButtons = [
    { command: 'bold', icon: '𝐁', title: 'Bold' },
    { command: 'italic', icon: '𝐼', title: 'Italic' },
    { command: 'underline', icon: '𝐔', title: 'Underline' },
    { command: 'strikeThrough', icon: '𝐒', title: 'Strikethrough' },
    { command: 'separator' },
    { command: 'formatBlock', value: 'h1', icon: 'H1', title: 'Heading 1' },
    { command: 'formatBlock', value: 'h2', icon: 'H2', title: 'Heading 2' },
    { command: 'formatBlock', value: 'h3', icon: 'H3', title: 'Heading 3' },
    { command: 'formatBlock', value: 'p', icon: 'P', title: 'Paragraph' },
    { command: 'separator' },
    { command: 'insertUnorderedList', icon: '•', title: 'Bullet List' },
    { command: 'insertOrderedList', icon: '1.', title: 'Numbered List' },
    { command: 'outdent', icon: '⬅', title: 'Decrease Indent' },
    { command: 'indent', icon: '➡', title: 'Increase Indent' },
    { command: 'separator' },
    { command: 'justifyLeft', icon: '⬅', title: 'Align Left' },
    { command: 'justifyCenter', icon: '⬌', title: 'Center' },
    { command: 'justifyRight', icon: '➡', title: 'Align Right' },
    { command: 'justifyFull', icon: '⬌', title: 'Justify' },
    { command: 'separator' },
    { command: 'createLink', icon: '🔗', title: 'Insert Link' },
    { command: 'unlink', icon: '🚫', title: 'Remove Link' },
    ...(enableImageUpload ? [
      { command: 'insertImage', icon: '🖼', title: 'Insert Image' },
    ] : []),
    { command: 'separator' },
    { command: 'foreColor', icon: '🎨', title: 'Text Color' },
    { command: 'hiliteColor', icon: '🖍', title: 'Highlight' },
    { command: 'separator' },
    { command: 'insertHorizontalRule', icon: '—', title: 'Horizontal Line' },
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
    } else if (command === 'foreColor') {
      const color = prompt('Enter color (hex, rgb, or name):');
      if (color) {
        document.execCommand(command, false, color);
      }
    } else if (command === 'hiliteColor') {
      const color = prompt('Enter highlight color (hex, rgb, or name):');
      if (color) {
        document.execCommand(command, false, color);
      }
    } else if (command === 'insertImage') {
      if (enableImageUpload && fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        setShowImageDialog(true);
      }
      return; // Don't update content yet
    } else {
      document.execCommand(command, false);
    }
    
    // Update the content after command execution
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let imageUrl = '';
      
      if (onImageUpload) {
        imageUrl = await onImageUpload(file);
      } else {
        // Create a local URL for the image
        imageUrl = URL.createObjectURL(file);
      }

      // Insert the image
      const img = `<img src="${imageUrl}" alt="${file.name}" style="max-width: 100%; height: auto;" />`;
      document.execCommand('insertHTML', false, img);
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const insertImageFromUrl = () => {
    if (imageUrl.trim()) {
      const img = `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto;" />`;
      document.execCommand('insertHTML', false, img);
      
      if (editorRef.current) {
        onChange(editorRef.current.innerHTML);
      }
      
      setShowImageDialog(false);
      setImageUrl('');
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    // Handle pasting images
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = items[i].getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = `<img src="${event.target?.result}" alt="Pasted image" style="max-width: 100%; height: auto;" />`;
            document.execCommand('insertHTML', false, img);
            if (editorRef.current) {
              onChange(editorRef.current.innerHTML);
            }
          };
          reader.readAsDataURL(file);
        }
        break;
      }
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
              className="px-2 py-1 text-xs font-medium text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors min-w-[28px] text-center"
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
            {isPreview ? '✏️ Edit' : '👁️ Preview'}
          </button>
        </div>
      </div>

      {/* Hidden file input for image upload */}
      {enableImageUpload && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      )}

      {/* Image URL Dialog */}
      {showImageDialog && (
        <div className="p-4 bg-gray-800 border-b border-gray-600">
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Enter image URL..."
              className="flex-1 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={insertImageFromUrl}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm rounded transition-colors"
            >
              Insert
            </button>
            <button
              onClick={() => {
                setShowImageDialog(false);
                setImageUrl('');
              }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Editor/Preview Area */}
      {isPreview ? (
        <div 
          className="p-4 min-h-[300px] text-white prose prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onPaste={handlePaste}
          className="p-4 min-h-[300px] text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-inset"
          style={{ whiteSpace: 'pre-wrap' }}
          data-placeholder={placeholder}
          suppressContentEditableWarning={true}
        />
      )}

      {/* Status bar */}
      <div className="flex justify-between items-center px-4 py-2 bg-gray-800 border-t border-gray-600 text-xs text-gray-400">
        <span>Characters: {value.replace(/<[^>]*>/g, '').length} | Words: {value.replace(/<[^>]*>/g, '').split(/\s+/).filter(w => w.length > 0).length}</span>
        <span>💡 Tip: Paste images directly or use Ctrl+Z to undo</span>
      </div>

      {/* Custom CSS for enhanced styling */}
      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          font-style: italic;
        }
        
        /* Enhanced content styling */
        [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.5em 0; color: #fbbf24; }
        [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.5em 0; color: #fbbf24; }
        [contenteditable] h3 { font-size: 1.25em; font-weight: bold; margin: 0.5em 0; color: #fbbf24; }
        [contenteditable] p { margin: 0.5em 0; line-height: 1.6; }
        [contenteditable] ul, [contenteditable] ol { margin: 0.5em 0; padding-left: 2em; }
        [contenteditable] li { margin: 0.25em 0; }
        [contenteditable] strong { font-weight: bold; }
        [contenteditable] em { font-style: italic; }
        [contenteditable] u { text-decoration: underline; }
        [contenteditable] s { text-decoration: line-through; }
        [contenteditable] a { color: #3b82f6; text-decoration: underline; }
        [contenteditable] a:hover { color: #1d4ed8; }
        [contenteditable] blockquote { 
          border-left: 4px solid #fbbf24; 
          padding-left: 1em; 
          margin: 1em 0; 
          font-style: italic; 
          color: #d1d5db;
        }
        [contenteditable] code { 
          background: #374151; 
          padding: 0.125em 0.25em; 
          border-radius: 0.25em; 
          font-family: monospace; 
          font-size: 0.875em;
        }
        [contenteditable] hr { 
          border: none; 
          border-top: 2px solid #4b5563; 
          margin: 1em 0; 
        }
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin: 0.5em 0;
        }
        [contenteditable] table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }
        [contenteditable] th, [contenteditable] td {
          border: 1px solid #4b5563;
          padding: 0.5em;
          text-align: left;
        }
        [contenteditable] th {
          background: #374151;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default AdvancedWYSIWYGEditor;
