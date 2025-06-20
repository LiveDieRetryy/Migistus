import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import MainNavbar from '@/components/nav/MainNavbar';
import { useAuth } from '@/context/AuthContext';

interface LiveDrop {
  id: string;
  productId: string;
  productName: string;
  status: 'scheduled' | 'live' | 'ending-soon' | 'ended';
  startTime: string;
  endTime: string;
  currentPledges: number;
  targetAmount: number;
  pledgeCount: number;
  timeRemaining?: string;
  participants: number;
  image?: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  status: string;
  image: string;
  category: string;
}

export default function AdminLiveDropsPage() {
  const { user, isAuthenticated } = useAuth();
  const [liveDrops, setLiveDrops] = useState<LiveDrop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'active' | 'schedule' | 'ended'>('overview');

  // New drop form
  const [newDrop, setNewDrop] = useState({
    productId: '',
    startTime: '',
    endTime: '',
    targetAmount: 0,
    limitedQuantity: false,
    maxQuantity: 0
  });

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    loadLiveDropsData();
  }, [isAuthenticated, user]);

  const loadLiveDropsData = async () => {
    try {
      // Load products first
      const productsResponse = await fetch('/api/products');
      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        setProducts(productsData.products || []);
      }

      // Load live drops data
      const liveDropsResponse = await fetch('/api/live-drops');
      if (liveDropsResponse.ok) {
        const liveDropsData = await liveDropsResponse.json();
        setLiveDrops(liveDropsData.liveDrops || []);
      }
    } catch (error) {
      console.error('Failed to load live drops data:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLiveDrop = async () => {
    if (!newDrop.productId || !newDrop.startTime || !newDrop.endTime) {
      alert('Please fill in all required fields');
      return;
    }

    const startDate = new Date(newDrop.startTime);
    const endDate = new Date(newDrop.endTime);
    
    if (startDate >= endDate) {
      alert('End time must be after start time');
      return;
    }

    try {
      const selectedProduct = products.find(p => p.id === newDrop.productId);
      
      const dropData = {
        ...newDrop,
        id: `drop_${Date.now()}`,
        productName: selectedProduct?.name || 'Unknown Product',
        status: new Date() >= startDate ? 'live' : 'scheduled',
        currentPledges: 0,
        pledgeCount: 0,
        participants: 0,
        image: selectedProduct?.image
      };

      const response = await fetch('/api/live-drops/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dropData)
      });

      if (response.ok) {
        alert('Live drop created successfully!');
        setNewDrop({
          productId: '',
          startTime: '',
          endTime: '',
          targetAmount: 0,
          limitedQuantity: false,
          maxQuantity: 0
        });
        loadLiveDropsData();
        setActiveTab('active');
      } else {
        alert('Failed to create live drop');
      }
    } catch (error) {
      console.error('Error creating live drop:', error);
      alert('Error creating live drop');
    }
  };

  const updateDropStatus = async (dropId: string, status: string) => {
    try {
      const response = await fetch('/api/live-drops/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropId, status })
      });

      if (response.ok) {
        loadLiveDropsData();
        alert(`Drop ${status} successfully!`);
      }
    } catch (error) {
      console.error('Error updating drop status:', error);
    }
  };

  const extendDrop = async (dropId: string, hours: number) => {
    try {
      const response = await fetch('/api/live-drops/extend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dropId, hours })
      });

      if (response.ok) {
        loadLiveDropsData();
        alert(`Drop extended by ${hours} hours!`);
      }
    } catch (error) {
      console.error('Error extending drop:', error);
    }
  };

  const endDrop = async (dropId: string) => {
    if (!confirm('Are you sure you want to end this drop? This action cannot be undone.')) return;
    updateDropStatus(dropId, 'ended');
  };

  const formatTimeRemaining = (endTime: string) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100);
  };

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">Access Denied</h1>
            <p className="text-gray-300">You need admin privileges to access live drops control.</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <MainNavbar />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="mt-4 text-gray-400">Loading live drops data...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeDrops = liveDrops.filter(d => d.status === 'live');
  const scheduledDrops = liveDrops.filter(d => d.status === 'scheduled');
  const endedDrops = liveDrops.filter(d => d.status === 'ended');
  const endingSoonDrops = liveDrops.filter(d => d.status === 'ending-soon');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Live Drops Control - Kings Domain | Migistus</title>
        <meta name="description" content="Admin live drops management" />
      </Head>

      <MainNavbar />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-red-400 mb-2 flex items-center gap-3">
            <span>🔴</span> Live Drops Control Center
          </h1>
          <p className="text-gray-400">Manage live drops, monitor real-time activity, and control drop lifecycle</p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-700">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Overview', count: liveDrops.length },
                { id: 'active', label: 'Active Drops', count: activeDrops.length },
                { id: 'schedule', label: 'Schedule New Drop' },
                { id: 'ended', label: 'Ended Drops', count: endedDrops.length }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-red-500 text-red-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className="ml-2 bg-gray-700 text-gray-300 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-2">🔴 Active Drops</h3>
                <div className="text-3xl font-bold text-white">{activeDrops.length}</div>
                <p className="text-sm text-gray-400">Currently live</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-yellow-400 mb-2">⏰ Scheduled</h3>
                <div className="text-3xl font-bold text-white">{scheduledDrops.length}</div>
                <p className="text-sm text-gray-400">Upcoming drops</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-orange-400 mb-2">⚠️ Ending Soon</h3>
                <div className="text-3xl font-bold text-white">{endingSoonDrops.length}</div>
                <p className="text-sm text-gray-400">Need attention</p>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-400 mb-2">✅ Completed</h3>
                <div className="text-3xl font-bold text-white">{endedDrops.length}</div>
                <p className="text-sm text-gray-400">Total ended</p>
              </div>
            </div>

            {/* Active Drops Quick View */}
            {activeDrops.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">🔴 Active Drops - Real Time</h3>
                <div className="space-y-4">
                  {activeDrops.map(drop => (
                    <div key={drop.id} className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {drop.image && (
                            <div className="w-12 h-12 bg-gray-600 rounded overflow-hidden">
                              <Image 
                                src={drop.image} 
                                alt={drop.productName}
                                width={48}
                                height={48}
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div>
                            <h4 className="font-semibold text-white">{drop.productName}</h4>
                            <p className="text-sm text-gray-400">Drop ID: {drop.id}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-red-400 font-bold">🔴 LIVE</div>
                          <div className="text-sm text-gray-400">{formatTimeRemaining(drop.endTime)} left</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-700 rounded p-3 text-center">
                          <div className="text-xl font-bold text-green-400">${drop.currentPledges}</div>
                          <div className="text-sm text-gray-400">Current Pledges</div>
                        </div>
                        <div className="bg-gray-700 rounded p-3 text-center">
                          <div className="text-xl font-bold text-blue-400">{drop.pledgeCount}</div>
                          <div className="text-sm text-gray-400">Participants</div>
                        </div>
                        <div className="bg-gray-700 rounded p-3 text-center">
                          <div className="text-xl font-bold text-purple-400">
                            {getProgressPercentage(drop.currentPledges, drop.targetAmount).toFixed(1)}%
                          </div>
                          <div className="text-sm text-gray-400">of ${drop.targetAmount}</div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="bg-gray-700 rounded-full h-3">
                          <div 
                            className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                            style={{ width: `${getProgressPercentage(drop.currentPledges, drop.targetAmount)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => extendDrop(drop.id, 2)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          +2h
                        </button>
                        <button
                          onClick={() => extendDrop(drop.id, 6)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          +6h
                        </button>
                        <button
                          onClick={() => extendDrop(drop.id, 24)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors"
                        >
                          +24h
                        </button>
                        <button
                          onClick={() => endDrop(drop.id)}
                          className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors ml-auto"
                        >
                          End Drop Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Drops Tab */}
        {activeTab === 'active' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-400 mb-4">All Active Drops</h3>
              {activeDrops.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No active drops at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {activeDrops.map(drop => (
                    <div key={drop.id} className="bg-gray-700 rounded-lg p-4">
                      {drop.image && (
                        <div className="w-full h-32 bg-gray-600 rounded mb-3 overflow-hidden">
                          <Image 
                            src={drop.image} 
                            alt={drop.productName}
                            width={300}
                            height={200}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <h4 className="font-semibold text-white mb-2">{drop.productName}</h4>
                      <div className="text-sm text-gray-400 mb-3">
                        <div>Time remaining: {formatTimeRemaining(drop.endTime)}</div>
                        <div>Pledges: ${drop.currentPledges} / ${drop.targetAmount}</div>
                        <div>Participants: {drop.pledgeCount}</div>
                      </div>

                      <div className="mb-3">
                        <div className="bg-gray-600 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${getProgressPercentage(drop.currentPledges, drop.targetAmount)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => extendDrop(drop.id, 2)}
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          +2h
                        </button>
                        <button
                          onClick={() => extendDrop(drop.id, 6)}
                          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          +6h
                        </button>
                        <button
                          onClick={() => endDrop(drop.id)}
                          className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs transition-colors"
                        >
                          End Now
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Schedule New Drop Tab */}
        {activeTab === 'schedule' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-6">Schedule New Live Drop</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Select Product</label>
                <select
                  value={newDrop.productId}
                  onChange={(e) => setNewDrop({ ...newDrop, productId: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                >
                  <option value="">Choose a product...</option>
                  {products.filter(p => p.status !== 'ended').map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} - {product.category}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="datetime-local"
                    value={newDrop.startTime}
                    onChange={(e) => setNewDrop({ ...newDrop, startTime: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="datetime-local"
                    value={newDrop.endTime}
                    onChange={(e) => setNewDrop({ ...newDrop, endTime: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Target Amount ($)</label>
                <input
                  type="number"
                  value={newDrop.targetAmount}
                  onChange={(e) => setNewDrop({ ...newDrop, targetAmount: Number(e.target.value) })}
                  placeholder="e.g., 5000"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newDrop.limitedQuantity}
                    onChange={(e) => setNewDrop({ ...newDrop, limitedQuantity: e.target.checked })}
                    className="w-4 h-4 text-red-600 bg-gray-700 border-gray-600 rounded focus:ring-red-500"
                  />
                  <span className="text-sm text-gray-300">Limited Quantity Drop</span>
                </label>
                
                {newDrop.limitedQuantity && (
                  <input
                    type="number"
                    value={newDrop.maxQuantity}
                    onChange={(e) => setNewDrop({ ...newDrop, maxQuantity: Number(e.target.value) })}
                    placeholder="Max quantity"
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-1 text-white focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                )}
              </div>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setNewDrop({
                    productId: '',
                    startTime: '',
                    endTime: '',
                    targetAmount: 0,
                    limitedQuantity: false,
                    maxQuantity: 0
                  })}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={createLiveDrop}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  Schedule Drop
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ended Drops Tab */}
        {activeTab === 'ended' && (
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-400 mb-4">Ended Drops</h3>
            {endedDrops.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No ended drops yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {endedDrops.map(drop => (
                  <div key={drop.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-white">{drop.productName}</h4>
                        <p className="text-sm text-gray-400">
                          Final: ${drop.currentPledges} / ${drop.targetAmount} 
                          ({getProgressPercentage(drop.currentPledges, drop.targetAmount).toFixed(1)}%)
                        </p>
                        <p className="text-xs text-gray-500">
                          Ended: {new Date(drop.endTime).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        drop.currentPledges >= drop.targetAmount
                          ? 'bg-green-900 text-green-300'
                          : 'bg-red-900 text-red-300'
                      }`}>
                        {drop.currentPledges >= drop.targetAmount ? 'Success' : 'Failed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
