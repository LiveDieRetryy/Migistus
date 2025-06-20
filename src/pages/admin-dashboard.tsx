import { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import ProductLifecycleAdmin from "@/components/admin/ProductLifecycleAdmin";
import { activityTracker } from "@/utils/activityTracker";

export default function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("lifecycle");
  const router = useRouter();

  useEffect(() => {
    // Check if user is admin
    const adminStatus = localStorage.getItem("isAdmin");
    if (adminStatus !== "true") {
      router.push("/admin-login");
      return;
    }
    setIsAdmin(true);

    // Track admin dashboard access
    activityTracker.trackAdminAction("admin_dashboard_access", {
      page: "admin-dashboard",
      timestamp: new Date().toISOString(),
    });
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("isAdmin");
    
    // Track admin logout
    activityTracker.trackAdminAction("admin_logout", {
      timestamp: new Date().toISOString(),
    });
    
    router.push("/admin-login");
  };

  const tabs = [
    { id: "lifecycle", label: "Product Lifecycle", icon: "🔄" },
    { id: "users", label: "User Management", icon: "👥" },
    { id: "analytics", label: "Analytics", icon: "📊" },
    { id: "settings", label: "Settings", icon: "⚙️" },
  ];

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Dashboard - Migistus</title>
        <meta name="description" content="Migistus Admin Dashboard" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Manage Migistus platform settings</p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push("/kingdom")}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  Back to Kingdom
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    activityTracker.trackAdminAction("admin_tab_change", {
                      fromTab: activeTab,
                      toTab: tab.id,
                    });
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "lifecycle" && <ProductLifecycleAdmin />}
          
          {activeTab === "users" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
              <p className="text-gray-600">User management features coming soon...</p>
            </div>
          )}
          
          {activeTab === "analytics" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Analytics</h3>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </div>
          )}
          
          {activeTab === "settings" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Settings</h3>
              <p className="text-gray-600">Platform settings coming soon...</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
