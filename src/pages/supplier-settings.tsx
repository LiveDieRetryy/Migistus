import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LocationSelector } from '../components/ui/LocationSelector';
import { ImageUpload } from '../components/ui/ImageUpload';
import { getCountryName, getStateName } from '../lib/locationData';
import { getSupplierAvatar } from '../lib/utils';

interface SupplierProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  website: string;
  description: string;
  logo: string;
  bannerImage: string;  location: {
    address: string;
    city: string;
    state: string; // This will be state/province code
    zipCode: string;
    country: string; // This will be country code
  };
  businessInfo: {
    businessName: string;
    businessType: string;
    taxId: string;
    registrationNumber: string;
    yearEstablished: number;
  };
  contactInfo: {
    primaryContact: string;
    primaryEmail: string;
    primaryPhone: string;
    supportEmail: string;
    supportPhone: string;
  };
  bankingInfo: {
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    swiftCode: string;
  };
  shippingInfo: {      warehouses: Array<{
        id: string;
        name: string;
        address: string;
        city: string;
        state: string; // This will be state/province code
        zipCode: string;
        country: string; // This will be country code
      }>;
    shippingMethods: string[];
    averageProcessingTime: string;
  };
  socialMedia: {
    facebook: string;
    twitter: string;
    instagram: string;
    linkedin: string;
    youtube: string;
  };
  certifications: string[];
  specialties: string[];
  minimumOrderValue: number;
  paymentTerms: string;
  returnPolicy: string;
}

