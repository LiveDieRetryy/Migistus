import { useEffect, useState, useRef } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext"; // Updated import
import { useToast } from "@/context/ToastContext";
import { useConfirm } from "@/components/ui/ConfirmModal";
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import { activityTracker } from "@/utils/activityTracker";
import { Eye, EyeOff } from "lucide-react";
import NotificationPreferences from "@/components/notifications/NotificationPreferences";

type UserSettings = {
  // Personal Information
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  phoneNumber: string;
  
  // Account Security
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  twoFactorEnabled: boolean;
  
  // Privacy & Communication
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  productUpdates: boolean;
  orderUpdates: boolean;
  profileVisibility: 'public' | 'private' | 'friends';
  
  // Preferences
  language: string;
  currency: string;
  timezone: string;
  theme: 'dark' | 'light' | 'auto';
  autoSave: boolean;
  
  // Addresses
  addresses: Array<{
    id: string;
    type: 'billing' | 'shipping';
    isDefault: boolean;
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phoneNumber?: string;
  }>;

  // Payment Methods
  paymentMethods: Array<{
    id: string;
    type: 'card' | 'paypal' | 'bank';
    isDefault: boolean;
    nickname: string;
    lastFour?: string;
    expiryDate?: string;
    brand?: string;
  }>;
  
  // Activity & Data
  loginHistory: Array<{
    date: string;
    location: string;
    device: string;
    ip: string;
  }>;
};

const defaultSettings: UserSettings = {
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  phoneNumber: '',
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  twoFactorEnabled: false,
  emailNotifications: true,
  smsNotifications: false,
  marketingEmails: true,
  productUpdates: true,
  orderUpdates: true,
  profileVisibility: 'public',
  language: 'en',
  currency: 'USD',
  timezone: 'America/New_York',
  theme: 'dark',
  autoSave: false,
  addresses: [],
  paymentMethods: [],
  loginHistory: []
};

