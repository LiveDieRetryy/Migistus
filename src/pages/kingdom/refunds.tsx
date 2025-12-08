import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

interface Refund {
  id: string;
  orderId: string;
  userId: string;
  productId?: string;
  amount?: number;
  reason: string;
  description?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processing' | 'completed';
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
  notes?: string;
  userEmail?: string;
  productName?: string;
}

export default function RefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadRefunds();
  }, []);

  const loadRefunds = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/refunds");
      if (response.ok) {
        const data = await response.json();
        setRefunds(Array.isArray(data) ? data : []);
      } else {
        setRefunds([]);
      }
    } catch (error) {
      console.error("Failed to load refunds:", error);
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (refundId: string, newStatus: string) => {
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/refunds/${refundId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: actionNotes,
          processedAt: new Date().toISOString(),
          processedBy: 'admin'
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Refund ${newStatus} successfully!`);
        await loadRefunds();
        setTimeout(() => {
          setSelectedRefund(null);
          setActionNotes("");
          setSuccessMessage("");
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to update refund");
      }
    } catch (error) {
      console.error("Failed to update refund:", error);
      setErrorMessage("Network error: Could not update refund");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteRefund = async (refundId: string) => {
    if (!confirm("Are you sure you want to delete this refund request?")) return;

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/refunds/${refundId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessMessage("Refund deleted successfully!");
        await loadRefunds();
        setTimeout(() => {
          setSelectedRefund(null);
          setSuccessMessage("");
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to delete refund");
      }
    } catch (error) {
      console.error("Failed to delete refund:", error);
      setErrorMessage("Network error: Could not delete refund");
    } finally {
      setProcessing(false);
    }
  };

  const filteredRefunds = refunds.filter((refund) => {
    const matchesSearch =
      searchTerm === "" ||
      (refund.orderId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (refund.userId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (refund.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || refund.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'approved': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      case 'processing': return 'text-purple-400 bg-purple-500/20 border-purple-500/50';
      case 'completed': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'rejected': return 'text-red-400 bg-red-500/20 border-red-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const stats = {
    total: refunds.length,
    pending: refunds.filter(r => r.status === 'pending').length,
    approved: refunds.filter(r => r.status === 'approved').length,
    processing: refunds.filter(r => r.status === 'processing').length,
    completed: refunds.filter(r => r.status === 'completed').length,
    rejected: refunds.filter(r => r.status === 'rejected').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-yellow-400 text-xl">Loading Refunds...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Refunds Management - MIGISTUS Admin</title>
      </Head>

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-yellow-500/30 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                Refunds Management
              </h1>
              <p className="text-gray-300 text-lg font-semibold">Process and manage refund requests</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <div className="text-2xl font-black text-white">{stats.total}</div>
              <div className="text-gray-400 text-sm font-semibold">Total Refunds</div>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
              <div className="text-2xl font-black text-yellow-400">{stats.pending}</div>
              <div className="text-gray-400 text-sm font-semibold">Pending</div>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
              <div className="text-2xl font-black text-blue-400">{stats.approved}</div>
              <div className="text-gray-400 text-sm font-semibold">Approved</div>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
              <div className="text-2xl font-black text-purple-400">{stats.processing}</div>
              <div className="text-gray-400 text-sm font-semibold">Processing</div>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
              <div className="text-2xl font-black text-green-400">{stats.completed}</div>
              <div className="text-gray-400 text-sm font-semibold">Completed</div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
              <div className="text-2xl font-black text-red-400">{stats.rejected}</div>
              <div className="text-gray-400 text-sm font-semibold">Rejected</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-500/20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Search by Order ID, User ID, or Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none md:col-span-1"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={loadRefunds}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl transition-all hover:scale-105"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Refunds List */}
        <div className="space-y-4">
          {filteredRefunds.length === 0 ? (
            <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl p-12 border-2 border-zinc-800 text-center">
              <span className="text-6xl block mb-4">✅</span>
              <h3 className="text-2xl font-black text-gray-400 mb-2">No Refunds Found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all'
                  ? "Try adjusting your filters"
                  : "No refund requests to process."}
              </p>
            </div>
          ) : (
            filteredRefunds.map((refund) => (
              <div
                key={refund.id}
                className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-sm rounded-xl p-6 border-2 border-zinc-700 hover:border-yellow-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black border ${getStatusColor(refund.status || 'pending')}`}>
                        {(refund.status || 'pending').toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(refund.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2">
                      Order #{refund.orderId || 'N/A'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                      <p className="text-gray-300">
                        <span className="font-semibold">User:</span>{" "}
                        <span className="text-yellow-400">{refund.userId || 'Unknown'}</span>
                      </p>
                      {refund.amount && (
                        <p className="text-gray-300">
                          <span className="font-semibold">Amount:</span>{" "}
                          <span className="text-green-400 font-bold">${refund.amount.toFixed(2)}</span>
                        </p>
                      )}
                      {refund.productId && (
                        <p className="text-gray-300">
                          <span className="font-semibold">Product:</span>{" "}
                          <span className="text-white">{refund.productName || refund.productId}</span>
                        </p>
                      )}
                      {refund.userEmail && (
                        <p className="text-gray-300">
                          <span className="font-semibold">Email:</span>{" "}
                          <span className="text-white">{refund.userEmail}</span>
                        </p>
                      )}
                    </div>

                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold">Reason:</span> {refund.reason || 'No reason provided'}
                    </p>
                    {refund.description && (
                      <p className="text-gray-400 text-sm mb-2">{refund.description}</p>
                    )}
                    
                    {refund.notes && (
                      <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <p className="text-xs text-gray-400 font-semibold mb-1">Admin Notes:</p>
                        <p className="text-sm text-gray-300">{refund.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedRefund(refund)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all hover:scale-105 whitespace-nowrap"
                    >
                      Process
                    </button>
                    <Link
                      href={`/kingdom/users`}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all hover:scale-105 text-center"
                    >
                      View User
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-yellow-500/30 shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b-2 border-yellow-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-yellow-400">Process Refund Request</h2>
                <button
                  onClick={() => {
                    setSelectedRefund(null);
                    setActionNotes("");
                  }}
                  className="p-2 rounded-xl bg-zinc-800 hover:bg-red-600 transition-all"
                >
                  <span className="text-xl">✕</span>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-green-500/20 border-2 border-green-500/50 rounded-xl">
                  <p className="text-green-400 font-bold flex items-center gap-2">
                    <span>✅</span> {successMessage}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {errorMessage && (
                <div className="p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl">
                  <p className="text-red-400 font-bold flex items-center gap-2">
                    <span>❌</span> {errorMessage}
                  </p>
                </div>
              )}

              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
                <h3 className="text-lg font-bold text-white mb-2">Order #{selectedRefund.orderId || 'N/A'}</h3>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-300">User: <span className="text-yellow-400">{selectedRefund.userId || 'Unknown'}</span></p>
                  {selectedRefund.amount && (
                    <p className="text-gray-300">Amount: <span className="text-green-400 font-bold">${selectedRefund.amount.toFixed(2)}</span></p>
                  )}
                  <p className="text-gray-300">Reason: <span className="text-white">{selectedRefund.reason || 'No reason provided'}</span></p>
                  {selectedRefund.description && (
                    <p className="text-gray-400 mt-2">{selectedRefund.description}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Add Notes (Optional)</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                  rows={4}
                  placeholder="Add internal notes about this decision..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedRefund.id, 'approved')}
                  disabled={processing}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  ✅ Approve
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRefund.id, 'rejected')}
                  disabled={processing}
                  className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  ❌ Reject
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRefund.id, 'processing')}
                  disabled={processing}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  🔄 Processing
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedRefund.id, 'completed')}
                  disabled={processing}
                  className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  ✔️ Complete
                </button>
              </div>

              <button
                onClick={() => handleDeleteRefund(selectedRefund.id)}
                disabled={processing}
                className="w-full px-4 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
              >
                🗑️ Delete Request
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


// Disable footer for Kingdom pages
(RefundsPage as any).showFooter = false;