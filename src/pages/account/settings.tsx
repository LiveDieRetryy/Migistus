import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext"; // Updated import
import { UserStorage3 as UserStorage } from "@/utils/userStorage";
import { activityTracker } from "@/utils/activityTracker";

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
  autoSave: true,
  addresses: [],
  paymentMethods: [],
  loginHistory: []
};

export default function AccountSettingsPage() {
  const { user, isAuthenticated, updateUser } = useAuth(); // Updated to use correct hook
  const router = useRouter();
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [activeSection, setActiveSection] = useState('personal');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newAddress, setNewAddress] = useState<any>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState<any>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user) {
      loadUserSettings();
    }
  }, [user, isAuthenticated, router]);

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

      if (section === 'security' || !section) {
        if (settings.newPassword && settings.newPassword !== settings.confirmPassword) {
          validationErrors.confirmPassword = 'Passwords do not match';
        }
        if (settings.newPassword && settings.newPassword.length < 8) {
          validationErrors.newPassword = 'Password must be at least 8 characters';
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
      }      // Save to API
      const response = await fetch(`/api/account/settings?userId=${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
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
    if (settings.autoSave) {
      // Debounce auto-save
      setTimeout(() => handleSave(), 1000);
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

  const deleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      // In a real app, this would call an API
      if (user) {
        UserStorage.clearUserData(user.id);
        localStorage.removeItem('userSession');
        router.push('/');
      }
    }
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
    { id: 'privacy', name: 'Privacy & Communication', icon: '🔐' },
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
          
          {/* Back Link */}
          <div className="lg:hidden mb-4">
            <Link href="/account" className="text-yellow-400 hover:text-yellow-300">
              ← Back to Account
            </Link>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-80">
            <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 sticky top-8">
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
                    onClick={() => setActiveSection(section.id)}
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
                          <input
                            type="password"
                            value={settings.currentPassword}
                            onChange={e => updateSetting('currentPassword', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                          <input
                            type="password"
                            value={settings.newPassword}
                            onChange={e => updateSetting('newPassword', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          />
                          {errors.newPassword && <div className="text-red-400 text-sm mt-1">{errors.newPassword}</div>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                          <input
                            type="password"
                            value={settings.confirmPassword}
                            onChange={e => updateSetting('confirmPassword', e.target.value)}
                            className="w-full px-4 py-3 bg-zinc-800 border border-yellow-500/30 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                          />
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
                      <div className="text-gray-400 text-sm">Automatically save changes as you type</div>
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
    </>
  );
}