export default function AccountSettingsPage() {
  const { user, isAuthenticated, updateUser } = useAuth(); // Updated to use correct hook
  const router = useRouter();
  const toast = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [newAddress, setNewAddress] = useState<any>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState<any>(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planLoading, setPlanLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingTierChange, setPendingTierChange] = useState<'Initiate' | 'Guild' | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=${encodeURIComponent(router.asPath)}`);
      return;
    }

    if (user) {
      loadUserSettings();
    }
    
    // Handle URL query parameter for section
    if (router.query.section && typeof router.query.section === 'string') {
      setActiveSection(router.query.section);
    }
  }, [user, isAuthenticated, router]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  const loadUserSettings = async () => {
    if (!user) return;

    try {
      // Load from API
      const response = await fetch(`/api/account/settings?userId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setSettings(prev => ({ ...prev, ...data }));
      }

      // Load additional data from UserStorage
      const profile = UserStorage.getUserProfile(user.id);
      if (profile) {
        setSettings(prev => ({
          ...prev,
          firstName: profile.firstName || prev.firstName,
          lastName: profile.lastName || prev.lastName,
        }));
      }

      // Mock login history
      const mockLoginHistory = [
        {
          date: new Date().toISOString(),
          location: 'New York, NY',
          device: 'Chrome on Windows',
          ip: '192.168.1.1'
        },
        {
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          location: 'New York, NY',
          device: 'Safari on iPhone',
          ip: '192.168.1.2'
        }
      ];
      
      setSettings(prev => ({ ...prev, loginHistory: mockLoginHistory }));
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };
  const handleSave = async (section?: string) => {
    if (!user) return;

    setSaving(true);
    setErrors({});

    // Track settings save attempt
    activityTracker.trackAccountMenuAction('save_settings', {
      section: section || 'all',
      hasPasswordChange: !!settings.newPassword,
      settingsChanged: Object.keys(settings).length
    });

    try {
      // Validate based on section
      const validationErrors: Record<string, string> = {};

      // Handle password change separately
      if (section === 'security' && settings.newPassword) {
        if (!settings.currentPassword) {
          validationErrors.currentPassword = 'Current password is required';
        }
        if (settings.newPassword !== settings.confirmPassword) {
          validationErrors.confirmPassword = 'Passwords do not match';
        }
        if (settings.newPassword.length < 8) {
          validationErrors.newPassword = 'Password must be at least 8 characters';
        }

        if (Object.keys(validationErrors).length === 0) {
          // Call dedicated password change API
          try {
            const passwordResponse = await fetch('/api/account/change-password', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                currentPassword: settings.currentPassword,
                newPassword: settings.newPassword
              })
            });

            const passwordData = await passwordResponse.json();

            if (!passwordResponse.ok) {
              setErrors({ currentPassword: passwordData.error || 'Failed to change password' });
              setSaving(false);
              return;
            }

            // Clear password fields on success
            setSettings(prev => ({
              ...prev,
              currentPassword: '',
              newPassword: '',
              confirmPassword: ''
            }));
            setShowPasswordSection(false);
            
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
            setSaving(false);
            
            activityTracker.trackAccountMenuAction('password_changed_success', {});
            return;

          } catch (error) {
            console.error('Password change error:', error);
            setErrors({ general: 'Failed to change password. Please try again.' });
            setSaving(false);
            return;
          }
        }
      }

      if (section === 'personal' || !section) {
        if (!settings.firstName.trim()) {
          validationErrors.firstName = 'First name is required';
        }
        if (!settings.lastName.trim()) {
          validationErrors.lastName = 'Last name is required';
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        setSaving(false);
        return;
      }      // Save to API (excluding password fields)
      const { currentPassword, newPassword, confirmPassword, ...settingsToSave } = settings;
      
      const response = await fetch(`/api/account/settings?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(settingsToSave)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Save marketing preferences separately
      const marketingResponse = await fetch('/api/marketing/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          agreeToMarketing: settings.marketingEmails,
          emailNotifications: settings.emailNotifications,
          marketingEmails: settings.marketingEmails,
          productUpdates: settings.productUpdates,
          orderUpdates: settings.orderUpdates
        })
      });

      if (!marketingResponse.ok) {
        console.warn('Failed to save marketing preferences, but continuing...');
      }

      // Update profile in UserStorage
      const profile = UserStorage.getUserProfile(user.id) || {};
      UserStorage.setUserProfile(user.id, {
        ...profile,
        firstName: settings.firstName,
        lastName: settings.lastName
      });      // Update user context if name changed
      if (settings.firstName || settings.lastName) {
        updateUser({
          id: user.id,
          email: user.email
        });
      }

      // Track successful save
      activityTracker.trackAccountMenuAction('save_settings_success', {
        section: section || 'all'
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setErrors({ general: 'Failed to save settings. Please try again.' });
      
      // Track failed save
      activityTracker.trackAccountMenuAction('save_settings_failed', {
        section: section || 'all',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setSaving(false);
  };
  const updateSetting = (key: keyof UserSettings, value: any) => {
    // Track account setting changes
    activityTracker.trackAccountMenuAction('setting_changed', {
      settingKey: key,
      newValue: typeof value === 'boolean' ? value : (typeof value === 'string' && value.length > 50 ? '[long_value]' : value),
      settingCategory: getSectionForSetting(key)
    });
    
    setSettings(prev => ({ ...prev, [key]: value }));
    
    // Auto-save with proper debouncing (skip password fields)
    if (settings.autoSave && !['currentPassword', 'newPassword', 'confirmPassword'].includes(key)) {
      // Clear previous timer
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      
      // Set new timer with 3 second delay
      autoSaveTimerRef.current = setTimeout(() => {
        handleSave();
      }, 3000);
    }
  };

  const getSectionForSetting = (key: keyof UserSettings): string => {
    const settingSections = {
      firstName: 'personal',
      lastName: 'personal',
      dateOfBirth: 'personal',
      phoneNumber: 'personal',
      currentPassword: 'security',
      newPassword: 'security',
      confirmPassword: 'security',
      twoFactorEnabled: 'security',
      emailNotifications: 'privacy',
      smsNotifications: 'privacy',
      marketingEmails: 'privacy',
      productUpdates: 'privacy',
      orderUpdates: 'privacy',
      profileVisibility: 'privacy',
      language: 'preferences',
      currency: 'preferences',
      timezone: 'preferences',
      theme: 'preferences',
      autoSave: 'preferences'
    };
    return settingSections[key as keyof typeof settingSections] || 'other';
  };

  const addAddress = () => {
    setNewAddress({
      id: Date.now().toString(),
      type: 'shipping',
      isDefault: false,
      firstName: '',
      lastName: '',
      company: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phoneNumber: ''
    });
  };

  const saveAddress = () => {
    if (!newAddress) return;
    
    setSettings(prev => ({
      ...prev,
      addresses: [...prev.addresses, newAddress]
    }));
    setNewAddress(null);
  };

  const removeAddress = (id: string) => {
    setSettings(prev => ({
      ...prev,
      addresses: prev.addresses.filter(addr => addr.id !== id)
    }));
  };

  const addPaymentMethod = () => {
    setNewPaymentMethod({
      id: Date.now().toString(),
      type: 'card',
      isDefault: false,
      nickname: '',
      lastFour: '',
      expiryDate: '',
      brand: ''
    });
  };

  const savePaymentMethod = () => {
    if (!newPaymentMethod) return;
    
    setSettings(prev => ({
      ...prev,
      paymentMethods: [...prev.paymentMethods, newPaymentMethod]
    }));
    setNewPaymentMethod(null);
  };

  const removePaymentMethod = (id: string) => {
    setSettings(prev => ({
      ...prev,
      paymentMethods: prev.paymentMethods.filter(pm => pm.id !== id)
    }));
  };

  const exportData = () => {
    const dataToExport = {
      user,
      settings,
      profile: UserStorage.getUserProfile(user?.id || 0),
      activity: UserStorage.getUserActivity(user?.id || 0),
      pledges: UserStorage.getUserPledges(user?.id || 0),
      votes: UserStorage.getUserVotes(user?.id || 0)
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `migistus-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePlanUpgrade = async (planId: 'guild' | 'elite') => {
    if (!user) return;
    
    setPlanLoading(true);
    setErrors({});

    try {
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customerResponse = await fetch('/api/subscriptions/create-customer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            email: user.email,
            name: user.username
          })
        });

        if (!customerResponse.ok) {
          throw new Error('Failed to create customer');
        }

        const customerData = await customerResponse.json();
        customerId = customerData.customerId;
      }

      // Create checkout session
      const response = await fetch('/api/subscriptions/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          tier: planId,
          customerId: customerId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Upgrade error:', err);
      setErrors({ general: err instanceof Error ? err.message : 'Failed to start upgrade process' });
      setPlanLoading(false);
    }
  };

  const handlePlanChange = async (targetTier: 'Initiate' | 'Guild' | 'MIGISTUS') => {
    if (!user) return;

    const currentTier = user.tier || 'Initiate';
    const tierOrder = { 'Initiate': 0, 'Guild': 1, 'MIGISTUS': 2 };
    const currentLevel = tierOrder[currentTier as keyof typeof tierOrder] || 0;
    const targetLevel = tierOrder[targetTier];

    // If same tier, do nothing
    if (currentTier === targetTier) {
      return;
    }

    // If upgrading
    if (targetLevel > currentLevel) {
      await handlePlanUpgrade(targetTier === 'Guild' ? 'guild' : 'elite');
    } else {
      // If downgrading
      await handlePlanDowngrade(targetTier as 'Initiate' | 'Guild');
    }
  };

  const handlePlanDowngrade = async (targetTier: 'Initiate' | 'Guild') => {
    if (!user) return;

    // Show custom confirmation modal instead of browser confirm
    setPendingTierChange(targetTier);
    setShowConfirmModal(true);
  };

  const confirmPlanDowngrade = async () => {
    if (!user || !pendingTierChange) return;

    setShowConfirmModal(false);
    setPlanLoading(true);
    setErrors({});

    const targetTier = pendingTierChange;

    try {
      let subscriptionId = user.stripeSubscriptionId;
      
      if (!subscriptionId) {
        const userResponse = await fetch(`/api/users/${user.id}`);
        if (userResponse.ok) {
          const userData = await userResponse.json();
          subscriptionId = userData.stripeSubscriptionId;
        }
      }

      if (!subscriptionId) {
        const response = await fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tier: targetTier }),
        });

        if (!response.ok) {
          throw new Error('Failed to update tier');
        }

        const sessionData = localStorage.getItem('userSession');
        if (sessionData) {
          const session = JSON.parse(sessionData);
          session.user.tier = targetTier;
          localStorage.setItem('userSession', JSON.stringify(session));
        }

        toast.success(`Tier updated to ${targetTier} successfully!`);
        setShowPlanModal(false);
        setPendingTierChange(null);
        setTimeout(() => window.location.reload(), 1500);
        return;
      }

      const response = await fetch('/api/subscriptions/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          subscriptionId: subscriptionId,
          targetTier: targetTier,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      const data = await response.json();
      
      const sessionData = localStorage.getItem('userSession');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        session.user.tier = targetTier;
        session.user.stripeSubscriptionStatus = 'canceling';
        localStorage.setItem('userSession', JSON.stringify(session));
      }
      
      toast.success(
        `Subscription will be canceled at the end of your billing period${data.periodEnd ? `: ${data.periodEnd}` : ''}. You'll retain access until then.`,
        7000
      );
      setShowPlanModal(false);
      setPendingTierChange(null);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      console.error('Downgrade error:', err);
      setErrors({ general: err instanceof Error ? err.message : 'Failed to cancel subscription' });
      setPlanLoading(false);
      setPendingTierChange(null);
    }
  };

  const deleteAccount = () => {
    confirm(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      () => {
        if (user) {
          UserStorage.clearUserData(user.id);
          localStorage.removeItem('userSession');
          toast.success('Account deleted successfully');
          setTimeout(() => router.push('/'), 1500);
        }
      },
      {
        variant: 'danger',
        confirmText: 'Delete Account'
      }
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <>
        <Head>
          <title>Account Settings - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-yellow-400 text-xl">Please sign in to access settings</div>
        </div>
      </>
    );
  }
  const sections = [
    { id: 'personal', name: 'Personal Information', icon: '👤' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'subscription', name: 'Subscription', icon: '👑' },
    { id: 'privacy', name: 'Privacy & Communication', icon: '🔐' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'marketing', name: 'Marketing Preferences', icon: '📧' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'addresses', name: 'Addresses', icon: '📍' },
    { id: 'payments', name: 'Payment Methods', icon: '💳' },
    { id: 'activity', name: 'Account Activity', icon: '📊' },
    { id: 'data', name: 'Data & Privacy', icon: '📁' }
  ];

  return (
    <>
      <Head>
        <title>Account Settings - MIGISTUS</title>
      </Head>
      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-12 gap-8">
          
          {/* Mobile Header with Hamburger */}
          <div className="lg:hidden mb-4 flex items-center justify-between">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Account
            </Link>
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="bg-zinc-800 p-2 rounded-lg text-yellow-400 hover:bg-zinc-700 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileSidebarOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>

          {/* Mobile Sidebar Overlay */}
          {isMobileSidebarOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
          )}

          {/* Sidebar */}
          <aside className={`
            lg:w-80
            ${isMobileSidebarOpen ? 'fixed inset-y-0 left-0 z-50 w-80' : 'hidden'}
            lg:block lg:relative lg:z-0
          `}>
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sticky top-8 h-full lg:h-auto overflow-y-auto">
              <div className="hidden lg:block mb-6">
                <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
                  ← Back to Account
                </Link>
              </div>
              
              <h2 className="text-2xl font-bold text-yellow-400 mb-6">Account Settings</h2>
              
              <nav className="space-y-2">
                {sections.map(section => (
                  <button
                    key={section.id}
                    onClick={() => {
                      setActiveSection(section.id);
                      setIsMobileSidebarOpen(false); // Close mobile sidebar on selection
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30'
                        : 'text-gray-300 hover:bg-zinc-800/50 hover:text-yellow-300'
                    }`}
                  >
                    <span className="text-lg">{section.icon}</span>
                    <span className="font-medium">{section.name}</span>
                  </button>
                ))}
              </nav>

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-zinc-700">
                <button
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="w-full bg-yellow-400 hover:bg-yellow-300 disabled:bg-gray-600 text-black font-bold py-3 rounded-lg transition-colors"
                >
                  {saving ? 'Saving...' : 'Save All Changes'}
                </button>
                
                {saved && (
                  <div className="mt-2 text-green-400 text-sm text-center">
                    ✓ Settings saved successfully
                  </div>
                )}
                
                {errors.general && (
                  <div className="mt-2 text-red-400 text-sm text-center">
                    {errors.general}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-8">
              
              {/* Personal Information */}
              {activeSection === 'personal' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Personal Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name *</label>
                      <input
                        type="text"
                        value={settings.firstName}
                        onChange={e => updateSetting('firstName', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      />
                      {errors.firstName && <div className="text-red-400 text-sm mt-1">{errors.firstName}</div>}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={settings.lastName}
                        onChange={e => updateSetting('lastName', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      />
                      {errors.lastName && <div className="text-red-400 text-sm mt-1">{errors.lastName}</div>}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-gray-400"
                      />
                      <div className="text-xs text-gray-400 mt-1">Contact support to change email</div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={settings.phoneNumber}
                        onChange={e => updateSetting('phoneNumber', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={settings.dateOfBirth}
                      onChange={e => updateSetting('dateOfBirth', e.target.value)}
                      className="w-full md:w-1/2 px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Subscription Management */}
              {activeSection === 'subscription' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Subscription Management</h3>
                  
                  {/* Current Subscription */}
                  <div className="border border-yellow-500/30 rounded-lg p-6 bg-gradient-to-br from-yellow-900/10 to-purple-900/10">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">Current Plan</h4>
                      <span className="px-4 py-2 bg-yellow-400 text-black font-bold rounded-full">
                        {user.tier || 'Initiate'}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">Daily Votes</div>
                        <div className="text-2xl font-bold text-white">
                          {user.tier === 'MIGISTUS' ? '10' : user.tier === 'Guild' ? '3' : '1'}
                        </div>
                      </div>
                      <div className="bg-zinc-800/50 rounded-lg p-4">
                        <div className="text-gray-400 text-sm mb-1">Voting Power</div>
                        <div className="text-2xl font-bold text-white">
                          {user.tier === 'MIGISTUS' ? '5x' : user.tier === 'Guild' ? '2x' : '1x'}
                        </div>
                      </div>
                    </div>
                    
                    {user.stripeSubscriptionStatus && (
                      <div className="text-sm text-gray-400 mb-4">
                        Status: <span className="text-green-400">{user.stripeSubscriptionStatus}</span>
                      </div>
                    )}
                    
                    <Link 
                      href="/account/subscription"
                      className="inline-block bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-3 rounded-lg transition-colors"
                    >
                      View All Plans & Upgrade
                    </Link>
                  </div>
                  
                  {/* Change Plan Button - Available for all tiers */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Manage Subscription</h4>
                    <button
                      onClick={() => setShowPlanModal(true)}
                      className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-6 py-3 rounded-lg transition-colors"
                    >
                      {user.tier === 'Initiate' ? 'Upgrade Your Plan' : 'Change Plan'}
                    </button>
                  </div>
                  
                  {/* Billing Information */}
                  {user.tier !== 'Initiate' && (
                    <div className="border border-zinc-700 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Billing Information</h4>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex justify-between py-2 border-b border-zinc-700">
                          <span className="text-gray-400">Plan</span>
                          <span className="text-white font-medium">{user.tier} Membership</span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-zinc-700">
                          <span className="text-gray-400">Price</span>
                          <span className="text-white font-medium">
                            {user.tier === 'MIGISTUS' ? '$29.99' : '$9.99'}/month
                          </span>
                        </div>
                        <div className="flex justify-between py-2 border-b border-zinc-700">
                          <span className="text-gray-400">Next Billing Date</span>
                          <span className="text-white font-medium">
                            {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                          </span>
                        </div>
                        {user.stripeCustomerId && (
                          <div className="flex justify-between py-2">
                            <span className="text-gray-400">Customer ID</span>
                            <span className="text-white font-mono text-sm">{user.stripeCustomerId.substring(0, 20)}...</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            confirm(
                              'Cancel Subscription',
                              'Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.',
                              () => {
                                window.location.href = '/account/subscription';
                              },
                              {
                                variant: 'danger',
                                confirmText: 'Cancel Subscription'
                              }
                            );
                          }}
                          className="w-full bg-red-600/10 hover:bg-red-600/20 border border-red-500/30 text-red-400 font-bold px-4 py-3 rounded-lg transition-colors"
                        >
                          Cancel Subscription
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Subscription Benefits */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Your Benefits</h4>
                    <ul className="space-y-2">
                      {user.tier === 'Initiate' ? (
                        <>
                          <li className="flex items-center gap-2 text-gray-400">
                            <span className="text-green-400">✓</span> 1 vote per day
                          </li>
                          <li className="flex items-center gap-2 text-gray-400">
                            <span className="text-green-400">✓</span> Basic profile access
                          </li>
                          <li className="flex items-center gap-2 text-gray-400">
                            <span className="text-green-400">✓</span> Community features
                          </li>
                        </>
                      ) : user.tier === 'Guild' ? (
                        <>
                          <li className="flex items-center gap-2 text-white">
                            <span className="text-green-400">✓</span> 3 votes per day
                          </li>
                          <li className="flex items-center gap-2 text-white">
                            <span className="text-green-400">✓</span> 2x voting power
                          </li>
                          <li className="flex items-center gap-2 text-white">
                            <span className="text-green-400">✓</span> Early product access
                          </li>
                          <li className="flex items-center gap-2 text-white">
                            <span className="text-green-400">✓</span> Exclusive live drops
                          </li>
                          <li className="flex items-center gap-2 text-white">
                            <span className="text-green-400">✓</span> Priority support
                          </li>
                          <li className="flex items-center gap-2 text-white">
                            <span className="text-green-400">✓</span> Guild badge & flair
                          </li>
                        </>
                      ) : (
                        <>
                          <li className="flex items-center gap-2 text-yellow-400">
                            <span className="text-green-400">✓</span> 10 votes per day
                          </li>
                          <li className="flex items-center gap-2 text-yellow-400">
                            <span className="text-green-400">✓</span> 5x voting power
                          </li>
                          <li className="flex items-center gap-2 text-yellow-400">
                            <span className="text-green-400">✓</span> All Guild benefits
                          </li>
                          <li className="flex items-center gap-2 text-yellow-400">
                            <span className="text-green-400">✓</span> MIGISTUS crown badge
                          </li>
                          <li className="flex items-center gap-2 text-yellow-400">
                            <span className="text-green-400">✓</span> Premium monthly rewards
                          </li>
                          <li className="flex items-center gap-2 text-yellow-400">
                            <span className="text-green-400">✓</span> AI-powered analytics
                          </li>
                          <li className="flex items-center gap-2 text-yellow-400">
                            <span className="text-green-400">✓</span> Unlimited customization
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Security */}
              {activeSection === 'security' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Security Settings</h3>
                  
                  {/* Change Password */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-white">Change Password</h4>
                      <button
                        onClick={() => setShowPasswordSection(!showPasswordSection)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        {showPasswordSection ? 'Cancel' : 'Change Password'}
                      </button>
                    </div>
                    
                    {showPasswordSection && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={settings.currentPassword}
                              onChange={e => updateSetting('currentPassword', e.target.value)}
                              className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                            >
                              {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={settings.newPassword}
                              onChange={e => updateSetting('newPassword', e.target.value)}
                              className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                            >
                              {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {errors.newPassword && <div className="text-red-400 text-sm mt-1">{errors.newPassword}</div>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={settings.confirmPassword}
                              onChange={e => updateSetting('confirmPassword', e.target.value)}
                              className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none pr-12"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-yellow-400"
                            >
                              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {errors.confirmPassword && <div className="text-red-400 text-sm mt-1">{errors.confirmPassword}</div>}
                        </div>
                        
                        <button
                          onClick={() => handleSave('security')}
                          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-2 rounded-lg"
                        >
                          Update Password
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Two-Factor Authentication */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold text-white">Two-Factor Authentication</h4>
                        <p className="text-gray-400 text-sm">Add an extra layer of security to your account</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.twoFactorEnabled}
                          onChange={e => updateSetting('twoFactorEnabled', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Privacy & Communication */}
              {activeSection === 'privacy' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Privacy & Communication</h3>
                  
                  {/* Notification Preferences */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Notification Preferences</h4>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Email Notifications</div>
                          <div className="text-gray-400 text-sm">Receive updates via email</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.emailNotifications}
                            onChange={e => updateSetting('emailNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">SMS Notifications</div>
                          <div className="text-gray-400 text-sm">Receive text message alerts</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.smsNotifications}
                            onChange={e => updateSetting('smsNotifications', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Marketing Emails</div>
                          <div className="text-gray-400 text-sm">Promotional offers and news</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.marketingEmails}
                            onChange={e => updateSetting('marketingEmails', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Product Updates</div>
                          <div className="text-gray-400 text-sm">New drops and product announcements</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.productUpdates}
                            onChange={e => updateSetting('productUpdates', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-white font-medium">Order Updates</div>
                          <div className="text-gray-400 text-sm">Shipping and delivery notifications</div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.orderUpdates}
                            onChange={e => updateSetting('orderUpdates', e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Profile Visibility */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Profile Visibility</h4>
                    <select
                      value={settings.profileVisibility}
                      onChange={e => updateSetting('profileVisibility', e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                    >
                      <option value="public">Public - Anyone can see your profile</option>
                      <option value="private">Private - Only you can see your profile</option>
                      <option value="friends">Friends Only - Only friends can see your profile</option>
                    </select>
                  </div>                </div>
              )}

              {/* Marketing Preferences */}
              {activeSection === 'marketing' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Marketing Preferences</h3>
                  
                  {/* Marketing Communication */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Marketing Communications</h4>
                    <div className="space-y-6">
                      <div className="bg-zinc-800/50 rounded-lg p-4 border border-yellow-500/20">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <span className="text-2xl">📧</span>
                          </div>
                          <div className="flex-1">
                            <h5 className="text-lg font-semibold text-yellow-400 mb-2">Marketing Email Opt-In</h5>
                            <p className="text-gray-300 text-sm mb-4">
                              Receive exclusive offers, new product announcements, special deals, and community updates. 
                              You can unsubscribe at any time.
                            </p>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-white font-medium">I'd like to receive marketing communications</div>
                                <div className="text-gray-400 text-sm">Get updates about new drops, special offers, and community events</div>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={settings.marketingEmails}
                                  onChange={e => updateSetting('marketingEmails', e.target.checked)}
                                  className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-600">
                          <div>
                            <div className="text-white font-medium">Product Updates</div>
                            <div className="text-gray-400 text-sm">New drops and product announcements</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.productUpdates}
                              onChange={e => updateSetting('productUpdates', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                          </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg border border-zinc-600">
                          <div>
                            <div className="text-white font-medium">Order Updates</div>
                            <div className="text-gray-400 text-sm">Shipping and delivery notifications</div>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={settings.orderUpdates}
                              onChange={e => updateSetting('orderUpdates', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                          </label>
                        </div>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-1">
                            <span className="text-blue-400 text-lg">ℹ️</span>
                          </div>
                          <div>
                            <h6 className="font-semibold text-blue-400 mb-1">Privacy Notice</h6>
                            <p className="text-gray-300 text-sm">
                              Your email preferences are stored securely and used only for the purposes you've selected. 
                              You can change these settings at any time. We will never sell or share your email address 
                              with third parties for marketing purposes.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications */}
              {activeSection === 'notifications' && (
                <div className="space-y-6">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-yellow-400 mb-2">Notification Settings</h3>
                    <p className="text-gray-400">
                      Manage how you receive notifications across different channels. 
                      Control what alerts you see in-app, via email, and through push notifications.
                    </p>
                  </div>
                  
                  <NotificationPreferences />
                  
                  <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-6">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        <span className="text-blue-400 text-lg">💡</span>
                      </div>
                      <div>
                        <h6 className="font-semibold text-blue-400 mb-1">Tip</h6>
                        <p className="text-gray-300 text-sm">
                          You can customize notification settings for each type of activity. 
                          In-app notifications appear in your notification center, email notifications are sent to your registered email, 
                          and push notifications appear on your devices.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preferences */}
              {activeSection === 'preferences' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Preferences</h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Language</label>
                      <select
                        value={settings.language}
                        onChange={e => updateSetting('language', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      >
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="ja">日本語</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Currency</label>
                      <select
                        value={settings.currency}
                        onChange={e => updateSetting('currency', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="JPY">JPY - Japanese Yen</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Timezone</label>
                      <select
                        value={settings.timezone}
                        onChange={e => updateSetting('timezone', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      >
                        <option value="America/New_York">Eastern Time (EST)</option>
                        <option value="America/Chicago">Central Time (CST)</option>
                        <option value="America/Denver">Mountain Time (MST)</option>
                        <option value="America/Los_Angeles">Pacific Time (PST)</option>
                        <option value="Europe/London">London (GMT)</option>
                        <option value="Europe/Paris">Paris (CET)</option>
                        <option value="Asia/Tokyo">Tokyo (JST)</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Theme</label>
                      <select
                        value={settings.theme}
                        onChange={e => updateSetting('theme', e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                      >
                        <option value="dark">Dark Theme</option>
                        <option value="light">Light Theme</option>
                        <option value="auto">Auto (System)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between border border-zinc-700 rounded-lg p-4">
                    <div>
                      <div className="text-white font-medium">Auto-save Changes</div>
                      <div className="text-gray-400 text-sm">Automatically save changes 3 seconds after you stop typing</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.autoSave}
                        onChange={e => updateSetting('autoSave', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 dark:peer-focus:ring-yellow-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-yellow-400"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Addresses */}
              {activeSection === 'addresses' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-yellow-400">Saved Addresses</h3>
                    <button
                      onClick={addAddress}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-lg"
                    >
                      + Add Address
                    </button>
                  </div>

                  {/* Address List */}
                  <div className="space-y-4">
                    {settings.addresses.map(address => (
                      <div key={address.id} className="border border-zinc-700 rounded-lg p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-white font-semibold">
                                {address.firstName} {address.lastName}
                              </span>
                              {address.isDefault && (
                                <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded">Default</span>
                              )}
                            </div>
                            <div className="text-gray-300">
                              {address.company && <div>{address.company}</div>}
                              <div>{address.address1}</div>
                              {address.address2 && <div>{address.address2}</div>}
                              <div>{address.city}, {address.state} {address.zipCode}</div>
                              <div>{address.country}</div>
                              {address.phoneNumber && <div>{address.phoneNumber}</div>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-yellow-400 hover:text-yellow-300">Edit</button>
                            <button
                              onClick={() => removeAddress(address.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Address Form */}
                  {newAddress && (
                    <div className="border border-yellow-500/30 rounded-lg p-6 bg-zinc-800/50">
                      <h4 className="text-lg font-semibold text-white mb-4">Add New Address</h4>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="First Name"
                          value={newAddress.firstName}
                          onChange={e => setNewAddress({...newAddress, firstName: e.target.value})}
                          className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Last Name"
                          value={newAddress.lastName}
                          onChange={e => setNewAddress({...newAddress, lastName: e.target.value})}
                          className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Company (Optional)"
                          value={newAddress.company}
                          onChange={e => setNewAddress({...newAddress, company: e.target.value})}
                          className="md:col-span-2 px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 1"
                          value={newAddress.address1}
                          onChange={e => setNewAddress({...newAddress, address1: e.target.value})}
                          className="md:col-span-2 px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Address Line 2 (Optional)"
                          value={newAddress.address2}
                          onChange={e => setNewAddress({...newAddress, address2: e.target.value})}
                          className="md:col-span-2 px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="City"
                          value={newAddress.city}
                          onChange={e => setNewAddress({...newAddress, city: e.target.value})}
                          className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="State"
                          value={newAddress.state}
                          onChange={e => setNewAddress({...newAddress, state: e.target.value})}
                          className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="ZIP Code"
                          value={newAddress.zipCode}
                          onChange={e => setNewAddress({...newAddress, zipCode: e.target.value})}
                          className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <select
                          value={newAddress.country}
                          onChange={e => setNewAddress({...newAddress, country: e.target.value})}
                          className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        >
                          <option value="US">United States</option>
                          <option value="CA">Canada</option>
                          <option value="GB">United Kingdom</option>
                          <option value="DE">Germany</option>
                          <option value="FR">France</option>
                        </select>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={saveAddress}
                          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-2 rounded-lg"
                        >
                          Save Address
                        </button>
                        <button
                          onClick={() => setNewAddress(null)}
                          className="bg-zinc-600 hover:bg-zinc-500 text-white px-6 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Methods */}
              {activeSection === 'payments' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-yellow-400">Payment Methods</h3>
                    <button
                      onClick={addPaymentMethod}
                      className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-4 py-2 rounded-lg"
                    >
                      + Add Payment Method
                    </button>
                  </div>

                  {/* Payment Methods List */}
                  <div className="space-y-4">
                    {settings.paymentMethods.map(payment => (
                      <div key={payment.id} className="border border-zinc-700 rounded-lg p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-8 bg-zinc-700 rounded flex items-center justify-center">
                              {payment.type === 'card' && '💳'}
                              {payment.type === 'paypal' && '🅿️'}
                              {payment.type === 'bank' && '🏦'}
                            </div>
                            <div>
                              <div className="text-white font-semibold">{payment.nickname}</div>
                              <div className="text-gray-400 text-sm">
                                {payment.brand} •••• {payment.lastFour}
                                {payment.expiryDate && ` • Expires ${payment.expiryDate}`}
                              </div>
                              {payment.isDefault && (
                                <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded mt-1 inline-block">Default</span>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button className="text-yellow-400 hover:text-yellow-300">Edit</button>
                            <button
                              onClick={() => removePaymentMethod(payment.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Add Payment Method Form */}
                  {newPaymentMethod && (
                    <div className="border border-yellow-500/30 rounded-lg p-6 bg-zinc-800/50">
                      <h4 className="text-lg font-semibold text-white mb-4">Add Payment Method</h4>
                      <div className="space-y-4">
                        <input
                          type="text"
                          placeholder="Nickname (e.g., 'Personal Card')"
                          value={newPaymentMethod.nickname}
                          onChange={e => setNewPaymentMethod({...newPaymentMethod, nickname: e.target.value})}
                          className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        />
                        <div className="grid md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            placeholder="Last Four Digits"
                            value={newPaymentMethod.lastFour}
                            onChange={e => setNewPaymentMethod({...newPaymentMethod, lastFour: e.target.value})}
                            className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Expiry (MM/YY)"
                            value={newPaymentMethod.expiryDate}
                            onChange={e => setNewPaymentMethod({...newPaymentMethod, expiryDate: e.target.value})}
                            className="px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          />
                        </div>
                        <select
                          value={newPaymentMethod.brand}
                          onChange={e => setNewPaymentMethod({...newPaymentMethod, brand: e.target.value})}
                          className="w-full px-4 py-3 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                        >
                          <option value="">Select Card Brand</option>
                          <option value="Visa">Visa</option>
                          <option value="Mastercard">Mastercard</option>
                          <option value="American Express">American Express</option>
                          <option value="Discover">Discover</option>
                        </select>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={savePaymentMethod}
                          className="bg-yellow-400 hover:bg-yellow-300 text-black font-bold px-6 py-2 rounded-lg"
                        >
                          Save Payment Method
                        </button>
                        <button
                          onClick={() => setNewPaymentMethod(null)}
                          className="bg-zinc-600 hover:bg-zinc-500 text-white px-6 py-2 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Account Activity */}
              {activeSection === 'activity' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Account Activity</h3>
                  
                  {/* Login History */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Recent Login Activity</h4>
                    <div className="space-y-4">
                      {settings.loginHistory.map((login, index) => (
                        <div key={index} className="flex items-center justify-between py-3 border-b border-zinc-700 last:border-b-0">
                          <div>
                            <div className="text-white font-medium">{login.location}</div>
                            <div className="text-gray-400 text-sm">{login.device}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-gray-300">{new Date(login.date).toLocaleDateString()}</div>
                            <div className="text-gray-400 text-sm">{login.ip}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Account Statistics */}
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
                      <div className="text-3xl mb-2">🛒</div>
                      <div className="text-2xl font-bold text-yellow-400">
                        {UserStorage.getUserPledges(user.id).length}
                      </div>
                      <div className="text-gray-400">Total Pledges</div>
                    </div>
                    
                    <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
                      <div className="text-3xl mb-2">🗳️</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {UserStorage.getUserVotes(user.id).length}
                      </div>
                      <div className="text-gray-400">Votes Cast</div>
                    </div>
                    
                    <div className="bg-zinc-800/50 rounded-lg p-6 text-center">
                      <div className="text-3xl mb-2">📅</div>
                      <div className="text-2xl font-bold text-green-400">
                        {Math.floor((Date.now() - new Date(user.id).getTime()) / (1000 * 60 * 60 * 24))}
                      </div>
                      <div className="text-gray-400">Days Active</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Data & Privacy */}
              {activeSection === 'data' && (
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-yellow-400 mb-6">Data & Privacy</h3>
                  
                  {/* Data Export */}
                  <div className="border border-zinc-700 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Export Your Data</h4>
                    <p className="text-gray-400 mb-4">
                      Download a copy of all your personal data stored in your MIGISTUS account.
                    </p>
                    <button
                      onClick={exportData}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2 rounded-lg"
                    >
                      Download My Data
                    </button>
                  </div>

                  {/* Account Deletion */}
                  <div className="border border-red-500/30 rounded-lg p-6 bg-red-900/10">
                    <h4 className="text-lg font-semibold text-red-400 mb-4">Delete Account</h4>
                    <p className="text-gray-400 mb-4">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                    <button
                      onClick={deleteAccount}
                      className="bg-red-600 hover:bg-red-500 text-white font-bold px-6 py-2 rounded-lg"
                    >
                      Delete My Account
                    </button>
                  </div>
                </div>
              )}

            </div>
          </main>
        </div>
      </div>

      {/* Plan Change Modal */}
      {showPlanModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-yellow-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-700 flex items-center justify-between sticky top-0 bg-zinc-900 z-10">
              <h3 className="text-2xl font-bold text-yellow-400">Change Your Plan</h3>
              <button
                onClick={() => setShowPlanModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Initiate Plan */}
              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                user.tier === 'Initiate' 
                  ? 'border-zinc-600 bg-zinc-800/30' 
                  : 'border-zinc-700 hover:border-yellow-500/30 hover:bg-zinc-800/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-white">Initiate</h4>
                      {user.tier === 'Initiate' && (
                        <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full">
                          CURRENT
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mb-3">Perfect for getting started</p>
                    <div className="text-2xl font-bold text-white mb-2">FREE</div>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> 1 vote per day
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> 1x voting power
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> Basic profile access
                      </li>
                    </ul>
                  </div>
                  {user.tier !== 'Initiate' && (
                    <button
                      onClick={() => handlePlanChange('Initiate')}
                      disabled={planLoading}
                      className="ml-4 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white font-bold px-6 py-2 rounded-lg transition-colors"
                    >
                      {planLoading ? 'Processing...' : 'Downgrade'}
                    </button>
                  )}
                </div>
              </div>

              {/* Guild Plan */}
              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                user.tier === 'Guild' 
                  ? 'border-yellow-600 bg-yellow-900/10' 
                  : 'border-zinc-700 hover:border-yellow-500/30 hover:bg-zinc-800/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-yellow-400">Guild</h4>
                      {user.tier === 'Guild' && (
                        <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full">
                          CURRENT
                        </span>
                      )}
                      <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
                        POPULAR
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">For serious voters</p>
                    <div className="text-2xl font-bold text-white mb-2">$9.99 <span className="text-sm text-gray-400">/ month</span></div>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> 3 votes per day
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> 2x voting power
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> Early product access
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> Exclusive live drops
                      </li>
                    </ul>
                  </div>
                  {user.tier !== 'Guild' && (
                    <button
                      onClick={() => handlePlanChange('Guild')}
                      disabled={planLoading}
                      className="ml-4 bg-yellow-400 hover:bg-yellow-300 disabled:bg-yellow-600 text-black font-bold px-6 py-2 rounded-lg transition-colors"
                    >
                      {planLoading ? 'Processing...' : user.tier === 'Initiate' ? 'Upgrade' : 'Switch'}
                    </button>
                  )}
                </div>
              </div>

              {/* MIGISTUS Plan */}
              <div className={`border rounded-lg p-4 cursor-pointer transition-all ${
                user.tier === 'MIGISTUS' 
                  ? 'border-purple-600 bg-purple-900/10' 
                  : 'border-zinc-700 hover:border-purple-500/30 hover:bg-zinc-800/50'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-bold text-purple-400">MIGISTUS</h4>
                      {user.tier === 'MIGISTUS' && (
                        <span className="px-3 py-1 bg-yellow-400 text-black text-xs font-bold rounded-full">
                          CURRENT
                        </span>
                      )}
                      <span className="px-3 py-1 bg-purple-500 text-white text-xs font-bold rounded-full">
                        ELITE
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">Maximum influence</p>
                    <div className="text-2xl font-bold text-white mb-2">$29.99 <span className="text-sm text-gray-400">/ month</span></div>
                    <ul className="space-y-1 text-sm text-gray-300">
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> 10 votes per day
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> 5x voting power
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> All Guild benefits
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> MIGISTUS crown badge
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-green-400">✓</span> Premium rewards
                      </li>
                    </ul>
                  </div>
                  {user.tier !== 'MIGISTUS' && (
                    <button
                      onClick={() => handlePlanChange('MIGISTUS')}
                      disabled={planLoading}
                      className="ml-4 bg-purple-500 hover:bg-purple-400 disabled:bg-purple-700 text-white font-bold px-6 py-2 rounded-lg transition-colors"
                    >
                      {planLoading ? 'Processing...' : 'Upgrade'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && pendingTierChange && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border-2 border-yellow-400/30 rounded-xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center">
              <div className="mb-4">
                <div className="mx-auto w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-yellow-400 mb-3">
                Confirm Downgrade
              </h3>
              
              <p className="text-gray-300 mb-6">
                Are you sure you want to downgrade to <span className="text-yellow-400 font-semibold">{pendingTierChange}</span>?
                <br />
                <span className="text-sm text-gray-400 mt-2 block">
                  You will lose access to higher tier features.
                </span>
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowConfirmModal(false);
                    setPendingTierChange(null);
                  }}
                  className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmPlanDowngrade}
                  disabled={planLoading}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-400 disabled:bg-yellow-600 text-black font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  {planLoading ? 'Processing...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <ConfirmDialog />
    </>
  );
}
