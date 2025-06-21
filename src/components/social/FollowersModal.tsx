import React from 'react';
import { X, Users, Star, Calendar, MessageCircle } from 'lucide-react';

interface Follower {
  id: string;
  name: string;
  avatar: string;
  followedDate: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  engagement: number;
  lastActive: string;
  verified?: boolean;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  followers: Follower[];
  supplierName: string;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  followers,
  supplierName
}) => {
  if (!isOpen) return null;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'text-orange-400';
      case 'silver': return 'text-gray-400';
      case 'gold': return 'text-yellow-400';
      case 'platinum': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getTierBadge = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'bg-orange-900 text-orange-300';
      case 'silver': return 'bg-gray-900 text-gray-300';
      case 'gold': return 'bg-yellow-900 text-yellow-300';
      case 'platinum': return 'bg-purple-900 text-purple-300';
      default: return 'bg-gray-900 text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-700">
          <h3 className="text-xl font-semibold text-white">
            {supplierName}'s Followers ({followers.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Followers List */}
        <div className="overflow-y-auto max-h-[60vh] p-6">
          <div className="space-y-4">
            {followers.map((follower) => (
              <div key={follower.id} className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-zinc-700 rounded-full overflow-hidden">
                    <img 
                      src={follower.avatar} 
                      alt={follower.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{follower.name}</h4>
                      {follower.verified && (
                        <Star className="w-4 h-4 text-blue-400 fill-current" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-400">
                      <Calendar className="w-3 h-3" />
                      <span>Followed {new Date(follower.followedDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">Spent</div>
                    <div className="text-white font-medium">${follower.totalSpent}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-400">Engagement</div>
                    <div className="text-white font-medium">{follower.engagement}%</div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getTierBadge(follower.tier)}`}>
                    {follower.tier}
                  </span>
                  <button className="p-2 text-zinc-400 hover:text-blue-400 transition">
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {followers.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-zinc-400">No followers yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
