// components/nav/MainNavbar.tsx
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { UserStorage3 as UserStorage } from '@/utils/userStorage';
import { activityTracker } from "@/utils/activityTracker";
import { ChevronDown } from "lucide-react";

export default function MainNavbar() {
  const { user, logout, isAuthenticated, login } = useAuth();
  const router = useRouter();  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLiveDropsOpen, setIsLiveDropsOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);
  
  // Login modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
    username: '',
    isRegistering: false,
    loading: false,
    error: ''
  });

  // Navigation configuration
  const liveDropsItems = [
    {
      name: "Community Drops",
      href: "/community-drops",
      icon: "🏛️",
      description: "Active community drops"
    },
    {
      name: "Staff Picks", 
      href: "/staff-picks",
      icon: (
        <Image
          src="/Icons/subsribers.png"
          alt="Staff Picks"
          width={20}
          height={20}
          className="object-contain"
        />
      ),
      description: "Curated by our team"
    },
    {
      name: "Recently Completed",
      href: "/drops/completed", 
      icon: "✅",
      description: "Past successful drops"
    }
  ];

  const navigation = [
    { name: "Voting", href: "/voting", icon: "🗳️" },
    { name: "Coming Soon", href: "/coming-soon", icon: "⏰" },
    { name: "Community", href: "/community", icon: "👥" },
    { name: "Categories", href: "/categories", icon: "🗂️" },
    { name: "About", href: "/about", icon: "ℹ️" },
  ];

  // Add or update styles for uniform nav items
  const NAV_ITEM_SIZE = 96; // px, adjust as needed for your design
  const ICON_SIZE = 40; // px, adjust as needed for your icons

  // Helper functions
  const createSlug = (username: string) => {
    return username
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const getUserProfileUrl = () => {
    if (!mounted || !user?.username) return "/account/profile";
    return `/account/profile/${createSlug(user.username)}`;
  };

  const getAvatarSrc = () => {
    if (!mounted) return "/Icons/New Member.png";
    return avatar || "/Icons/New Member.png";
  };

  const isActivePage = (href: string) => {
    if (!mounted || !router.isReady) return false;
    return router.pathname === href || router.pathname.startsWith(href + "/");
  };  // Account menu items
  const accountMenuItems = [
    { name: "My Account", href: "/account", icon: "🏠" },
    { name: "Profile", href: getUserProfileUrl(), icon: "👤" },
    { name: "Wallet", href: "/wallet", icon: "💰" },    { name: "Pledges", href: "/account/pledges", icon: "🤝" },
    { name: "Settings", href: "/account/settings", icon: "⚙️" },    // Admin menu items - The King's Domain
    ...(user?.email === 'admin@migistus.com' ? [
      { name: "─────────────", href: "#", icon: "" }, // Divider
      { name: "👑 Kings Domain", href: "/kingdom", icon: "👑" },
      { name: "User Management", href: "/kingdom/users", icon: "👥" },
      { name: "Royal Marketing", href: "/kingdom/marketing", icon: "📧" },
      { name: "Voting Control", href: "/kingdom/voting", icon: "🗳️" },
      { name: "Product Control", href: "/kingdom/products", icon: "📦" },
      { name: "Live Drops Control", href: "/kingdom/live-drops", icon: "🔴" },
      { name: "Content Management", href: "/kingdom/content", icon: "📝" },
      { name: "Analytics", href: "/kingdom/analytics", icon: "📊" },
      { name: "System Settings", href: "/kingdom/settings", icon: "⚙️" },
    ] : []),
  ];
  useEffect(() => {
    setMounted(true);
    
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="live-drops"]')) {
        setIsLiveDropsOpen(false);
      }
    };

    if (isLiveDropsOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isLiveDropsOpen]);

  // Load user avatar
  useEffect(() => {
    if (!mounted || !user) {
      setAvatar(null);
      return;
    }

    try {
      const profile = UserStorage?.getUserProfile?.(user.id);
      if (profile?.avatar) {
        setAvatar(profile.avatar);
        return;
      }

      // Fallback checks
      const manualKey = `user_${user.id}_profile`;
      const manualProfile = localStorage.getItem(manualKey);
      if (manualProfile) {
        const parsedProfile = JSON.parse(manualProfile);
        if (parsedProfile.avatar) {
          setAvatar(parsedProfile.avatar);
          return;
        }
      }

      setAvatar(null);
    } catch (error) {
      console.warn('Failed to load user avatar:', error);
      setAvatar(null);
    }
  }, [mounted, user]);

  // Avatar upload handler
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setAvatar(dataUrl);
      
      try {
        const profile = UserStorage?.getUserProfile?.(user.id);
        if (profile) {
          profile.avatar = dataUrl;
          UserStorage?.setUserProfile?.(user.id, profile);
        } else {
          const basicProfile = {
            id: user.id,
            username: user.username,
            email: user.email,
            avatar: dataUrl,
            bio: '',
            tier: 'New Member',
            guildTokens: 0,
            joinedDate: new Date().toISOString().split('T')[0],
            titles: [],
            badges: [],
            links: [],
            stats: { totalPledges: 0, totalVotes: 0, dropsJoined: 0, followers: 0, following: 0 }
          };
          UserStorage?.setUserProfile?.(user.id, basicProfile);
        }

        // Trigger profile update event
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: { userId: user.id, field: 'avatar', value: dataUrl }
        }));
      } catch (error) {
        console.warn('Failed to update profile avatar:', error);
      }
    };
    reader.readAsDataURL(file);
  };

  // Login modal handlers
  const openLoginModal = (registerMode = false) => {
    setShowLoginModal(true);
    setLoginForm({
      email: '',
      password: '',
      username: '',
      isRegistering: registerMode,
      loading: false,
      error: ''
    });
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
    setLoginForm({
      email: '',
      password: '',
      username: '',
      isRegistering: false,
      loading: false,
      error: ''
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginForm(prev => ({ ...prev, loading: true, error: '' }));

    const { email, password, username, isRegistering } = loginForm;

    if (!email || !password) {
      setLoginForm(prev => ({ ...prev, error: 'Please fill in all required fields', loading: false }));
      return;
    }

    if (isRegistering && !username) {
      setLoginForm(prev => ({ ...prev, error: 'Username is required for registration', loading: false }));
      return;
    }

    if (isRegistering && username) {
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        setLoginForm(prev => ({ 
          ...prev, 
          error: 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores',
          loading: false 
        }));
        return;
      }
    }

    try {
      const success = await login(email, password, isRegistering ? username : undefined);
      
      if (success) {
        closeLoginModal();
      } else {
        setLoginForm(prev => ({ 
          ...prev, 
          error: isRegistering ? 'Registration failed. Please try again.' : 'No account found with this email. Please register first or check your email.',
          loading: false 
        }));
      }
    } catch (error) {
      setLoginForm(prev => ({ 
        ...prev, 
        error: 'An unexpected error occurred. Please try again.',
        loading: false 
      }));
    }
  };

  const handleLogout = () => {
    setAvatar(null);
    logout();
  };

  // Scroll event effect
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 80) {
        setShowNavbar(false); // scrolling down, hide
      } else {
        setShowNavbar(true); // scrolling up, show
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Don't render anything until mounted to prevent hydration mismatches
  if (!mounted) {
    return (
      <nav className="bg-zinc-950/95 backdrop-blur-md border-b border-yellow-400/20 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center">
              <Image
                src="/images/migistus_logo.png"
                alt="MIGISTUS"
                width={80}
                height={80}
                className="transition-transform duration-300 hover:scale-110"
              />
            </Link>
            <div className="hidden md:flex items-center space-x-6">
              {/* Skeleton nav items for loading state */}
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex flex-col items-center justify-center animate-pulse" style={{ width: NAV_ITEM_SIZE, height: NAV_ITEM_SIZE }}>
                  <div className="w-10 h-10 bg-zinc-800 rounded-full mb-2" />
                  <div className="w-16 h-3 bg-zinc-800 rounded" />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 text-gray-300">Sign In</div>
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-6 py-2 rounded-lg">
                Join Elite
              </div>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className={`bg-zinc-950/95 backdrop-blur-md border-b border-yellow-400/20 shadow-lg sticky top-0 z-50 transition-opacity duration-500 ${showNavbar ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group">
            <Image
              src="/images/migistus_logo.png"
              alt="MIGISTUS"
              width={80}
              height={80}
              className="transition-transform duration-300 group-hover:scale-110"
            />
          </Link>            {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">              {/* Live Drops Dropdown */}
            <div className="relative" data-dropdown="live-drops">
              <button
                onClick={() => setIsLiveDropsOpen(!isLiveDropsOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isLiveDropsOpen || liveDropsItems.some(item => isActivePage(item.href))
                    ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
                    : "text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5"
                }`}
              >
                <Image
                  src="/Icons/livedrops.png"
                  alt="Live Drops"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                Live Drops
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isLiveDropsOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Dropdown Menu */}
              {isLiveDropsOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                  {liveDropsItems.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsLiveDropsOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5 transition-all duration-200 border-b border-zinc-800 last:border-b-0"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {typeof item.icon === 'string' ? (
                          <span className="text-base">{item.icon}</span>
                        ) : (
                          item.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-400">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other Navigation Items */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActivePage(item.href)
                    ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
                    : "text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5"
                }`}
              >
                {typeof item.icon === 'string' ? (
                  <span className="text-base">{item.icon}</span>
                ) : (
                  item.icon
                )}
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              /* User Dropdown */
              <div className="relative">                  <button
                  onClick={() => {
                    const newState = !isDropdownOpen;
                    setIsDropdownOpen(newState);
                    // Track account menu interactions
                    activityTracker.trackAccountMenuAction(newState ? 'open' : 'close', {
                      username: user?.username,
                      userId: user?.id
                    });
                  }}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-700/50 transition-all duration-200"
                >
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 hover:border-yellow-400/50 transition-colors overflow-hidden bg-zinc-700">
                      <Image
                        src="/Icons/New Member.png"
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                        priority
                      />
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-zinc-900 rounded-full"></div>
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium text-white">{user?.username || 'Member'}</div>
                    <div className="text-xs text-gray-400">View Profile</div>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-4 border-b border-zinc-700 bg-zinc-800/50">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full border-2 border-yellow-400/30 overflow-hidden bg-zinc-700">
                            <Image
                              src="/Icons/New Member.png"
                              alt="Profile"
                              width={40}
                              height={40}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <label className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">📸</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">{user?.username || 'Member'}</div>
                          <div className="text-sm text-gray-400 truncate">{user?.email}</div>
                        </div>
                      </div>
                    </div>
                      {/* Menu items */}
                    <div className="py-2">                        {accountMenuItems.map((item, index) => {
                          // Handle divider
                          if (item.name.startsWith('─')) {
                            return (
                              <div key={index} className="border-t border-yellow-500/30 my-2 mx-4">
                                <div className="text-xs text-yellow-400 text-center py-2 font-medium">
                                  ROYAL CONTROLS
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <Link
                              key={item.name}
                              href={item.href}
                              onClick={() => {
                                setIsDropdownOpen(false);
                                // Track account menu navigation
                                activityTracker.trackAccountMenuAction('navigate', {
                                  destination: item.href,
                                  menuItem: item.name,
                                  icon: item.icon
                                });
                              }}
                              className={`flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white transition-colors ${
                                item.name.includes('👑') ? 'hover:bg-yellow-800/20 bg-yellow-900/10' : 'hover:bg-zinc-800'
                              }`}
                            >
                              <span className="text-lg">{item.icon}</span>
                              <span className={`font-medium ${
                                item.name.includes('👑') ? 'text-yellow-400' : ''
                              }`}>{item.name}</span>
                            </Link>
                          );
                        })}
                      </div>
                      
                      <div className="border-t border-zinc-700">                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            // Track logout action
                            activityTracker.trackAccountMenuAction('logout', {
                              method: 'account_menu',
                              timestamp: new Date().toISOString()
                            });
                            activityTracker.trackLogout();
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors"
                        >
                          <span className="text-lg">🚪</span>
                          <span className="font-medium">Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Login/Register Buttons */
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openLoginModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5 rounded-lg transition-all duration-200 font-medium"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => openLoginModal(true)}
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-200"
                  >
                    Join Elite
                  </button>
                </div>
              )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
        isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="bg-zinc-900/95 backdrop-blur-lg border-t border-yellow-400/20">            <div className="px-4 py-4 space-y-2">
            {/* Live Drops Section */}
            <div className="mb-3">
              <div className="flex items-center gap-2 px-4 py-2 text-yellow-400 font-semibold">
                <Image
                  src="/Icons/livedrops.png"
                  alt="Live Drops"
                  width={20}
                  height={20}
                  className="object-contain"
                />
                Live Drops
              </div>
              <div className="ml-4 space-y-1">
                {liveDropsItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                      isActivePage(item.href)
                        ? "bg-yellow-400/10 text-yellow-400"
                        : "text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5"
                    }`}
                  >
                    {typeof item.icon === 'string' ? (
                      <span className="text-base">{item.icon}</span>
                    ) : (
                      item.icon
                    )}
                    <div>
                      <div className="font-medium text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Other Navigation Items */}
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActivePage(item.href)
                    ? "bg-yellow-400/10 text-yellow-400"
                    : "text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5"
                }`}
              >
                {typeof item.icon === 'string' ? (
                  <span className="text-lg">{item.icon}</span>
                ) : (
                  item.icon
                )}
                <span className="font-medium">{item.name}</span>
              </Link>
            ))}
            
            <div className="border-t border-zinc-700/50 my-4"></div>
            
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800/50 rounded-lg">
                  <div className="w-8 h-8 rounded-full border-2 border-yellow-400/30 overflow-hidden bg-zinc-700">
                    <Image
                      src="/Icons/New Member.png"
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-medium text-white">{user?.username || 'Member'}</div>
                    <div className="text-sm text-gray-400">{user?.email}</div>
                  </div>
                </div>
                  {accountMenuItems.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      setIsMenuOpen(false);
                      // Track mobile account menu navigation
                      activityTracker.trackAccountMenuAction('navigate_mobile', {
                        destination: item.href,
                        menuItem: item.name,
                        icon: item.icon
                      });
                    }}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5 rounded-lg transition-colors"
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </Link>
                ))}
                  <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    // Track mobile logout action
                    activityTracker.trackAccountMenuAction('logout_mobile', {
                      method: 'mobile_menu',
                      timestamp: new Date().toISOString()
                    });
                    activityTracker.trackLogout();
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <span className="text-lg">🚪</span>
                  <span className="font-medium">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openLoginModal(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5 rounded-lg transition-colors"
                >
                  <span className="text-lg">🔑</span>
                  <span className="font-medium">Sign In</span>
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    openLoginModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors font-semibold"
                >
                  <span className="text-lg">⭐</span>
                  <span>Join Elite</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-700 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {loginForm.isRegistering ? 'Join MIGISTUS' : 'Welcome Back'}
              </h2>
              <button
                onClick={closeLoginModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {loginForm.isRegistering && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
                  <input
                    type="text"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, username: e.target.value }))
                    }
                    className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    placeholder="Choose your username"
                    required={loginForm.isRegistering}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))
                  }
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  placeholder="Enter any password (demo)"
                  required
                />
              </div>

              {loginForm.error && (
                <div className="text-red-400 text-sm text-center">{loginForm.error}</div>
              )}

              <button
                type="submit"
                disabled={loginForm.loading || (loginForm.isRegistering && !loginForm.username)}
                className="w-full py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
              >
                {loginForm.loading 
                  ? (loginForm.isRegistering ? 'Creating Account...' : 'Signing In...') 
                  : (loginForm.isRegistering ? 'Create Account' : 'Sign In')
                }
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setLoginForm(prev => ({ 
                    ...prev, 
                    isRegistering: !prev.isRegistering, 
                    error: '', 
                    username: '' 
                  }));
                }}
                className="text-yellow-400 hover:text-yellow-300 text-sm font-medium"
              >
                {loginForm.isRegistering 
                  ? 'Already have an account? Sign In' 
                  : "Don't have an account? Register"
                }
              </button>
            </div>

            <div className="mt-4 text-center text-xs text-gray-400">
              <p>This is a demo - {loginForm.isRegistering ? 'choose any email and username' : 'use your registered email'}</p>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}