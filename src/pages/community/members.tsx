import { useState, useEffect } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import MainNavbar from "@/components/nav/MainNavbar";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";

type User = {
  id: number;
  username: string;
  email: string;
  tier?: string;
  banned?: boolean;
  guildTokens?: number;
  bio?: string;
  avatar?: string;
  banner?: string;
  joinedDate?: string;
  titles?: string[];
  badges?: string[];
  links?: { name: string; url: string }[];
  stats?: {
    totalPledges: number;
    totalVotes: number;
    dropsJoined: number;
    followers: number;
    following: number;
  };
};

type UserProfile = {
  id: number;
  username: string;
  email: string;
  bio?: string;
  avatar?: string;
  tier?: string;
  guildTokens?: number;
  joinedDate?: string;
  stats?: {
    totalPledges: number;
    totalVotes: number;
    dropsJoined: number;
    followers: number;
    following: number;
  };
};

export default function CommunityMembersPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'active' | 'name'>('newest');
  const [mounted, setMounted] = useState(false);

  const createSlug = (username: string) => {
    return username.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "MIGISTUS":
        return "from-yellow-400 to-yellow-600";
      case "Guild":
        return "from-purple-400 to-purple-600";
      default:
        return "from-gray-400 to-gray-600";
    }
  };

  const getTierEmoji = (tier: string) => {
    switch (tier) {
      case "MIGISTUS":
        return "👑";
      case "Guild":
        return "⚔️";
      default:
        return "🛡️";
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the SAME comprehensive user retrieval method as admin page
  const getAllUsers = (): User[] => {
    const allUsers: User[] = [];
    const userIds = new Set<number>();

    if (typeof window === 'undefined') return allUsers;

    console.log('🔍 Community: Scanning for all users...');

    try {
      // 1. Get users from registry system (PRIMARY)
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
      console.log('📋 Community: User registry entries:', Object.keys(userRegistry).length);
      
      Object.entries(userRegistry).forEach(([email, userData]: [string, any]) => {
        if (userData.id && !userIds.has(userData.id)) {
          let profile = getProfileForUser(userData.id);
          
          if (!profile) {
            profile = {
              id: userData.id,
              username: userData.username || `user_${userData.id}`,
              email: userData.email || email,
              bio: '',
              tier: 'New Member',
              joinedDate: new Date().toISOString().split('T')[0],
              stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
            };
          }
          
          if (profile.username) {
            const user = createUserFromProfile(profile);
            allUsers.push(user);
            userIds.add(userData.id);
            console.log(`✅ Community: Added registry user: ${profile.username} (ID: ${userData.id})`);
          }
        }
      });

      // 2. Get users from current session
      const currentSession = localStorage.getItem('userSession');
      if (currentSession) {
        try {
          const session = JSON.parse(currentSession);
          if (session.user && session.user.id && !userIds.has(session.user.id)) {
            let profile = getProfileForUser(session.user.id);
            
            if (!profile) {
              profile = {
                id: session.user.id,
                username: session.user.username || `user_${session.user.id}`,
                email: session.user.email,
                bio: '',
                tier: 'New Member',
                joinedDate: new Date().toISOString().split('T')[0],
                stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
              };
            }
            
            if (profile.username) {
              const user = createUserFromProfile(profile);
              allUsers.push(user);
              userIds.add(session.user.id);
              console.log(`✅ Community: Added session user: ${profile.username} (ID: ${session.user.id})`);
            }
          }
        } catch (error) {
          console.warn('Community: Error processing session user:', error);
        }
      }

      // 3. Get users from new user_ storage system
      const newProfileKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('user_') && key.endsWith('_profile')
      );
      console.log('🗂️ Community: Found', newProfileKeys.length, 'new-style profiles');
      
      newProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (profile.id && profile.username && !userIds.has(profile.id)) {
            const user = createUserFromProfile(profile);
            allUsers.push(user);
            userIds.add(profile.id);
            console.log(`✅ Community: Added new storage user: ${profile.username} (ID: ${profile.id})`);
          }
        } catch (error) {
          console.error('Community: Error parsing new profile:', key, error);
        }
      });

      // 4. Get users from old userProfile_ system
      const oldProfileKeys = Object.keys(localStorage).filter(key => key.startsWith('userProfile_'));
      console.log('📁 Community: Found', oldProfileKeys.length, 'old-style profiles');
      
      oldProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          if (profile.id && profile.username && !userIds.has(profile.id)) {
            const user = createUserFromProfile(profile);
            allUsers.push(user);
            userIds.add(profile.id);
            console.log(`✅ Community: Added old storage user: ${profile.username} (ID: ${profile.id})`);
          }
        } catch (error) {
          console.error('Community: Error parsing old profile:', key, error);
        }
      });

      console.log(`📊 Community: Total unique users found: ${allUsers.length}`);

    } catch (error) {
      console.error('❌ Community: Error getting users:', error);
    }

    return allUsers;
  };

  // Helper function to get profile for a user ID
  const getProfileForUser = (userId: number): any => {
    // Try new storage first
    try {
      const manualKey = `user_${userId}_profile`;
      const manualProfile = localStorage.getItem(manualKey);
      if (manualProfile) {
        return JSON.parse(manualProfile);
      }
    } catch (error) {
      // Continue to old storage
    }

    // Try old storage
    try {
      const oldKey = `userProfile_${userId}`;
      const oldProfile = localStorage.getItem(oldKey);
      if (oldProfile) {
        return JSON.parse(oldProfile);
      }
    } catch (error) {
      // No profile found
    }

    return null;
  };

  // Helper function to create User object from profile
  const createUserFromProfile = (profile: any): User => {
    return {
      id: profile.id,
      username: profile.username,
      email: profile.email || '',
      tier: profile.tier || 'New Member',
      joinedDate: profile.joinedDate || new Date().toISOString().split('T')[0],
      stats: profile.stats || {
        totalPledges: 0,
        totalVotes: 0,
        dropsJoined: 0,
        followers: 0,
        following: 0
      },
      avatar: profile.avatar || null,
      bio: profile.bio || ''
    };
  };

  useEffect(() => {
    if (!mounted) return;

    const loadAllProfiles = () => {
      try {
        const allProfiles: UserProfile[] = [];
        
        // Get users from new registry system
        try {
          const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
          
          Object.values(userRegistry).forEach((userData: any) => {
            let profile;
            try {
              profile = UserStorage?.getUserProfile?.(userData.id);
            } catch (error) {
              const manualKey = `user_${userData.id}_profile`;
              const manualProfile = localStorage.getItem(manualKey);
              profile = manualProfile ? JSON.parse(manualProfile) : null;
            }
            
            if (profile && profile.username) {
              allProfiles.push({
                ...profile,
                stats: profile.stats || { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
              });
            }
          });
        } catch (error) {
          console.error('Error reading user registry:', error);
        }
        
        // Get users from other storage systems as fallback
        const allKeys = Object.keys(localStorage);
        
        // Check old userProfile_ system
        const oldProfileKeys = allKeys.filter(key => key.startsWith('userProfile_'));
        oldProfileKeys.forEach(key => {
          try {
            const profile = JSON.parse(localStorage.getItem(key) || '{}');
            const userId = parseInt(key.replace('userProfile_', ''));
            
            if (allProfiles.some(p => p.id === userId)) return;
            
            if (profile.id && profile.username) {
              allProfiles.push({
                ...profile,
                stats: profile.stats || { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
              });
            }
          } catch (error) {
            console.error('Error parsing old profile:', error);
          }
        });
        
        // Check new user_ system
        const newProfileKeys = allKeys.filter(key => key.startsWith('user_') && key.endsWith('_profile'));
        newProfileKeys.forEach(key => {
          try {
            const profile = JSON.parse(localStorage.getItem(key) || '{}');
            
            if (allProfiles.some(p => p.id === profile.id)) return;
            
            if (profile.id && profile.username) {
              allProfiles.push({
                ...profile,
                stats: profile.stats || { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
              });
            }
          } catch (error) {
            console.error('Error parsing new profile:', error);
          }
        });
        
        setProfiles(allProfiles);
      } catch (error) {
        console.error('Error loading profiles:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllProfiles();
  }, [mounted]);

  const filteredAndSortedProfiles = profiles
    .filter(profile => 
      profile.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (profile.bio && profile.bio.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.joinedDate || '').getTime() - new Date(a.joinedDate || '').getTime();
        case 'active':
          const aActivity = (a.stats?.totalPledges || 0) + (a.stats?.totalVotes || 0) + (a.stats?.dropsJoined || 0);
          const bActivity = (b.stats?.totalPledges || 0) + (b.stats?.totalVotes || 0) + (b.stats?.dropsJoined || 0);
          return bActivity - aActivity;
        case 'name':
          return a.username.localeCompare(b.username);
        default:
          return 0;
      }
    });

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading community members...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Community Members - MIGISTUS</title>
        <meta name="description" content="Discover and connect with MIGISTUS community members" />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="px-4 sm:px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-4">Community Members</h1>
              <p className="text-gray-400 text-lg">
                Discover and connect with {profiles.length} amazing MIGISTUS members
              </p>
            </div>

            {/* Search and Filter Controls */}
            <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-700 mb-8">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search members by username or bio..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  />
                </div>
                <div>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'active' | 'name')}
                    className="px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="newest">Newest Members</option>
                    <option value="active">Most Active</option>
                    <option value="name">Alphabetical</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Members Grid */}
            {filteredAndSortedProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAndSortedProfiles.map((profile) => {
                  const profileSlug = createSlug(profile.username);
                  const totalActivity = (profile.stats?.totalPledges || 0) + 
                                      (profile.stats?.totalVotes || 0) + 
                                      (profile.stats?.dropsJoined || 0);
                  
                  return (
                    <Link
                      key={profile.id}
                      href={`/account/profile/${profileSlug}`}
                      className="bg-zinc-900 rounded-xl border border-zinc-700 hover:border-yellow-400/50 transition-all duration-200 overflow-hidden group"
                    >
                      <div className="p-6">
                        {/* Avatar and Tier */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="relative w-16 h-16 rounded-full border-2 border-zinc-600 group-hover:border-yellow-400/50 bg-zinc-800 overflow-hidden transition-colors">
                            {profile.avatar ? (
                              <Image
                                src={profile.avatar}
                                alt={`${profile.username}'s Avatar`}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <Image
                                src="/Icons/New Member.png"
                                alt="Default Avatar"
                                fill
                                className="object-contain p-2"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-lg text-white group-hover:text-yellow-400 transition-colors truncate">
                              {profile.username}
                            </h3>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getTierColor(profile.tier || "New Member")} text-black`}>
                              <span>{getTierEmoji(profile.tier || "New Member")}</span>
                              {profile.tier || "New Member"}
                            </div>
                          </div>
                        </div>

                        {/* Bio */}
                        <div className="mb-4">
                          {profile.bio ? (
                            <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
                              {profile.bio}
                            </p>
                          ) : (
                            <p className="text-gray-500 text-sm italic">
                              No bio added yet
                            </p>
                          )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 mb-4">
                          <div className="text-center p-2 bg-zinc-800 rounded-lg">
                            <div className="text-lg font-bold text-yellow-400">
                              {profile.stats?.totalPledges || 0}
                            </div>
                            <div className="text-xs text-gray-400">Pledges</div>
                          </div>
                          <div className="text-center p-2 bg-zinc-800 rounded-lg">
                            <div className="text-lg font-bold text-blue-400">
                              {profile.stats?.totalVotes || 0}
                            </div>
                            <div className="text-xs text-gray-400">Votes</div>
                          </div>
                          <div className="text-center p-2 bg-zinc-800 rounded-lg">
                            <div className="text-lg font-bold text-green-400">
                              {profile.stats?.dropsJoined || 0}
                            </div>
                            <div className="text-xs text-gray-400">Drops</div>
                          </div>
                        </div>

                        {/* Join Date */}
                        <div className="text-xs text-gray-400 text-center">
                          Member since {new Date(profile.joinedDate || '').toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold mb-2">No members found</h3>
                <p className="text-gray-400">
                  {searchTerm ? 'Try adjusting your search terms' : 'No community members found'}
                </p>
              </div>
            )}

            {/* Community Stats */}
            <div className="mt-12 bg-zinc-900 rounded-xl p-6 border border-zinc-700">
              <h2 className="text-2xl font-bold mb-6 text-center">Community Overview</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-400 mb-2">
                    {profiles.length}
                  </div>
                  <div className="text-gray-400">Total Members</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400 mb-2">
                    {profiles.reduce((sum, p) => sum + (p.stats?.totalVotes || 0), 0)}
                  </div>
                  <div className="text-gray-400">Total Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-400 mb-2">
                    {profiles.reduce((sum, p) => sum + (p.stats?.totalPledges || 0), 0)}
                  </div>
                  <div className="text-gray-400">Total Pledges</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-400 mb-2">
                    {profiles.reduce((sum, p) => sum + (p.stats?.dropsJoined || 0), 0)}
                  </div>
                  <div className="text-gray-400">Drops Joined</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
