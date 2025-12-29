import { useState, useEffect } from 'react';
import Head from 'next/head';
import MainNavbar from '@/components/nav/MainNavbar';
import CreatePost from '@/components/social/CreatePost';
import PostCard from '@/components/social/PostCard';
import { socialAPI, Post } from '@/lib/socialAPI';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function CommunitySocialPage() {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'following' | 'explore'>('following');
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({ totalPosts: 0, totalLikes: 0, totalComments: 0, activeUsers: 0 });

  useEffect(() => {
    loadPosts();
  }, [activeTab, user]);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const options = activeTab === 'following' && user
        ? { feed: true, limit: 50 } // Personalized feed
        : { limit: 50 }; // Public posts
      
      const { posts: loadedPosts } = await socialAPI.getPosts(options);
      setPosts(loadedPosts);
      
      // Calculate stats
      const totalLikes = loadedPosts.reduce((sum, p) => sum + (p.likes_count || 0), 0);
      const totalComments = loadedPosts.reduce((sum, p) => sum + (p.comments_count || 0), 0);
      const uniqueUsers = new Set(loadedPosts.map(p => p.user_id)).size;
      
      setStats({
        totalPosts: loadedPosts.length,
        totalLikes,
        totalComments,
        activeUsers: uniqueUsers
      });
    } catch (error) {
      console.error('Failed to load posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      loadPosts();
      return;
    }
    
    // For now, just filter client-side. Can add search API later
    setLoading(true);
    try {
      const { posts: allPosts } = await socialAPI.getPosts({ limit: 200 });
      const filtered = allPosts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.username?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setPosts(filtered);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost: Post) => {
    setPosts(prev => [newPost, ...prev]);
    setStats(prev => ({ ...prev, totalPosts: prev.totalPosts + 1 }));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts(prev => prev.map(post => 
      post.id === updatedPost.id ? updatedPost : post
    ));
  };

  const handlePostDeleted = (postId: number) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
    setStats(prev => ({ ...prev, totalPosts: prev.totalPosts - 1 }));
  };

  return (
    <>
      <Head>
        <title>Community Social - MIGISTUS</title>
        <meta name="description" content="Connect and share with the MIGISTUS community" />
      </Head>
      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="max-w-6xl mx-auto px-4 py-8">
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-4xl font-bold text-yellow-400 mb-2">Community Social</h1>
                <p className="text-gray-400">Connect and share with the MIGISTUS community</p>
              </div>
                <Link
                href="/community/members-list"
                className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 border border-yellow-500/30 rounded-lg transition-colors"
              >
                👥 View Members
              </Link>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.totalPosts}</div>
                <div className="text-sm text-gray-400">Total Posts</div>
              </div>
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-red-400">{stats.totalLikes}</div>
                <div className="text-sm text-gray-400">Total Likes</div>
              </div>
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalComments}</div>
                <div className="text-sm text-gray-400">Comments</div>
              </div>
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.activeUsers}</div>
                <div className="text-sm text-gray-400">Active Users</div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('following')}
                  className={`px-4 py-2 rounded-md font-semibold transition-all ${
                    activeTab === 'following'
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  Following
                </button>
                <button
                  onClick={() => setActiveTab('explore')}
                  className={`px-4 py-2 rounded-md font-semibold transition-all ${
                    activeTab === 'explore'
                      ? 'bg-yellow-400 text-black'
                      : 'text-gray-400 hover:text-yellow-400'
                  }`}
                >
                  Explore
                </button>
              </div>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts, hashtags, users..."
                    className="w-full px-4 py-2 pl-10 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                </div>
              </form>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Main Feed */}
            <div className="lg:col-span-2 space-y-6">
              {/* Create Post */}
              {isAuthenticated && (
                <CreatePost 
                  onPostCreated={handlePostCreated}
                  placeholder="Share something with the community..."
                />
              )}

              {/* Posts Feed */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-gray-400">Loading posts...</div>
                  </div>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onUpdate={handlePostUpdated}
                      onDelete={handlePostDeleted}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-12 text-center">
                  <div className="text-6xl mb-4">
                    {activeTab === 'following' ? '👥' : '🌍'}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    {activeTab === 'following' ? 'No posts from followed users' : 'No posts found'}
                  </h3>
                  <p className="text-gray-400 mb-4">
                    {activeTab === 'following' 
                      ? 'Follow some community members to see their posts here.'
                      : searchQuery 
                        ? `No posts found matching "${searchQuery}"`
                        : 'Be the first to share something with the community!'
                    }
                  </p>
                  {activeTab === 'following' && (                    <Link
                      href="/community/members-list"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors"
                    >
                      Find People to Follow
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Trending Tags */}
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">🔥 Trending Tags</h3>
                <div className="space-y-2">
                  {['migistus', 'drops', 'community', 'guild', 'pledges'].map((tag, index) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSearchQuery(`#${tag}`);
                        handleSearch(new Event('submit') as any);
                      }}
                      className="block w-full text-left px-3 py-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-blue-500/20 hover:border-blue-400/40 transition-colors"
                    >
                      <span className="text-blue-400">#{tag}</span>
                      <span className="text-gray-400 text-sm ml-2">
                        {Math.floor(Math.random() * 50) + 10} posts
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Active Members */}
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-yellow-400 mb-4">👥 Most Active</h3>
                <div className="space-y-3">
                  {posts
                    .reduce((acc: any[], post) => {
                      const existing = acc.find(u => u.userId === post.user_id);
                      if (existing) {
                        existing.posts++;
                        existing.engagement += (post.likes_count || 0) + (post.comments_count || 0);
                      } else {
                        acc.push({
                          userId: post.user_id,
                          username: post.username,
                          userAvatar: post.userAvatar,
                          posts: 1,
                          engagement: (post.likes_count || 0) + (post.comments_count || 0)
                        });
                      }
                      return acc;
                    }, [])
                    .sort((a, b) => b.engagement - a.engagement)
                    .slice(0, 5)
                    .map((member, index) => (
                      <div key={member.userId} className="flex items-center gap-3 p-3 bg-zinc-800/30 rounded-lg">
                        <div className="w-8 h-8 rounded-full border border-yellow-400/30 overflow-hidden bg-zinc-700">
                          <img
                            src={member.userAvatar || "/Icons/New Member.png"}
                            alt={member.username}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-white text-sm">{member.username || 'User'}</div>
                          <div className="text-xs text-gray-400">{member.posts} posts</div>
                        </div>
                        <div className="text-yellow-400 font-bold">#{index + 1}</div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Quick Actions */}
              {!isAuthenticated && (
                <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-2xl p-6 text-center">
                  <h3 className="text-lg font-bold text-yellow-400 mb-4">Join the Community</h3>
                  <p className="text-gray-400 mb-4">Create an account to post, like, and comment!</p>
                  <button className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-semibold rounded-lg transition-colors">
                    Sign Up Now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
