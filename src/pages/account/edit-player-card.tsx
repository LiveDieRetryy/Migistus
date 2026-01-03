import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { Camera, Save, X, User, Image as ImageIcon, FileText, Award, MapPin, AlertCircle, Sparkles } from 'lucide-react';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';
import { UserStorage3 as UserStorage } from '@/utils/userStorage';
import AvatarEffects, { AvatarEffectType } from '@/components/effects/AvatarEffects';
import ProfileEffects, { ProfileEffectType } from '@/components/effects/ProfileEffects';
import { avatarEffects, profileEffects, canUserAccessEffect, getTierColor, getTierBadge } from '@/lib/effects';

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

export default function EditPlayerCard() {
  const router = useRouter();
  const { user, isAuthenticated, loading, updateUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Banner editing states
  const [bannerPosition, setBannerPosition] = useState({ x: 0, y: 0 });
  const [bannerScale, setBannerScale] = useState(1);
  const [isDraggingBanner, setIsDraggingBanner] = useState(false);
  const [bannerDragStart, setBannerDragStart] = useState({ x: 0, y: 0 });
  const [isEditingBanner, setIsEditingBanner] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);
  
  // Avatar editing states
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0 });
  const [avatarScale, setAvatarScale] = useState(1);
  const [isDraggingAvatar, setIsDraggingAvatar] = useState(false);
  const [avatarDragStart, setAvatarDragStart] = useState({ x: 0, y: 0 });
  const [isEditingAvatar, setIsEditingAvatar] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);

  const [editForm, setEditForm] = useState({
    avatar: '',
    banner: '',
    bio: '',
    city: '',
    country: '',
    avatarEffect: 'none' as AvatarEffectType,
    profileEffect: 'none' as ProfileEffectType,
  });

  // Account navigation items
  const getProfileSlug = () => {
    if (!user?.username) return "/account/profile";
    return `/account/profile/${user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
  };

  const accountNav = [
    { label: "Account Overview", href: "/account", icon: "🏠" },
    { label: "Notifications", href: "/notifications", icon: "🔔" },
    { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
    { label: "My Orders", href: "/account/orders", icon: "📦" },
    { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
    { label: "My Votes", href: "/account/votes", icon: "🗳️" },
    { label: "Wallet", href: "/wallet", icon: "💰" },
    { label: "View Profile", href: getProfileSlug(), icon: "👤" },
    { label: "Edit Player Card", href: "/account/edit-player-card", icon: "🎴" },
    { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
  ];

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (user) {
      loadProfile();
    }
  }, [user, isAuthenticated, loading, router]);
  
  // Lock page scroll when editing banner
  useEffect(() => {
    if (isEditingBanner) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isEditingBanner]);
  
  // Lock page scroll when editing avatar
  useEffect(() => {
    if (isEditingAvatar) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isEditingAvatar]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/users/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setEditForm({
          avatar: data.avatar || '',
          banner: data.banner || '',
          bio: data.bio || '',
          city: data.location?.city || '',
          country: data.location?.country || data.country || '',
          avatarEffect: (data.avatarEffect as AvatarEffectType) || 'none',
          profileEffect: (data.profileEffect as ProfileEffectType) || 'none',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Avatar must be less than 5MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, avatar: reader.result as string }));
        setIsEditingAvatar(true);
        setAvatarPosition({ x: 0, y: 0 });
        setAvatarScale(1);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'Banner must be less than 10MB' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm(prev => ({ ...prev, banner: reader.result as string }));
        setIsEditingBanner(true);
        setBannerPosition({ x: 0, y: 0 });
        setBannerScale(1);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Banner editing handlers
  const handleBannerMouseDown = (e: React.MouseEvent) => {
    if (!isEditingBanner) return;
    e.preventDefault();
    setIsDraggingBanner(true);
    setBannerDragStart({
      x: e.clientX - bannerPosition.x,
      y: e.clientY - bannerPosition.y
    });
  };

  const handleBannerMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingBanner) return;
    e.preventDefault();
    setBannerPosition({
      x: e.clientX - bannerDragStart.x,
      y: e.clientY - bannerDragStart.y
    });
  };

  const handleBannerMouseUp = () => {
    setIsDraggingBanner(false);
  };

  const handleBannerWheel = (e: React.WheelEvent) => {
    if (!isEditingBanner) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setBannerScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const handleApplyBannerPosition = async () => {
    if (!bannerRef.current) return;
    try {
      const container = bannerRef.current;
      const containerRect = container.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;
      
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = editForm.banner || '';
      });
      
      const scaledWidth = img.naturalWidth * bannerScale;
      const scaledHeight = img.naturalHeight * bannerScale;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const imgX = centerX + bannerPosition.x - (scaledWidth / 2);
      const imgY = centerY + bannerPosition.y - (scaledHeight / 2);
      
      ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
      
      const croppedImage = canvas.toDataURL('image/png');
      setEditForm(prev => ({ ...prev, banner: croppedImage }));
      setIsEditingBanner(false);
      setBannerPosition({ x: 0, y: 0 });
      setBannerScale(1);
    } catch (error) {
      console.error('Error applying banner position:', error);
      setMessage({ type: 'error', text: 'Failed to save banner. Please try again.' });
    }
  };
  
  // Avatar editing handlers
  const handleAvatarMouseDown = (e: React.MouseEvent) => {
    if (!isEditingAvatar) return;
    e.preventDefault();
    setIsDraggingAvatar(true);
    setAvatarDragStart({
      x: e.clientX - avatarPosition.x,
      y: e.clientY - avatarPosition.y
    });
  };

  const handleAvatarMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingAvatar) return;
    e.preventDefault();
    setAvatarPosition({
      x: e.clientX - avatarDragStart.x,
      y: e.clientY - avatarDragStart.y
    });
  };

  const handleAvatarMouseUp = () => {
    setIsDraggingAvatar(false);
  };

  const handleAvatarWheel = (e: React.WheelEvent) => {
    if (!isEditingAvatar) return;
    e.preventDefault();
    e.stopPropagation();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setAvatarScale(prev => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const handleApplyAvatarPosition = async () => {
    if (!avatarRef.current) return;
    try {
      const container = avatarRef.current;
      const containerRect = container.getBoundingClientRect();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;
      
      canvas.width = containerRect.width;
      canvas.height = containerRect.height;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = editForm.avatar || '';
      });
      
      const scaledWidth = img.naturalWidth * avatarScale;
      const scaledHeight = img.naturalHeight * avatarScale;
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const imgX = centerX + avatarPosition.x - (scaledWidth / 2);
      const imgY = centerY + avatarPosition.y - (scaledHeight / 2);
      
      ctx.drawImage(img, imgX, imgY, scaledWidth, scaledHeight);
      
      const croppedImage = canvas.toDataURL('image/png');
      setEditForm(prev => ({ ...prev, avatar: croppedImage }));
      setIsEditingAvatar(false);
      setAvatarPosition({ x: 0, y: 0 });
      setAvatarScale(1);
    } catch (error) {
      console.error('Error applying avatar position:', error);
      setMessage({ type: 'error', text: 'Failed to save avatar. Please try again.' });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setSaving(true);
    setMessage(null);

    try {
      // Upload avatar if changed
      let finalAvatarUrl = profile?.avatar;
      if (editForm.avatar && editForm.avatar.startsWith('data:')) {
        const avatarBlob = await fetch(editForm.avatar).then(r => r.blob());
        const avatarFormData = new FormData();
        avatarFormData.append('avatar', avatarBlob, 'avatar.png');

        const avatarResponse = await fetch('/api/upload/avatar', {
          method: 'POST',
          body: avatarFormData,
          credentials: 'include',
        });

        if (avatarResponse.ok) {
          const avatarData = await avatarResponse.json();
          finalAvatarUrl = avatarData.avatarUrl;
        }
      }

      // Upload banner if changed
      let finalBannerUrl = profile?.banner;
      if (editForm.banner && editForm.banner.startsWith('data:')) {
        const bannerBlob = await fetch(editForm.banner).then(r => r.blob());
        const bannerFormData = new FormData();
        bannerFormData.append('banner', bannerBlob, 'banner.png');

        const bannerResponse = await fetch('/api/upload/banner', {
          method: 'POST',
          body: bannerFormData,
          credentials: 'include',
        });

        if (bannerResponse.ok) {
          const bannerData = await bannerResponse.json();
          finalBannerUrl = bannerData.bannerUrl;
        }
      }

      // Update profile
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bio: editForm.bio,
          avatar: finalAvatarUrl || null,
          banner: finalBannerUrl || null,
          avatarEffect: editForm.avatarEffect,
          profileEffect: editForm.profileEffect,
          location: {
            city: editForm.city,
            country: editForm.country,
          },
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Player card updated successfully!' });
        
        // Reload profile to get fresh data
        await loadProfile();

        // Force a refresh of the user data in localStorage
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('user-profile-updated'));
        }
      } else {
        setMessage({ type: 'error', text: 'Failed to update player card' });
      }
    } catch (error) {
      console.error('Error saving player card:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Edit Player Card - MIGISTUS</title>
        <meta name="description" content="Customize your MIGISTUS player card" />
      </Head>

      <MainNavbar />

      <div className="min-h-screen bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden mb-4 flex items-center space-x-2 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          >
            <span className="text-2xl">☰</span>
            <span>Menu</span>
          </button>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <div
            className={`
            ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-80' : 'hidden'}
            lg:fixed lg:inset-y-20 lg:left-8 lg:block lg:w-64 xl:w-72
            bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl p-6 overflow-y-auto
          `}
          >
            <h2 className="text-2xl font-bold text-yellow-400 mb-6">My Account</h2>
            <nav className="space-y-2">
              {accountNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${
                    router.pathname === item.href
                      ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 text-yellow-400 border-l-4 border-yellow-500'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                  onClick={() => setIsMobileSidebarOpen(false)}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="lg:ml-80 xl:ml-96">
            <div className="bg-zinc-900 border-2 border-yellow-500/30 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-yellow-400 mb-2">Edit Player Card</h1>
                  <p className="text-zinc-400">Customize how you appear to other members</p>
                </div>
              </div>

              {message && (
                <div
                  className={`mb-6 p-4 rounded-xl border ${
                    message.type === 'success'
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    <span>{message.text}</span>
                  </div>
                </div>
              )}

              <div className="space-y-8">
                {/* Banner Section */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                    <ImageIcon className="w-5 h-5 text-yellow-400" />
                    Profile Banner
                  </label>
                  <div 
                    ref={bannerRef}
                    className="relative h-40 bg-zinc-800 rounded-xl overflow-hidden border-2 border-zinc-700 hover:border-yellow-500/50 transition-colors group"
                    style={{ touchAction: isEditingBanner ? 'none' : 'auto' }}
                    onMouseDown={handleBannerMouseDown}
                    onMouseMove={handleBannerMouseMove}
                    onMouseUp={handleBannerMouseUp}
                    onMouseLeave={handleBannerMouseUp}
                    onWheel={handleBannerWheel}
                  >
                    {editForm.banner ? (
                      <img
                        src={editForm.banner}
                        alt="Banner"
                        className={isEditingBanner ? 'cursor-move select-none' : 'w-full h-full object-cover'}
                        draggable={false}
                        style={isEditingBanner ? {
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: `translate(calc(-50% + ${bannerPosition.x}px), calc(-50% + ${bannerPosition.y}px)) scale(${bannerScale})`,
                          transformOrigin: 'center center',
                          willChange: 'transform',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          width: 'auto',
                          height: 'auto',
                          maxWidth: 'none',
                          maxHeight: 'none'
                        } : undefined}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/30 via-purple-600/30 to-pink-600/30" />
                    )}
                    
                    {/* Grid overlay for editing */}
                    {isEditingBanner && (
                      <div className="absolute inset-0 pointer-events-none z-10">
                        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                          <defs>
                            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.3"/>
                            </pattern>
                          </defs>
                          <rect width="100%" height="100%" fill="url(#grid)" />
                          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
                          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
                        </svg>
                      </div>
                    )}
                    
                    {!isEditingBanner && (
                      <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-semibold flex items-center gap-2">
                          <Camera className="w-5 h-5" />
                          Change Banner
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBannerChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  
                  {/* Banner editing controls */}
                  {isEditingBanner && (
                    <div className="mt-3 bg-zinc-800/50 rounded-lg p-3 border border-yellow-500/30">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold">
                          <span>🎨</span>
                          <span>Position Banner: Drag • Scroll to zoom</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-gray-300 text-xs font-semibold whitespace-nowrap">Zoom:</span>
                          <input
                            type="range"
                            min={0.1}
                            max={5}
                            step={0.05}
                            value={bannerScale}
                            onChange={(e) => setBannerScale(Number(e.target.value))}
                            className="flex-1 h-2 bg-zinc-700 rounded-lg accent-yellow-500 cursor-pointer"
                          />
                          <span className="text-yellow-400 text-xs font-mono font-bold w-12 text-right">{Math.round(bannerScale * 100)}%</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setBannerPosition({ x: 0, y: 0 })}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            🎯 Center
                          </button>
                          <button
                            onClick={() => {
                              setBannerPosition({ x: 0, y: 0 });
                              setBannerScale(1);
                            }}
                            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            🔄 Reset
                          </button>
                          <button
                            onClick={() => {
                              setIsEditingBanner(false);
                              setEditForm(prev => ({ ...prev, banner: profile?.banner || '' }));
                              setBannerPosition({ x: 0, y: 0 });
                              setBannerScale(1);
                            }}
                            className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold transition-all"
                          >
                            ✕ Cancel
                          </button>
                          <button
                            onClick={handleApplyBannerPosition}
                            className="px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black rounded-lg text-xs font-bold transition-all shadow-lg"
                          >
                            ✓ Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <p className="text-xs text-zinc-400 mt-2">Recommended: 1200x400px, max 10MB</p>
                </div>

                {/* Avatar Section */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                    <User className="w-5 h-5 text-yellow-400" />
                    Profile Avatar
                  </label>
                  <div className="flex flex-col gap-4">
                    <div 
                      ref={avatarRef}
                      className="relative w-32 h-32 mx-auto bg-zinc-800 rounded-full overflow-hidden border-4 border-zinc-700 hover:border-yellow-500/50 transition-colors group"
                      style={{ touchAction: isEditingAvatar ? 'none' : 'auto' }}
                      onMouseDown={handleAvatarMouseDown}
                      onMouseMove={handleAvatarMouseMove}
                      onMouseUp={handleAvatarMouseUp}
                      onMouseLeave={handleAvatarMouseUp}
                      onWheel={handleAvatarWheel}
                    >
                      <img
                        src={editForm.avatar || "/Icons/New Member.png"}
                        alt="Avatar"
                        className={isEditingAvatar ? 'cursor-move select-none' : 'w-full h-full object-cover'}
                        draggable={false}
                        style={isEditingAvatar ? {
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: `translate(calc(-50% + ${avatarPosition.x}px), calc(-50% + ${avatarPosition.y}px)) scale(${avatarScale})`,
                          transformOrigin: 'center center',
                          willChange: 'transform',
                          pointerEvents: 'none',
                          userSelect: 'none',
                          width: 'auto',
                          height: 'auto',
                          maxWidth: 'none',
                          maxHeight: 'none'
                        } : undefined}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/Icons/New Member.png";
                        }}
                      />
                      
                      {/* Grid overlay for editing */}
                      {isEditingAvatar && (
                        <div className="absolute inset-0 pointer-events-none z-10">
                          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="50%" cy="50%" r="45%" fill="none" stroke="#F59E0B" strokeWidth="1" opacity="0.5" />
                            <circle cx="50%" cy="50%" r="30%" fill="none" stroke="#F59E0B" strokeWidth="0.5" opacity="0.3" />
                            <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#F59E0B" strokeWidth="0.5" opacity="0.3" />
                            <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#F59E0B" strokeWidth="0.5" opacity="0.3" />
                          </svg>
                        </div>
                      )}
                      
                      {!isEditingAvatar && (
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <Camera className="w-8 h-8 text-yellow-400" />
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAvatarChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    
                    {/* Avatar editing controls */}
                    {isEditingAvatar && (
                      <div className="bg-zinc-800/50 rounded-lg p-3 border border-yellow-500/30">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold">
                            <span>🎨</span>
                            <span>Position Avatar: Drag • Scroll to zoom</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-gray-300 text-xs font-semibold whitespace-nowrap">Zoom:</span>
                            <input
                              type="range"
                              min={0.1}
                              max={5}
                              step={0.05}
                              value={avatarScale}
                              onChange={(e) => setAvatarScale(Number(e.target.value))}
                              className="flex-1 h-2 bg-zinc-700 rounded-lg accent-yellow-500 cursor-pointer"
                            />
                            <span className="text-yellow-400 text-xs font-mono font-bold w-12 text-right">{Math.round(avatarScale * 100)}%</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setAvatarPosition({ x: 0, y: 0 })}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              🎯 Center
                            </button>
                            <button
                              onClick={() => {
                                setAvatarPosition({ x: 0, y: 0 });
                                setAvatarScale(1);
                              }}
                              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              🔄 Reset
                            </button>
                            <button
                              onClick={() => {
                                setIsEditingAvatar(false);
                                setEditForm(prev => ({ ...prev, avatar: profile?.avatar || '' }));
                                setAvatarPosition({ x: 0, y: 0 });
                                setAvatarScale(1);
                              }}
                              className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg text-xs font-bold transition-all"
                            >
                              ✕ Cancel
                            </button>
                            <button
                              onClick={handleApplyAvatarPosition}
                              className="px-3 py-1.5 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600 text-black rounded-lg text-xs font-bold transition-all shadow-lg"
                            >
                              ✓ Save
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-zinc-400 text-center">Recommended: 400x400px, max 5MB</p>
                  </div>
                </div>

                {/* Bio Section */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                    <FileText className="w-5 h-5 text-yellow-400" />
                    Bio
                  </label>
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    placeholder="Tell others about yourself..."
                    className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500 resize-none"
                    rows={4}
                    maxLength={200}
                  />
                  <p className="text-xs text-zinc-400 mt-2">
                    {editForm.bio.length}/200 characters
                  </p>
                </div>

                {/* Location Section */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                    <MapPin className="w-5 h-5 text-yellow-400" />
                    Location
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="text"
                        value={editForm.city}
                        onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                        placeholder="City"
                        className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={editForm.country}
                        onChange={(e) => setEditForm({ ...editForm, country: e.target.value })}
                        placeholder="Country"
                        className="w-full bg-zinc-800 border-2 border-zinc-700 rounded-xl px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-yellow-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Avatar Effects Section */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Avatar Effect
                  </label>
                  <p className="text-sm text-zinc-400 mb-4">Choose an animated effect for your avatar</p>
                  
                  {/* Preview */}
                  <div className="mb-6 p-6 bg-zinc-800/50 rounded-xl border border-zinc-700 flex justify-center">
                    <div className="w-40 h-40 p-2">
                      <AvatarEffects effect={editForm.avatarEffect} size="xl">
                        <div className="w-full h-full bg-zinc-700 rounded-full overflow-hidden relative">
                          <Image
                            src={editForm.avatar || "/Icons/New Member.png"}
                            alt="Preview"
                            width={160}
                            height={160}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </AvatarEffects>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {avatarEffects.map((effect) => {
                      const canAccess = canUserAccessEffect(profile?.tier, effect.tier);
                      return (
                        <button
                          key={effect.id}
                          onClick={() => canAccess && setEditForm({ ...editForm, avatarEffect: effect.id })}
                          disabled={!canAccess}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            editForm.avatarEffect === effect.id
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : canAccess
                              ? 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                              : 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-3xl mb-2">{effect.icon}</div>
                          <div className="text-sm font-medium text-white mb-1">{effect.name}</div>
                          <div className="text-xs text-zinc-400">{effect.description}</div>
                          {!canAccess && (
                            <div className={`text-xs font-semibold mt-2 ${getTierColor(effect.tier)}`}>
                              {getTierBadge(effect.tier)} {effect.tier.toUpperCase()} Required
                            </div>
                          )}
                          {editForm.avatarEffect === effect.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-black text-xs">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Profile Effects Section */}
                <div>
                  <label className="flex items-center gap-2 text-lg font-semibold text-white mb-3">
                    <Sparkles className="w-5 h-5 text-yellow-400" />
                    Profile Background Effect
                  </label>
                  <p className="text-sm text-zinc-400 mb-4">Add an animated background to your player card</p>
                  
                  {/* Preview */}
                  <div className="mb-6 p-6 bg-zinc-800/50 rounded-xl border border-zinc-700">
                    <div className="relative h-48 bg-gradient-to-br from-zinc-900 to-black rounded-lg overflow-hidden">
                      <ProfileEffects effect={editForm.profileEffect} />
                      <div className="relative z-10 flex items-center justify-center h-full">
                        <div className="text-center">
                          <div className="text-xl font-bold text-white mb-2">Preview</div>
                          <div className="text-sm text-zinc-400">Background Effect Preview</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {profileEffects.map((effect) => {
                      const canAccess = canUserAccessEffect(profile?.tier, effect.tier);
                      return (
                        <button
                          key={effect.id}
                          onClick={() => canAccess && setEditForm({ ...editForm, profileEffect: effect.id })}
                          disabled={!canAccess}
                          className={`relative p-4 rounded-xl border-2 transition-all ${
                            editForm.profileEffect === effect.id
                              ? 'border-yellow-500 bg-yellow-500/10'
                              : canAccess
                              ? 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                              : 'border-zinc-800 bg-zinc-900/50 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-3xl mb-2">{effect.icon}</div>
                          <div className="text-sm font-medium text-white mb-1">{effect.name}</div>
                          <div className="text-xs text-zinc-400">{effect.description}</div>
                          {!canAccess && (
                            <div className={`text-xs font-semibold mt-2 ${getTierColor(effect.tier)}`}>
                              {getTierBadge(effect.tier)} {effect.tier.toUpperCase()} Required
                            </div>
                          )}
                          {editForm.profileEffect === effect.id && (
                            <div className="absolute top-2 right-2 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                              <span className="text-black text-xs">✓</span>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-zinc-600 disabled:to-zinc-700 text-black disabled:text-zinc-400 font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <Link
                    href={getProfileSlug()}
                    className="px-6 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-xl transition-colors flex items-center gap-2"
                  >
                    <X className="w-5 h-5" />
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
