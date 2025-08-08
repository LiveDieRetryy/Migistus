import React, { useState, useMemo } from 'react';

interface BlockPanelProps {
  editor: any;
  isVisible: boolean;
  onToggle: () => void;
}

interface BlockCategory {
  id: string;
  name: string;
  icon: string;
  blocks: Block[];
}

interface Block {
  id: string;
  label: string;
  icon: string;
  content: string;
  category: string;
  description?: string;
  tags?: string[];
}

export const BlockPanel: React.FC<BlockPanelProps> = ({
  editor,
  isVisible,
  onToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [draggedBlock, setDraggedBlock] = useState<Block | null>(null);

  // Define block categories and blocks
  const blockCategories: BlockCategory[] = [
    {
      id: 'basic',
      name: 'Basic',
      icon: '📦',
      blocks: [
        {
          id: 'text',
          label: 'Text',
          icon: '📝',
          content: '<div class="text-block"><p>Click to edit this text</p></div>',
          category: 'basic',
          description: 'Simple text paragraph',
          tags: ['text', 'paragraph', 'content']
        },
        {
          id: 'heading',
          label: 'Heading',
          icon: '📰',
          content: '<div class="heading-block"><h2>Heading Text</h2></div>',
          category: 'basic',
          description: 'Section heading',
          tags: ['heading', 'title', 'h2']
        },
        {
          id: 'image',
          label: 'Image',
          icon: '🖼️',
          content: '<div class="image-block"><img src="https://via.placeholder.com/400x200" alt="Placeholder" style="width: 100%; height: auto;" /></div>',
          category: 'basic',
          description: 'Responsive image',
          tags: ['image', 'picture', 'photo']
        },
        {
          id: 'button',
          label: 'Button',
          icon: '🔘',
          content: '<div class="button-block"><button style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Click Me</button></div>',
          category: 'basic',
          description: 'Call-to-action button',
          tags: ['button', 'cta', 'action']
        },
        {
          id: 'divider',
          label: 'Divider',
          icon: '➖',
          content: '<div class="divider-block"><hr style="border: 1px solid #e5e7eb; margin: 20px 0;" /></div>',
          category: 'basic',
          description: 'Section divider line',
          tags: ['divider', 'separator', 'line']
        }
      ]
    },
    {
      id: 'layout',
      name: 'Layout',
      icon: '📐',
      blocks: [
        {
          id: 'container',
          label: 'Container',
          icon: '📦',
          content: '<div class="container-block" style="max-width: 1200px; margin: 0 auto; padding: 20px;"><p>Container content</p></div>',
          category: 'layout',
          description: 'Centered container with max width',
          tags: ['container', 'wrapper', 'layout']
        },
        {
          id: 'row',
          label: 'Row',
          icon: '↔️',
          content: '<div class="row-block" style="display: flex; gap: 20px; flex-wrap: wrap;"><div style="flex: 1; min-width: 200px; padding: 20px; background: #f3f4f6;">Column 1</div><div style="flex: 1; min-width: 200px; padding: 20px; background: #f3f4f6;">Column 2</div></div>',
          category: 'layout',
          description: 'Flexible row with columns',
          tags: ['row', 'columns', 'flex', 'grid']
        },
        {
          id: 'section',
          label: 'Section',
          icon: '📋',
          content: '<section class="section-block" style="padding: 60px 20px; background: #ffffff;"><div style="max-width: 1200px; margin: 0 auto;"><h2>Section Title</h2><p>Section content goes here.</p></div></section>',
          category: 'layout',
          description: 'Content section with padding',
          tags: ['section', 'content', 'area']
        },
        {
          id: 'card',
          label: 'Card',
          icon: '🃏',
          content: '<div class="card-block" style="background: white; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb;"><h3>Card Title</h3><p>Card description content.</p></div>',
          category: 'layout',
          description: 'Card with shadow and border',
          tags: ['card', 'box', 'panel']
        }
      ]
    },
    {
      id: 'media',
      name: 'Media',
      icon: '🎬',
      blocks: [
        {
          id: 'video',
          label: 'Video',
          icon: '🎥',
          content: '<div class="video-block"><video style="width: 100%; height: auto;" controls><source src="" type="video/mp4">Your browser does not support the video tag.</video></div>',
          category: 'media',
          description: 'HTML5 video player',
          tags: ['video', 'media', 'player']
        },
        {
          id: 'iframe',
          label: 'Embed',
          icon: '🔗',
          content: '<div class="iframe-block"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="width: 100%; height: 315px; border: none;" allowfullscreen></iframe></div>',
          category: 'media',
          description: 'Embedded content iframe',
          tags: ['iframe', 'embed', 'youtube']
        },
        {
          id: 'gallery',
          label: 'Gallery',
          icon: '🖼️',
          content: '<div class="gallery-block" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;"><img src="https://via.placeholder.com/200" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;" /><img src="https://via.placeholder.com/200" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;" /><img src="https://via.placeholder.com/200" style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px;" /></div>',
          category: 'media',
          description: 'Responsive image gallery',
          tags: ['gallery', 'images', 'grid']
        }
      ]
    },
    {
      id: 'forms',
      name: 'Forms',
      icon: '📝',
      blocks: [
        {
          id: 'input',
          label: 'Input',
          icon: '✏️',
          content: '<div class="input-block"><label style="display: block; margin-bottom: 8px; font-weight: 500;">Label</label><input type="text" placeholder="Enter text..." style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px;" /></div>',
          category: 'forms',
          description: 'Text input field',
          tags: ['input', 'form', 'text']
        },
        {
          id: 'textarea',
          label: 'Textarea',
          icon: '📄',
          content: '<div class="textarea-block"><label style="display: block; margin-bottom: 8px; font-weight: 500;">Message</label><textarea placeholder="Enter message..." style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 16px; resize: vertical; min-height: 100px;"></textarea></div>',
          category: 'forms',
          description: 'Multi-line text area',
          tags: ['textarea', 'form', 'message']
        },
        {
          id: 'form',
          label: 'Contact Form',
          icon: '📮',
          content: '<form class="form-block" style="max-width: 500px; margin: 0 auto; padding: 24px; background: #f9fafb; border-radius: 12px;"><h3 style="margin-bottom: 20px;">Contact Us</h3><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 500;">Name</label><input type="text" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px;" /></div><div style="margin-bottom: 16px;"><label style="display: block; margin-bottom: 8px; font-weight: 500;">Email</label><input type="email" style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px;" /></div><div style="margin-bottom: 20px;"><label style="display: block; margin-bottom: 8px; font-weight: 500;">Message</label><textarea style="width: 100%; padding: 12px; border: 1px solid #d1d5db; border-radius: 8px; min-height: 100px; resize: vertical;"></textarea></div><button type="submit" style="background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 8px; font-weight: 500; cursor: pointer;">Send Message</button></form>',
          category: 'forms',
          description: 'Complete contact form',
          tags: ['form', 'contact', 'email']
        }
      ]
    },
    {
      id: 'advanced',
      name: 'Advanced',
      icon: '⚡',
      blocks: [
        {
          id: 'navbar',
          label: 'Navigation',
          icon: '🧭',
          content: '<nav class="navbar-block" style="background: #1f2937; padding: 16px 24px;"><div style="display: flex; justify-content: space-between; align-items: center; max-width: 1200px; margin: 0 auto;"><div style="color: white; font-size: 24px; font-weight: bold;">Logo</div><div style="display: flex; gap: 24px;"><a href="#" style="color: white; text-decoration: none; font-weight: 500;">Home</a><a href="#" style="color: white; text-decoration: none; font-weight: 500;">About</a><a href="#" style="color: white; text-decoration: none; font-weight: 500;">Services</a><a href="#" style="color: white; text-decoration: none; font-weight: 500;">Contact</a></div></div></nav>',
          category: 'advanced',
          description: 'Responsive navigation bar',
          tags: ['navbar', 'navigation', 'menu']
        },
        {
          id: 'hero',
          label: 'Hero Section',
          icon: '🌟',
          content: '<section class="hero-block" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 100px 20px; text-align: center;"><div style="max-width: 800px; margin: 0 auto;"><h1 style="font-size: 48px; font-weight: bold; margin-bottom: 24px;">Welcome to Our Website</h1><p style="font-size: 20px; margin-bottom: 32px; opacity: 0.9;">Discover amazing features and start your journey with us today.</p><button style="background: white; color: #667eea; padding: 16px 32px; border: none; border-radius: 8px; font-size: 18px; font-weight: 600; cursor: pointer;">Get Started</button></div></section>',
          category: 'advanced',
          description: 'Eye-catching hero section',
          tags: ['hero', 'banner', 'landing']
        },
        {
          id: 'footer',
          label: 'Footer',
          icon: '🦶',
          content: '<footer class="footer-block" style="background: #111827; color: white; padding: 60px 20px 20px;"><div style="max-width: 1200px; margin: 0 auto;"><div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 40px; margin-bottom: 40px;"><div><h4 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Company</h4><ul style="list-style: none; padding: 0;"><li style="margin-bottom: 8px;"><a href="#" style="color: #9ca3af; text-decoration: none;">About Us</a></li><li style="margin-bottom: 8px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Careers</a></li><li style="margin-bottom: 8px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Contact</a></li></ul></div><div><h4 style="font-size: 18px; font-weight: 600; margin-bottom: 16px;">Services</h4><ul style="list-style: none; padding: 0;"><li style="margin-bottom: 8px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Web Design</a></li><li style="margin-bottom: 8px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Development</a></li><li style="margin-bottom: 8px;"><a href="#" style="color: #9ca3af; text-decoration: none;">Consulting</a></li></ul></div></div><div style="border-top: 1px solid #374151; padding-top: 20px; text-align: center; color: #9ca3af;"><p>&copy; 2024 Your Company. All rights reserved.</p></div></div></footer>',
          category: 'advanced',
          description: 'Complete website footer',
          tags: ['footer', 'links', 'copyright']
        }
      ]
    }
  ];

  // Flatten all blocks for search
  const allBlocks = useMemo(() => {
    return blockCategories.flatMap(category => category.blocks);
  }, []);

  // Filter blocks based on search and category
  const filteredBlocks = useMemo(() => {
    let blocks = selectedCategory === 'all' 
      ? allBlocks 
      : allBlocks.filter(block => block.category === selectedCategory);

    if (searchTerm) {
      blocks = blocks.filter(block => 
        block.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        block.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        block.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return blocks;
  }, [allBlocks, selectedCategory, searchTerm]);

  const handleDragStart = (e: React.DragEvent, block: Block) => {
    setDraggedBlock(block);
    e.dataTransfer.setData('text/html', block.content);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggedBlock(null);
  };

  const handleBlockClick = (block: Block) => {
    if (editor) {
      const selected = editor.getSelected();
      if (selected) {
        // Add after selected component
        selected.parent().append(block.content);
      } else {
        // Add to canvas
        editor.addComponents(block.content);
      }
    }
  };

  if (!isVisible) return null;

  return (
    <div className="block-panel bg-gray-900 text-white w-80 h-full flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-lg font-semibold">Block Library</h3>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Close block panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-700">
        <div className="relative">
          <input
            type="text"
            placeholder="Search blocks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm focus:outline-none focus:border-blue-500"
          />
          <svg 
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap border-b border-gray-700 p-2 gap-1">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3 py-1 text-xs rounded transition-colors ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
          }`}
        >
          All
        </button>
        {blockCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
            }`}
            title={category.name}
          >
            <span className="flex items-center space-x-1">
              <span>{category.icon}</span>
              <span className="hidden sm:inline">{category.name}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Blocks List */}
      <div className="flex-1 overflow-y-auto p-4">
        {filteredBlocks.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p>No blocks found</p>
            <p className="text-sm">Try adjusting your search terms</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBlocks.map((block) => (
              <div
                key={block.id}
                draggable
                onDragStart={(e) => handleDragStart(e, block)}
                onDragEnd={handleDragEnd}
                onClick={() => handleBlockClick(block)}
                className={`p-3 bg-gray-800 rounded-lg border border-gray-700 cursor-pointer transition-all hover:bg-gray-750 hover:border-gray-600 group ${
                  draggedBlock?.id === block.id ? 'opacity-50 scale-95' : ''
                }`}
                title={`Drag to canvas or click to add: ${block.description}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl flex-shrink-0">{block.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-white group-hover:text-blue-300 transition-colors">
                      {block.label}
                    </h4>
                    {block.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                        {block.description}
                      </p>
                    )}
                    {block.tags && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {block.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-gray-700 text-gray-300 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Add Bar */}
      <div className="p-4 border-t border-gray-700">
        <p className="text-xs text-gray-400 mb-2">Quick Add:</p>
        <div className="flex space-x-2">
          {allBlocks.slice(0, 4).map((block) => (
            <button
              key={block.id}
              onClick={() => handleBlockClick(block)}
              className="flex-1 p-2 bg-gray-800 hover:bg-gray-700 rounded text-center transition-colors"
              title={`Add ${block.label}`}
            >
              <div className="text-lg">{block.icon}</div>
              <div className="text-xs mt-1">{block.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
