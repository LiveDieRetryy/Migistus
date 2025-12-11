import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { Search, Users, TrendingUp, MessageCircle, Heart, Share2, MoreHorizontal, UserPlus, Sparkles, Edit3, Send, ChevronDown, Zap, Globe, Shield, Award, Package } from "lucide-react";
import MainNavbar from "@/components/nav/MainNavbar";
import { useAuth } from "@/context/AuthContext";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import { activityTracker } from "@/utils/activityTracker";
import FollowButton from '@/components/FollowButton';
import { SocialPostsStorage } from "@/utils/socialPostsStorage";
import OnlineStatus from "@/components/OnlineStatus";

interface User {
  id: number;
  username: string;
  email: string;
  tier?: string;
  avatar?: string;
  bio?: string;
  joinedDate?: string;
  country?: string;
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
}

interface AuthUser {
  id: number;
  username: string;
  email: string;
  tier?: string;
  avatar?: string;
}

interface Post {
  id: string;
  userId: number;
  username: string;
  avatar?: string;
  tier?: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: number;
  shares: number;
  type: 'vote' | 'pledge' | 'comment' | 'general';
  productName?: string;
  isLiked?: boolean;
  visibility?: 'public' | 'followers' | 'private';
}

interface Activity {
  type: string;
  timestamp: string;
  productName?: string;
  [key: string]: any;
}

