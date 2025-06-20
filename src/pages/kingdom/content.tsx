import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface ContentItem {
  id: string;
  type: 'banner' | 'announcement' | 'featured';
  title: string;
  content: string;
  imageUrl?: string;
  status: 'active' | 'draft' | 'archived';
  priority: number;
  createdAt: string;
  updatedAt: string;
}

export default function KingdomContent() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);  const [newContent, setNewContent] = useState({
    type: 'announcement' as 'banner' | 'announcement' | 'featured',
    title: '',
    content: '',
    imageUrl: '',
    priority: '1'
  });
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadContentData();
      }
    }
  }, [router]);

  const loadContentData = () => {
    // Load content from localStorage
    const storedContent = JSON.parse(localStorage.getItem('site_content') || '[]');
    setContentItems(storedContent);
  };

  const handleCreateContent = () => {
    if (!newContent.title || !newContent.content) return;

    const contentItem: ContentItem = {
      id: Date.now().toString(),
      type: newContent.type,
      title: newContent.title,
      content: newContent.content,
      imageUrl: newContent.imageUrl || undefined,
      status: 'draft',
      priority: parseInt(newContent.priority),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const updatedContent = [...contentItems, contentItem];
    setContentItems(updatedContent);
    localStorage.setItem('site_content', JSON.stringify(updatedContent));

    setNewContent({
      type: 'announcement',
      title: '',
      content: '',
      imageUrl: '',
      priority: '1'
    });
    setShowCreateForm(false);
  };

  const handleUpdateContent = (contentId: string, updates: Partial<ContentItem>) => {
    const updatedContent = contentItems.map(item => 
      item.id === contentId 
        ? { ...item, ...updates, updatedAt: new Date().toISOString() }
        : item
    );
    setContentItems(updatedContent);
    localStorage.setItem('site_content', JSON.stringify(updatedContent));
  };

  const handleDeleteContent = (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    const updatedContent = contentItems.filter(item => item.id !== contentId);
    setContentItems(updatedContent);
    localStorage.setItem('site_content', JSON.stringify(updatedContent));
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'banner': return '🎯';
      case 'announcement': return '📢';
      case 'featured': return '⭐';
      default: return '📄';
    }
  };

  const filteredContent = contentItems.filter(item => 
    activeTab === 'all' || item.type === activeTab || item.status === activeTab
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-yellow-400 text-2xl">
        Loading content management...
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Content Management - The King's Domain</title>
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#FFD700] mb-2">🎨 Content Management</h1>
          <p className="text-zinc-400">Update homepage, banners, announcements, and featured content</p>
        </div>

        {/* Content Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Total Content</h3>
            <p className="text-2xl font-bold text-white">{contentItems.length}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Active</h3>
            <p className="text-2xl font-bold text-white">{contentItems.filter(item => item.status === 'active').length}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Drafts</h3>
            <p className="text-2xl font-bold text-white">{contentItems.filter(item => item.status === 'draft').length}</p>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 text-sm font-medium mb-2">Banners</h3>
            <p className="text-2xl font-bold text-white">{contentItems.filter(item => item.type === 'banner').length}</p>
          </div>
        </div>

        {/* Content Tabs */}
        <div className="mb-6">
          <div className="flex space-x-4 border-b border-zinc-700">
            {['all', 'banner', 'announcement', 'featured', 'active', 'draft'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                  activeTab === tab
                    ? 'border-yellow-400 text-yellow-400'
                    : 'border-transparent text-zinc-400 hover:text-zinc-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Create Content Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-3 rounded-lg font-medium transition"
          >
            {showCreateForm ? 'Cancel' : '+ Create New Content'}
          </button>
        </div>

        {/* Create Content Form */}
        {showCreateForm && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6 mb-8">
            <h3 className="text-xl font-semibold text-yellow-400 mb-4">Create New Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Content Type</label>
                <select
                  value={newContent.type}
                  onChange={(e) => setNewContent({...newContent, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                >
                  <option value="announcement">Announcement</option>
                  <option value="banner">Banner</option>
                  <option value="featured">Featured Content</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Priority</label>
                <select
                  value={newContent.priority}
                  onChange={(e) => setNewContent({...newContent, priority: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                >
                  <option value="1">High (1)</option>
                  <option value="2">Medium (2)</option>
                  <option value="3">Low (3)</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({...newContent, title: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Content title..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Content</label>
                <textarea
                  value={newContent.content}
                  onChange={(e) => setNewContent({...newContent, content: e.target.value})}
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="Content text..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-zinc-300 mb-2">Image URL (optional)</label>
                <input
                  type="url"
                  value={newContent.imageUrl}
                  onChange={(e) => setNewContent({...newContent, imageUrl: e.target.value})}
                  className="w-full px-3 py-2 border border-zinc-600 rounded-md bg-zinc-800 text-white"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2 flex space-x-4">
                <button
                  onClick={handleCreateContent}
                  className="bg-yellow-600 hover:bg-yellow-700 text-black px-6 py-2 rounded-lg transition"
                >
                  Create Content
                </button>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="bg-zinc-700 hover:bg-zinc-600 text-white px-6 py-2 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="bg-zinc-900 border border-yellow-500 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-zinc-700">
            <h3 className="text-xl font-semibold text-yellow-400">
              Content Items ({filteredContent.length})
            </h3>
          </div>
          <div className="divide-y divide-zinc-700">
            {filteredContent.length === 0 ? (
              <div className="px-6 py-8 text-center text-zinc-400">
                No content found. Create your first content item to get started!
              </div>
            ) : (
              filteredContent.map(item => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">{getTypeIcon(item.type || 'announcement')}</span>
                        <h4 className="text-white font-medium">{item.title || 'Untitled'}</h4>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusBadgeClass(item.status || 'draft')}`}>
                          {(item.status || 'draft').charAt(0).toUpperCase() + (item.status || 'draft').slice(1)}
                        </span>
                      </div>
                      <p className="text-zinc-400 text-sm mb-2">{(item.content || '').substring(0, 150)}...</p>
                      <div className="flex items-center space-x-4 text-xs text-zinc-500">
                        <span>Type: {item.type || 'Unknown'}</span>
                        <span>Priority: {item.priority || 'N/A'}</span>
                        <span>Created: {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Unknown'}</span>
                        <span>Updated: {item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      {item.status === 'draft' && (
                        <button
                          onClick={() => handleUpdateContent(item.id, { status: 'active' })}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition"
                        >
                          Publish
                        </button>
                      )}
                      {item.status === 'active' && (
                        <button
                          onClick={() => handleUpdateContent(item.id, { status: 'archived' })}
                          className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition"
                        >
                          Archive
                        </button>
                      )}
                      <button
                        onClick={() => setEditingItem(item)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteContent(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {item.imageUrl && (
                    <div className="mt-3">
                      <img 
                        src={item.imageUrl} 
                        alt={item.title}
                        className="w-32 h-20 object-cover rounded border border-zinc-600"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 font-medium mb-3">🎯 Homepage Banner</h3>
            <p className="text-zinc-400 text-sm mb-4">Manage the main banner on the homepage</p>
            <button className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded text-sm transition">
              Update Banner
            </button>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 font-medium mb-3">📢 Site Announcement</h3>
            <p className="text-zinc-400 text-sm mb-4">Create site-wide announcements</p>
            <button 
              onClick={() => {
                setNewContent({...newContent, type: 'announcement'});
                setShowCreateForm(true);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded text-sm transition"
            >
              New Announcement
            </button>
          </div>
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-6">
            <h3 className="text-yellow-400 font-medium mb-3">⭐ Featured Content</h3>
            <p className="text-zinc-400 text-sm mb-4">Highlight special content</p>
            <button 
              onClick={() => {
                setNewContent({...newContent, type: 'featured'});
                setShowCreateForm(true);
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-black px-4 py-2 rounded text-sm transition"
            >
              Add Featured
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
