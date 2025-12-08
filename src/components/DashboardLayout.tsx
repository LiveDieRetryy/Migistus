import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

type DashboardLayoutProps = {
  children: ReactNode;
};

const NAVIGATION_ITEMS = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "🏰",
    href: "/kingdom",
    description: "Command center & overview",
  },
  // Core Admin Modules
  {
    id: "users",
    title: "Users",
    icon: "👥",
    href: "/kingdom/users",
    description: "Manage user accounts",
    badge: "users",
    category: "core"
  },
  {
    id: "products",
    title: "Products",
    icon: "📦",
    href: "/kingdom/products",
    description: "Product catalog & inventory",
    badge: "products",
    category: "core"
  },
  {
    id: "voting",
    title: "Voting",
    icon: "🗳️",
    href: "/kingdom/voting",
    description: "Community polls & decisions",
    category: "core"
  },
  {
    id: "live-drops",
    title: "Live Drops",
    icon: "🔥",
    href: "/kingdom/live-drops",
    description: "Real-time product drops",
    category: "core"
  },
  {
    id: "marketing",
    title: "Marketing",
    icon: "📢",
    href: "/kingdom/marketing",
    description: "Campaigns & promotions",
    category: "core"
  },  {
    id: "coming-soon",
    title: "Coming Soon",
    icon: "⏰",
    href: "/kingdom/coming-soon",
    description: "Upcoming features & announcements",
    category: "core"
  },  {
    id: "suppliers",
    title: "Suppliers",
    icon: "🏭",
    href: "/kingdom/suppliers",
    description: "Manage supplier applications",
    badge: "supplierApplications",
    category: "core"
  },{
    id: "supplier-products",
    title: "Product Reviews",
    icon: "📦",
    href: "/kingdom/supplier-products",
    description: "Review supplier product submissions",
    badge: "supplierProducts",
    category: "core"
  },
  // Analytics & Content
  {
    id: "analytics",
    title: "Analytics",
    icon: "📊",
    href: "/kingdom/analytics",
    description: "Performance insights",
    category: "analytics"
  },
  {
    id: "content",
    title: "Content",
    icon: "🎨",
    href: "/kingdom/content",
    description: "Site content & media",
    category: "analytics"
  },
  // Settings & Moderation
  {
    id: "settings",
    title: "Settings",
    icon: "⚙️",
    href: "/kingdom/settings",
    description: "System configuration",
    category: "settings"
  },
  {
    id: "refunds",
    title: "Refunds",
    icon: "💰",
    href: "/kingdom/refunds",
    description: "Process refund requests",
    badge: "refunds",
    category: "settings"
  },
  {
    id: "moderation",
    title: "Moderation",
    icon: "🛡️",
    href: "/kingdom/moderation",
    description: "Chat & content moderation",
    badge: "reports",
    category: "settings"
  },
];

