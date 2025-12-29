import { useEffect, useState } from "react";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { Package, Truck, CheckCircle, Clock, AlertCircle, Eye } from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'shipped' | 'delivered'>('all');

  // Account navigation items
  const getProfileSlug = () => {
    if (!user?.username) return "/account/profile";
    return `/account/profile/${user.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")}`;
  };

  const accountNav = [
    { label: "Account Overview", href: "/account", icon: "🏠" },
    { label: "Notifications", href: "/notifications", icon: "🔔" },
    { label: "My Current Pledges", href: "/account/pledges", icon: "🤝" },
    { label: "My Orders", href: "/account/orders", icon: "📦" },
    { label: "My Wishlist", href: "/account/wishlist", icon: "❤️" },
    { label: "My Votes", href: "/account/votes", icon: "🗳️" },
    { label: "Wallet", href: "/wallet", icon: "💰" },
    { label: "View Profile", href: getProfileSlug(), icon: "👤" },
    { label: "Account Settings", href: "/account/settings", icon: "⚙️" },
  ];

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
      return;
    }

    if (user) {
      loadOrders();
    }
  }, [user, isAuthenticated, authLoading, router]);

  const loadOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/orders?userId=${user.id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error("Failed to load orders");
        setOrders([]);
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      case 'processing':
        return <Package className="w-5 h-5 text-blue-400" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-400" />;
      case 'delivered':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30';
      case 'processing':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'shipped':
        return 'text-purple-400 bg-purple-400/10 border-purple-400/30';
      case 'delivered':
        return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'cancelled':
        return 'text-red-400 bg-red-400/10 border-red-400/30';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/30';
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  if (authLoading) {
    return (
      <>
        <Head>
          <title>My Orders - MIGISTUS</title>
        </Head>
        <MainNavbar />
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-yellow-400 border-t-transparent rounded-full"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>My Orders - MIGISTUS</title>
      </Head>
      <MainNavbar />

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        <div className="flex flex-col lg:flex-row max-w-7xl mx-auto px-4 py-12 gap-8">
          
          {/* Back Link - Mobile */}
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
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <h2 className="text-xl font-bold text-yellow-400">
                    Account Menu
                  </h2>
                  <p className="text-sm text-gray-400">{user?.username}</p>
                </div>
              </div>
              
              <ul className="space-y-2">
                {accountNav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        router.pathname === item.href
                          ? "bg-yellow-400 text-black font-semibold"
                          : "text-yellow-300 hover:bg-yellow-400/10 hover:text-yellow-400"
                      }`}
                    >
                      <span className="text-lg">{item.icon}</span>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-yellow-400 mb-2">My Orders</h1>
              <p className="text-gray-400">
                Track and manage your order history
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {[
                { value: 'all', label: 'All Orders' },
                { value: 'pending', label: 'Pending' },
                { value: 'shipped', label: 'Shipped' },
                { value: 'delivered', label: 'Delivered' }
              ].map(tab => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                    filter === tab.value
                      ? 'bg-yellow-400 text-black'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Orders List */}
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin w-8 h-8 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-zinc-600" />
                <h3 className="text-xl font-bold text-white mb-2">No Orders Found</h3>
                <p className="text-gray-400 mb-6">
                  {filter === 'all' 
                    ? "You haven't placed any orders yet."
                    : `You don't have any ${filter} orders.`}
                </p>
                <Link
                  href="/"
                  className="inline-block px-6 py-3 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-zinc-900/50 backdrop-blur-sm border border-yellow-500/20 rounded-2xl p-6 hover:border-yellow-400/40 transition-colors"
                  >
                    {/* Order Header */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-zinc-800">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-bold text-white">
                            Order #{order.orderNumber}
                          </h3>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-2 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Placed on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-yellow-400">
                          ${order.totalAmount.toFixed(2)}
                        </div>
                        <p className="text-sm text-gray-400">
                          {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3 mb-4">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 p-3 bg-zinc-800/30 rounded-lg">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-zinc-700 rounded-lg flex items-center justify-center">
                              <Package className="w-8 h-8 text-zinc-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold text-white">{item.productName}</h4>
                            <p className="text-sm text-gray-400">Quantity: {item.quantity}</p>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-yellow-400">${item.price.toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Shipping Info */}
                    <div className="flex flex-wrap gap-4 pt-4 border-t border-zinc-800">
                      {order.trackingNumber && (
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm text-gray-400 mb-1">Tracking Number</p>
                          <p className="font-mono text-yellow-400">{order.trackingNumber}</p>
                        </div>
                      )}
                      {order.estimatedDelivery && (
                        <div className="flex-1 min-w-[200px]">
                          <p className="text-sm text-gray-400 mb-1">Estimated Delivery</p>
                          <p className="text-white">
                            {new Date(order.estimatedDelivery).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>
                      )}
                      <div className="flex-1 min-w-[200px]">
                        <p className="text-sm text-gray-400 mb-1">Shipping Address</p>
                        <p className="text-white text-sm">
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}<br />
                          {order.shippingAddress.address1}
                          {order.shippingAddress.address2 && <>, {order.shippingAddress.address2}</>}<br />
                          {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 mt-4 pt-4 border-t border-zinc-800">
                      <Link
                        href={`/account/orders/${order.id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-yellow-400 text-black rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </Link>
                      {order.trackingNumber && (
                        <a
                          href={`https://www.track.com/${order.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-zinc-800 text-zinc-300 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
                        >
                          <Truck className="w-4 h-4" />
                          Track Package
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
