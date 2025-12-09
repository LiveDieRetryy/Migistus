import { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import DashboardLayout from '@/components/DashboardLayout';
import { useAuth } from '@/context/AuthContext';
import { 
  processLifecycleTransitions, 
  getProductLifecycleStatus, 
  DEFAULT_LIFECYCLE_CONFIG,
  LifecycleConfig,
  ProductStage 
} from '@/utils/productLifecycle';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  votes: number;
  stage: ProductStage;
  stageEnteredAt: string;
  status?: string;
  pledges?: number;
  pledgeGoal?: number;
  backers?: number;
}

interface LifecycleStats {
  voting: number;
  comingSoon: number;
  communityDrops: number;
  recentlyCompleted: number;
  total: number;
  needsTransition: number;
  nextTransitionDate: string;
}

export default function LifecycleControlCenter() {
  const { user, isAuthenticated } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [activeStage, setActiveStage] = useState<ProductStage | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [stats, setStats] = useState<LifecycleStats>({
    voting: 0,
    comingSoon: 0,
    communityDrops: 0,
    recentlyCompleted: 0,
    total: 0,
    needsTransition: 0,
    nextTransitionDate: ''
  });

  // Lifecycle configuration
  const [config, setConfig] = useState<LifecycleConfig>(DEFAULT_LIFECYCLE_CONFIG);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!isAuthenticated || user?.email !== 'admin@migistus.com') return;
    loadLifecycleData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLifecycleData, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  useEffect(() => {
    filterProducts();
  }, [products, activeStage, searchTerm]);

  const loadLifecycleData = async () => {
    try {
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const allProducts = data.products || [];
        setProducts(allProducts);
        calculateStats(allProducts);
      }
    } catch (error) {
      console.error('Failed to load lifecycle data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (allProducts: Product[]) => {
    const voting = allProducts.filter(p => (p.stage || 'voting') === 'voting').length;
    const comingSoon = allProducts.filter(p => p.stage === 'coming-soon').length;
    const communityDrops = allProducts.filter(p => p.stage === 'community-drops').length;
    const recentlyCompleted = allProducts.filter(p => p.stage === 'recently-completed').length;
    
    // Count products that need transition
    let needsTransition = 0;
    allProducts.forEach(product => {
      const status = getProductLifecycleStatus(product as any, config);
      if (status.readyToTransition) {
        needsTransition++;
      }
    });

    // Get next Friday
    const today = new Date();
    const daysUntilFriday = (5 - today.getDay() + 7) % 7;
    const nextFriday = new Date(today);
    nextFriday.setDate(today.getDate() + (daysUntilFriday === 0 ? 7 : daysUntilFriday));

    setStats({
      voting,
      comingSoon,
      communityDrops,
      recentlyCompleted,
      total: allProducts.length,
      needsTransition,
      nextTransitionDate: nextFriday.toLocaleDateString()
    });
  };

  const filterProducts = () => {
    let filtered = products;

    if (activeStage !== 'all') {
      filtered = filtered.filter(p => (p.stage || 'voting') === activeStage);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredProducts(filtered);
  };

  const processTransitions = async () => {
    setProcessing(true);
    setMessage('');

    try {
      const processedProducts = processLifecycleTransitions(products as any[], config);
      
      // Save to API
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: processedProducts })
      });

      if (response.ok) {
        setMessage('✅ Lifecycle transitions processed successfully!');
        await loadLifecycleData();
      } else {
        setMessage('❌ Failed to save transitions');
      }
    } catch (error) {
      console.error('Error processing transitions:', error);
      setMessage('❌ Error processing transitions');
    } finally {
      setProcessing(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const manualTransition = async (productId: string, newStage: ProductStage) => {
    try {
      const updatedProducts = products.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            stage: newStage,
            stageEnteredAt: new Date().toISOString()
          };
        }
        return p;
      });

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updatedProducts })
      });

      if (response.ok) {
        setMessage(`✅ Product manually moved to ${newStage}`);
        await loadLifecycleData();
        setShowTransitionModal(false);
        setSelectedProduct(null);
      } else {
        setMessage('❌ Failed to transition product');
      }
    } catch (error) {
      console.error('Error transitioning product:', error);
      setMessage('❌ Error transitioning product');
    }
    setTimeout(() => setMessage(''), 5000);
  };

  const resetProductToVoting = async (productId: string) => {
    await manualTransition(productId, 'voting');
  };

  const saveConfiguration = async () => {
    try {
      // Save config to localStorage for now (could be API endpoint)
      localStorage.setItem('lifecycle_config', JSON.stringify(config));
      setMessage('✅ Configuration saved successfully!');
      setShowConfigModal(false);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage('❌ Error saving configuration');
    }
    setTimeout(() => setMessage(''), 5000);
  };

  const getStageColor = (stage: ProductStage | undefined) => {
    switch (stage || 'voting') {
      case 'voting': return 'bg-blue-500/20 border-blue-500 text-blue-400';
      case 'coming-soon': return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'community-drops': return 'bg-green-500/20 border-green-500 text-green-400';
      case 'recently-completed': return 'bg-purple-500/20 border-purple-500 text-purple-400';
      default: return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  const getStageIcon = (stage: ProductStage | undefined) => {
    switch (stage || 'voting') {
      case 'voting': return '🗳️';
      case 'coming-soon': return '⏳';
      case 'community-drops': return '🔥';
      case 'recently-completed': return '✅';
      default: return '📦';
    }
  };

  if (!isAuthenticated || user?.email !== 'admin@migistus.com') {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-2">⚠️ Access Denied</h1>
            <p className="text-gray-300">You need royal privileges to access the Lifecycle Control Center.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Lifecycle Control Center - Kings Domain | Migistus</title>
        <meta name="description" content="Complete product lifecycle management and control" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔄</span>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 bg-clip-text text-transparent">
                  Lifecycle Control Center
                </h1>
                <p className="text-gray-400 text-lg">Complete oversight of the product lifecycle automation system</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowConfigModal(true)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>⚙️</span>
                <span>Configuration</span>
              </button>
              <button
                onClick={processTransitions}
                disabled={processing}
                className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg transition-colors font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {processing ? (
                  <>
                    <span className="animate-spin">⚡</span>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <span>🔄</span>
                    <span>Process Transitions</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-4 ${message.includes('✅') ? 'bg-green-900/30 border border-green-500 text-green-400' : 'bg-red-900/30 border border-red-500 text-red-400'}`}>
              {message}
            </div>
          )}

          <div className="text-sm text-gray-400">
            Next automatic transition: <span className="text-yellow-400 font-semibold">{stats.nextTransitionDate} (Friday)</span> | 
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-blue-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🗳️</span>
              <span className="text-2xl font-bold text-blue-400">{stats.voting}</span>
            </div>
            <p className="text-sm text-gray-400">Voting Stage</p>
            <p className="text-xs text-gray-500 mt-1">Active voting period</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-yellow-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">⏳</span>
              <span className="text-2xl font-bold text-yellow-400">{stats.comingSoon}</span>
            </div>
            <p className="text-sm text-gray-400">Coming Soon</p>
            <p className="text-xs text-gray-500 mt-1">Preparing for launch</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-green-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">🔥</span>
              <span className="text-2xl font-bold text-green-400">{stats.communityDrops}</span>
            </div>
            <p className="text-sm text-gray-400">Live Drops</p>
            <p className="text-xs text-gray-500 mt-1">Active group buys</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-purple-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">✅</span>
              <span className="text-2xl font-bold text-purple-400">{stats.recentlyCompleted}</span>
            </div>
            <p className="text-sm text-gray-400">Completed</p>
            <p className="text-xs text-gray-500 mt-1">Archived drops</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-orange-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">⚡</span>
              <span className="text-2xl font-bold text-orange-400">{stats.needsTransition}</span>
            </div>
            <p className="text-sm text-gray-400">Needs Transition</p>
            <p className="text-xs text-gray-500 mt-1">Ready to advance</p>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-3xl">📦</span>
              <span className="text-2xl font-bold text-gray-400">{stats.total}</span>
            </div>
            <p className="text-sm text-gray-400">Total Products</p>
            <p className="text-xs text-gray-500 mt-1">All stages</p>
          </div>
        </div>

        {/* Stage Filter Tabs */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <button
              onClick={() => setActiveStage('all')}
              className={`px-4 py-2 rounded-lg transition-colors ${activeStage === 'all' ? 'bg-gradient-to-r from-yellow-600 to-orange-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              All Products ({stats.total})
            </button>
            <button
              onClick={() => setActiveStage('voting')}
              className={`px-4 py-2 rounded-lg transition-colors ${activeStage === 'voting' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              🗳️ Voting ({stats.voting})
            </button>
            <button
              onClick={() => setActiveStage('coming-soon')}
              className={`px-4 py-2 rounded-lg transition-colors ${activeStage === 'coming-soon' ? 'bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              ⏳ Coming Soon ({stats.comingSoon})
            </button>
            <button
              onClick={() => setActiveStage('community-drops')}
              className={`px-4 py-2 rounded-lg transition-colors ${activeStage === 'community-drops' ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              🔥 Live Drops ({stats.communityDrops})
            </button>
            <button
              onClick={() => setActiveStage('recently-completed')}
              className={`px-4 py-2 rounded-lg transition-colors ${activeStage === 'recently-completed' ? 'bg-purple-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-gray-300'}`}
            >
              ✅ Completed ({stats.recentlyCompleted})
            </button>

            <div className="ml-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-yellow-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Current Stage</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Stage Duration</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Metrics</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      <div className="animate-spin text-4xl mb-2">⚡</div>
                      <div>Loading lifecycle data...</div>
                    </td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-400">
                      No products found in this stage
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => {
                    const lifecycleStatus = getProductLifecycleStatus(product as any, config);
                    const daysInStage = Math.floor(
                      (new Date().getTime() - new Date(product.stageEnteredAt).getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <tr key={product.id} className="hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {product.image && (
                              <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gray-700">
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-white">{product.name}</div>
                              <div className="text-sm text-gray-400">${product.price}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-gray-700 rounded-full text-sm text-gray-300">
                            {product.category}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-semibold ${getStageColor(product.stage)}`}>
                            <span>{getStageIcon(product.stage)}</span>
                            <span className="capitalize">{(product.stage || 'voting').replace('-', ' ')}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            <div className="font-semibold text-white">{daysInStage} days</div>
                            <div className="text-gray-400">
                              {lifecycleStatus.daysRemaining > 0 
                                ? `${lifecycleStatus.daysRemaining} days left`
                                : 'Ready to transition'
                              }
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm">
                            {product.stage === 'voting' || !product.stage ? (
                              <>
                                <div className="font-semibold text-blue-400">🗳️ {product.votes || 0} votes</div>
                              </>
                            ) : product.stage === 'community-drops' ? (
                              <>
                                <div className="font-semibold text-green-400">💰 ${product.pledges || 0} pledged</div>
                                <div className="text-gray-400">{product.backers || 0} backers</div>
                              </>
                            ) : product.stage === 'recently-completed' ? (
                              <>
                                <div className="font-semibold text-purple-400">✅ {product.backers || 0} backers</div>
                                <div className="text-gray-400">${product.pledges || 0} fulfilled</div>
                              </>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {lifecycleStatus.readyToTransition ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-900/30 border border-orange-500 rounded-full text-sm text-orange-400 font-semibold">
                              <span>⚡</span>
                              <span>Ready</span>
                            </span>
                          ) : lifecycleStatus.daysRemaining <= 2 ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-900/30 border border-yellow-500 rounded-full text-sm text-yellow-400">
                              <span>⏰</span>
                              <span>Soon</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-900/30 border border-green-500 rounded-full text-sm text-green-400">
                              <span>✓</span>
                              <span>Active</span>
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setSelectedProduct(product);
                                setShowTransitionModal(true);
                              }}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-sm font-semibold transition-colors"
                            >
                              Transition
                            </button>
                            <button
                              onClick={() => resetProductToVoting(product.id)}
                              className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm transition-colors"
                              title="Reset to Voting"
                            >
                              🔄
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Manual Transition Modal */}
      {showTransitionModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h3 className="text-xl font-bold mb-4 text-white">Manual Stage Transition</h3>
            <p className="text-gray-300 mb-4">
              Transition <span className="font-semibold text-yellow-400">{selectedProduct.name}</span> to:
            </p>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => manualTransition(selectedProduct.id, 'voting')}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors text-left flex items-center gap-3"
              >
                <span className="text-2xl">🗳️</span>
                <div>
                  <div className="font-semibold">Voting Stage</div>
                  <div className="text-sm text-blue-200">Community voting period</div>
                </div>
              </button>

              <button
                onClick={() => manualTransition(selectedProduct.id, 'coming-soon')}
                className="w-full px-4 py-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors text-left flex items-center gap-3"
              >
                <span className="text-2xl">⏳</span>
                <div>
                  <div className="font-semibold">Coming Soon</div>
                  <div className="text-sm text-yellow-200">Preparing for launch</div>
                </div>
              </button>

              <button
                onClick={() => manualTransition(selectedProduct.id, 'community-drops')}
                className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors text-left flex items-center gap-3"
              >
                <span className="text-2xl">🔥</span>
                <div>
                  <div className="font-semibold">Community Drops</div>
                  <div className="text-sm text-green-200">Active group buy</div>
                </div>
              </button>

              <button
                onClick={() => manualTransition(selectedProduct.id, 'recently-completed')}
                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-left flex items-center gap-3"
              >
                <span className="text-2xl">✅</span>
                <div>
                  <div className="font-semibold">Recently Completed</div>
                  <div className="text-sm text-purple-200">Archive completed drop</div>
                </div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowTransitionModal(false);
                setSelectedProduct(null);
              }}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full border border-gray-700 my-8">
            <h3 className="text-2xl font-bold mb-4 text-white flex items-center gap-2">
              <span>⚙️</span>
              <span>Lifecycle Configuration</span>
            </h3>

            <div className="space-y-6 mb-6">
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-yellow-400 mb-3">Stage Durations</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Voting Stage Duration (days)
                    </label>
                    <input
                      type="number"
                      value={config.votingDuration}
                      onChange={(e) => setConfig({...config, votingDuration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-gray-400 mt-1">Current: {config.votingDuration} days</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Coming Soon Duration (days)
                    </label>
                    <input
                      type="number"
                      value={config.comingSoonDuration}
                      onChange={(e) => setConfig({...config, comingSoonDuration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-gray-400 mt-1">Current: {config.comingSoonDuration} days</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Community Drops Duration (days)
                    </label>
                    <input
                      type="number"
                      value={config.communityDropsDuration}
                      onChange={(e) => setConfig({...config, communityDropsDuration: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                      min="1"
                      max="30"
                    />
                    <p className="text-xs text-gray-400 mt-1">Current: {config.communityDropsDuration} days</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h4 className="font-semibold text-yellow-400 mb-3">Transition Settings</h4>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Voting End Day
                    </label>
                    <select
                      value={config.votingEndDay}
                      onChange={(e) => setConfig({...config, votingEndDay: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">All voting ends on this day every week</p>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Drop Launch Day
                    </label>
                    <select
                      value={config.dropStartDay}
                      onChange={(e) => setConfig({...config, dropStartDay: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
                    >
                      <option value="0">Sunday</option>
                      <option value="1">Monday</option>
                      <option value="2">Tuesday</option>
                      <option value="3">Wednesday</option>
                      <option value="4">Thursday</option>
                      <option value="5">Friday</option>
                      <option value="6">Saturday</option>
                    </select>
                    <p className="text-xs text-gray-400 mt-1">New drops launch on this day only</p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/20 border border-blue-500/50 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="text-sm text-blue-200">
                    <p className="font-semibold mb-1">Automatic Transitions</p>
                    <p>Products automatically transition through stages based on duration and day settings. The system processes transitions every time the products API is called, and only on the configured days.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={saveConfiguration}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 rounded-lg transition-colors font-semibold"
              >
                Save Configuration
              </button>
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

// Suppress footer for this admin page
(LifecycleControlCenter as any).showFooter = false;
