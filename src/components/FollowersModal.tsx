import { useState, useEffect } from 'react';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';
import Image from 'next/image';
import Link from 'next/link';
import FollowButton from '@/components/FollowButton';
import { useAuth } from '@/context/AuthContext';

interface FollowersModalProps {
  userId: number;
  username: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

interface UserPreview {
  id: number;
  username: string;
  avatar: string | null;
  tier: string;
  followers: number;
  isFollowing?: boolean;
}

export default function FollowersModal({ userId, username, type, isOpen, onClose }: FollowersModalProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen, userId, type]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Call the API to get followers or following list
      const response = await fetch(`/api/followers?userId=${userId}&type=${type}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      const userList = type === 'followers' ? data.followers : data.following;
      
      // Map to UserPreview format
      const userProfiles: UserPreview[] = (userList || []).map((user: any) => ({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        tier: user.tier || 'Initiate',
        followers: user.followers || 0,
        isFollowing: currentUser ? user.isFollowing : false
      }));

      setUsers(userProfiles);
    } catch (error) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const createSlug = (username: string) => {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "MIGISTUS": return "from-yellow-400 to-yellow-600";
      case "Guild": return "from-purple-400 to-purple-600";
      default: return "from-gray-400 to-gray-600";
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case "MIGISTUS": return "👑";
      case "Guild": return "⚔️";
      default: return "🛡️";
    }
  };

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFollowChange = (targetUserId: number, isFollowing: boolean, newCount: number) => {
    // Update the user's follower count in the list
    setUsers(prev => prev.map(user => 
      user.id === targetUserId 
        ? { ...user, followers: newCount, isFollowing } 
        : user
    ));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-yellow-500/20 w-full max-w-2xl max-h-[80vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <div>
            <h2 className="text-2xl font-bold text-yellow-400">
              {type === 'followers' ? 'Followers' : 'Following'}
            </h2>
            <p className="text-gray-400">
              {username}'s {type} • {users.length} {users.length === 1 ? 'person' : 'people'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        {users.length > 0 && (
          <div className="p-4 border-b border-zinc-700">
            <div className="relative">
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-3 pl-10 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-gray-400 focus:border-yellow-400 focus:outline-none"
              />
              <span className="absolute left-3 top-3.5 text-gray-400">🔍</span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(80vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-400">Loading {type}...</div>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-6xl mb-4">
                {type === 'followers' ? '👥' : '🔗'}
              </div>
              <h3 className="text-xl font-semibold text-gray-300 mb-2">
                {searchTerm ? 'No users found' : `No ${type} yet`}
              </h3>
              <p className="text-gray-400">
                {searchTerm 
                  ? `No users match "${searchTerm}"`
                  : type === 'followers' 
                    ? `${username} doesn't have any followers yet.`
                    : `${username} isn't following anyone yet.`
                }
              </p>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {filteredUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-4 p-4 bg-zinc-800/50 rounded-lg hover:bg-zinc-800/70 transition-colors border border-zinc-700/50 hover:border-yellow-400/30"
                >
                  {/* Avatar */}
                  <Link 
                    href={`/account/profile/${createSlug(user.username)}`}
                    onClick={onClose}
                    className="flex-shrink-0"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full border-2 border-yellow-400/30 hover:border-yellow-400/50 transition-colors overflow-hidden bg-zinc-700">
                        <Image
                          src={user.avatar || "/Icons/New Member.png"}
                          alt={user.username}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/Icons/New Member.png";
                          }}
                        />
                      </div>
                      {/* Online status indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 border border-zinc-900 rounded-full"></div>
                    </div>
                  </Link>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/account/profile/${createSlug(user.username)}`}
                      onClick={onClose}
                      className="block hover:text-yellow-400 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">
                          {user.username}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r ${getTierColor(user.tier)} rounded-full text-xs font-semibold text-white`}>
                          {getTierIcon(user.tier)} {user.tier}
                        </span>
                      </div>
                      <div className="text-sm text-gray-400">
                        {user.followers} {user.followers === 1 ? 'follower' : 'followers'}
                      </div>
                    </Link>
                  </div>

                  {/* Follow Button */}
                  <div className="flex-shrink-0">
                    {currentUser && currentUser.id !== user.id ? (
                      <FollowButton
                        targetUserId={user.id}
                        targetUsername={user.username}
                        initialFollowersCount={user.followers}
                        onFollowChange={(isFollowing, newCount) => 
                          handleFollowChange(user.id, isFollowing, newCount)
                        }
                        size="sm"
                        variant="default"
                      />
                    ) : (
                      <div className="px-3 py-1.5 text-sm text-gray-400">
                        {currentUser?.id === user.id ? 'You' : ''}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && filteredUsers.length > 0 && (
          <div className="p-4 border-t border-zinc-700 bg-zinc-800/50">
            <div className="text-center text-sm text-gray-400">
              {searchTerm ? (
                <>
                  Showing {filteredUsers.length} of {users.length} {type}
                </>
              ) : (
                <>
                  {users.length} {users.length === 1 ? 'person' : 'people'} total
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
