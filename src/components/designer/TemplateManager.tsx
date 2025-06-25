import React, { useState, useEffect } from 'react';

interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: string;
  html: string;
  css: string;
  components: any[];
}

interface TemplateManagerProps {
  onSelectTemplate: (template: Template) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function TemplateManager({ onSelectTemplate, onClose, isOpen }: TemplateManagerProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const categories = [
    { id: 'all', name: 'All Templates', icon: 'fa-th' },
    { id: 'business', name: 'Business', icon: 'fa-briefcase' },
    { id: 'portfolio', name: 'Portfolio', icon: 'fa-user' },
    { id: 'ecommerce', name: 'E-commerce', icon: 'fa-shopping-cart' },
    { id: 'blog', name: 'Blog', icon: 'fa-blog' },
    { id: 'landing', name: 'Landing Page', icon: 'fa-rocket' },
  ];

  // Mock templates data
  useEffect(() => {
    const mockTemplates: Template[] = [
      {
        id: '1',
        name: 'Modern Business',
        description: 'Clean and professional business template',
        thumbnail: '/images/template-business.jpg',
        category: 'business',
        html: '<div class="hero-section">...</div>',
        css: '.hero-section { ... }',
        components: []
      },
      {
        id: '2',
        name: 'Creative Portfolio',
        description: 'Showcase your work with this stunning portfolio',
        thumbnail: '/images/template-portfolio.jpg',
        category: 'portfolio',
        html: '<div class="portfolio-grid">...</div>',
        css: '.portfolio-grid { ... }',
        components: []
      },
      {
        id: '3',
        name: 'E-commerce Store',
        description: 'Complete online store template',
        thumbnail: '/images/template-ecommerce.jpg',
        category: 'ecommerce',
        html: '<div class="product-showcase">...</div>',
        css: '.product-showcase { ... }',
        components: []
      },
      {
        id: '4',
        name: 'Tech Blog',
        description: 'Modern blog template for tech content',
        thumbnail: '/images/template-blog.jpg',
        category: 'blog',
        html: '<div class="blog-layout">...</div>',
        css: '.blog-layout { ... }',
        components: []
      },
      {
        id: '5',
        name: 'SaaS Landing',
        description: 'Convert visitors with this high-converting landing page',
        thumbnail: '/images/template-saas.jpg',
        category: 'landing',
        html: '<div class="saas-hero">...</div>',
        css: '.saas-hero { ... }',
        components: []
      }
    ];
    setTemplates(mockTemplates);
  }, []);

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-6xl h-[80vh] flex flex-col border border-yellow-400/20">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zinc-700">
          <div>
            <h2 className="text-2xl font-bold text-yellow-300 flex items-center gap-2">
              <span className="fa fa-layer-group" />
              Template Library
            </h2>
            <p className="text-zinc-400 mt-1">Choose a template to get started quickly</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 text-yellow-200 rounded-lg hover:bg-zinc-700 transition"
          >
            <span className="fa fa-times text-lg" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-zinc-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-zinc-800 text-yellow-200 rounded-lg border border-zinc-700 focus:ring-2 focus:ring-yellow-400"
              />
              <span className="fa fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-zinc-400" />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg font-semibold transition flex items-center gap-2 ${
                    selectedCategory === category.id
                      ? 'bg-yellow-400 text-black'
                      : 'bg-zinc-800 text-yellow-200 hover:bg-zinc-700'
                  }`}
                >
                  <span className={`fa ${category.icon} text-sm`} />
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 hover:border-yellow-400/50 transition-all cursor-pointer group"
                onClick={() => onSelectTemplate(template)}
              >
                {/* Template Preview */}
                <div className="aspect-video bg-gradient-to-br from-zinc-700 to-zinc-800 flex items-center justify-center relative overflow-hidden">
                  <div className="text-6xl text-zinc-600 fa fa-image" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-bold hover:bg-yellow-300 transition">
                      <span className="fa fa-plus mr-2" />
                      Use Template
                    </button>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-yellow-300 mb-2">{template.name}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{template.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-400/20 text-yellow-300">
                      {categories.find(c => c.id === template.category)?.name}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-1 text-zinc-400 hover:text-yellow-400 transition">
                        <span className="fa fa-eye text-sm" />
                      </button>
                      <button className="p-1 text-zinc-400 hover:text-yellow-400 transition">
                        <span className="fa fa-heart text-sm" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl text-zinc-600 fa fa-search mb-4" />
              <h3 className="text-xl font-bold text-zinc-400 mb-2">No templates found</h3>
              <p className="text-zinc-500">Try adjusting your search or category filter</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-700 bg-zinc-800/50">
          <div className="flex justify-between items-center">
            <div className="text-sm text-zinc-400">
              <span className="fa fa-info-circle mr-2" />
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
            </div>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-700 text-zinc-300 rounded-lg hover:bg-zinc-600 transition"
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition">
                <span className="fa fa-upload mr-2" />
                Upload Template
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
