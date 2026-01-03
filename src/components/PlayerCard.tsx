import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, MessageCircle, UserPlus, Shield, Award, Users, Heart, Zap, MapPin, Calendar } from 'lucide-react';
import FollowButton from './FollowButton';
import OnlineStatus from './OnlineStatus';
import AvatarEffects, { AvatarEffectType } from './effects/AvatarEffects';
import ProfileEffects, { ProfileEffectType } from './effects/ProfileEffects';

interface PlayerCardProps {
  userId: number;
  username: string;
  onClose: () => void;
  position?: { x: number; y: number };
}

interface UserProfile {
  id: number;
  username: string;
  email: string;
  tier?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  joinedDate?: string;
  country?: string;
  avatarEffect?: AvatarEffectType;
  profileEffect?: ProfileEffectType;
  location?: {
    country?: string;
    city?: string;
  };
  stats?: {
    followers: number;
    following: number;
    totalVotes: number;
    totalPledges: number;
    dropsJoined?: number;
  };
  badges?: string[];
  titles?: string[];
}

export default function PlayerCard({ userId, username, onClose, position }: PlayerCardProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch user profile
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

    // Listen for profile updates to refresh the card
    const handleProfileUpdate = () => {
      fetchProfile();
    };

    window.addEventListener('user-profile-updated', handleProfileUpdate);

    return () => {
      window.removeEventListener('user-profile-updated', handleProfileUpdate);
    };
  }, [userId]);

  useEffect(() => {
    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Close on Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'MIGISTUS': return 'text-yellow-400';
      case 'Guild': return 'text-purple-400';
      case 'Squire': return 'text-blue-400';
      default: return 'text-zinc-400';
    }
  };

  const getTierEmoji = (tier?: string) => {
    switch (tier) {
      case 'MIGISTUS': return '👑';
      case 'Guild': return '⚔️';
      case 'Squire': return '🛡️';
      default: return '🎮';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Calculate card position to keep it on screen
  const getCardStyle = () => {
    if (!position) return {};
    
    const cardWidth = 340;
    const cardHeight = 600;
    const padding = 16;
    
    let left = position.x;
    let top = position.y;

    // Keep card on screen horizontally
    if (left + cardWidth > window.innerWidth) {
      left = window.innerWidth - cardWidth - padding;
    }
    if (left < padding) {
      left = padding;
    }

    // Keep card on screen vertically
    if (top + cardHeight > window.innerHeight) {
      top = window.innerHeight - cardHeight - padding;
    }
    if (top < padding) {
      top = padding;
    }

    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  if (loading) {
    return (
      <div 
        ref={cardRef}
        className="fixed z-50 w-[340px] bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 overflow-hidden animate-fadeIn"
        style={getCardStyle()}
      >
        <div className="h-[600px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] animate-fadeIn" />
      
      {/* Player Card */}
      <div 
        ref={cardRef}
        className="fixed z-50 w-[340px] bg-zinc-900 rounded-xl shadow-2xl border border-zinc-700 overflow-hidden animate-slideUp"
        style={getCardStyle()}
      >
        {/* Profile Effect Background - Full Card */}
        <div className="absolute inset-0 z-0 rounded-xl overflow-hidden">
          <ProfileEffects effect={profile.profileEffect || 'none'} />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-1.5 bg-black/40 hover:bg-black/60 rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-white" />
        </button>

        {/* Banner */}
        <div className="relative h-[120px] bg-gradient-to-br from-blue-600/20 to-purple-600/20 overflow-hidden z-10">
          {profile.banner ? (
            <Image
              src={profile.banner}
              alt="Banner"
              fill
              className="object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30" />
          )}
        </div>

        {/* Profile Content */}
        <div className="px-4 pb-4 relative z-10">
          {/* Avatar */}
          <div className="relative -mt-12 mb-3">
            <div className="w-20 h-20 p-1">
              <AvatarEffects effect={profile.avatarEffect || 'none'} size="lg">
                <div className="w-full h-full bg-zinc-800 rounded-full overflow-hidden relative ring-4 ring-zinc-900">
                  <Image
                    src={profile.avatar || "/Icons/New Member.png"}
                    alt={profile.username}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                    target.src = "/Icons/New Member.png";
                  }}
                  />
                  {/* Tier Badge */}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-2 border-zinc-900 flex items-center justify-center ${
                    profile.tier === 'MIGISTUS' ? 'bg-yellow-500' :
                    profile.tier === 'Guild' ? 'bg-purple-500' : 'bg-blue-500'
                  }`}>
                    <Award className="w-3 h-3 text-white" />
                  </div>
                </div>
              </AvatarEffects>
            </div>
            <div className="absolute top-0 left-24">
              <OnlineStatus userId={profile.id} size="md" />
            </div>
          </div>

          {/* Username and Tier */}
          <div className="mb-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {profile.username}
            </h3>
            <p className={`text-sm font-medium ${getTierColor(profile.tier)}`}>
              {getTierEmoji(profile.tier)} {profile.tier || 'Member'}
            </p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mb-4 p-3 bg-zinc-800/50 rounded-lg">
              <p className="text-sm text-zinc-300 leading-relaxed">{profile.bio}</p>
            </div>
          )}

          {/* Titles */}
          {profile.titles && profile.titles.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Titles</h4>
              <div className="flex flex-wrap gap-2">
                {profile.titles.slice(0, 3).map((title, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-md text-xs text-blue-300"
                  >
                    {title}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="mb-4 space-y-2">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Member Stats</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-zinc-800/30 rounded-lg">
                <Users className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-zinc-400">Followers</p>
                  <p className="text-sm font-bold text-white">{profile.stats?.followers || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-zinc-800/30 rounded-lg">
                <Users className="w-4 h-4 text-blue-400" />
                <div>
                  <p className="text-xs text-zinc-400">Following</p>
                  <p className="text-sm font-bold text-white">{profile.stats?.following || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-zinc-800/30 rounded-lg">
                <Zap className="w-4 h-4 text-yellow-400" />
                <div>
                  <p className="text-xs text-zinc-400">Votes</p>
                  <p className="text-sm font-bold text-white">{profile.stats?.totalVotes || 0}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-zinc-800/30 rounded-lg">
                <Heart className="w-4 h-4 text-pink-400" />
                <div>
                  <p className="text-xs text-zinc-400">Pledges</p>
                  <p className="text-sm font-bold text-white">{profile.stats?.totalPledges || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Location and Join Date */}
          <div className="mb-4 space-y-2 text-xs text-zinc-400">
            {(profile.location?.country || profile.country) && (
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5" />
                <span>
                  {profile.location?.city && `${profile.location.city}, `}
                  {profile.location?.country || profile.country}
                </span>
              </div>
            )}
            {profile.joinedDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5" />
                <span>Joined {formatDate(profile.joinedDate)}</span>
              </div>
            )}
          </div>

          {/* Badges */}
          {profile.badges && profile.badges.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-2">Badges</h4>
              <div className="flex flex-wrap gap-2">
                {profile.badges.slice(0, 6).map((badge, idx) => (
                  <div
                    key={idx}
                    className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-lg"
                    title={badge}
                  >
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Link
              href={`/account/profile/${profile.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
              className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-medium rounded-lg transition-all duration-300 text-center"
              onClick={onClose}
            >
              View Profile
            </Link>
            <FollowButton 
              targetUserId={profile.id}
              targetUsername={profile.username}
              size="md"
            />
            <Link
              href={`/messenger?user=${profile.username}`}
              className="p-2.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-all duration-300 flex items-center justify-center"
              onClick={onClose}
              title="Send Message"
            >
              <MessageCircle className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </>
  );
}
