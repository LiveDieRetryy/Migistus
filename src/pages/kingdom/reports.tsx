import { useEffect, useState } from "react";
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import Link from "next/link";

interface Report {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  reporterId: string;
  targetId?: string;
  targetType?: 'user' | 'product' | 'chat' | 'other';
  reason: string;
  description?: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  notes?: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [actionNotes, setActionNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(Array.isArray(data) ? data : []);
      } else {
        setReports([]);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus,
          notes: actionNotes,
          resolvedAt: newStatus === 'resolved' || newStatus === 'dismissed' ? new Date().toISOString() : undefined,
          resolvedBy: 'admin'
        }),
      });

      if (response.ok) {
        setSuccessMessage(`Report ${newStatus} successfully!`);
        await loadReports();
        setTimeout(() => {
          setSelectedReport(null);
          setActionNotes("");
          setSuccessMessage("");
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to update report");
      }
    } catch (error) {
      console.error("Failed to update report:", error);
      setErrorMessage("Network error: Could not update report");
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;

    setProcessing(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const response = await fetch(`/api/reports/${reportId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccessMessage("Report deleted successfully!");
        await loadReports();
        setTimeout(() => {
          setSelectedReport(null);
          setSuccessMessage("");
        }, 1500);
      } else {
        const error = await response.json();
        setErrorMessage(error.error || "Failed to delete report");
      }
    } catch (error) {
      console.error("Failed to delete report:", error);
      setErrorMessage("Network error: Could not delete report");
    } finally {
      setProcessing(false);
    }
  };

  const filteredReports = reports.filter((report) => {
    const matchesSearch =
      searchTerm === "" ||
      (report.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.reporterId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.reason || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === "all" || report.status === filterStatus;
    const matchesSeverity = filterSeverity === "all" || report.severity === filterSeverity;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20 border-red-500/50';
      case 'high': return 'text-orange-400 bg-orange-500/20 border-orange-500/50';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'low': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/50';
      case 'investigating': return 'text-blue-400 bg-blue-500/20 border-blue-500/50';
      case 'resolved': return 'text-green-400 bg-green-500/20 border-green-500/50';
      case 'dismissed': return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
      default: return 'text-gray-400 bg-gray-500/20 border-gray-500/50';
    }
  };

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    investigating: reports.filter(r => r.status === 'investigating').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    critical: reports.filter(r => r.severity === 'critical').length,
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-400 mx-auto mb-4"></div>
            <p className="text-yellow-400 text-xl">Loading Reports...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Reports Management - MIGISTUS Admin</title>
      </Head>

      <div className="p-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900/80 via-zinc-800/80 to-zinc-900/80 backdrop-blur-xl rounded-3xl p-8 border-2 border-yellow-500/30 shadow-2xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl">⚠️</span>
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
                Reports Management
              </h1>
              <p className="text-gray-300 text-lg font-semibold">Review and manage user reports</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700">
              <div className="text-2xl font-black text-white">{stats.total}</div>
              <div className="text-gray-400 text-sm font-semibold">Total Reports</div>
            </div>
            <div className="bg-yellow-500/10 rounded-xl p-4 border border-yellow-500/30">
              <div className="text-2xl font-black text-yellow-400">{stats.pending}</div>
              <div className="text-gray-400 text-sm font-semibold">Pending</div>
            </div>
            <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
              <div className="text-2xl font-black text-blue-400">{stats.investigating}</div>
              <div className="text-gray-400 text-sm font-semibold">Investigating</div>
            </div>
            <div className="bg-green-500/10 rounded-xl p-4 border border-green-500/30">
              <div className="text-2xl font-black text-green-400">{stats.resolved}</div>
              <div className="text-gray-400 text-sm font-semibold">Resolved</div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
              <div className="text-2xl font-black text-red-400">{stats.critical}</div>
              <div className="text-gray-400 text-sm font-semibold">Critical</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl p-6 border-2 border-yellow-500/20">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search reports..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="investigating">Investigating</option>
              <option value="resolved">Resolved</option>
              <option value="dismissed">Dismissed</option>
            </select>
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white focus:border-yellow-500 focus:outline-none"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <button
              onClick={loadReports}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-black rounded-xl transition-all hover:scale-105"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {filteredReports.length === 0 ? (
            <div className="bg-zinc-900/60 backdrop-blur-sm rounded-xl p-12 border-2 border-zinc-800 text-center">
              <span className="text-6xl block mb-4">✅</span>
              <h3 className="text-2xl font-black text-gray-400 mb-2">No Reports Found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all'
                  ? "Try adjusting your filters"
                  : "All clear! No reports to review."}
              </p>
            </div>
          ) : (
            filteredReports.map((report) => (
              <div
                key={report.id}
                className="bg-gradient-to-br from-zinc-900/90 to-zinc-800/90 backdrop-blur-sm rounded-xl p-6 border-2 border-zinc-700 hover:border-yellow-500/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`px-3 py-1 rounded-lg text-xs font-black border ${getSeverityColor(report.severity || 'medium')}`}>
                        {(report.severity || 'medium').toUpperCase()}
                      </span>
                      <span className={`px-3 py-1 rounded-lg text-xs font-black border ${getStatusColor(report.status || 'pending')}`}>
                        {(report.status || 'pending').toUpperCase()}
                      </span>
                      <span className="text-gray-400 text-sm">
                        {new Date(report.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-white mb-2">{report.type || 'General Report'}</h3>
                    <p className="text-gray-300 mb-2">
                      <span className="font-semibold">Reason:</span> {report.reason || 'No reason provided'}
                    </p>
                    {report.description && (
                      <p className="text-gray-400 text-sm mb-2">{report.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Reporter: <span className="text-yellow-400 font-semibold">{report.reporterId || 'Anonymous'}</span></span>
                      {report.targetId && (
                        <span>Target: <span className="text-white font-semibold">{report.targetType || 'unknown'} #{report.targetId}</span></span>
                      )}
                    </div>
                    {report.notes && (
                      <div className="mt-3 p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
                        <p className="text-xs text-gray-400 font-semibold mb-1">Admin Notes:</p>
                        <p className="text-sm text-gray-300">{report.notes}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedReport(report)}
                      className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold rounded-lg transition-all hover:scale-105"
                    >
                      Take Action
                    </button>
                    {report.targetType === 'user' && report.targetId && (
                      <Link
                        href={`/kingdom/users`}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all hover:scale-105 text-center"
                      >
                        View User
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Action Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-2xl border-2 border-yellow-500/30 shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b-2 border-yellow-500/20">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-yellow-400">Take Action on Report</h2>
                <button
                  onClick={() => {
                    setSelectedReport(null);
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

              <div>
                <h3 className="text-lg font-bold text-white mb-2">{selectedReport.type || 'General Report'}</h3>
                <p className="text-gray-300">{selectedReport.reason || 'No reason provided'}</p>
                {selectedReport.description && (
                  <p className="text-gray-400 text-sm mt-2">{selectedReport.description}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Add Notes (Optional)</label>
                <textarea
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  className="w-full px-4 py-3 bg-zinc-800 border-2 border-zinc-700 rounded-xl text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                  rows={4}
                  placeholder="Add internal notes about this action..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'investigating')}
                  disabled={processing}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  🔍 Investigate
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')}
                  disabled={processing}
                  className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  ✅ Resolve
                </button>
                <button
                  onClick={() => handleUpdateStatus(selectedReport.id, 'dismissed')}
                  disabled={processing}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  ❌ Dismiss
                </button>
                <button
                  onClick={() => handleDeleteReport(selectedReport.id)}
                  disabled={processing}
                  className="px-4 py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl transition-all hover:scale-105 disabled:opacity-50"
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}


// Disable footer for Kingdom pages
(ReportsPage as any).showFooter = false;