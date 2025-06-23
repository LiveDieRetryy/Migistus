import { useState, useEffect } from 'react';
import Head from 'next/head';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

export default function AdminContentPage() {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'banners' | 'featured'>('announcements');

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    setLoading(false);
  }, [isAuthenticated, user]);

  // Auto-allow for WebDesigner preview
  if (typeof window !== 'undefined' && window.location.search.includes('preview=1')) {
    return (
      <div className="min-h-screen bg-zinc-950 text-yellow-300 flex flex-col items-center justify-center">
        <Head><title>Admin Content Preview</title></Head>
        <h1 className="text-3xl font-bold mb-4">Admin Content (Preview Mode)</h1>
      </div>
    );
  }

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access content management.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading content management...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Content Management - Kings Domain | Migistus</title>
        <meta name="description" content="Admin content management" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-indigo-400 mb-2 flex items-center gap-3">
            <span>📝</span> Content Management Center
          </h1>
          <p className="text-gray-400">Manage site content, announcements, banners, and featured items</p>
        </div>

        {/* Coming Soon Notice */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-8 text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-bold text-indigo-400 mb-4">Content Management Coming Soon</h2>
          <p className="text-gray-300 mb-6">
            This section will include comprehensive content management tools including:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📢</div>
              <h3 className="font-semibold text-white mb-2">Announcements</h3>
              <p className="text-sm text-gray-400">Site-wide announcements and notifications</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🎨</div>
              <h3 className="font-semibold text-white mb-2">Banners</h3>
              <p className="text-sm text-gray-400">Homepage and category banners</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">⭐</div>
              <h3 className="font-semibold text-white mb-2">Featured Content</h3>
              <p className="text-sm text-gray-400">Manage featured products and categories</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📄</div>
              <h3 className="font-semibold text-white mb-2">Pages</h3>
              <p className="text-sm text-gray-400">Edit static pages and content</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">🏷️</div>
              <h3 className="font-semibold text-white mb-2">Categories</h3>
              <p className="text-sm text-gray-400">Manage product categories and tags</p>
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-white mb-2">SEO</h3>
              <p className="text-sm text-gray-400">Meta tags and SEO optimization</p>
            </div>
          </div>
          
          <div className="mt-8">
            <p className="text-sm text-gray-500">
              In the meantime, use the other admin tools to manage your kingdom effectively.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