export default function CommunityPage() {  
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'feed' | 'members' | 'suppliers'>('feed');
  const [feedFilter, setFeedFilter] = useState<'personal' | 'local' | 'worldwide'>('personal');

  // Check for tab query parameter on mount
  useEffect(() => {
    if (router.query.tab === 'suppliers') {
      setActiveTab('suppliers');
    } else if (router.query.tab === 'members') {
      setActiveTab('members');
    } else if (router.query.tab === 'feed') {
      setActiveTab('feed');
    }
  }, [router.query.tab]);

  const [posts, setPosts] = useState<Post[]>([]);
  const [newUsers, setNewUsers] = useState<User[]>([]);
  const [allMembers, setAllMembers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<User[]>([]);  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'active' | 'name'>('newest');
  const [loading, setLoading] = useState(true);  const [following, setFollowing] = useState<number[]>([]);  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [isGuildModalOpen, setIsGuildModalOpen] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  
  // Live stats tracking
  const [liveStats, setLiveStats] = useState({
    countries: 0,
    totalInteractions: 0
  });

  // Load live stats from backend
  useEffect(() => {
    const loadLiveStats = async () => {
      try {
        // Fetch users for country count
        const usersResponse = await fetch('/api/users');
        const usersData = await usersResponse.json();
        const users = usersData.users || [];
        
        // Count unique countries
        const countries = new Set(
          users
            .filter((u: any) => !u.banned)
            .map((u: any) => u.country || u.location?.country)
            .filter((c: string) => c && c.trim() !== '')
        );
        
        // Fetch voting data for interactions
        const votingResponse = await fetch('/data/voting.json');
        const votingData = await votingResponse.json();
        const totalVotes = votingData.products?.reduce((sum: number, p: any) => sum + (p.votes || 0), 0) || 0;
        
        // Fetch pledges for more interactions
        const pledgesResponse = await fetch('/data/pledges.json');
        const pledgesData = await pledgesResponse.json();
        const totalPledges = pledgesData.pledges?.length || 0;
        
        // Calculate total interactions (votes + pledges + posts + comments)
        const totalInteractions = totalVotes + totalPledges + posts.length;
        
        setLiveStats({
          countries: countries.size,
          totalInteractions
        });
      } catch (error) {
        console.error('Failed to load live stats:', error);
      }
    };
    
    loadLiveStats();
    const interval = setInterval(loadLiveStats, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [posts.length]);

  useEffect(() => {
    loadCommunityData();
  }, [user]);  // Listen for real-time post updates from profile pages
  useEffect(() => {
    const handleNewPost = async () => {
      if (user && !loading) {
        const refreshedPosts = await generateLiveFeedPosts();
        setPosts(refreshedPosts);
      }
    };

    // Listen for custom event when a new post is created
    window.addEventListener('newSocialPost', handleNewPost);
    
    return () => {
      window.removeEventListener('newSocialPost', handleNewPost);
    };
  }, [user, loading, feedFilter, following]);

  // Listen for follower updates to refresh following list and feed
  useEffect(() => {    const handleFollowerUpdate = async (event: Event) => {
      if (!user) return;
      
      const customEvent = event as CustomEvent;
      const { followerId, followingId, action } = customEvent.detail;
      
      console.log('🔔 Community page received follower update:', customEvent.detail);
      
      // If current user followed/unfollowed someone, update following list
      if (followerId === user.id) {
        const updatedFollowingList = UserStorage.getFollowingList(user.id) || [];
        const updatedFollowingIds = updatedFollowingList.map((item: any) => {
          if (typeof item === 'object' && item.userId) {
            return item.userId;
          } else if (typeof item === 'object' && item.id) {
            return item.id;
          } else if (typeof item === 'number') {
            return item;
          } else {
            return parseInt(item);
          }
        }).filter((id: number) => !isNaN(id));
        
        setFollowing(updatedFollowingIds);
        
        // Refresh feed to show/hide posts based on new following status
        if (!loading) {
          const refreshedPosts = await generateLiveFeedPosts();
          setPosts(refreshedPosts);
        }
      }
      
      // Update local state immediately with UserStorage data
      const updateMemberStats = (members: any[]) => {
        return members.map(member => {
          // Update stats for both the follower and the person being followed
          if (member.id === followerId || member.id === followingId) {
            return {
              ...member,
              stats: {
                ...member.stats,
                followers: UserStorage.getUserFollowers(member.id) || 0,
                following: UserStorage.getUserFollowing(member.id) || 0,
                totalVotes: member.stats?.totalVotes || 0,
                totalPledges: member.stats?.totalPledges || 0,
                dropsJoined: member.stats?.dropsJoined || 0
              }
            };
          }
          return member;
        });
      };
      
      setNewUsers(prevUsers => updateMemberStats(prevUsers));
      setAllMembers(prevMembers => updateMemberStats(prevMembers));
      
      // Fetch updated user data from API to get accurate follower counts
      try {
        // Small delay to ensure API has finished updating the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          
          if (data.users && Array.isArray(data.users)) {
            // Update newUsers with fresh data from USERSTORAGE (source of truth)
            setNewUsers(prevUsers => 
              prevUsers.map(member => {
                const updatedUser = data.users.find((u: any) => u.id === member.id);
                if (updatedUser) {
                  return {
                    ...member,
                    stats: {
                      // Use UserStorage for followers/following (same as profile page)
                      followers: UserStorage.getUserFollowers(updatedUser.id) || 0,
                      following: UserStorage.getUserFollowing(updatedUser.id) || 0,
                      // Use API for other stats
                      totalVotes: updatedUser.totalVotes || 0,
                      totalPledges: updatedUser.totalPledges || 0,
                      dropsJoined: updatedUser.dropsJoined || 0
                    }
                  };
                }
                return member;
              })
            );
            
            // Update allMembers with fresh data from USERSTORAGE (source of truth)
            setAllMembers(prevMembers => 
              prevMembers.map(member => {
                const updatedUser = data.users.find((u: any) => u.id === member.id);
                if (updatedUser) {
                  return {
                    ...member,
                    stats: {
                      // Use UserStorage for followers/following (same as profile page)
                      followers: UserStorage.getUserFollowers(updatedUser.id) || 0,
                      following: UserStorage.getUserFollowing(updatedUser.id) || 0,
                      // Use API for other stats
                      totalVotes: updatedUser.totalVotes || 0,
                      totalPledges: updatedUser.totalPledges || 0,
                      dropsJoined: updatedUser.dropsJoined || 0
                    }
                  };
                }
                return member;
              })
            );
            
            // Update suppliers list as well
            setSuppliers(prevSuppliers => 
              prevSuppliers.map(supplier => {
                const updatedUser = data.users.find((u: any) => u.id === supplier.id);
                if (updatedUser) {
                  return {
                    ...supplier,
                    stats: {
                      followers: UserStorage.getUserFollowers(updatedUser.id) || 0,
                      following: UserStorage.getUserFollowing(updatedUser.id) || 0,
                      totalVotes: updatedUser.totalVotes || 0,
                      totalPledges: updatedUser.totalPledges || 0,
                      dropsJoined: updatedUser.dropsJoined || 0
                    }
                  };
                }
                return supplier;
              })
            );
            
            console.log(`✅ Refreshed follower counts from UserStorage after ${action}`);
          }
        }
      } catch (error) {
        console.error('Failed to refresh follower counts:', error);
      }
    };    // Listen for follower update events
    window.addEventListener('followerUpdate', handleFollowerUpdate);
    
    return () => {
      window.removeEventListener('followerUpdate', handleFollowerUpdate);
    };
  }, [user, loading, feedFilter]);

  // Listen for new user registrations to update member list
  useEffect(() => {
    const handleNewUserRegistration = async (event: Event) => {
      console.log('🔔 Community page received new user registration event');
      
      // Reload all members from API to include newly registered user
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ Reloaded ${data.users?.length || 0} users after new registration`);
          
          if (data.users && Array.isArray(data.users) && data.users.length > 0) {
            const apiMembers: User[] = data.users
              .filter((u: any) => !u.banned)
              .map((u: any) => {
                const userStorageFollowers = UserStorage.getUserFollowers(u.id) || 0;
                const userStorageFollowing = UserStorage.getUserFollowing(u.id) || 0;
                
                return {
                  id: u.id,
                  username: u.username,
                  email: u.email,
                  tier: u.tier || "New Member",
                  avatar: u.avatar || null,
                  bio: u.bio || "",
                  joinedDate: u.joinDate || u.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                  stats: {
                    followers: userStorageFollowers,
                    following: userStorageFollowing,
                    totalVotes: u.totalVotes || 0,
                    totalPledges: u.totalPledges || 0,
                    dropsJoined: u.dropsJoined || 0
                  }
                };
              });
            
            console.log(`✅ Updated member list with ${apiMembers.length} members`);
            setAllMembers(apiMembers);
            
            // Update suppliers list
            const supplierMembers = apiMembers.filter(m => m.tier === 'Supplier');
            setSuppliers(supplierMembers);
            
            // Also update new users list
            const recentUsers = getNewUsers();
            setNewUsers(recentUsers);
          }
        }
      } catch (error) {
        console.error('❌ Error reloading members after registration:', error);
      }
    };

    window.addEventListener('newUserRegistered', handleNewUserRegistration);
    
    return () => {
      window.removeEventListener('newUserRegistered', handleNewUserRegistration);
    };
  }, []);

  // Periodic refresh to catch any missed updates
  useEffect(() => {
    if (!user || loading) return;

    const refreshInterval = setInterval(async () => {
      const refreshedPosts = await generateLiveFeedPosts();
      setPosts(refreshedPosts);
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [user, loading, feedFilter, following]);

  // Keyboard and click-outside handling for modals
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsGuildModalOpen(false);
        setIsPostModalOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Close guild modal if clicking outside
      if (isGuildModalOpen && !target.closest('.guild-modal-content')) {
        setIsGuildModalOpen(false);
      }
      
      // Close post modal if clicking outside
      if (isPostModalOpen && !target.closest('.post-modal-content')) {
        setIsPostModalOpen(false);
      }
    };

    if (isGuildModalOpen || isPostModalOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };  }, [isGuildModalOpen, isPostModalOpen]);

  // Helper function to load suppliers from suppliers.json
  const loadSuppliersFromJson = async (apiMembers: User[]): Promise<User[]> => {
    try {
      const suppliersResponse = await fetch('/data/suppliers.json');
      if (suppliersResponse.ok) {
        const suppliersData = await suppliersResponse.json();
        console.log(`📦 Loaded ${suppliersData.length} suppliers from suppliers.json`);
        
        // Convert supplier data to User format
        const supplierAccounts: User[] = suppliersData
          .filter((s: any) => s.status === 'active')
          .map((s: any) => {
            // Check if this supplier already exists as a user account
            const existingUser = apiMembers.find(m => m.email === s.email || m.username === s.name);
            
            if (existingUser) {
              // Update existing user with supplier info
              return {
                ...existingUser,
                tier: 'Supplier',
                avatar: s.avatar || existingUser.avatar,
                bio: `${s.companyName} - Supplier since ${new Date(s.joinedDate).getFullYear()}. Specializing in ${s.productCategories.join(', ')}.`,
                location: {
                  country: s.address?.split(',').pop()?.trim() || 'Unknown'
                }
              };
            } else {
              // Create new supplier entry
              const supplierId = parseInt(s.id) || Date.now();
              const userStorageFollowers = UserStorage.getUserFollowers(supplierId) || 0;
              const userStorageFollowing = UserStorage.getUserFollowing(supplierId) || 0;
              
              return {
                id: supplierId,
                username: s.username || s.name || s.companyName,
                email: s.email,
                tier: 'Supplier',
                avatar: s.avatar || null,
                bio: `${s.companyName} - Supplier since ${new Date(s.joinedDate).getFullYear()}. Specializing in ${s.productCategories.join(', ')}.`,
                joinedDate: s.joinedDate,
                country: s.address?.split(',').pop()?.trim(),
                location: {
                  country: s.address?.split(',').pop()?.trim() || 'Unknown'
                },
                stats: {
                  followers: userStorageFollowers,
                  following: userStorageFollowing,
                  totalVotes: 0,
                  totalPledges: 0,
                  dropsJoined: s.totalProducts || 0
                }
              };
            }
          });
        
        return supplierAccounts;
      }
    } catch (error) {
      console.error('Error loading suppliers.json:', error);
    }
    return [];
  };

  const loadCommunityData = async () => {
    try {
      // Load real following list
      if (user) {// Ensure user profile exists
        let userProfile = UserStorage.getUserProfile(user.id);
        if (!userProfile) {
          const authUser = user as AuthUser;
          userProfile = {
            id: user.id,
            username: user.username,
            email: user.email,
            tier: authUser.tier || 'Initiate',
            avatar: authUser.avatar,
            joinedDate: new Date().toISOString(),
            stats: {
              followers: 0,
              following: 0,
              totalVotes: 0,
              totalPledges: 0,
              dropsJoined: 0
            }          };
          UserStorage.setUserProfile(user.id, userProfile);
        }        // Get following list using the correct UserStorage method
        const followingList = UserStorage.getFollowingList(user.id) || [];
        
        // Extract IDs - the method returns objects with userId property
        const followingIds = followingList.map((item: any) => {
          if (typeof item === 'object' && item.userId) {
            return item.userId;
          } else if (typeof item === 'object' && item.id) {
            return item.id;
          } else if (typeof item === 'number') {
            return item;
          } else {
            return parseInt(item);
          }
        }).filter((id: number) => !isNaN(id));

        setFollowing(followingIds);
      }

      // Load posts based on current filter
      const feedPosts = await generateLiveFeedPosts();
      setPosts(feedPosts);

      // Load new users
      const recentUsers = getNewUsers();
      setNewUsers(recentUsers);

      // Load all community members - FETCH FROM API FIRST
      try {
        console.log('📡 Fetching members from API...');
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API returned ${data.users?.length || 0} users`);
          
          if (data.users && Array.isArray(data.users) && data.users.length > 0) {
            // Convert API users to User format (display data only, no auto-creation)
            const apiMembers: User[] = data.users
              .filter((u: any) => !u.banned) // Filter out banned users
              .map((u: any) => {
                // Use UserStorage as the SOURCE OF TRUTH for follower counts (same as profile page)
                const userStorageFollowers = UserStorage.getUserFollowers(u.id) || 0;
                const userStorageFollowing = UserStorage.getUserFollowing(u.id) || 0;
                
                return {
                  id: u.id,
                  username: u.username,
                  email: u.email,
                  tier: u.tier || "New Member",
                  avatar: u.avatar || null,
                  bio: u.bio || "",
                  joinedDate: u.joinDate || u.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
                  stats: {
                    // Use UserStorage for followers/following (same source as profile page)
                    followers: userStorageFollowers,
                    following: userStorageFollowing,
                    // Use API for other stats
                    totalVotes: u.totalVotes || 0,
                    totalPledges: u.totalPledges || 0,
                    dropsJoined: u.dropsJoined || 0
                  }
                };
              });
            
            console.log(`✅ Converted ${apiMembers.length} API users to members (using UserStorage for follower counts)`);
            setAllMembers(apiMembers);
            
            // Load suppliers - combine API users with 'Supplier' tier and suppliers.json
            const supplierMembers = apiMembers.filter(m => m.tier === 'Supplier');
            console.log(`📦 Found ${supplierMembers.length} supplier users from regular members`);
            
            // Load additional suppliers from suppliers.json
            const jsonSuppliers = await loadSuppliersFromJson(apiMembers);
            
            // Merge suppliers, avoiding duplicates by email and ID
            const allSuppliers = [...supplierMembers];
            const existingEmails = new Set(supplierMembers.map(s => s.email.toLowerCase()));
            const existingIds = new Set(supplierMembers.map(s => s.id));
            
            jsonSuppliers.forEach(supplier => {
              const emailExists = existingEmails.has(supplier.email.toLowerCase());
              const idExists = existingIds.has(supplier.id);
              
              if (!emailExists && !idExists) {
                allSuppliers.push(supplier);
                existingEmails.add(supplier.email.toLowerCase());
                existingIds.add(supplier.id);
              } else if (emailExists || idExists) {
                // Update existing supplier with more complete data from JSON
                const index = allSuppliers.findIndex(s => 
                  s.email.toLowerCase() === supplier.email.toLowerCase() || s.id === supplier.id
                );
                if (index !== -1) {
                  allSuppliers[index] = {
                    ...allSuppliers[index],
                    ...supplier,
                    stats: {
                      followers: supplier.stats?.followers ?? allSuppliers[index].stats?.followers ?? 0,
                      following: supplier.stats?.following ?? allSuppliers[index].stats?.following ?? 0,
                      totalVotes: supplier.stats?.totalVotes ?? allSuppliers[index].stats?.totalVotes ?? 0,
                      totalPledges: supplier.stats?.totalPledges ?? allSuppliers[index].stats?.totalPledges ?? 0,
                      dropsJoined: supplier.stats?.dropsJoined ?? allSuppliers[index].stats?.dropsJoined ?? 0
                    }
                  };
                }
              }
            });
            
            console.log(`✅ Total suppliers after merge: ${allSuppliers.length}`);
            setSuppliers(allSuppliers);
          } else {
            // Fallback to localStorage
            console.log('⚠️ No users in API, falling back to localStorage');
            const members = getAllCommunityMembers();
            setAllMembers(members);
            
            // Load suppliers from both localStorage and JSON
            const supplierMembers = members.filter(m => m.tier === 'Supplier');
            const jsonSuppliers = await loadSuppliersFromJson(members);
            
            const allSuppliers = [...supplierMembers];
            const existingEmails = new Set(supplierMembers.map(s => s.email.toLowerCase()));
            const existingIds = new Set(supplierMembers.map(s => s.id));
            
            jsonSuppliers.forEach(supplier => {
              if (!existingEmails.has(supplier.email.toLowerCase()) && !existingIds.has(supplier.id)) {
                allSuppliers.push(supplier);
              }
            });
            
            setSuppliers(allSuppliers);
          }
        } else {
          console.warn('⚠️ API request failed, using localStorage');
          const members = getAllCommunityMembers();
          setAllMembers(members);
          
          // Load suppliers from both localStorage and JSON
          const supplierMembers = members.filter(m => m.tier === 'Supplier');
          const jsonSuppliers = await loadSuppliersFromJson(members);
          
          const allSuppliers = [...supplierMembers];
          const existingEmails = new Set(supplierMembers.map(s => s.email.toLowerCase()));
          const existingIds = new Set(supplierMembers.map(s => s.id));
          
          jsonSuppliers.forEach(supplier => {
            if (!existingEmails.has(supplier.email.toLowerCase()) && !existingIds.has(supplier.id)) {
              allSuppliers.push(supplier);
            }
          });
          
          setSuppliers(allSuppliers);
        }
      } catch (apiError) {
        console.error('❌ Error fetching from API:', apiError);
        // Fallback to localStorage
        const members = getAllCommunityMembers();
        setAllMembers(members);
        
        // Load suppliers from both localStorage and JSON
        const supplierMembers = members.filter(m => m.tier === 'Supplier');
        const jsonSuppliers = await loadSuppliersFromJson(members);
        
        const allSuppliers = [...supplierMembers];
        const existingEmails = new Set(supplierMembers.map(s => s.email.toLowerCase()));
        const existingIds = new Set(supplierMembers.map(s => s.id));
        
        jsonSuppliers.forEach(supplier => {
          if (!existingEmails.has(supplier.email.toLowerCase()) && !existingIds.has(supplier.id)) {
            allSuppliers.push(supplier);
          }
        });
        
        setSuppliers(allSuppliers);
      }

    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };
  const generateLiveFeedPosts = async (): Promise<Post[]> => {
    if (!user) return [];

    const livePosts: Post[] = [];
    let targetUsers: number[] = [];
    
    // Debug: Check what's in localStorage for social posts
    const allSocialPosts = SocialPostsStorage.getAllPosts();
    console.log(`💾 Total social posts in storage: ${allSocialPosts.length}`);
    const userSocialPosts = allSocialPosts.filter(p => p.userId === user.id);
    console.log(`📝 Your posts in storage: ${userSocialPosts.length}`);
    if (userSocialPosts.length > 0) {
      console.log('📋 Your posts details:', userSocialPosts.map(p => ({
        id: p.id,
        content: p.content.substring(0, 50),
        visibility: p.visibility,
        timestamp: p.timestamp,
        userId: p.userId
      })));
    }
    console.log(`🎯 Current user ID: ${user.id}`);
    
    // Determine which users to include based on filter
    switch (feedFilter) {      case 'personal':
        // Include user's own posts, plus posts from people they follow
        const followingUsers = [...following];
        // Ensure no duplicates and current user is always included
        targetUsers = [user.id, ...followingUsers.filter(id => id !== user.id)];
        console.log(`👥 Personal Guild - Target users: [${targetUsers.join(', ')}]`);
        break;
          case 'local':
        // Include users from the same country
        const userProfile = UserStorage.getUserProfile(user.id);
        const userCountry = userProfile?.country || userProfile?.location?.country;
        if (userCountry) {
          const allUsers = getAllCommunityMembers();
          targetUsers = allUsers
            .filter(member => {
              const memberProfile = UserStorage.getUserProfile(member.id);
              const memberCountry = memberProfile?.country || memberProfile?.location?.country;
              return memberCountry === userCountry;
            })
            .map(member => member.id);
          // Ensure current user is included
          if (!targetUsers.includes(user.id)) {
            targetUsers.push(user.id);
          }
        } else {
          // Fallback to personal if no country info
          targetUsers = [user.id, ...following];
        }
        break;
          case 'worldwide':
        // Include all users
        const allUsers = getAllCommunityMembers();
        targetUsers = allUsers.map(member => member.id);
        // Ensure current user is included
        if (!targetUsers.includes(user.id)) {
          targetUsers.push(user.id);
        }
        break;
    }    // Generate posts from user activities AND social posts
    targetUsers.forEach(userId => {
      try {
        let userProfile = UserStorage.getUserProfile(userId);
        
        // CRITICAL: If user profile doesn't exist, create it from API data or session
        if (!userProfile && userId === user.id) {
          console.log(`⚠️ No profile found for current user ${userId}, creating from session data...`);
          userProfile = {
            id: user.id,
            username: user.username,
            email: user.email,
            bio: '',
            tier: 'New Member',
            avatar: null,
            joinedDate: new Date().toISOString().split('T')[0],
            stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
          };
          UserStorage.setUserProfile(user.id, userProfile);
          console.log(`✅ Created profile for current user: ${user.username}`);
        }
        
        if (!userProfile) {
          console.log(`⚠️ No profile found for user ID ${userId}`);
          return;
        }

        // Filter out test accounts from posts
        if (isTestAccount(userProfile)) {
          return;
        }
        
        if (userId === user.id) {
          console.log(`📝 Loading posts for current user: ${userProfile.username}`);
        }

        // 1. Get posts from UserStorage (legacy post activities)
        const userActivity = UserStorage.getUserActivity(userId) || [];
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentActivities = userActivity
          .filter((activity: any) => {
            const activityDate = new Date(activity.timestamp);
            const isRecent = activityDate >= thirtyDaysAgo;
            const isPostType = activity.type === 'post';
            
            return isRecent && isPostType;
          })
          .slice(0, 10);

        // Convert legacy activities to posts
        recentActivities.forEach((activity: any, index: number) => {
          const post: Post = {
            id: `legacy_${userId}_${activity.timestamp}_${index}`,
            userId: userId,
            username: userProfile.username,
            avatar: userProfile.avatar,
            tier: userProfile.tier || 'Initiate',
            content: activity.content || `${userProfile.username} shared something with the community`,
            timestamp: activity.timestamp,
            likes: Math.floor(Math.random() * 20),
            comments: Math.floor(Math.random() * 10),
            shares: Math.floor(Math.random() * 5),
            type: 'general',
            isLiked: false
          };
          
          livePosts.push(post);
        });

        // 2. Get posts from SocialPostsStorage (new social posts from profile)
        const socialPosts = SocialPostsStorage.getUserPosts(userId);
        
        if (userId === user.id) {
          console.log(`📦 SocialPostsStorage for current user: ${socialPosts.length} posts found`);
          if (socialPosts.length > 0) {
            console.log('Post titles:', socialPosts.map(p => `"${p.content.substring(0, 30)}..."`));
          }
        }
        
        const recentSocialPosts = socialPosts.filter(socialPost => {
          const postDate = new Date(socialPost.timestamp);
          return postDate >= thirtyDaysAgo;
        });        // Convert social posts to community feed format
        recentSocialPosts.forEach((socialPost: any) => {
          // Double-check that the social post is not from a test account
          const socialPostProfile = {
            id: socialPost.userId,
            username: socialPost.username,
            email: socialPost.userEmail || ''
          };
          
          if (isTestAccount(socialPostProfile)) {
            return;
          }

          // Apply visibility filtering based on post visibility AND current feed filter
          const isOwnPost = socialPost.userId === user.id;
          const isFollowing = UserStorage.isFollowing(user.id, socialPost.userId);
          const visibility = socialPost.visibility || 'public';
          
          // Debug logging for ALL posts to see what's happening
          console.log(`🔍 Processing post by ${socialPost.username} (ID: ${socialPost.userId}):`, {
            content: socialPost.content.substring(0, 40),
            visibility,
            feedFilter,
            isOwnPost,
            isFollowing,
            currentUserId: user.id
          });
          
          // Determine if post should be shown based on visibility and feed filter
          let canViewPost = false;
          
          if (visibility === 'public') {
            // Public posts appear in ALL guild types
            canViewPost = true;
          } else if (visibility === 'followers') {
            // Followers-only posts ONLY appear in Personal Guild
            // And only if: it's your own post OR you follow the author
            if (feedFilter === 'personal') {
              canViewPost = isOwnPost || isFollowing;
              console.log(`👥 Followers-only post check: isOwnPost=${isOwnPost}, isFollowing=${isFollowing}, canView=${canViewPost}`);
            } else {
              canViewPost = false; // Don't show in Local/Worldwide guilds
              console.log(`🚫 Followers-only post hidden in ${feedFilter} guild`);
            }
          } else if (visibility === 'private') {
            // Private posts ONLY appear for the owner, regardless of guild
            canViewPost = isOwnPost;
          }
          
          if (!canViewPost) {
            console.log(`❌ Post filtered out - visibility: ${visibility}, feedFilter: ${feedFilter}`);
            return;
          }
          
          console.log(`✅ Post will be shown in feed`);

          const post: Post = {
            id: `social_${socialPost.id}`,
            userId: socialPost.userId,
            username: socialPost.username,
            avatar: socialPost.userAvatar,
            tier: socialPost.userTier || 'Initiate',
            content: socialPost.content,
            timestamp: socialPost.timestamp,
            likes: socialPost.likes,
            comments: socialPost.comments,
            shares: socialPost.shares,
            type: 'general',
            isLiked: socialPost.likedBy?.includes(user.id) || false,
            visibility: socialPost.visibility || 'public'
          };
          
          livePosts.push(post);
        });

        // 3. If no recent activities/posts and it's the current user, create a welcome post
        if (recentActivities.length === 0 && recentSocialPosts.length === 0 && userId === user.id) {
          const welcomePost: Post = {
            id: `${userId}_welcome_${Date.now()}`,
            userId: userId,
            username: userProfile.username,
            avatar: userProfile.avatar,
            tier: userProfile.tier || 'Initiate',
            content: `Welcome to the community! Start voting, pledging, and engaging to see your activity here. 🌟`,
            timestamp: new Date().toISOString(),
            likes: 0,
            comments: 0,
            shares: 0,
            type: 'general',
            isLiked: false
          };
          livePosts.push(welcomePost);
        }

      } catch (error) {
        console.error(`❌ Error loading activity for user ${userId}:`, error);
      }
    });// Sort by timestamp (newest first)
    const sortedPosts = livePosts.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 50); // Limit to 50 most recent posts
    
    console.log(`📊 Feed Summary: ${sortedPosts.length} posts total`);
    const ownPosts = sortedPosts.filter(p => p.userId === user.id);
    console.log(`📝 Your posts in feed: ${ownPosts.length}`);
    if (ownPosts.length > 0) {
      console.log('Own posts:', ownPosts.map(p => `"${p.content.substring(0, 30)}..."`));
    }
    
    return sortedPosts;
  };
  const handleCreatePost = async () => {
    if (!user || !newPostContent.trim() || isPosting) return;

    setIsPosting(true);
    
    try {
      const userProfile = UserStorage.getUserProfile(user.id);
      
      // Create post using SocialPostsStorage for consistency with profile posts
      const newPost = SocialPostsStorage.createPost({
        userId: user.id,
        username: user.username,
        userAvatar: userProfile?.avatar || null,
        userTier: userProfile?.tier || 'Initiate',
        content: newPostContent.trim(),
        visibility: 'public',
        tags: [],
        mentions: []
      });

      // Also create legacy activity entry for backward compatibility
      const postActivity = {
        type: 'post',
        timestamp: new Date().toISOString(),
        content: newPostContent.trim(),
        postId: `post_${user.id}_${Date.now()}`
      };

      UserStorage.addUserActivity(user.id, postActivity);

      // Track the activity
      activityTracker.trackActivity({
        type: 'community',
        action: 'community_post',
        details: {
          userId: user.id,
          username: user.username,
          content: newPostContent.trim(),
          feedFilter: feedFilter,
          contentLength: newPostContent.trim().length
        }
      });

      // Refresh the feed from stored activities
      const refreshedPosts = await generateLiveFeedPosts();
      setPosts(refreshedPosts);

      setNewPostContent('');
      setIsPostModalOpen(false);
    } catch (error) {
      console.error('❌ Error creating post:', error);
    } finally {
      setIsPosting(false);
    }
  };
  const generatePostContentFromActivity = (activity: any, username: string): string => {
    switch (activity.type) {
      case 'post':
        return activity.content || `${username} shared a post in the community! 📝`;
      case 'vote':
        return `Voted for ${activity.productName}! Looking forward to this drop. 🗳️`;
      case 'pledge':
        return `Just pledged for ${activity.productName}. Can't wait for the group buy! 💎`;
      case 'comment':
        return `Shared thoughts on ${activity.productName}. Community discussion is so valuable! 💬`;
      case 'like':
        return `Liked a post about ${activity.productName || 'community activity'}. Great content! ❤️`;
      case 'follow':
        return `Started following ${activity.targetUsername}. Building connections in the community! 👥`;
      default:
        return `Active in the community! 🌟`;
    }
  };
  // Update posts when filter changes or following list updates
  useEffect(() => {
    if (user && !loading) {
      const updateFeed = async () => {
        const newPosts = await generateLiveFeedPosts();
        setPosts(newPosts);
      };
      updateFeed();
    }
  }, [feedFilter, following, user, loading]);

  // Helper function to identify bot/test accounts
  const isTestAccount = (profile: any): boolean => {
    if (!profile) return true;
    
    const username = (profile.username || '').toLowerCase();
    const email = (profile.email || '').toLowerCase();
    
    // IMPORTANT: Don't filter out the actual admin account (user ID 1)
    // Only filter test/demo accounts
    if (profile.id === 1 || profile.id === '1') {
      return false; // Never filter out the main admin
    }
    
    // Filter out accounts with test-related names
    const testPatterns = [
      'test', 'bot', 'demo', 'sample', 'mock', 'fake',
      'placeholder', 'example', 'dummy', 'temp'
    ];
    
    // Check username patterns
    if (testPatterns.some(pattern => username.includes(pattern))) {
      return true;
    }
    
    // Check for generic usernames like "user_123"
    if (/^user_\d+$/.test(username)) {
      return true;
    }
    
    // Check email patterns
    if (testPatterns.some(pattern => email.includes(pattern))) {
      return true;
    }
    
    // Filter out test email domains
    const testDomains = ['example.com', 'test.com', 'demo.com', 'localhost'];
    if (testDomains.some(domain => email.includes(domain))) {
      return true;
    }
    
    // Filter out specific test user IDs (if any known test IDs exist)
    const testUserIds = [1001, 1002, 1003, 1004, 101, 102, 103, 999];
    if (testUserIds.includes(profile.id)) {
      return true;
    }
    
    return false;
  };
  const getAllCommunityMembers = (): User[] => {
    const allMembers: User[] = [];
    const userIds = new Set<number>();

    if (typeof window === 'undefined') return allMembers;

    try {
      // Get users from registry system
      const userRegistry = JSON.parse(localStorage.getItem('migistus_user_registry') || '{}');
        Object.entries(userRegistry).forEach(([email, userData]: [string, any]) => {
        if (userData.id && !userIds.has(userData.id)) {
          let profile = getUserProfile(userData.id);
          
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
          
          // Only add if not a test account and has valid username
          if (profile.username && !isTestAccount(profile)) {
            const member = createMemberFromProfile(profile);
            allMembers.push(member);
            userIds.add(userData.id);
          }
        }
      });      // Get users from current session
      const currentSession = localStorage.getItem('userSession');
      if (currentSession) {
        try {
          const session = JSON.parse(currentSession);
          if (session.user && session.user.id && !userIds.has(session.user.id)) {
            let profile = getUserProfile(session.user.id);
            
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
            
            // Only add if not a test account and has valid username
            if (profile.username && !isTestAccount(profile)) {
              const member = createMemberFromProfile(profile);
              allMembers.push(member);
              userIds.add(session.user.id);
            }
          }
        } catch (error) {
          console.warn('Error processing session user:', error);
        }
      }      // Get users from new user_ storage system
      const newProfileKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('user_') && key.endsWith('_profile')
      );
      
      newProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Only add if not a test account and has valid username
          if (profile.id && profile.username && !userIds.has(profile.id) && !isTestAccount(profile)) {
            const member = createMemberFromProfile(profile);
            allMembers.push(member);
            userIds.add(profile.id);
          }
        } catch (error) {
          console.error('Error parsing new profile:', key, error);
        }
      });      // Get users from old userProfile_ system
      const oldProfileKeys = Object.keys(localStorage).filter(key => key.startsWith('userProfile_'));
      
      oldProfileKeys.forEach(key => {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || '{}');
          
          // Only add if not a test account and has valid username
          if (profile.id && profile.username && !userIds.has(profile.id) && !isTestAccount(profile)) {
            const member = createMemberFromProfile(profile);
            allMembers.push(member);
            userIds.add(profile.id);
          }
        } catch (error) {
          console.error('Error parsing old profile:', key, error);
        }
      });

    } catch (error) {
      console.error('Error getting community members:', error);
    }

    return allMembers;
  };

  const getUserProfile = (userId: number): any => {
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

  const createMemberFromProfile = (profile: any): User => {
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
  const getNewUsers = (): User[] => {
    const allMembers = getAllCommunityMembers();
    
    // Sort by join date (newest first) and take recent users
    const sortedByJoinDate = allMembers
      .filter(member => member.joinedDate)
      .sort((a, b) => new Date(b.joinedDate!).getTime() - new Date(a.joinedDate!).getTime())
      .slice(0, 10); // Get 10 most recent users
    
    return sortedByJoinDate;
  };
  const getCurrentFilterInfo = () => {
    switch (feedFilter) {
      case 'personal':
        return { 
          icon: '👥', 
          name: 'Personal Guild', 
          description: `Posts from you and ${following.length} ${following.length === 1 ? 'person' : 'people'} you follow` 
        };
      case 'local':
        return { icon: '🌍', name: 'Local Guild', description: 'Posts from members in your country' };
      case 'worldwide':
        return { icon: '🌐', name: 'Worldwide Guild', description: 'Public posts from all community members' };
    }
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const getTierColor = (tier: string = 'Initiate') => {
    switch (tier) {
      case 'MIGISTUS':
        return 'text-yellow-400';
      case 'Guild':
        return 'text-purple-400';
      case 'Initiate':
        return 'text-blue-400';
      default:
        return 'text-zinc-400';
    }
  };

  const getTierEmoji = (tier: string = 'Initiate') => {
    switch (tier) {
      case 'MIGISTUS':
        return '👑';
      case 'Guild':
        return '⚔️';
      case 'Initiate':
        return '🛡️';
      default:
        return '👤';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - time.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Helper for filter display
  const getGuildFilterDisplay = () => {
    switch (feedFilter) {
      case 'personal':
        return { label: 'Personal Guild', icon: '👥', color: 'text-blue-400' };
      case 'local':
        return { label: 'Local Guild', icon: '🌍', color: 'text-green-400' };
      case 'worldwide':
        return { label: 'Worldwide Guild', icon: '🌐', color: 'text-purple-400' };
      default:
        return { label: 'Personal Guild', icon: '👥', color: 'text-blue-400' };
    }
  };

  return (
    <>
      <Head>
        <title>Community - MIGISTUS | Connect & Discover</title>
        <meta name="description" content="Join the MIGISTUS community. Connect with fellow members, share experiences, and stay updated with the latest activity." />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-black">
        {/* Enhanced Header with Stats - Collapses when any tab is selected */}
        <div className={`relative overflow-hidden bg-gradient-to-br from-black via-zinc-900 to-black transition-all duration-700 ease-in-out py-8`}>
          {/* Animated Background Elements */}
          <div className={`absolute inset-0 transition-opacity duration-700 opacity-0`}>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>
          
          <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700 opacity-0 -translate-y-4 h-0 overflow-hidden`}>
            <div className="text-center mb-12">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-full px-6 py-2 mb-6 backdrop-blur-sm">
                <Users className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-medium">Community Hub</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              
              {/* Heading */}
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Connect & Discover
                </span>
              </h1>
              
              <p className="text-xl text-zinc-300 max-w-3xl mx-auto leading-relaxed mb-8">
                Join thousands of MIGISTUS members sharing experiences, discovering products, 
                and building connections in the ultimate group buying community
              </p>

              {/* Community Stats */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
                <div className="bg-zinc-900/60 backdrop-blur-sm border border-blue-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-blue-400">{allMembers.length}+</div>
                  <div className="text-xs text-zinc-400">Active Members</div>
                </div>
                
                <div className="bg-zinc-900/60 backdrop-blur-sm border border-purple-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-purple-400">{posts.length}+</div>
                  <div className="text-xs text-zinc-400">Recent Posts</div>
                </div>
                
                <div className="bg-zinc-900/60 backdrop-blur-sm border border-orange-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center mb-2">
                    <Package className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="text-2xl font-bold text-orange-400">{suppliers.length}+</div>
                  <div className="text-xs text-zinc-400">Suppliers</div>
                </div>
                
                <div className="bg-zinc-900/60 backdrop-blur-sm border border-green-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center mb-2">
                    <Globe className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-400">{liveStats.countries > 0 ? liveStats.countries : '—'}</div>
                  <div className="text-xs text-zinc-400">Countries</div>
                </div>
                
                <div className="bg-zinc-900/60 backdrop-blur-sm border border-yellow-500/30 rounded-xl p-4 hover:scale-105 transition-transform">
                  <div className="flex items-center justify-center mb-2">
                    <Heart className="w-6 h-6 text-yellow-400" />
                  </div>
                  <div className="text-2xl font-bold text-yellow-400">{liveStats.totalInteractions > 0 ? liveStats.totalInteractions.toLocaleString() : '—'}</div>
                  <div className="text-xs text-zinc-400">Interactions</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="sticky top-0 z-30 bg-black/95 backdrop-blur-xl border-b border-zinc-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex space-x-2 bg-zinc-900/50 border border-zinc-700 rounded-xl p-1.5">
              <button
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'feed'
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <MessageCircle className="w-4 h-4 inline mr-2" />
                Feed
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'members'
                    ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg shadow-green-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Users className="w-4 h-4 inline mr-2" />
                Guild Mates
              </button>
              <button
                onClick={() => setActiveTab('suppliers')}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'suppliers'
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Suppliers
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">          {/* Feed Tab */}
          {activeTab === 'feed' && (
            <div className="space-y-6">
              {!isAuthenticated ? (
                <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-2 border-blue-500/30 rounded-3xl p-12 text-center backdrop-blur-sm">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Users className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Join Our Community</h3>
                  <p className="text-zinc-300 mb-6 max-w-md mx-auto leading-relaxed">
                    Sign in to see posts from people you follow, share your own activity, and engage with the community.
                  </p>
                  <Link href="/login" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105">
                    <Shield className="w-5 h-5" />
                    Sign In to Continue
                    <Sparkles className="w-4 h-4" />
                  </Link>
                  <div className="mt-6 flex items-center justify-center gap-8 text-sm text-zinc-400">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-4 h-4 text-blue-400" />
                      <span>Share Posts</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-pink-400" />
                      <span>Like & Comment</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-green-400" />
                      <span>Follow Members</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>                  {/* Guild Filter and Refresh Controls */}
                  <div className="flex justify-between items-center mb-2">
                    <button
                      onClick={async () => {
                        setLoading(true);
                        const refreshedPosts = await generateLiveFeedPosts();
                        setPosts(refreshedPosts);
                        setLoading(false);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-700/70 transition-all text-zinc-300 hover:text-white text-sm"
                      title="Refresh feed"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </button>
                    <button
                      onClick={() => setIsGuildModalOpen(true)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-700/70 transition-all ${getGuildFilterDisplay().color}`}
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>{getGuildFilterDisplay().icon} {getGuildFilterDisplay().label}</span>
                      <ChevronDown className="w-4 h-4 ml-1" />
                    </button>
                  </div>

                  {/* Guild Filter Modal */}
                  {isGuildModalOpen && (
                    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40" onClick={() => setIsGuildModalOpen(false)}>                      <div
                        className="guild-modal-content bg-zinc-900 border border-zinc-700 rounded-2xl shadow-xl p-6 w-full max-w-xs relative z-50"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <TrendingUp className="w-5 h-5 text-blue-400" />
                          <h3 className="text-lg font-semibold text-white">Select Guild Feed</h3>
                        </div>
                        <div className="flex flex-col gap-3">                          <button
                            onClick={() => { setFeedFilter('personal'); setIsGuildModalOpen(false); }}
                            className={`flex items-center justify-between w-full px-4 py-2 rounded-lg font-medium transition-all ${feedFilter === 'personal' ? 'bg-blue-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
                          >
                            <span className="flex items-center gap-2">
                              👥 Personal Guild
                            </span>
                            <span className="text-xs bg-white/10 px-2 py-1 rounded-full">
                              {following.length + 1} {/* +1 for current user */}
                            </span>
                          </button>
                          <button
                            onClick={() => { setFeedFilter('local'); setIsGuildModalOpen(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${feedFilter === 'local' ? 'bg-green-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
                          >
                            🌍 Local Guild
                          </button>
                          <button
                            onClick={() => { setFeedFilter('worldwide'); setIsGuildModalOpen(false); }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${feedFilter === 'worldwide' ? 'bg-purple-600 text-white' : 'bg-zinc-800/50 text-zinc-400 hover:text-white hover:bg-zinc-700/50'}`}
                          >
                            🌐 Worldwide Guild
                          </button>
                        </div>
                        <button
                          onClick={() => setIsGuildModalOpen(false)}
                          className="absolute top-2 right-3 text-zinc-500 hover:text-white text-xl font-bold"
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  )}                  {/* Share with Community Button */}
                  <button
                    onClick={() => setIsPostModalOpen(true)}
                    className="group w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white p-6 rounded-2xl font-semibold transition-all duration-300 flex items-center justify-center space-x-3 shadow-xl hover:shadow-2xl border-2 border-blue-500/20 hover:scale-[1.02]"
                  >
                    <Edit3 className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-lg">Share with the Community</span>
                    <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
                  </button>

                  {loading ? (
                    <div className="text-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto"></div>
                      <div className="text-zinc-400 mt-4">Loading your feed...</div>
                    </div>                  ) : posts.length === 0 ? (
                    <div className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 border-2 border-zinc-700 rounded-3xl p-12 text-center">
                      <div className="w-20 h-20 bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <MessageCircle className="w-10 h-10 text-zinc-500" />
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3">No Posts Yet</h3>
                      <p className="text-zinc-300 mb-6 max-w-md mx-auto">
                        {feedFilter === 'personal' && "Follow other users or start participating to see activity in your personal feed."}
                        {feedFilter === 'local' && "No recent activity from members in your country. Try expanding to Worldwide Guild."}
                        {feedFilter === 'worldwide' && "No recent community activity found. Be the first to start engaging!"}
                      </p>
                      <div className="flex gap-4 justify-center flex-wrap">
                        <button 
                          onClick={() => setActiveTab('members')}
                          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105"
                        >
                          <Users className="w-5 h-5" />
                          Browse Members
                        </button>
                        {feedFilter !== 'worldwide' && (
                          <button 
                            onClick={() => setFeedFilter('worldwide')}
                            className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white rounded-xl font-semibold transition-all duration-300"
                          >
                            <Globe className="w-5 h-5" />
                            Try Worldwide
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {posts.map((post) => {
                        const isAdminPost = post.userId === 1;
                        const isOwnPost = user && post.userId === user.id;
                        return (
                        <div 
                          key={post.id} 
                          className={`bg-zinc-800/30 rounded-2xl p-6 hover:bg-zinc-700/30 transition-all duration-300 ${
                            isAdminPost 
                              ? 'border-2 border-yellow-500/50 shadow-lg shadow-yellow-500/20' 
                              : isOwnPost
                              ? 'border-2 border-blue-500/50 shadow-lg shadow-blue-500/20'
                              : 'border border-zinc-700'
                          }`}
                        >
                          {/* Post Header */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <div className="relative">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden ${
                                  isAdminPost ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-zinc-700'
                                }`}>
                                  {post.avatar ? (
                                    <Image src={post.avatar} alt={post.username} width={48} height={48} className="object-cover" />
                                  ) : (
                                    <span className={isAdminPost ? 'text-zinc-900' : 'text-zinc-400'}>{getTierEmoji(post.tier)}</span>
                                  )}
                                </div>
                                {/* Online Status Indicator */}
                                <div className="absolute -bottom-1 -right-1">
                                  <OnlineStatus userId={post.userId} size="sm" />
                                </div>
                              </div>
                              <div>
                                <div className="flex items-center space-x-2">
                                  <h4 className={`font-semibold ${isAdminPost ? 'text-yellow-400' : 'text-white'}`}>
                                    {post.username}
                                    {isAdminPost && <span className="ml-2 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30">ADMIN</span>}
                                  </h4>
                                  <span className={`text-sm ${getTierColor(post.tier)}`}>
                                    {getTierEmoji(post.tier)} {post.tier}
                                  </span>
                                </div>
                                <p className="text-sm text-zinc-400">{formatTimeAgo(post.timestamp)}</p>
                              </div>
                            </div>
                            <button className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-zinc-700/50 transition-colors">
                              <MoreHorizontal className="w-5 h-5" />
                            </button>
                          </div>

                          {/* Post Content */}
                          <div className="mb-4">
                            <p className="text-white leading-relaxed">{post.content}</p>
                            {post.productName && (
                              <div className="mt-3 p-3 bg-zinc-700/30 rounded-lg border border-zinc-600">
                                <p className="text-sm text-zinc-300">
                                  <span className="capitalize text-blue-400">{post.type}</span> • {post.productName}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Post Actions */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <button 
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center space-x-2 text-sm transition-colors ${
                                  post.isLiked ? 'text-red-400' : 'text-zinc-400 hover:text-red-400'
                                }`}
                              >
                                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                                <span>{post.likes}</span>
                              </button>
                              <button className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-blue-400 transition-colors">
                                <MessageCircle className="w-5 h-5" />
                                <span>{post.comments}</span>
                              </button>
                              <button className="flex items-center space-x-2 text-sm text-zinc-400 hover:text-green-400 transition-colors">
                                <Share2 className="w-5 h-5" />
                                <span>{post.shares}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-green-900/20 via-green-800/20 to-emerald-900/20 border border-green-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-green-500/10 rounded-xl">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-green-300 mb-1 sm:mb-2">Find Your Guild Mates</h3>
                    <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                      Search and connect with all MIGISTUS members. Use filters to find people with similar interests 
                      and build your community network.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-4 sm:p-6 lg:p-8">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-6 sm:mb-8">
                  <div className="p-1.5 sm:p-2 bg-green-500/10 rounded-lg">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white">Guild Mates Discovery</h2>
                    <p className="text-xs sm:text-sm text-zinc-400 mt-0.5 sm:mt-1">
                      Browse and connect with community members ({allMembers.length} member{allMembers.length !== 1 ? 's' : ''} found)
                    </p>
                  </div>
                </div>
                
                {/* Search and Filter Controls */}
                <div className="flex flex-col md:flex-row gap-4 mb-8">
                  <div className="flex-1">
                    <div className="relative group">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-400 group-focus-within:text-green-400 w-5 h-5 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search members by username or bio..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-zinc-800/50 border border-zinc-600 rounded-xl pl-12 pr-4 py-4 text-white placeholder-zinc-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'active' | 'name')}
                      className="px-5 py-4 bg-zinc-800/50 border border-zinc-600 rounded-xl text-white focus:border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-all cursor-pointer hover:bg-zinc-700/50"
                    >
                      <option value="newest">⏰ Newest Members</option>
                      <option value="active">🔥 Most Active</option>
                      <option value="name">🔤 Alphabetical</option>
                    </select>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
                    <div className="text-zinc-400 mt-2">Loading members...</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {allMembers.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                        <p className="text-zinc-400 text-lg">No members found</p>
                        <p className="text-zinc-500 text-sm mt-2">Try adjusting your search or check back later</p>
                      </div>
                    ) : allMembers
                      .filter(member => {
                        const matchesSearch = member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (member.bio && member.bio.toLowerCase().includes(searchTerm.toLowerCase()));
                        return matchesSearch;
                      })
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
                      })
                      .slice(0, 20) // Show first 20 results
                      .map((member) => (
                        <div key={member.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 border border-zinc-700 rounded-2xl hover:border-green-500/50 transition-all duration-300 hover:scale-[1.01] sm:hover:scale-[1.02] hover:shadow-lg hover:shadow-green-500/10">                          <div className="flex items-center space-x-3 sm:space-x-4 w-full sm:w-auto">
                            <div className="relative flex-shrink-0">
                              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-zinc-600 group-hover:ring-green-500 transition-all">
                                <Image 
                                  src={member.avatar || "/Icons/New Member.png"} 
                                  alt={member.username} 
                                  width={56} 
                                  height={56} 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = "/Icons/New Member.png";
                                  }}
                                />
                              </div>
                              <div className={`absolute -bottom-0.5 sm:-bottom-1 -right-0.5 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 border-zinc-800 flex items-center justify-center ${
                                member.tier === 'MIGISTUS' ? 'bg-yellow-500' :
                                member.tier === 'Guild' ? 'bg-purple-500' : 'bg-blue-500'
                              }`}>
                                <Award className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 sm:gap-2">
                                <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-green-400 transition-colors truncate">{member.username}</h3>
                                <OnlineStatus userId={member.id} size="sm" />
                              </div>
                              <p className={`text-xs sm:text-sm font-medium ${getTierColor(member.tier)}`}>
                                {getTierEmoji(member.tier)} {member.tier}
                              </p>
                              {member.bio && (
                                <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-md truncate">{member.bio}</p>
                              )}
                              <div className="flex flex-wrap gap-2 sm:gap-4 text-[10px] sm:text-xs text-zinc-400 mt-1.5 sm:mt-2">
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {member.stats?.followers || 0} followers
                                </span>
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  {member.stats?.totalVotes || 0} votes
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="w-3 h-3" />
                                  {member.stats?.totalPledges || 0} pledges
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                            <FollowButton 
                              targetUserId={member.id}
                              targetUsername={member.username}
                              size="sm"
                            />                            <Link 
                              href={`/account/profile/${member.username.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                              className="px-3 sm:px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs sm:text-sm rounded-lg font-medium transition-all duration-300 text-center"
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      ))}
                      
                    {allMembers.length === 0 && (
                      <div className="text-center py-12 bg-zinc-800/30 rounded-2xl border border-zinc-700">
                        <div className="w-16 h-16 bg-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Users className="w-8 h-8 text-zinc-500" />
                        </div>
                        <p className="text-zinc-400 text-lg">No community members found</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>          )}

          {/* Suppliers Tab */}
          {activeTab === 'suppliers' && (
            <div className="space-y-6">
              {/* Welcome Message */}
              <div className="bg-gradient-to-r from-purple-900/20 via-purple-800/20 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6 backdrop-blur-sm">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/10 rounded-xl">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-purple-300 mb-2">Connect with Suppliers</h3>
                    <p className="text-zinc-300 text-sm leading-relaxed">
                      Follow suppliers to stay updated on their products, new drops, and exclusive offers. 
                      Build relationships with trusted suppliers in the MIGISTUS marketplace.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-700 rounded-2xl p-8">
                <div className="flex items-center space-x-3 mb-8">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Package className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Verified Suppliers</h2>
                    <p className="text-sm text-zinc-400 mt-1">
                      Discover and follow trusted suppliers ({suppliers.length} supplier{suppliers.length !== 1 ? 's' : ''} available)
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto"></div>
                    <p className="text-zinc-400 mt-4">Loading suppliers...</p>
                  </div>
                ) : (
                  <div className="grid gap-6">
                    {suppliers.length > 0 ? (
                      suppliers.map((supplier) => {
                        const profileSlug = supplier.username.toLowerCase().replace(/[^a-z0-9]/g, '-');
                        
                        return (
                          <div
                            key={supplier.id}
                            className="group bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 border border-zinc-700 hover:border-purple-500/50 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-purple-500/10"
                          >
                            <div className="flex flex-col md:flex-row gap-6">
                              {/* Supplier Avatar and Info */}
                              <div className="flex items-start gap-4 flex-1">
                                <div className="relative">
                                  <div className="w-20 h-20 bg-zinc-700 rounded-xl overflow-hidden ring-2 ring-zinc-600 group-hover:ring-purple-500 transition-all">
                                    <Image 
                                      src={supplier.avatar || '/Icons/SupplierPlaceHolder.png'} 
                                      alt={supplier.username} 
                                      width={80} 
                                      height={80} 
                                      className="object-cover w-full h-full" 
                                    />
                                  </div>
                                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-purple-500 rounded-full border-2 border-zinc-800 flex items-center justify-center">
                                    <Shield className="w-4 h-4 text-white" />
                                  </div>
                                </div>

                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="font-bold text-white text-xl mb-1 group-hover:text-purple-300 transition-colors">
                                        {supplier.username}
                                      </h3>
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs font-medium text-purple-300">
                                          <Shield className="w-3 h-3" />
                                          Verified Supplier
                                        </span>
                                        {supplier.country && (
                                          <span className="text-xs text-zinc-500">
                                            📍 {supplier.country}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {supplier.bio && (
                                    <p className="text-sm text-zinc-300 mb-4 line-clamp-2">
                                      {supplier.bio}
                                    </p>
                                  )}

                                  {/* Supplier Stats */}
                                  <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                      <Users className="w-4 h-4 text-purple-400" />
                                      <span className="font-medium text-white">{supplier.stats?.followers || 0}</span>
                                      <span>followers</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                      <Package className="w-4 h-4 text-purple-400" />
                                      <span className="font-medium text-white">{supplier.stats?.dropsJoined || 0}</span>
                                      <span>products</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-zinc-400">
                                      <TrendingUp className="w-4 h-4 text-purple-400" />
                                      <span className="font-medium text-white">{supplier.stats?.totalVotes || 0}</span>
                                      <span>total votes</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex md:flex-col gap-2 md:justify-center">
                                <FollowButton 
                                  targetUserId={supplier.id}
                                  targetUsername={supplier.username}
                                  size="md"
                                />
                                <Link 
                                  href={`/supplier/${profileSlug}`}
                                  className="flex-1 md:flex-none px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-lg font-medium text-center transition-all duration-300 whitespace-nowrap"
                                >
                                  View Supplier
                                </Link>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 bg-zinc-800/30 rounded-2xl border border-zinc-700">
                        <div className="w-16 h-16 bg-zinc-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                          <Package className="w-8 h-8 text-zinc-500" />
                        </div>
                        <p className="text-zinc-400 text-lg mb-2">No suppliers found</p>
                        <p className="text-zinc-500 text-sm">Check back soon for verified suppliers</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Creation Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setIsPostModalOpen(false)}>
          <div
            className="post-modal-content bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl p-6 w-full max-w-2xl mx-4 relative z-50"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <Edit3 className="w-6 h-6 text-blue-400" />
                <h3 className="text-xl font-semibold text-white">Share with the Community</h3>
              </div>
              <button
                onClick={() => setIsPostModalOpen(false)}
                className="text-zinc-500 hover:text-white text-2xl font-bold transition-colors"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex items-start space-x-4">
              <div className="w-14 h-14 bg-zinc-700 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                <Image 
                  src={(user as AuthUser)?.avatar || "/Icons/New Member.png"} 
                  alt={user?.username || 'User'} 
                  width={56} 
                  height={56} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/Icons/New Member.png";
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="mb-3">
                  <span className="text-sm font-medium text-white">{user?.username}</span>
                  <span className="text-sm text-zinc-400 ml-2">
                    posting to <span className="text-blue-400">
                      {feedFilter === 'personal' && '👥 Personal Guild'}
                      {feedFilter === 'local' && '🌍 Local Guild'}
                      {feedFilter === 'worldwide' && '🌐 Worldwide Guild'}
                    </span>
                  </span>
                </div>
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="Share something with the community..."
                  className="w-full bg-zinc-800/50 border border-zinc-600 rounded-xl p-4 text-white placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none min-h-[120px]"
                  rows={4}
                  maxLength={500}
                  autoFocus
                />
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-zinc-400">
                    <span className={newPostContent.length > 450 ? 'text-orange-400' : newPostContent.length > 480 ? 'text-red-400' : ''}>
                      {newPostContent.length}/500 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setIsPostModalOpen(false)}
                      className="px-6 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim() || isPosting || newPostContent.length > 500}
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>{isPosting ? 'Posting...' : 'Post'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
