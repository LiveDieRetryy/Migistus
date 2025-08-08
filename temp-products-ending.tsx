        )}

        {/* Lifecycle Tab - Placeholder */}
        {activeTab === 'lifecycle' && (
          <div className="bg-zinc-900 border border-yellow-500 rounded-lg p-8 text-center mt-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">Product Lifecycle Controls</h2>
            <div className="text-zinc-400">Lifecycle configuration will be available here.</div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// --- LifecycleConfigForm component ---
function LifecycleConfigForm() {
  const [config, setConfig] = useState({
    votingToComingSoonThreshold: 50,
    comingSoonDuration: 7,
    communityDropsDuration: 14,
    autoPromotionEnabled: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/product-lifecycle-config')
      .then(res => res.json())
      .then(data => {
        setConfig(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : Number(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError('');
    try {
      const res = await fetch('/api/product-lifecycle-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSuccess(true);
      } else {
        setError('Failed to save config');
      }
    } catch {
      setError('Failed to save config');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-zinc-400">Loading config...</div>;

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto text-left">
      <div className="mb-6">
        <label className="block text-yellow-300 font-medium mb-2">Votes required to move to Coming Soon</label>
        <input
          type="number"
          name="votingToComingSoonThreshold"
          value={config.votingToComingSoonThreshold}
          onChange={handleChange}
          min={1}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div className="mb-6">
        <label className="block text-yellow-300 font-medium mb-2">Days in Coming Soon before Live Drop</label>
        <input
          type="number"
          name="comingSoonDuration"
          value={config.comingSoonDuration}
          onChange={handleChange}
          min={1}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div className="mb-6">
        <label className="block text-yellow-300 font-medium mb-2">Days as Live Drop before Ending</label>
        <input
          type="number"
          name="communityDropsDuration"
          value={config.communityDropsDuration}
          onChange={handleChange}
          min={1}
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-yellow-500 focus:outline-none"
        />
      </div>
      <div className="mb-6 flex items-center gap-2">
        <input
          type="checkbox"
          name="autoPromotionEnabled"
          checked={config.autoPromotionEnabled}
          onChange={handleChange}
          className="h-5 w-5 text-yellow-500 focus:ring-yellow-400 border-zinc-700 rounded"
        />
        <label className="text-yellow-300 font-medium">Enable Auto-Promotion</label>
      </div>
      <button
        type="submit"
        className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 py-3 rounded-lg transition"
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Settings'}
      </button>
      {success && <div className="text-green-400 mt-4">Settings saved!</div>}
      {error && <div className="text-red-400 mt-4">{error}</div>}
    </form>
  );
}