const QUICK_ACTIONS = [
  {
    id: "add-product",
    title: "Add Product",
    icon: "➕",
    href: "/kingdom/products",
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "create-poll",
    title: "Create Poll",
    icon: "🗳️",
    href: "/kingdom/voting",
    color: "from-purple-500 to-purple-600",
  },
  {
    id: "send-campaign",
    title: "Send Campaign",
    icon: "📢",
    href: "/kingdom/marketing",
    color: "from-green-500 to-green-600",
  },
  {
    id: "homepage",
    title: "View Site",
    icon: "🏠",
    href: "/",
    color: "from-yellow-500 to-yellow-600",
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [activeItem, setActiveItem] = useState("");  
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const [diagnosticsData, setDiagnosticsData] = useState<{
    refunds: any[];
    reports: any[];
    supplierApplications: any[];
  }>({ refunds: [], reports: [], supplierApplications: [] });
  const [badges, setBadges] = useState({
    users: 0,
    products: 0,
    supplierProducts: 0,
    supplierApplications: 0,
    refunds: 0,
    reports: 0,
  });
  const [systemStatus, setSystemStatus] = useState<
    "healthy" | "warning" | "error"
  >("healthy");
  const [lastSync, setLastSync] = useState<Date>(new Date());

  // Set active item based on current route
  useEffect(() => {
    const currentPath = router.pathname;
    const activeNavItem = NAVIGATION_ITEMS.find((item) => item.href === currentPath);
    if (activeNavItem) {
      setActiveItem(activeNavItem.id);
    }
  }, [router.pathname]);

  // Fetch badge data and system status
  useEffect(() => {    const fetchBadgeData = async () => {
      try {
        const [usersRes, productsRes, supplierProductsRes, supplierApplicationsRes, refundsRes, reportsRes] = await Promise.all([
          fetch("/api/users").catch(() => null),
          fetch("/api/products").catch(() => null),
          fetch("/api/admin/supplier-product-stats").catch(() => null),
          fetch("/api/admin/supplier-application-stats").catch(() => null),
          fetch("/api/refunds").catch(() => null),
          fetch("/api/reports").catch(() => null),
        ]);

        const [usersData, productsData, supplierProductsData, supplierApplicationsData, refundsData, reportsData] = await Promise.all([
          usersRes?.ok ? usersRes.json().catch(() => ({ totalUsers: 0 })) : { totalUsers: 0 },
          productsRes?.ok ? productsRes.json().catch(() => ({ products: [] })) : { products: [] },
          supplierProductsRes?.ok ? supplierProductsRes.json().catch(() => ({ pendingCount: 0 })) : { pendingCount: 0 },
          supplierApplicationsRes?.ok ? supplierApplicationsRes.json().catch(() => ({ pendingCount: 0, applications: [] })) : { pendingCount: 0, applications: [] },
          refundsRes?.ok ? refundsRes.json().catch(() => []) : [],
          reportsRes?.ok ? reportsRes.json().catch(() => []) : [],
        ]);

        const pendingRefunds = Array.isArray(refundsData) ? refundsData.filter((r: any) => r.status === "pending") : [];
        const pendingReports = Array.isArray(reportsData) ? reportsData : [];
        const pendingApplications = Array.isArray(supplierApplicationsData.applications) ? 
          supplierApplicationsData.applications.filter((a: any) => a.status === "pending") : [];

        setBadges({
          users: usersData.totalUsers || 0,
          products: Array.isArray(productsData.products) ? productsData.products.length : 0,
          supplierProducts: supplierProductsData.pendingCount || 0,
          supplierApplications: supplierApplicationsData.pendingCount || 0,
          refunds: pendingRefunds.length,
          reports: pendingReports.length,
        });

        // Store detailed data for diagnostics
        setDiagnosticsData({
          refunds: pendingRefunds,
          reports: pendingReports,
          supplierApplications: pendingApplications,
        });

        // Determine system status based on data
        const totalIssues = pendingRefunds.length + pendingReports.length;

        if (totalIssues === 0) setSystemStatus("healthy");
        else if (totalIssues < 5) setSystemStatus("warning");
        else setSystemStatus("error");

        setLastSync(new Date());
      } catch (error) {
        console.error("Failed to fetch badge data:", error);
        setSystemStatus("error");
      }
    };

    fetchBadgeData();
    const interval = setInterval(fetchBadgeData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (systemStatus) {
      case "healthy":
        return "text-green-400";
      case "warning":
        return "text-yellow-400";
      case "error":
        return "text-red-400";
    }
  };

  const getStatusIcon = () => {
    switch (systemStatus) {
      case "healthy":
        return "✅";
      case "warning":
        return "⚠️";
      case "error":
        return "❌";
    }
  };

  const getBadgeValue = (badgeKey: string) => {
    return badges[badgeKey as keyof typeof badges] || 0;
  };
  return (
    <div className="flex h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Modern Glassmorphic Sidebar */}
      <aside
        className={`${
          isCollapsed ? "w-20" : "w-80"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:relative z-50 bg-gradient-to-b from-zinc-900/95 via-zinc-900/90 to-zinc-950/95 backdrop-blur-xl border-r-2 border-yellow-500/20 shadow-2xl shadow-black/50 transition-all duration-300 ease-in-out flex flex-col h-full overflow-hidden`}
      >        
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 via-transparent to-yellow-500/10 pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-400/5 via-transparent to-transparent pointer-events-none"></div>
        
        {/* Animated Border */}
        <div className="absolute inset-y-0 right-0 w-[2px] bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent animate-pulse"></div>

        {/* Enhanced Header */}
        <div className="relative p-6 border-b-2 border-yellow-500/20 bg-zinc-900/50">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center text-black font-black text-2xl shadow-lg shadow-yellow-500/30 animate-pulse">
                  👑
                </div>
                <div>
                  <h1 className="text-2xl font-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent mb-0.5">
                    King's Domain
                  </h1>
                  <p className="text-xs text-gray-400 font-bold">Administrative Command Center</p>
                </div>
              </div>
            )}
            {isCollapsed && (
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-500/30 animate-pulse mx-auto">
                👑
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2.5 rounded-xl bg-gradient-to-r from-zinc-800 to-zinc-700 hover:from-yellow-500/20 hover:to-yellow-600/20 border-2 border-yellow-500/20 hover:border-yellow-400/50 transition-all hover:scale-110 shadow-lg ${isCollapsed ? 'absolute top-6 right-6' : ''}`}
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-yellow-400 font-bold">{isCollapsed ? "→" : "←"}</span>
            </button>
          </div>

          {/* System Status Card */}
          {!isCollapsed && (
            <div className="mt-5 p-4 bg-gradient-to-br from-zinc-800/80 to-zinc-900/80 rounded-xl border-2 border-yellow-500/20 backdrop-blur-sm shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <span className="text-sm font-black text-gray-200">System Status</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gradient-to-r from-green-500/10 to-green-600/10 border border-green-500/30">
                  <span className="text-lg">{getStatusIcon()}</span>
                  <span className={`text-xs font-black ${getStatusColor()}`}>
                    {systemStatus.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 font-semibold flex items-center gap-2">
                <span className="text-yellow-400">🕒</span>
                Last sync: <span className="text-white">{lastSync.toLocaleTimeString()}</span>
              </div>
            </div>
          )}
        </div>        {/* Enhanced Navigation */}
        <nav className="relative flex-1 px-3 py-6 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-500/30 scrollbar-track-transparent">
          {/* Core Modules Section */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-full shadow-lg shadow-yellow-500/50"></div>
                <h2 className="text-xs font-black text-yellow-400 uppercase tracking-wider">
                  ⚡ Core Modules
                </h2>
              </div>
            )}
            <div className="space-y-1.5">
              {NAVIGATION_ITEMS.filter(item => item.category === 'core' || !item.category).map((item) => {
                const isActive = activeItem === item.id;
                const badgeValue = item.badge ? getBadgeValue(item.badge) : 0;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-yellow-500/30 via-yellow-400/20 to-yellow-500/30 border-2 border-yellow-400/60 shadow-lg shadow-yellow-500/20 scale-[1.02]"
                        : "hover:bg-gradient-to-r hover:from-zinc-800/60 hover:to-zinc-700/40 border-2 border-transparent hover:border-yellow-500/20 hover:scale-[1.01]"
                    }`}
                    title={isCollapsed ? item.title : ""}
                  >
                    {/* Active Indicator Glow */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/10 to-transparent rounded-xl blur-sm"></div>
                    )}
                    
                    <span className={`text-2xl relative z-10 transition-transform group-hover:scale-110 ${
                      isActive ? 'animate-pulse' : ''
                    }`}>
                      {item.icon}
                    </span>
                    
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 relative z-10">
                          <div className={`font-bold text-sm ${
                            isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                          }`}>
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                        
                        {badgeValue > 0 && (
                          <div className="relative z-10 flex items-center justify-center min-w-[28px] h-7 px-2.5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-lg shadow-lg shadow-yellow-500/30 border border-yellow-300">
                            <span className="text-xs font-black text-black">
                              {badgeValue > 99 ? '99+' : badgeValue}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {isCollapsed && badgeValue > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center text-[10px] font-black text-black border-2 border-zinc-900 shadow-lg">
                        {badgeValue > 9 ? '9+' : badgeValue}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Analytics & Content Section */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full shadow-lg shadow-blue-500/50"></div>
                <h2 className="text-xs font-black text-blue-400 uppercase tracking-wider">
                  📊 Analytics & Content
                </h2>
              </div>
            )}
            <div className="space-y-1.5">
              {NAVIGATION_ITEMS.filter(item => item.category === 'analytics').map((item) => {
                const isActive = activeItem === item.id;
                const badgeValue = item.badge ? getBadgeValue(item.badge) : 0;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-blue-500/30 via-blue-400/20 to-blue-500/30 border-2 border-blue-400/60 shadow-lg shadow-blue-500/20 scale-[1.02]"
                        : "hover:bg-gradient-to-r hover:from-zinc-800/60 hover:to-zinc-700/40 border-2 border-transparent hover:border-blue-500/20 hover:scale-[1.01]"
                    }`}
                    title={isCollapsed ? item.title : ""}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 to-transparent rounded-xl blur-sm"></div>
                    )}
                    
                    <span className={`text-2xl relative z-10 transition-transform group-hover:scale-110 ${
                      isActive ? 'animate-pulse' : ''
                    }`}>
                      {item.icon}
                    </span>
                    
                    {!isCollapsed && (
                      <div className="flex-1 relative z-10">
                        <div className={`font-bold text-sm ${
                          isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                        }`}>
                          {item.title}
                        </div>
                        <div className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">
                          {item.description}
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Settings & Moderation Section */}
          <div>
            {!isCollapsed && (
              <div className="px-3 mb-4 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full shadow-lg shadow-orange-500/50"></div>
                <h2 className="text-xs font-black text-orange-400 uppercase tracking-wider">
                  🛡️ Settings & Moderation
                </h2>
              </div>
            )}
            <div className="space-y-1.5">
              {NAVIGATION_ITEMS.filter(item => item.category === 'settings').map((item) => {
                const isActive = activeItem === item.id;
                const badgeValue = item.badge ? getBadgeValue(item.badge) : 0;

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={`group relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 ${
                      isActive
                        ? "bg-gradient-to-r from-orange-500/30 via-orange-400/20 to-orange-500/30 border-2 border-orange-400/60 shadow-lg shadow-orange-500/20 scale-[1.02]"
                        : "hover:bg-gradient-to-r hover:from-zinc-800/60 hover:to-zinc-700/40 border-2 border-transparent hover:border-orange-500/20 hover:scale-[1.01]"
                    }`}
                    title={isCollapsed ? item.title : ""}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-orange-400/10 to-transparent rounded-xl blur-sm"></div>
                    )}
                    
                    <span className={`text-2xl relative z-10 transition-transform group-hover:scale-110 ${
                      isActive ? 'animate-pulse' : ''
                    }`}>
                      {item.icon}
                    </span>
                    
                    {!isCollapsed && (
                      <>
                        <div className="flex-1 relative z-10">
                          <div className={`font-bold text-sm ${
                            isActive ? 'text-white' : 'text-gray-300 group-hover:text-white'
                          }`}>
                            {item.title}
                          </div>
                          <div className="text-xs text-gray-500 group-hover:text-gray-400 mt-0.5">
                            {item.description}
                          </div>
                        </div>
                        
                        {badgeValue > 0 && (
                          <div className="relative z-10 flex items-center justify-center min-w-[28px] h-7 px-2.5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg shadow-lg shadow-orange-500/30 border border-orange-300">
                            <span className="text-xs font-black text-black">
                              {badgeValue > 99 ? '99+' : badgeValue}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {isCollapsed && badgeValue > 0 && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-[10px] font-black text-black border-2 border-zinc-900 shadow-lg">
                        {badgeValue > 9 ? '9+' : badgeValue}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>        {/* Modern Quick Actions */}
        {!isCollapsed && (
          <div className="relative p-4 border-t-2 border-yellow-500/20 bg-gradient-to-b from-zinc-900/30 to-zinc-900/60">
            <h3 className="text-xs font-black text-yellow-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">⚡</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-r ${action.color} text-white hover:shadow-xl transition-all duration-300 hover:scale-105 group text-center border-2 border-white/10 hover:border-white/30`}
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform drop-shadow-lg">
                    {action.icon}
                  </span>
                  <span className="font-black text-xs drop-shadow">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}        {/* Enhanced User Info Footer */}
        <div className="relative p-4 border-t-2 border-yellow-500/20 bg-zinc-900/50">
          {!isCollapsed ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-zinc-800/80 to-zinc-800/60 rounded-xl border-2 border-yellow-500/20 shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-500/30 animate-pulse">
                  👑
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-yellow-300 truncate text-sm">Administrator</p>
                  <p className="text-xs text-gray-400 font-semibold">King's Domain Access</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 border-2 border-zinc-600 hover:border-yellow-500/30 transition-all hover:scale-[1.02] shadow-lg text-sm"
                  title="View Website"
                >
                  <span className="text-yellow-400 text-lg">🏠</span>
                  <span className="text-gray-200 font-bold">Site</span>
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("isAdmin");
                    router.push("/admin-login");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 border-2 border-red-600 hover:border-red-400 transition-all hover:scale-[1.02] shadow-lg text-sm"
                  title="Logout"
                >
                  <span className="text-white text-lg">🚪</span>
                  <span className="text-white font-bold">Exit</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 via-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center text-black font-black text-xl shadow-lg shadow-yellow-500/30 animate-pulse">
                👑
              </div>
              <div className="flex flex-col gap-2 w-full">
                <Link
                  href="/"
                  className="p-2.5 rounded-xl bg-gradient-to-r from-zinc-700 to-zinc-600 hover:from-zinc-600 hover:to-zinc-500 border-2 border-zinc-600 hover:border-yellow-500/30 transition-all hover:scale-110 shadow-lg flex items-center justify-center"
                  title="View Website"
                >
                  <span className="text-yellow-400 text-xl">🏠</span>
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("isAdmin");
                    router.push("/admin-login");
                  }}
                  className="p-2.5 rounded-xl bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 border-2 border-red-600 hover:border-red-400 transition-all hover:scale-110 shadow-lg flex items-center justify-center"
                  title="Logout"
                >
                  <span className="text-white text-xl">🚪</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">        {/* Enhanced Header */}        <header className="bg-zinc-900/60 backdrop-blur-sm border-b border-yellow-500/20 px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileOpen(!isMobileOpen)}
              className="lg:hidden p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-yellow-500/20 transition-all hover:border-yellow-400/50"
              title="Toggle menu"
            >
              <span className="text-yellow-400">{isMobileOpen ? "✕" : "☰"}</span>
            </button>

            {/* Breadcrumb & Page Info */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Link
                  href="/kingdom"
                  className="text-yellow-400 hover:text-yellow-300 transition-colors font-medium"
                >
                  👑 Kingdom
                </Link>
                {router.pathname !== "/kingdom" && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-white font-medium">
                      {
                        NAVIGATION_ITEMS.find((item) => item.href === router.pathname)
                          ?.title || "Page"
                      }
                    </span>
                  </>
                )}
              </div>
              
              {/* Page Description */}
              {router.pathname !== "/kingdom" && (
                <div className="hidden lg:block text-xs text-gray-400">
                  {NAVIGATION_ITEMS.find((item) => item.href === router.pathname)?.description}
                </div>
              )}
            </div>

            {/* System Info & Stats */}
            <div className="flex items-center gap-6">
              {/* Live Status */}
              <div className="flex items-center gap-2 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-gray-400 hidden sm:inline">Live</span>
              </div>

              {/* Quick Stats with Clickable Badges */}
              <div className="hidden md:flex items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-500/10 rounded-md">
                  <span className="text-blue-400">👥</span>
                  <span className="text-white font-medium">{badges.users}</span>
                  <span className="text-gray-400 text-xs">users</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-green-500/10 rounded-md">
                  <span className="text-green-400">📦</span>
                  <span className="text-white font-medium">{badges.products}</span>
                  <span className="text-gray-400 text-xs">products</span>
                </div>
                {(badges.refunds > 0 || badges.reports > 0 || badges.supplierApplications > 0) && (
                  <button
                    onClick={() => setShowDiagnostics(true)}
                    className="flex items-center gap-2 hover:scale-105 transition-transform cursor-pointer"
                    title="Click to view diagnostics"
                  >
                    {badges.refunds > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/20 hover:bg-red-500/30 rounded-md border border-red-500/30 hover:border-red-400/50 transition-all">
                        <span className="text-red-400">💰</span>
                        <span className="text-white font-medium">{badges.refunds}</span>
                      </div>
                    )}
                    {badges.reports > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/20 hover:bg-yellow-500/30 rounded-md border border-yellow-500/30 hover:border-yellow-400/50 transition-all">
                        <span className="text-yellow-400">⚠️</span>
                        <span className="text-white font-medium">{badges.reports}</span>
                      </div>
                    )}
                    {badges.supplierApplications > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/20 hover:bg-purple-500/30 rounded-md border border-purple-500/30 hover:border-purple-400/50 transition-all">
                        <span className="text-purple-400">📋</span>
                        <span className="text-white font-medium">{badges.supplierApplications}</span>
                      </div>
                    )}
                  </button>
                )}
              </div>

              {/* System Status Indicator - Also Clickable */}
              <button
                onClick={() => setShowDiagnostics(true)}
                className={`flex items-center gap-2 px-2 py-1 rounded-md transition-all hover:scale-105 ${
                  systemStatus === 'healthy' ? 'bg-green-500/10 hover:bg-green-500/20' :
                  systemStatus === 'warning' ? 'bg-yellow-500/10 hover:bg-yellow-500/20' : 'bg-red-500/10 hover:bg-red-500/20'
                }`}
                title="Click to view system diagnostics"
              >
                <span className="text-sm">{getStatusIcon()}</span>
                <span className={`text-xs font-medium hidden sm:inline ${getStatusColor()}`}>
                  {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">{children}</main>
      </div>

      {/* Diagnostics Modal */}
      {showDiagnostics && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-yellow-500/30 shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b-2 border-yellow-500/20 bg-zinc-900/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-2xl">🔍</span>
                </div>
                <div>
                  <h2 className="text-2xl font-black bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                    System Diagnostics
                  </h2>
                  <p className="text-gray-400 text-sm font-semibold">Live system status & pending items</p>
                </div>
              </div>
              <button
                onClick={() => setShowDiagnostics(false)}
                className="p-2 rounded-xl bg-zinc-800 hover:bg-red-600 border-2 border-zinc-700 hover:border-red-500 transition-all hover:scale-110"
                title="Close diagnostics"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* System Status Overview */}
              <div className={`p-4 rounded-xl border-2 ${
                systemStatus === 'healthy' ? 'bg-green-500/10 border-green-500/30' :
                systemStatus === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-red-500/10 border-red-500/30'
              }`}>
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{getStatusIcon()}</span>
                  <div>
                    <h3 className={`text-xl font-black ${getStatusColor()}`}>
                      System Status: {systemStatus.toUpperCase()}
                    </h3>
                    <p className="text-gray-300 text-sm">
                      Last updated: {lastSync.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Refunds */}
              {diagnosticsData.refunds.length > 0 && (
                <div className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-2 border-red-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">💰</span>
                    <h3 className="text-lg font-black text-red-400">
                      Pending Refunds ({diagnosticsData.refunds.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {diagnosticsData.refunds.map((refund: any, index: number) => (
                      <div key={index} className="bg-zinc-900/60 rounded-lg p-3 border border-red-500/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">
                              Order #{refund.orderId || refund.id || 'N/A'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              User: {refund.userId || 'Unknown'}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Reason: {refund.reason || 'No reason provided'}
                            </p>
                          </div>
                          <Link
                            href="/kingdom/refunds"
                            onClick={() => setShowDiagnostics(false)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 rounded-lg text-white text-xs font-bold transition-all hover:scale-105"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Reports */}
              {diagnosticsData.reports.length > 0 && (
                <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">⚠️</span>
                    <h3 className="text-lg font-black text-yellow-400">
                      Pending Reports ({diagnosticsData.reports.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {diagnosticsData.reports.map((report: any, index: number) => (
                      <div key={index} className="bg-zinc-900/60 rounded-lg p-3 border border-yellow-500/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">
                              {report.type || 'Report'} - {report.severity || 'Medium'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              Reporter: {report.reporterId || 'Anonymous'}
                            </p>
                            <p className="text-gray-400 text-xs">
                              {report.description || report.reason || 'No details provided'}
                            </p>
                          </div>
                          <Link
                            href="/kingdom/reports"
                            onClick={() => setShowDiagnostics(false)}
                            className="px-3 py-1 bg-yellow-600 hover:bg-yellow-500 rounded-lg text-black text-xs font-bold transition-all hover:scale-105"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pending Supplier Applications */}
              {diagnosticsData.supplierApplications.length > 0 && (
                <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-2 border-purple-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">📋</span>
                    <h3 className="text-lg font-black text-purple-400">
                      Pending Supplier Applications ({diagnosticsData.supplierApplications.length})
                    </h3>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {diagnosticsData.supplierApplications.map((application: any, index: number) => (
                      <div key={index} className="bg-zinc-900/60 rounded-lg p-3 border border-purple-500/20">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-white font-bold text-sm">
                              {application.companyName || application.name || 'Unknown Company'}
                            </p>
                            <p className="text-gray-400 text-xs mt-1">
                              Contact: {application.email || 'No email'}
                            </p>
                            <p className="text-gray-400 text-xs">
                              Applied: {application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : 'Unknown'}
                            </p>
                          </div>
                          <Link
                            href="/kingdom/suppliers"
                            onClick={() => setShowDiagnostics(false)}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-xs font-bold transition-all hover:scale-105"
                          >
                            Review
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Issues */}
              {diagnosticsData.refunds.length === 0 && 
               diagnosticsData.reports.length === 0 && 
               diagnosticsData.supplierApplications.length === 0 && (
                <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-2 border-green-500/30 rounded-xl p-8 text-center">
                  <span className="text-6xl block mb-4">✅</span>
                  <h3 className="text-2xl font-black text-green-400 mb-2">All Clear!</h3>
                  <p className="text-gray-400">No pending issues or warnings at this time.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-yellow-500/20 bg-zinc-900/50 flex justify-end">
              <button
                onClick={() => setShowDiagnostics(false)}
                className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl shadow-lg transition-all hover:scale-105"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
