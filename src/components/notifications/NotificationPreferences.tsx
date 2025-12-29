// components/notifications/NotificationPreferences.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bell, Mail, Smartphone, Save, Check } from 'lucide-react';

interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  channels: {
    inApp: boolean;
    email: boolean;
    push: boolean;
  };
}

interface NotificationPreferencesProps {
  className?: string;
}

export default function NotificationPreferences({ className = '' }: NotificationPreferencesProps) {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      type: 'follow',
      label: 'New Followers',
      description: 'When someone follows you',
      channels: { inApp: true, email: true, push: false }
    },
    {
      type: 'like',
      label: 'Likes',
      description: 'When someone likes your post',
      channels: { inApp: true, email: false, push: false }
    },
    {
      type: 'comment',
      label: 'Comments',
      description: 'When someone comments on your post',
      channels: { inApp: true, email: true, push: false }
    },
    {
      type: 'mention',
      label: 'Mentions',
      description: 'When someone mentions you',
      channels: { inApp: true, email: true, push: true }
    },
    {
      type: 'product',
      label: 'Product Updates',
      description: 'Updates on products you follow',
      channels: { inApp: true, email: true, push: false }
    },
    {
      type: 'message',
      label: 'Direct Messages',
      description: 'When you receive a new message',
      channels: { inApp: true, email: true, push: true }
    },
    {
      type: 'marketing',
      label: 'Marketing & News',
      description: 'Platform updates and newsletters',
      channels: { inApp: false, email: true, push: false }
    },
    {
      type: 'system',
      label: 'System Alerts',
      description: 'Important platform notifications',
      channels: { inApp: true, email: true, push: true }
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Fetch preferences
  const fetchPreferences = async () => {
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const response = await fetch('/api/notifications/preferences', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        
        // API returns database preferences object directly (or null if none exist)
        // Map database fields to our preference structure
        if (data && typeof data === 'object') {
          setPreferences(prev =>
            prev.map(pref => {
              // Map preference types to database fields
              const dbFieldMap: Record<string, string> = {
                follow: 'new_followers',
                comment: 'product_comments',
                product: 'product_launches',
                message: 'direct_messages',
                marketing: 'marketing_emails',
                system: 'system_announcements'
              };
              
              const dbField = dbFieldMap[pref.type];
              
              // If we have a database field mapping and it exists in the response
              if (dbField && data[dbField] !== undefined) {
                return {
                  ...pref,
                  channels: {
                    inApp: data[dbField] || false,
                    email: data.email_enabled && data[dbField] || false,
                    push: data.push_enabled && data[dbField] || false
                  }
                };
              }
              
              return pref;
            })
          );
        }
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      // Keep default preferences on error
    } finally {
      setLoading(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    if (!isAuthenticated) return;

    setSaving(true);
    setSaved(false);
    
    try {
      // Convert our preference structure to the API format
      const apiPreferences: any = {
        email_enabled: preferences.some(p => p.channels.email),
        push_enabled: preferences.some(p => p.channels.push)
      };
      
      // Map each preference type to database field
      preferences.forEach(pref => {
        const dbFieldMap: Record<string, string> = {
          follow: 'new_followers',
          comment: 'product_comments',
          product: 'product_launches',
          message: 'direct_messages',
          marketing: 'marketing_emails',
          system: 'system_announcements',
          like: 'product_votes'
        };
        
        const dbField = dbFieldMap[pref.type];
        if (dbField) {
          apiPreferences[dbField] = pref.channels.inApp || pref.channels.email || pref.channels.push;
        }
      });
      
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(apiPreferences)
      });

      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert('Failed to save preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  // Toggle channel
  const toggleChannel = (type: string, channel: 'inApp' | 'email' | 'push') => {
    setPreferences(prev =>
      prev.map(pref =>
        pref.type === type
          ? {
              ...pref,
              channels: { ...pref.channels, [channel]: !pref.channels[channel] }
            }
          : pref
      )
    );
  };

  // Fetch on mount
  useEffect(() => {
    fetchPreferences();
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className={`bg-zinc-900 rounded-lg border border-zinc-800 p-8 text-center ${className}`}>
        <Bell className="w-12 h-12 mx-auto mb-3 text-zinc-600" />
        <p className="text-zinc-400">Please sign in to manage notification preferences</p>
      </div>
    );
  }

  return (
    <div className={`bg-zinc-900 rounded-lg border border-zinc-800 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
            <p className="text-sm text-zinc-400 mt-0.5">
              Choose how you want to be notified
            </p>
          </div>
          
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <Check className="w-4 h-4" />
              <span>Saved!</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full mx-auto mb-2"></div>
          <p className="text-zinc-400">Loading preferences...</p>
        </div>
      ) : (
        <>
          {/* Channel Headers */}
          <div className="px-6 py-3 bg-zinc-950 border-b border-zinc-800">
            <div className="grid grid-cols-[1fr,120px,120px,120px] gap-4 items-center">
              <div className="text-xs font-semibold text-zinc-400 uppercase">
                Notification Type
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 uppercase">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">In-App</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 uppercase">
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">Email</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-zinc-400 uppercase">
                <Smartphone className="w-4 h-4" />
                <span className="hidden sm:inline">Push</span>
              </div>
            </div>
          </div>

          {/* Preferences List */}
          <div className="divide-y divide-zinc-800">
            {preferences.map((pref) => (
              <div
                key={pref.type}
                className="px-6 py-4 hover:bg-zinc-800/30 transition-colors"
              >
                <div className="grid grid-cols-[1fr,120px,120px,120px] gap-4 items-center">
                  {/* Label & Description */}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {pref.label}
                    </div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {pref.description}
                    </div>
                  </div>

                  {/* In-App Toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleChannel(pref.type, 'inApp')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        pref.channels.inApp
                          ? 'bg-yellow-400'
                          : 'bg-zinc-700'
                      }`}
                      aria-label={`Toggle in-app notifications for ${pref.label}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          pref.channels.inApp ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Email Toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleChannel(pref.type, 'email')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        pref.channels.email
                          ? 'bg-yellow-400'
                          : 'bg-zinc-700'
                      }`}
                      aria-label={`Toggle email notifications for ${pref.label}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          pref.channels.email ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>

                  {/* Push Toggle */}
                  <div className="flex justify-center">
                    <button
                      onClick={() => toggleChannel(pref.type, 'push')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        pref.channels.push
                          ? 'bg-yellow-400'
                          : 'bg-zinc-700'
                      }`}
                      aria-label={`Toggle push notifications for ${pref.label}`}
                    >
                      <div
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                          pref.channels.push ? 'translate-x-6' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer - Save Button */}
          <div className="px-6 py-4 bg-zinc-950 border-t border-zinc-800">
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Changes are saved automatically to your account
              </p>
              <button
                onClick={savePreferences}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-yellow-400 hover:bg-yellow-300 text-black rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Preferences</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
