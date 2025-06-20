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
  const [activeItem, setActiveItem] = useState("");  const [badges, setBadges] = useState({
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
          supplierApplicationsRes?.ok ? supplierApplicationsRes.json().catch(() => ({ pendingCount: 0 })) : { pendingCount: 0 },
          refundsRes?.ok ? refundsRes.json().catch(() => []) : [],
          reportsRes?.ok ? reportsRes.json().catch(() => []) : [],
        ]);

        setBadges({
          users: usersData.totalUsers || 0,
          products: Array.isArray(productsData.products) ? productsData.products.length : 0,
          supplierProducts: supplierProductsData.pendingCount || 0,
          supplierApplications: supplierApplicationsData.pendingCount || 0,
          refunds: Array.isArray(refundsData) ? refundsData.filter((r: any) => r.status === "pending").length : 0,
          reports: Array.isArray(reportsData) ? reportsData.length : 0,
        });

        // Determine system status based on data
        const totalIssues =
          (Array.isArray(refundsData) ? refundsData.filter((r: any) => r.status === "pending").length : 0) +
          (Array.isArray(reportsData) ? reportsData.length : 0);

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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Enhanced Sidebar Navigation */}      <aside
        className={`${
          isCollapsed ? "w-20" : "w-72"
        } ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } fixed lg:relative z-50 bg-zinc-900/90 backdrop-blur-md border-r border-yellow-500/20 shadow-2xl transition-all duration-300 ease-in-out flex flex-col relative overflow-hidden h-full`}
      >        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-400/8 via-transparent to-yellow-400/5 pointer-events-none"></div>
        
        {/* Subtle animated border */}
        <div className="absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-yellow-400/50 to-transparent animate-pulse"></div>

        {/* Header */}
        <div className="relative p-6 border-b border-yellow-500/20">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center text-black font-bold text-xl shadow-lg">
                  👑
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                    The King's Domain
                  </h1>
                  <p className="text-xs text-gray-400">Administrative Panel</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-yellow-500/20 transition-all hover:border-yellow-400/50"
              title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <span className="text-yellow-400">{isCollapsed ? "→" : "←"}</span>
            </button>
          </div>

          {/* System Status */}          {!isCollapsed && (
            <div className="mt-4 p-3 bg-gradient-to-r from-zinc-800/60 to-zinc-800/40 rounded-lg border border-zinc-700/50 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  System Status
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getStatusIcon()}</span>
                  <span className={`text-sm font-medium ${getStatusColor()}`}>
                    {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-1">
                <span>🕒</span>
                Last sync: {lastSync.toLocaleTimeString()}
              </div>
            </div>
          )}
        </div>        {/* Navigation Items */}
        <nav className="relative flex-1 p-4 space-y-1 overflow-y-auto">
          {/* Core Modules */}
          <div className="mb-6">            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-yellow-400/80 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <span className="text-yellow-400">⚡</span>
                Core Modules
              </h3>
            )}
            {NAVIGATION_ITEMS.filter(item => item.category === 'core' || !item.category).map((item) => {
              const isActive = activeItem === item.id;
              const badgeValue = item.badge ? getBadgeValue(item.badge) : 0;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-yellow-400/20 to-yellow-300/10 border border-yellow-400/30 text-yellow-300 shadow-lg"
                      : "hover:bg-zinc-800/50 hover:border-yellow-400/20 border border-transparent text-gray-300 hover:text-yellow-300"
                  }`}
                  title={isCollapsed ? item.title : ""}
                >
                  {/* Icon */}
                  <div
                    className={`text-xl transition-transform group-hover:scale-110 ${
                      isActive ? "animate-pulse" : ""
                    }`}
                  >
                    {item.icon}
                  </div>

                  {/* Content */}
                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate">{item.title}</h3>
                        {badgeValue > 0 && (
                          <div className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center animate-pulse">
                            {badgeValue > 99 ? "99+" : badgeValue}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{item.description}</p>
                    </div>
                  )}

                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-r-full shadow-lg"></div>
                  )}

                  {/* Collapsed Badge */}
                  {isCollapsed && badgeValue > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                      {badgeValue > 9 ? "9+" : badgeValue}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Analytics Section */}
          <div className="mb-6">            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-blue-400/80 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <span className="text-blue-400">📊</span>
                Analytics & Content
              </h3>
            )}
            {NAVIGATION_ITEMS.filter(item => item.category === 'analytics').map((item) => {
              const isActive = activeItem === item.id;
              const badgeValue = item.badge ? getBadgeValue(item.badge) : 0;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-blue-400/20 to-blue-300/10 border border-blue-400/30 text-blue-300 shadow-lg"
                      : "hover:bg-zinc-800/50 hover:border-blue-400/20 border border-transparent text-gray-300 hover:text-blue-300"
                  }`}
                  title={isCollapsed ? item.title : ""}
                >
                  <div className={`text-lg transition-transform group-hover:scale-110 ${isActive ? "animate-pulse" : ""}`}>
                    {item.icon}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate text-sm">{item.title}</h3>
                        {badgeValue > 0 && (
                          <div className="bg-blue-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
                            {badgeValue > 99 ? "99+" : badgeValue}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{item.description}</p>
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-r-full shadow-lg"></div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Settings & Moderation */}
          <div className="mb-6">            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-orange-400/80 uppercase tracking-wider mb-3 px-2 flex items-center gap-2">
                <span className="text-orange-400">🛡️</span>
                Settings & Moderation
              </h3>
            )}
            {NAVIGATION_ITEMS.filter(item => item.category === 'settings').map((item) => {
              const isActive = activeItem === item.id;
              const badgeValue = item.badge ? getBadgeValue(item.badge) : 0;

              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`group relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-orange-400/20 to-orange-300/10 border border-orange-400/30 text-orange-300 shadow-lg"
                      : "hover:bg-zinc-800/50 hover:border-orange-400/20 border border-transparent text-gray-300 hover:text-orange-300"
                  }`}
                  title={isCollapsed ? item.title : ""}
                >
                  <div className={`text-lg transition-transform group-hover:scale-110 ${isActive ? "animate-pulse" : ""}`}>
                    {item.icon}
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium truncate text-sm">{item.title}</h3>
                        {badgeValue > 0 && (
                          <div className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center animate-pulse">
                            {badgeValue > 99 ? "99+" : badgeValue}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{item.description}</p>
                    </div>
                  )}

                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full shadow-lg"></div>
                  )}

                  {isCollapsed && badgeValue > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse">
                      {badgeValue > 9 ? "9+" : badgeValue}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>        {/* Quick Actions */}        {!isCollapsed && (
          <div className="relative p-4 border-t border-yellow-500/20 bg-gradient-to-b from-transparent to-yellow-400/5">
            <h3 className="text-xs font-semibold text-yellow-400/80 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="text-yellow-400">⚡</span>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.id}
                  href={action.href}
                  className={`flex flex-col items-center gap-1 p-3 rounded-lg bg-gradient-to-r ${action.color} text-white hover:shadow-lg transition-all duration-200 hover:scale-105 group text-center`}
                >
                  <span className="text-lg group-hover:scale-110 transition-transform">
                    {action.icon}
                  </span>
                  <span className="font-medium text-xs">{action.title}</span>
                </Link>
              ))}
            </div>
          </div>
        )}        {/* User Info Footer */}
        <div className="relative p-4 border-t border-yellow-500/20">
          {!isCollapsed ? (
            <div className="space-y-3">              <div className="flex items-center gap-3 p-3 bg-zinc-800/50 rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm">
                  👑
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-yellow-300 truncate text-sm">Administrator</p>
                  <p className="text-xs text-gray-400">King's Domain Access</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link
                  href="/"
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors text-sm"
                  title="View Website"
                >
                  <span className="text-yellow-400">🏠</span>
                  <span className="text-gray-300">Site</span>
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("isAdmin");
                    router.push("/admin-login");
                  }}
                  className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg bg-red-700 hover:bg-red-600 transition-colors text-sm"
                  title="Logout"
                >
                  <span className="text-white">🚪</span>
                  <span className="text-white">Exit</span>
                </button>
              </div>
            </div>
          ) : (            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-sm">
                👑
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href="/"
                  className="p-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 transition-colors"
                  title="View Website"
                >
                  <span className="text-yellow-400">🏠</span>
                </Link>
                <button
                  onClick={() => {
                    localStorage.removeItem("isAdmin");
                    router.push("/admin-login");
                  }}
                  className="p-2 rounded-lg bg-red-700 hover:bg-red-600 transition-colors"
                  title="Logout"
                >
                  <span className="text-white">🚪</span>
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

              {/* Quick Stats */}
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
                {(badges.refunds > 0 || badges.reports > 0) && (
                  <div className="flex items-center gap-2">
                    {badges.refunds > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded-md">
                        <span className="text-red-400">💰</span>
                        <span className="text-white font-medium">{badges.refunds}</span>
                      </div>
                    )}
                    {badges.reports > 0 && (
                      <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded-md">
                        <span className="text-yellow-400">🚨</span>
                        <span className="text-white font-medium">{badges.reports}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* System Status Indicator */}
              <div className={`flex items-center gap-2 px-2 py-1 rounded-md ${
                systemStatus === 'healthy' ? 'bg-green-500/10' :
                systemStatus === 'warning' ? 'bg-yellow-500/10' : 'bg-red-500/10'
              }`}>
                <span className="text-sm">{getStatusIcon()}</span>
                <span className={`text-xs font-medium hidden sm:inline ${getStatusColor()}`}>
                  {systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-transparent">{children}</main>
      </div>
    </div>
  );
}
