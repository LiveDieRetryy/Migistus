// components/nav/MainNavbar.tsx
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { UserStorage3 as UserStorage } from '@/utils/userStorage';
import { activityTracker } from "@/utils/activityTracker";
import { ChevronDown } from "lucide-react";
import NotificationCenter from "@/components/notifications/NotificationCenter";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

export default function MainNavbar() {
  const { user, logout, isAuthenticated, login } = useAuth();
  const router = useRouter();
  const { unreadCount, requestPermission } = useMessageNotifications();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLiveDropsOpen, setIsLiveDropsOpen] = useState(false);
  const [isMobileLiveDropsOpen, setIsMobileLiveDropsOpen] = useState(false);
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
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    country: '',
    state: '',
    city: '',
    phoneNumber: '',
    referralSource: '',
    agreeToTerms: false,
    agreeToMarketing: false,
    isRegistering: false,
    registrationStep: 1,
    loading: false,
    error: ''
  });

  const [validationErrors, setValidationErrors] = useState({
    username: '',
    email: ''
  });

  // Real-time validation helpers
  const checkUsernameAvailability = async (username: string) => {
    if (!username || username.length < 3) {
      setValidationErrors(prev => ({ ...prev, username: '' }));
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
      setValidationErrors(prev => ({ 
        ...prev, 
        username: 'Username must be 3-20 characters (letters, numbers, -, _)' 
      }));
      return;
    }

    try {
      const response = await fetch('/data/users.json');
      const data = await response.json();
      const users = data.users || [];
      const exists = users.some((u: any) => u.username.toLowerCase() === username.toLowerCase());
      
      setValidationErrors(prev => ({ 
        ...prev, 
        username: exists ? '❌ Username already taken' : '✅ Username available' 
      }));
    } catch (error) {
      console.error('Error checking username:', error);
      setValidationErrors(prev => ({ ...prev, username: '' }));
    }
  };

  const checkEmailAvailability = async (email: string) => {
    if (!email) {
      setValidationErrors(prev => ({ ...prev, email: '' }));
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
      return;
    }

    try {
      const response = await fetch('/data/users.json');
      const data = await response.json();
      const users = data.users || [];
      const exists = users.some((u: any) => u.email.toLowerCase() === email.toLowerCase());
      
      setValidationErrors(prev => ({ 
        ...prev, 
        email: exists ? '❌ Email already registered' : '✅ Email available' 
      }));
    } catch (error) {
      console.error('Error checking email:', error);
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };

  // Debounced validation
  useEffect(() => {
    if (loginForm.isRegistering && loginForm.username) {
      const timer = setTimeout(() => {
        checkUsernameAvailability(loginForm.username);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loginForm.username, loginForm.isRegistering]);

  useEffect(() => {
    if (loginForm.isRegistering && loginForm.email) {
      const timer = setTimeout(() => {
        checkEmailAvailability(loginForm.email);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loginForm.email, loginForm.isRegistering]);

  // Navigation configuration
  const liveDropsItems = [
    {
      name: "Community Drops",
      href: "/community-drops",
      icon: <img src="/Icons/communitydrops.png" alt="Community Drops" width={32} height={32} className="object-contain" />,
      description: "Active community drops"
    },
    {
      name: "Staff Picks", 
      href: "/staff-picks",
      icon: (
        <img
          src="/Icons/subsribers.png"
          alt="Staff Picks"
          width={32}
          height={32}
          className="object-contain"
        />
      ),
      description: "Curated by our team"
    },
    {
      name: "Recently Completed",
      href: "/recently-completed", 
      icon: <span style={{fontSize: '2rem'}}>✅</span>,
      description: "Past successful drops"
    }
  ];

  // Insert Live Drops as a placeholder for ordering
  const navigation = [
    { name: "Voting", href: "/voting", iconSrc: "/Icons/voting.png" },
    { name: "Coming Soon", href: "/coming-soon", iconSrc: "/Icons/comingsoon.png" },
    // Live Drops placeholder (will be rendered as dropdown)
    { name: "Live Drops", isDropdown: true },
    { name: "Community", href: "/community", iconSrc: "/Icons/Chat.png" },
    { name: "Categories", href: "/categories", iconSrc: "/Icons/categories-icon.png" },
    { name: "About", href: "/about", iconSrc: "/Icons/about.png" },
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
    { name: "Messages", href: "/messages", icon: "💬" },
    { name: "Wallet", href: "/wallet", icon: "💰" },    { name: "Pledges", href: "/account/pledges", icon: "🤝" },
    { name: "Settings", href: "/account/settings", icon: "⚙️" },    // Admin menu items - The King's Domain
    ...(user?.email === 'admin@migistus.com' ? [
      { name: "─────────────", href: "#", icon: "" }, // Divider
      { name: "👑 Kings Domain", href: "/admin", icon: "👑" },
      { name: "🔄 Lifecycle Control", href: "/kingdom/lifecycle", icon: "�" },
      { name: "User Management", href: "/admin/users", icon: "�" },
      { name: "Royal Marketing", href: "/admin/marketing", icon: "�" },
      { name: "Product Control", href: "/admin/products", icon: "📦" },
      { name: "Content Management", href: "/admin/content", icon: "📝" },
      { name: "Analytics", href: "/admin/analytics", icon: "📊" },
      { name: "System Settings", href: "/admin/settings", icon: "⚙️" },
    ] : []),
  ];
  useEffect(() => {
    setMounted(true);
    
    // Expose auth modal opener globally for other components
    (window as any).openAuthModal = (isRegister = false) => {
      setLoginForm(prev => ({ 
        ...prev, 
        isRegistering: isRegister,
        registrationStep: 1 
      }));
      setShowLoginModal(true);
    };
    
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

    return () => {
      // Cleanup
      delete (window as any).openAuthModal;
    };
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
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      country: '',
      state: '',
      city: '',
      phoneNumber: '',
      referralSource: '',
      agreeToTerms: false,
      agreeToMarketing: false,
      isRegistering: registerMode,
      registrationStep: 1,
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
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      country: '',
      state: '',
      city: '',
      phoneNumber: '',
      referralSource: '',
      agreeToTerms: false,
      agreeToMarketing: false,
      isRegistering: false,
      registrationStep: 1,
      loading: false,
      error: ''
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginForm(prev => ({ ...prev, loading: true, error: '' }));

    const { email, password, username, isRegistering, firstName, lastName, dateOfBirth, country, agreeToTerms } = loginForm;

    // Basic validation
    if (!email || !password) {
      setLoginForm(prev => ({ ...prev, error: 'Please fill in all required fields', loading: false }));
      return;
    }

    if (isRegistering) {
      // Registration validation
      if (!username || !firstName || !lastName || !dateOfBirth || !country || !agreeToTerms) {
        setLoginForm(prev => ({ ...prev, error: 'Please fill in all required fields and agree to terms', loading: false }));
        return;
      }

      // Username validation
      const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
      if (!usernameRegex.test(username)) {
        setLoginForm(prev => ({ 
          ...prev, 
          error: 'Username must be 3-20 characters and contain only letters, numbers, hyphens, and underscores',
          loading: false 
        }));
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setLoginForm(prev => ({ 
          ...prev, 
          error: 'Please enter a valid email address',
          loading: false 
        }));
        return;
      }

      // Age validation (must be 13+)
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      const actualAge = monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate()) ? age - 1 : age;
      
      if (actualAge < 13) {
        setLoginForm(prev => ({ 
          ...prev, 
          error: 'You must be at least 13 years old to register',
          loading: false 
        }));
        return;
      }

      // Check for duplicate username
      try {
        const usersResponse = await fetch('/data/users.json');
        const data = await usersResponse.json();
        const users = data.users || [];
        
        const usernameExists = users.some((user: any) => 
          user.username.toLowerCase() === username.toLowerCase()
        );
        
        if (usernameExists) {
          setLoginForm(prev => ({ 
            ...prev, 
            error: 'This username is already taken. Please choose another one.',
            loading: false 
          }));
          return;
        }

        // Check for duplicate email
        const emailExists = users.some((user: any) => 
          user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (emailExists) {
          setLoginForm(prev => ({ 
            ...prev, 
            error: 'An account with this email already exists. Please sign in or use a different email.',
            loading: false 
          }));
          return;
        }
      } catch (error) {
        console.error('Error checking for duplicates:', error);
        // Continue with registration even if check fails
      }
    }

    try {
      // Prepare registration data if registering
      let registrationDataToSend = undefined;
      if (isRegistering) {
        registrationDataToSend = {
          firstName,
          lastName,
          dateOfBirth,
          country,
          state: loginForm.state,
          city: loginForm.city,
          phoneNumber: loginForm.phoneNumber,
          referralSource: loginForm.referralSource,
          agreeToMarketing: loginForm.agreeToMarketing
        };
      }
      
      const success = await login(
        email, 
        password, 
        isRegistering ? username : undefined,
        registrationDataToSend
      );
      
      if (success) {
        // Dispatch event to notify other components (like community page) of new registration
        if (isRegistering) {
          console.log('📢 Dispatching newUserRegistered event');
          window.dispatchEvent(new CustomEvent('newUserRegistered', {
            detail: { username, email, timestamp: new Date().toISOString() }
          }));
        }
        closeLoginModal();
      } else {
        // Provide specific error messages
        if (isRegistering) {
          setLoginForm(prev => ({ 
            ...prev, 
            error: 'Registration failed. The username or email may already be in use.',
            loading: false 
          }));
        } else {
          setLoginForm(prev => ({ 
            ...prev, 
            error: 'No account found with this email or username. Please register first or check your credentials.',
            loading: false 
          }));
        }
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
    <>
    <nav className={`bg-zinc-950/95 backdrop-blur-xl border-b border-yellow-400/40 shadow-xl shadow-black/30 sticky top-0 z-50 transition-all duration-500 ${showNavbar ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
      {/* Animated gradient glow on top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent animate-pulse"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-24">
          {/* Logo - Centered */}
          <div className="flex-1 flex justify-center">
            <Link href="/" className="block">
              <Image
                src="/images/migistus_logo.png"
                alt="MIGISTUS"
                width={220}
                height={220}
                className="mx-auto transition-transform duration-300 hover:scale-105"
                style={{ maxHeight: '130px', width: 'auto', height: '130px' }}
              />
            </Link>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item, idx) => {
              if (item.isDropdown) {
                // Live Drops Dropdown
                return (
                  <div key="LiveDropsDropdown" className="relative flex items-center justify-center" data-dropdown="live-drops">
                    <button
                      onClick={() => setIsLiveDropsOpen(!isLiveDropsOpen)}
                      className={`flex items-center justify-center w-24 h-24 rounded-lg transition-all duration-200 ${
                        isLiveDropsOpen || liveDropsItems.some(item => isActivePage(item.href))
                          ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
                          : "text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/5"
                      }`}
                      style={{ minWidth: 96, minHeight: 96 }}
                    >
                      <Image
                        src="/Icons/livedrops.png"
                        alt="Live Drops"
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isLiveDropsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {/* Dropdown Menu */}
                    {isLiveDropsOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-zinc-900 border border-yellow-400/30 rounded-xl shadow-xl z-50 overflow-hidden">
                        {liveDropsItems.map((item) => (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setIsLiveDropsOpen(false)}
                            className="flex items-start gap-3 px-4 py-3 text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/5 transition-all duration-200 border-b border-zinc-800 last:border-b-0"
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
                );
              }
              if (typeof item.href === 'string' && item.iconSrc) {
                const href = item.href as string;
                return (
                  <Link
                    key={item.name}
                    href={href}
                    className={`flex items-center justify-center w-24 h-24 rounded-lg transition-all duration-200 ${
                      isActivePage(href)
                        ? "bg-yellow-400/10 text-yellow-400 border border-yellow-400/30"
                        : "text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/5"
                    }`}
                    style={{ minWidth: 96, minHeight: 96 }}
                  >
                    <Image
                      src={item.iconSrc}
                      alt={item.name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                  </Link>
                );
              }
              return null;
            })}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated && (
              /* Notification Bell */
              <NotificationCenter />
            )}
            
            {isAuthenticated ? (
              /* User Dropdown */
              <div className="relative">
                <button
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
                        src={getAvatarSrc()}
                        alt="Profile"
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="font-semibold text-yellow-200 ml-2">{user?.username || 'Account'}</span>
                  <ChevronDown className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 max-h-[70vh] overflow-y-auto bg-zinc-900 border border-yellow-400/30 rounded-xl shadow-xl z-50">
                    {accountMenuItems.map((item) => (
                      <Link
                        key={item.name}
                        href={item.href}
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-yellow-300 hover:text-yellow-400 hover:bg-yellow-400/5 transition-all duration-200 border-b border-zinc-800 last:border-b-0"
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="font-medium flex-1">{item.name}</span>
                        {item.name === "Messages" && unreadCount > 0 && (
                          <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </Link>
                    ))}
                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        activityTracker.trackAccountMenuAction('logout_desktop', {
                          method: 'desktop_menu',
                          timestamp: new Date().toISOString()
                        });
                        activityTracker.trackLogout();
                        handleLogout();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-colors border-t border-zinc-800"
                    >
                      <span className="text-lg">🚪</span>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Login/Register Buttons */
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5 rounded-lg transition-all duration-200 font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-black font-semibold px-6 py-2 rounded-lg transition-all duration-200"
                >
                  Join The Guild
                </Link>
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
        isMenuOpen ? "max-h-[80vh] opacity-100" : "max-h-0 opacity-0"
      }`}>
        <div className="bg-zinc-900/95 backdrop-blur-lg border-t border-yellow-400/20">
          <div className="px-4 py-4 space-y-2 overflow-y-auto max-h-[80vh]">
            {/* User Profile / Auth Section - Always at top */}
            {isAuthenticated ? (
              <div className="space-y-2 mb-4 pb-4 border-b border-zinc-700/50">
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
                    <span className="font-medium flex-1">{item.name}</span>
                    {item.name === "Messages" && unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
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
              <div className="space-y-2 mb-4 pb-4 border-b border-zinc-700/50">
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 text-gray-300 hover:text-yellow-300 hover:bg-yellow-400/5 rounded-lg transition-colors border border-zinc-700"
                >
                  <span className="text-lg">🔑</span>
                  <span className="font-medium">Sign In</span>
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-yellow-400 text-black hover:bg-yellow-300 rounded-lg transition-colors font-semibold"
                >
                  <span className="text-lg">⭐</span>
                  <span>Join The Guild</span>
                </Link>
              </div>
            )}

            {/* Navigation Items - Render in order with Live Drops in the middle */}
            {navigation.map((item) => {
              // Render Live Drops as collapsible dropdown
              if (item.isDropdown) {
                return (
                  <div key="live-drops" className="mb-3">
                    <button
                      onClick={() => setIsMobileLiveDropsOpen(!isMobileLiveDropsOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 text-yellow-400 font-semibold hover:bg-yellow-400/5 rounded-lg transition-all"
                    >
                      <div className="flex items-center gap-2">
                        <Image
                          src="/Icons/livedrops.png"
                          alt="Live Drops"
                          width={20}
                          height={20}
                          className="object-contain"
                        />
                        Live Drops
                      </div>
                      <ChevronDown 
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isMobileLiveDropsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    <div className={`overflow-hidden transition-all duration-300 ${
                      isMobileLiveDropsOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                      <div className="ml-4 space-y-1 mt-2">
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
                  </div>
                );
              }
              
              // Render regular navigation items
              if (typeof item.href === 'string' && item.iconSrc) {
                return (
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
                    <div className="flex items-center gap-3">
                      <img src={item.iconSrc} alt={item.name} width={32} height={32} />
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </Link>
                );
              }
              return null;
            })}
          </div>
        </div>
      </div>
    </nav>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl p-8 border border-zinc-700 w-full max-w-md max-h-[90vh] overflow-y-auto">
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
              {loginForm.isRegistering ? (
                <>
                  {/* Step 1: Account Info */}
                  {loginForm.registrationStep === 1 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Username *</label>
                        <input
                          type="text"
                          value={loginForm.username}
                          onChange={(e) => {
                            setLoginForm(prev => ({ ...prev, username: e.target.value }));
                            setValidationErrors(prev => ({ ...prev, username: '' }));
                          }}
                          className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white focus:outline-none transition-colors ${
                            validationErrors.username.includes('❌') 
                              ? 'border-red-500 focus:border-red-400' 
                              : validationErrors.username.includes('✅')
                              ? 'border-green-500 focus:border-green-400'
                              : 'border-zinc-600 focus:border-yellow-400'
                          }`}
                          placeholder="Choose your username"
                          required
                        />
                        {validationErrors.username && (
                          <p className={`text-sm mt-1 ${
                            validationErrors.username.includes('❌') ? 'text-red-400' : 
                            validationErrors.username.includes('✅') ? 'text-green-400' : 
                            'text-gray-400'
                          }`}>
                            {validationErrors.username}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                        <input
                          type="email"
                          value={loginForm.email}
                          onChange={(e) => {
                            setLoginForm(prev => ({ ...prev, email: e.target.value }));
                            setValidationErrors(prev => ({ ...prev, email: '' }));
                          }}
                          className={`w-full px-4 py-3 bg-zinc-800 border rounded-lg text-white focus:outline-none transition-colors ${
                            validationErrors.email.includes('❌') 
                              ? 'border-red-500 focus:border-red-400' 
                              : validationErrors.email.includes('✅')
                              ? 'border-green-500 focus:border-green-400'
                              : 'border-zinc-600 focus:border-yellow-400'
                          }`}
                          placeholder="your.email@example.com"
                          required
                        />
                        {validationErrors.email && (
                          <p className={`text-sm mt-1 ${
                            validationErrors.email.includes('❌') ? 'text-red-400' : 
                            validationErrors.email.includes('✅') ? 'text-green-400' : 
                            'text-gray-400'
                          }`}>
                            {validationErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                        <input
                          type="password"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          placeholder="Create a strong password"
                          required
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          // Validate before moving to next step
                          if (!loginForm.username || !loginForm.email || !loginForm.password) {
                            setLoginForm(prev => ({ ...prev, error: 'Please fill in all required fields' }));
                            return;
                          }
                          if (validationErrors.username.includes('❌') || validationErrors.email.includes('❌')) {
                            setLoginForm(prev => ({ ...prev, error: 'Please fix validation errors before continuing' }));
                            return;
                          }
                          if (!validationErrors.username.includes('✅') || !validationErrors.email.includes('✅')) {
                            setLoginForm(prev => ({ ...prev, error: 'Please wait for validation to complete' }));
                            return;
                          }
                          setLoginForm(prev => ({ ...prev, registrationStep: 2, error: '' }));
                        }}
                        disabled={
                          !loginForm.username || 
                          !loginForm.email || 
                          !loginForm.password ||
                          validationErrors.username.includes('❌') ||
                          validationErrors.email.includes('❌') ||
                          (!validationErrors.username.includes('✅') && loginForm.username.length >= 3) ||
                          (!validationErrors.email.includes('✅') && loginForm.email.includes('@'))
                        }
                        className="w-full py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next: Personal Information
                      </button>
                    </>
                  )}

                  {/* Step 2: Personal Info */}
                  {loginForm.registrationStep === 2 && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                          <input
                            type="text"
                            value={loginForm.firstName}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                            placeholder="John"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                          <input
                            type="text"
                            value={loginForm.lastName}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                            placeholder="Doe"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth *</label>
                        <input
                          type="date"
                          value={loginForm.dateOfBirth}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                        <input
                          type="tel"
                          value={loginForm.phoneNumber}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setLoginForm(prev => ({ ...prev, registrationStep: 1 }))}
                          className="flex-1 py-3 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="button"
                          onClick={() => setLoginForm(prev => ({ ...prev, registrationStep: 3 }))}
                          className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors"
                        >
                          Next: Location
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 3: Location */}
                  {loginForm.registrationStep === 3 && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Country *</label>
                        <select
                          value={loginForm.country}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, country: e.target.value, state: '', city: '' }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          required
                        >
                          <option value="">Select Country</option>
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="UK">United Kingdom</option>
                          <option value="OTHER">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">State/Province</label>
                        <input
                          type="text"
                          value={loginForm.state}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, state: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          placeholder="California"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
                        <input
                          type="text"
                          value={loginForm.city}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, city: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          placeholder="Los Angeles"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">How did you hear about us?</label>
                        <select
                          value={loginForm.referralSource}
                          onChange={(e) => setLoginForm(prev => ({ ...prev, referralSource: e.target.value }))}
                          className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        >
                          <option value="">Select an option</option>
                          <option value="Search Engine">Search Engine (Google, Bing, etc.)</option>
                          <option value="Social Media">Social Media</option>
                          <option value="Friend">Friend or Family Recommendation</option>
                          <option value="Advertisement">Online Advertisement</option>
                          <option value="Blog">Blog or News Article</option>
                          <option value="YouTube">YouTube or Video Platform</option>
                          <option value="Podcast">Podcast</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={loginForm.agreeToTerms}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400"
                            required
                          />
                          <span className="text-sm text-gray-300">
                            I agree to the <a href="/terms" className="text-yellow-400 hover:text-yellow-300">Terms of Service</a> and <a href="/privacy" className="text-yellow-400 hover:text-yellow-300">Privacy Policy</a> *
                          </span>
                        </label>

                        <label className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={loginForm.agreeToMarketing}
                            onChange={(e) => setLoginForm(prev => ({ ...prev, agreeToMarketing: e.target.checked }))}
                            className="mt-1 w-4 h-4 rounded border-zinc-600 text-yellow-400 focus:ring-yellow-400"
                          />
                          <span className="text-sm text-gray-300">
                            I want to receive updates and promotional offers
                          </span>
                        </label>
                      </div>

                      {loginForm.error && (
                        <div className="text-red-400 text-sm text-center">{loginForm.error}</div>
                      )}

                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => setLoginForm(prev => ({ ...prev, registrationStep: 2 }))}
                          className="flex-1 py-3 bg-zinc-700 text-white font-semibold rounded-lg hover:bg-zinc-600 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          disabled={loginForm.loading || !loginForm.agreeToTerms}
                          className="flex-1 py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
                        >
                          {loginForm.loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Login Form */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Email or Username</label>
                    <input
                      type="text"
                      value={loginForm.email}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      placeholder="your.email@example.com or username"
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
                  placeholder="Password"
                  required
                  />
                </div>

                  {loginForm.error && (
                    <div className="text-red-400 text-sm text-center">{loginForm.error}</div>
                  )}

                  <button
                    type="submit"
                    disabled={loginForm.loading}
                    className="w-full py-3 bg-yellow-400 text-black font-semibold rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50"
                  >
                    {loginForm.loading ? 'Signing In...' : 'Sign In'}
                  </button>
                </>
              )}
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setLoginForm(prev => ({ 
                    ...prev, 
                    isRegistering: !prev.isRegistering,
                    registrationStep: 1,
                    error: '', 
                    username: '',
                    firstName: '',
                    lastName: '',
                    dateOfBirth: '',
                    country: '',
                    state: '',
                    city: '',
                    phoneNumber: '',
                    referralSource: '',
                    agreeToTerms: false,
                    agreeToMarketing: false
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
          </div>
        </div>
      )}
    </>
  );
}