export default function SupplierSettings() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [supplierProfile, setSupplierProfile] = useState<SupplierProfile>({
    id: '',
    name: '',
    email: '',
    phone: '',
    website: '',
    description: '',
    logo: '',
    bannerImage: '',
    location: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    },
    businessInfo: {
      businessName: '',
      businessType: '',
      taxId: '',
      registrationNumber: '',
      yearEstablished: new Date().getFullYear(),
    },
    contactInfo: {
      primaryContact: '',
      primaryEmail: '',
      primaryPhone: '',
      supportEmail: '',
      supportPhone: '',
    },
    bankingInfo: {
      accountHolderName: '',
      bankName: '',
      accountNumber: '',
      routingNumber: '',
      swiftCode: '',
    },
    shippingInfo: {
      warehouses: [],
      shippingMethods: [],
      averageProcessingTime: '',
    },
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: '',
      youtube: '',
    },
    certifications: [],
    specialties: [],
    minimumOrderValue: 0,
    paymentTerms: '',
    returnPolicy: '',
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isSupplier = localStorage.getItem("isSupplier") === "true";
      const supplierName = localStorage.getItem("supplierName") || "";
      const supplierId = localStorage.getItem("supplierId") || "";
      
      if (!isSupplier) {
        router.replace("/supplier-login");
      } else {
        loadSupplierProfile(supplierId, supplierName);
        setLoading(false);
      }
    }
  }, [router]);
  // Cleanup effect to revoke blob URLs on unmount
  useEffect(() => {
    return () => {
      // Clean up any blob URLs to prevent memory leaks
      // Only revoke blob URLs, not server URLs
      if (supplierProfile.logo && supplierProfile.logo.startsWith('blob:')) {
        URL.revokeObjectURL(supplierProfile.logo);
      }
      if (supplierProfile.bannerImage && supplierProfile.bannerImage.startsWith('blob:')) {
        URL.revokeObjectURL(supplierProfile.bannerImage);
      }
    };
  }, [supplierProfile.logo, supplierProfile.bannerImage]);

  const loadSupplierProfile = async (supplierId: string, supplierName: string) => {
    try {
      // Try to load from localStorage first
      const savedProfile = localStorage.getItem(`supplierProfile_${supplierId}`);
      if (savedProfile) {
        setSupplierProfile(JSON.parse(savedProfile));
      } else {
        // Initialize with basic info
        setSupplierProfile(prev => ({
          ...prev,
          id: supplierId,
          name: supplierName,
          businessInfo: {
            ...prev.businessInfo,
            businessName: supplierName,
          },
          contactInfo: {
            ...prev.contactInfo,
            primaryContact: supplierName,
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load supplier profile:', error);
    }
  };
  const handleSave = async () => {
    setSaving(true);
    try {
      // Validate required fields
      if (!supplierProfile.name || !supplierProfile.email) {
        alert('Please fill in all required fields (Name and Email).');
        setSaving(false);
        return;
      }

      // Save to localStorage for now (can be replaced with API call)
      localStorage.setItem(`supplierProfile_${supplierProfile.id}`, JSON.stringify(supplierProfile));
      
      // Update the supplier name in main storage if changed
      if (supplierProfile.name) {
        localStorage.setItem("supplierName", supplierProfile.name);
      }
      
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  // Function to handle image removal and cleanup
  const handleImageRemove = (field: 'logo' | 'bannerImage') => {
    const currentImage = supplierProfile[field];
    
    // Clean up blob URLs to prevent memory leaks
    // Only revoke blob URLs, not server URLs
    if (currentImage && currentImage.startsWith('blob:')) {
      URL.revokeObjectURL(currentImage);
    }
    
    handleInputChange(field, '');
  };
  const handleInputChange = (field: string, value: any, section?: string) => {
    setSupplierProfile(prev => {
      if (section) {
        return {
          ...prev,
          [section]: {
            ...(prev[section as keyof SupplierProfile] as Record<string, any>),
            [field]: value
          }
        };
      }
      return {
        ...prev,
        [field]: value
      };
    });
  };

  const addWarehouse = () => {
    const newWarehouse = {
      id: Date.now().toString(),
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: '',
    };
    setSupplierProfile(prev => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        warehouses: [...prev.shippingInfo.warehouses, newWarehouse]
      }
    }));
  };

  const removeWarehouse = (warehouseId: string) => {
    setSupplierProfile(prev => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        warehouses: prev.shippingInfo.warehouses.filter(w => w.id !== warehouseId)
      }
    }));
  };
  const updateWarehouse = (warehouseId: string, field: string, value: string) => {
    setSupplierProfile(prev => ({
      ...prev,
      shippingInfo: {
        ...prev.shippingInfo,
        warehouses: prev.shippingInfo.warehouses.map(w => 
          w.id === warehouseId ? { ...w, [field]: value } : w
        )
      }
    }));
  };

  const handleLocationChange = (field: 'country' | 'state', value: string) => {
    setSupplierProfile(prev => ({
      ...prev,
      location: {
        ...prev.location,
        [field]: value
      }
    }));
  };

  const handleWarehouseLocationChange = (warehouseId: string, field: 'country' | 'state', value: string) => {
    updateWarehouse(warehouseId, field, value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }
  const tabs = [
    { id: 'general', name: 'General Info', icon: '👤' },
    { id: 'business', name: 'Business Details', icon: '🏢' },
    { id: 'contact', name: 'Contact Info', icon: '📞' },
    { id: 'banking', name: 'Banking', icon: '🏦' },
    { id: 'shipping', name: 'Shipping', icon: '📦' },
    { id: 'social', name: 'Social Media', icon: '📱' },
    { id: 'preferences', name: 'Preferences', icon: '⚙️' },
    { id: 'preview', name: 'Profile Preview', icon: '👁️' },
  ];

  return (
    <>
      <Head>
        <title>Supplier Settings - MIGISTUS</title>
        <meta name="description" content="Manage your supplier profile and settings" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black">
        {/* Header */}
        <div className="bg-zinc-900/50 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/supplier-dashboard" className="text-yellow-400 hover:text-yellow-300">
                  ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-white">Supplier Settings</h1>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-6 py-2 rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex gap-8">
            {/* Sidebar Navigation */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-4">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                          : 'text-gray-300 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="text-xl">{tab.icon}</span>
                      <span className="font-medium">{tab.name}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg p-6">
                {/* General Info Tab */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">General Information</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Supplier Name *
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.name}
                          onChange={(e) => handleInputChange('name', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Enter your supplier name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={supplierProfile.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Enter your email"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={supplierProfile.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Enter your phone number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Website
                        </label>
                        <input
                          type="url"
                          value={supplierProfile.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="https://your-website.com"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={supplierProfile.description}
                        onChange={(e) => handleInputChange('description', e.target.value)}
                        rows={4}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                        placeholder="Tell us about your business..."
                      />
                    </div>                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Company Logo
                        </label>
                        <ImageUpload
                          value={supplierProfile.logo}
                          onChange={(imageUrl) => handleInputChange('logo', imageUrl)}
                          onRemove={() => handleImageRemove('logo')}
                          placeholder="Upload your company logo"
                          aspectRatio="square"
                          maxSizeMB={2}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Recommended size: 200x200px or larger. Square format preferred.
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Banner Image
                        </label>
                        <ImageUpload
                          value={supplierProfile.bannerImage}
                          onChange={(imageUrl) => handleInputChange('bannerImage', imageUrl)}
                          onRemove={() => handleImageRemove('bannerImage')}
                          placeholder="Upload your banner image"
                          aspectRatio="banner"
                          maxSizeMB={5}
                          className="w-full"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          Recommended size: 1200x400px or larger. Banner format (3:1 ratio) preferred.
                        </p>
                      </div>
                    </div>

                    {/* Location */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Location</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Address
                          </label>
                          <input
                            type="text"
                            value={supplierProfile.location.address}
                            onChange={(e) => handleInputChange('address', e.target.value, 'location')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="Street address"
                          />
                        </div>                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            value={supplierProfile.location.city}
                            onChange={(e) => handleInputChange('city', e.target.value, 'location')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="City"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            ZIP/Postal Code
                          </label>
                          <input
                            type="text"
                            value={supplierProfile.location.zipCode}
                            onChange={(e) => handleInputChange('zipCode', e.target.value, 'location')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="ZIP or Postal Code"
                          />
                        </div>
                      </div>                      {/* Dynamic Location Selector */}
                      <LocationSelector
                        country={supplierProfile.location.country}
                        state={supplierProfile.location.state}
                        onCountryChange={(country) => handleLocationChange('country', country)}
                        onStateChange={(state) => handleLocationChange('state', state)}
                        className="mb-6"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Business Details Tab */}
                {activeTab === 'business' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Business Details</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Name *
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.businessInfo.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value, 'businessInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Official business name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Type
                        </label>
                        <select
                          value={supplierProfile.businessInfo.businessType}
                          onChange={(e) => handleInputChange('businessType', e.target.value, 'businessInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                        >
                          <option value="">Select business type</option>
                          <option value="Corporation">Corporation</option>
                          <option value="LLC">LLC</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Sole Proprietorship">Sole Proprietorship</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Tax ID / EIN
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.businessInfo.taxId}
                          onChange={(e) => handleInputChange('taxId', e.target.value, 'businessInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Tax ID or EIN"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Registration Number
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.businessInfo.registrationNumber}
                          onChange={(e) => handleInputChange('registrationNumber', e.target.value, 'businessInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Business registration number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Year Established
                        </label>
                        <input
                          type="number"
                          value={supplierProfile.businessInfo.yearEstablished}
                          onChange={(e) => handleInputChange('yearEstablished', parseInt(e.target.value), 'businessInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Year established"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Certifications
                      </label>
                      <textarea
                        value={supplierProfile.certifications.join('\n')}
                        onChange={(e) => handleInputChange('certifications', e.target.value.split('\n').filter(c => c.trim()))}
                        rows={4}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                        placeholder="Enter certifications (one per line)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Specialties
                      </label>
                      <textarea
                        value={supplierProfile.specialties.join('\n')}
                        onChange={(e) => handleInputChange('specialties', e.target.value.split('\n').filter(s => s.trim()))}
                        rows={4}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                        placeholder="Enter your specialties (one per line)"
                      />
                    </div>
                  </div>
                )}

                {/* Contact Info Tab */}
                {activeTab === 'contact' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Contact Information</h2>
                    
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Primary Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Contact Name *
                          </label>
                          <input
                            type="text"
                            value={supplierProfile.contactInfo.primaryContact}
                            onChange={(e) => handleInputChange('primaryContact', e.target.value, 'contactInfo')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="Primary contact name"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Email *
                          </label>
                          <input
                            type="email"
                            value={supplierProfile.contactInfo.primaryEmail}
                            onChange={(e) => handleInputChange('primaryEmail', e.target.value, 'contactInfo')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="Primary contact email"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Phone *
                          </label>
                          <input
                            type="tel"
                            value={supplierProfile.contactInfo.primaryPhone}
                            onChange={(e) => handleInputChange('primaryPhone', e.target.value, 'contactInfo')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="Primary contact phone"
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">Support Contact</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Support Email
                          </label>
                          <input
                            type="email"
                            value={supplierProfile.contactInfo.supportEmail}
                            onChange={(e) => handleInputChange('supportEmail', e.target.value, 'contactInfo')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="Support email"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Support Phone
                          </label>
                          <input
                            type="tel"
                            value={supplierProfile.contactInfo.supportPhone}
                            onChange={(e) => handleInputChange('supportPhone', e.target.value, 'contactInfo')}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                            placeholder="Support phone"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Banking Tab */}
                {activeTab === 'banking' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Banking Information</h2>
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <span className="text-yellow-400 text-xl">🔒</span>
                        <div>
                          <h3 className="text-yellow-400 font-semibold">Secure Information</h3>
                          <p className="text-gray-300 text-sm">Your banking information is encrypted and secure. This is required for payment processing.</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Account Holder Name *
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.bankingInfo.accountHolderName}
                          onChange={(e) => handleInputChange('accountHolderName', e.target.value, 'bankingInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Account holder name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Bank Name *
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.bankingInfo.bankName}
                          onChange={(e) => handleInputChange('bankName', e.target.value, 'bankingInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Bank name"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Account Number *
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.bankingInfo.accountNumber}
                          onChange={(e) => handleInputChange('accountNumber', e.target.value, 'bankingInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Account number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Routing Number *
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.bankingInfo.routingNumber}
                          onChange={(e) => handleInputChange('routingNumber', e.target.value, 'bankingInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Routing number"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          SWIFT Code (International)
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.bankingInfo.swiftCode}
                          onChange={(e) => handleInputChange('swiftCode', e.target.value, 'bankingInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="SWIFT code"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Tab */}
                {activeTab === 'shipping' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Shipping Information</h2>
                    
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-white">Warehouses</h3>
                        <button
                          onClick={addWarehouse}
                          className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black px-4 py-2 rounded-lg font-medium transition-all"
                        >
                          Add Warehouse
                        </button>
                      </div>

                      {supplierProfile.shippingInfo.warehouses.map((warehouse, index) => (
                        <div key={warehouse.id} className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-white font-medium">Warehouse {index + 1}</h4>
                            <button
                              onClick={() => removeWarehouse(warehouse.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Warehouse Name
                              </label>
                              <input
                                type="text"
                                value={warehouse.name}
                                onChange={(e) => updateWarehouse(warehouse.id, 'name', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                                placeholder="Warehouse name"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                Address
                              </label>
                              <input
                                type="text"
                                value={warehouse.address}
                                onChange={(e) => updateWarehouse(warehouse.id, 'address', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                                placeholder="Address"
                              />
                            </div>                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={warehouse.city}
                                onChange={(e) => updateWarehouse(warehouse.id, 'city', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                                placeholder="City"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-300 mb-2">
                                ZIP/Postal Code
                              </label>
                              <input
                                type="text"
                                value={warehouse.zipCode}
                                onChange={(e) => updateWarehouse(warehouse.id, 'zipCode', e.target.value)}
                                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                                placeholder="ZIP/Postal Code"
                              />
                            </div>
                          </div>

                          {/* Warehouse Location Selector */}
                          <LocationSelector
                            country={warehouse.country}
                            state={warehouse.state}
                            onCountryChange={(country) => handleWarehouseLocationChange(warehouse.id, 'country', country)}
                            onStateChange={(state) => handleWarehouseLocationChange(warehouse.id, 'state', state)}
                            className="mb-4"
                          />
                        </div>
                      ))}

                      {supplierProfile.shippingInfo.warehouses.length === 0 && (
                        <div className="text-center py-8 text-gray-400">
                          No warehouses added yet. Click "Add Warehouse" to get started.
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Shipping Methods
                        </label>
                        <textarea
                          value={supplierProfile.shippingInfo.shippingMethods.join('\n')}
                          onChange={(e) => handleInputChange('shippingMethods', e.target.value.split('\n').filter(m => m.trim()), 'shippingInfo')}
                          rows={4}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="Enter shipping methods (one per line)&#10;e.g. Standard Ground&#10;Express Shipping&#10;Overnight"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Average Processing Time
                        </label>
                        <input
                          type="text"
                          value={supplierProfile.shippingInfo.averageProcessingTime}
                          onChange={(e) => handleInputChange('averageProcessingTime', e.target.value, 'shippingInfo')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="e.g. 1-2 business days"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media Tab */}
                {activeTab === 'social' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Social Media</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Facebook
                        </label>
                        <input
                          type="url"
                          value={supplierProfile.socialMedia.facebook}
                          onChange={(e) => handleInputChange('facebook', e.target.value, 'socialMedia')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="https://facebook.com/yourpage"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Twitter
                        </label>
                        <input
                          type="url"
                          value={supplierProfile.socialMedia.twitter}
                          onChange={(e) => handleInputChange('twitter', e.target.value, 'socialMedia')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="https://twitter.com/youraccount"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Instagram
                        </label>
                        <input
                          type="url"
                          value={supplierProfile.socialMedia.instagram}
                          onChange={(e) => handleInputChange('instagram', e.target.value, 'socialMedia')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="https://instagram.com/youraccount"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          value={supplierProfile.socialMedia.linkedin}
                          onChange={(e) => handleInputChange('linkedin', e.target.value, 'socialMedia')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="https://linkedin.com/company/yourcompany"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          YouTube
                        </label>
                        <input
                          type="url"
                          value={supplierProfile.socialMedia.youtube}
                          onChange={(e) => handleInputChange('youtube', e.target.value, 'socialMedia')}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="https://youtube.com/yourchannel"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences Tab */}
                {activeTab === 'preferences' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Business Preferences</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Minimum Order Value
                        </label>
                        <input
                          type="number"
                          value={supplierProfile.minimumOrderValue}
                          onChange={(e) => handleInputChange('minimumOrderValue', parseFloat(e.target.value) || 0)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Payment Terms
                        </label>
                        <select
                          value={supplierProfile.paymentTerms}
                          onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
                        >
                          <option value="">Select payment terms</option>
                          <option value="Net 30">Net 30</option>
                          <option value="Net 15">Net 15</option>
                          <option value="Due on Receipt">Due on Receipt</option>
                          <option value="2/10 Net 30">2/10 Net 30</option>
                          <option value="Cash on Delivery">Cash on Delivery</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Return Policy
                      </label>
                      <textarea
                        value={supplierProfile.returnPolicy}
                        onChange={(e) => handleInputChange('returnPolicy', e.target.value)}
                        rows={6}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                        placeholder="Describe your return policy..."
                      />                    </div>
                  </div>
                )}

                {/* Profile Preview Tab */}
                {activeTab === 'preview' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold text-white mb-6">Profile Preview</h2>
                    <p className="text-gray-300 mb-6">This is how your supplier profile will appear to customers and administrators.</p>
                    
                    {/* Profile Card Preview */}
                    <div className="bg-zinc-800 border border-zinc-700 rounded-lg overflow-hidden">
                      {/* Banner Image */}
                      {supplierProfile.bannerImage && (
                        <div className="h-32 bg-gradient-to-r from-zinc-700 to-zinc-600 relative">
                          <img
                            src={supplierProfile.bannerImage}
                            alt="Supplier Banner"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Profile Content */}
                      <div className="p-6">
                        <div className="flex items-start gap-4">                          {/* Logo */}
                          <div className="flex-shrink-0">
                            <img
                              src={getSupplierAvatar(supplierProfile.logo)}
                              alt="Supplier Logo"
                              className="w-16 h-16 rounded-lg object-cover border border-zinc-600"
                            />
                          </div>
                          
                          {/* Basic Info */}
                          <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">
                              {supplierProfile.name || 'Your Supplier Name'}
                            </h3>
                            {supplierProfile.businessInfo.businessName && 
                             supplierProfile.businessInfo.businessName !== supplierProfile.name && (
                              <p className="text-yellow-400 text-sm">
                                {supplierProfile.businessInfo.businessName}
                              </p>
                            )}
                            <p className="text-gray-300 text-sm mt-1">
                              {supplierProfile.location.city && supplierProfile.location.country ? (
                                `${supplierProfile.location.city}, ${getCountryName(supplierProfile.location.country)}`
                              ) : (
                                'Location not specified'
                              )}
                            </p>
                            {supplierProfile.businessInfo.yearEstablished && (
                              <p className="text-gray-400 text-xs mt-1">
                                Established {supplierProfile.businessInfo.yearEstablished}
                              </p>
                            )}
                          </div>
                          
                          {/* Quick Stats */}
                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm text-gray-300">
                              <p>Business Type:</p>
                              <p className="text-yellow-400 font-medium">
                                {supplierProfile.businessInfo.businessType || 'Not specified'}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Description */}
                        {supplierProfile.description && (
                          <div className="mt-4 pt-4 border-t border-zinc-700">
                            <p className="text-gray-300 text-sm">
                              {supplierProfile.description}
                            </p>
                          </div>
                        )}
                        
                        {/* Specialties & Certifications */}
                        <div className="mt-4 pt-4 border-t border-zinc-700">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {supplierProfile.specialties.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Specialties:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {supplierProfile.specialties.map((specialty, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs"
                                    >
                                      {specialty}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {supplierProfile.certifications.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Certifications:</h4>
                                <div className="flex flex-wrap gap-1">
                                  {supplierProfile.certifications.map((cert, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs"
                                    >
                                      {cert}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Contact & Links */}
                        <div className="mt-4 pt-4 border-t border-zinc-700 flex flex-wrap gap-4 text-sm">
                          {supplierProfile.email && (
                            <a
                              href={`mailto:${supplierProfile.email}`}
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              📧 {supplierProfile.email}
                            </a>
                          )}
                          {supplierProfile.website && (
                            <a
                              href={supplierProfile.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              🌐 Website
                            </a>
                          )}
                          {supplierProfile.phone && (
                            <span className="text-gray-300">
                              📞 {supplierProfile.phone}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview Notes */}
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="text-blue-400 font-medium mb-2">Preview Notes:</h4>
                      <ul className="text-sm text-gray-300 space-y-1">
                        <li>• This preview shows how your profile appears to customers and administrators</li>
                        <li>• Upload a logo and banner image in the General Info tab for better presentation</li>
                        <li>• Complete all sections to provide comprehensive information about your business</li>
                        <li>• Specialties and certifications help customers understand your expertise</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
