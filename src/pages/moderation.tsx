import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
  Shield, 
  Flag, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BarChart3,
  Activity,
  Zap,
  UserX
} from 'lucide-react';

interface ChatReport {
  id: number;
  reporterId: number;
  reporterName: string;
  reportedUserId: number;
  reportedUserName: string;
  messageId: number;
  messageContent: string;
  productId: number;
  reason: string;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: number;
  action?: string;
  reportedUserMessageHistory?: any[];
}

interface ModerationLog {
  userId?: number;
  productId?: number;
  message?: string;
  reason: string;
  timestamp: string;
  type?: string;
  reporterId?: number;
  reportedUserId?: number;
  messageId?: number;
}

interface Stats {
  totalReports: number;
  pendingReports: number;
  resolvedToday: number;
  activeUsers: number;
  messagesModerated: number;
  spamBlocked: number;
}

export default function KingdomModeration() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'reports' | 'logs' | 'users' | 'stats'>('reports');
  const [reports, setReports] = useState<ChatReport[]>([]);
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({
    totalReports: 0,
    pendingReports: 0,
    resolvedToday: 0,
    activeUsers: 0,
    messagesModerated: 0,
    spamBlocked: 0
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [reasonFilter, setReasonFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);

  useEffect(() => {
    // Check admin status
    const adminStatus = localStorage.getItem('isAdmin');
    if (adminStatus !== 'true') {
      router.push('/admin-login');
      return;
    }
    setIsAdmin(true);
    
    // Load initial data
    loadReports();
    loadLogs();
  }, [router]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/products/chat/report');
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        
        // Calculate stats
        const pending = data.reports.filter((r: ChatReport) => r.status === 'pending').length;
        const today = new Date().toDateString();
        const resolvedToday = data.reports.filter((r: ChatReport) => 
          r.status === 'resolved' && r.reviewedAt && new Date(r.reviewedAt).toDateString() === today
        ).length;
        
        setStats(prev => ({
          ...prev,
          totalReports: data.reports.length,
          pendingReports: pending,
          resolvedToday
        }));
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await fetch('/api/moderation/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs || []);
        
        // Calculate moderation stats
        const messagesModerated = data.logs.filter((l: ModerationLog) => l.reason === 'profanity_filtered').length;
        const spamBlocked = data.logs.filter((l: ModerationLog) => l.reason === 'spam_detected').length;
        
        setStats(prev => ({
          ...prev,
          messagesModerated,
          spamBlocked
        }));
      }
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const handleReportAction = async (reportId: number, action: 'resolve' | 'dismiss', actionNote?: string) => {
    try {
      const response = await fetch(`/api/moderation/report-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportId,
          action,
          actionNote
        })
      });

      if (response.ok) {
        loadReports(); // Reload reports
        alert(`Report ${action === 'resolve' ? 'resolved' : 'dismissed'} successfully`);
      } else {
        alert('Failed to update report');
      }
    } catch (error) {
      console.error('Error updating report:', error);
      alert('Failed to update report');
    }
  };

  const getReasonBadge = (reason: string) => {
    const colors: Record<string, string> = {
      spam: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      harassment: 'bg-red-500/20 text-red-400 border-red-500/30',
      hate_speech: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      inappropriate_content: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      scam: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
      impersonation: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      other: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    };
    
    return colors[reason] || colors.other;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'reviewed':
        return <Eye className="w-4 h-4 text-blue-400" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'dismissed':
        return <XCircle className="w-4 h-4 text-gray-400" />;
      default:
        return null;
    }
  };

  const filteredReports = reports.filter(report => {
    if (statusFilter !== 'all' && report.status !== statusFilter) return false;
    if (reasonFilter !== 'all' && report.reason !== reasonFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        report.reportedUserName.toLowerCase().includes(query) ||
        report.reporterName.toLowerCase().includes(query) ||
        report.messageContent.toLowerCase().includes(query)
      );
    }
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-yellow-500 mx-auto"></div>
          <p className="mt-4 text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Kingdom Moderation - MIGISTUS</title>
        <meta name="description" content="Moderation dashboard for MIGISTUS platform" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black">
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Kingdom Moderation</h1>
                  <p className="text-zinc-400 text-sm">Monitor and manage platform safety</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    loadReports();
                    loadLogs();
                  }}
                  className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5 text-zinc-400" />
                </button>
                <Link
                  href="/admin-dashboard"
                  className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors flex items-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Admin Dashboard</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Total Reports</span>
                <Flag className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.totalReports}</div>
              <div className="text-xs text-zinc-500 mt-1">All time</div>
            </div>

            <div className="bg-zinc-800/30 border border-yellow-500/30 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Pending Review</span>
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="text-3xl font-bold text-yellow-400">{stats.pendingReports}</div>
              <div className="text-xs text-zinc-500 mt-1">Requires attention</div>
            </div>

            <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Resolved Today</span>
                <CheckCircle className="w-5 h-5 text-green-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.resolvedToday}</div>
              <div className="text-xs text-zinc-500 mt-1">Last 24 hours</div>
            </div>

            <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 text-sm">Auto-Moderated</span>
                <Zap className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-3xl font-bold text-white">{stats.messagesModerated + stats.spamBlocked}</div>
              <div className="text-xs text-zinc-500 mt-1">{stats.messagesModerated} profanity, {stats.spamBlocked} spam</div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-zinc-800/30 border border-zinc-700 rounded-xl mb-6">
            <div className="flex border-b border-zinc-700">
              {[
                { id: 'reports', label: 'Reports', icon: Flag },
                { id: 'logs', label: 'Moderation Logs', icon: Activity },
                { id: 'users', label: 'User Management', icon: Users },
                { id: 'stats', label: 'Analytics', icon: BarChart3 }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-6 py-4 flex items-center justify-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'bg-yellow-500/10 border-b-2 border-yellow-500 text-yellow-400'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-700/30'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Reports Tab */}
            {activeTab === 'reports' && (
              <div className="p-6">
                {/* Filters */}
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search reports..."
                        className="w-full pl-10 pr-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:border-yellow-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="resolved">Resolved</option>
                    <option value="dismissed">Dismissed</option>
                  </select>

                  <select
                    value={reasonFilter}
                    onChange={(e) => setReasonFilter(e.target.value)}
                    className="px-4 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none"
                  >
                    <option value="all">All Reasons</option>
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="hate_speech">Hate Speech</option>
                    <option value="inappropriate_content">Inappropriate</option>
                    <option value="scam">Scam</option>
                    <option value="impersonation">Impersonation</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Reports List */}
                <div className="space-y-4">
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="w-8 h-8 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                      <div className="text-zinc-400">Loading reports...</div>
                    </div>
                  ) : filteredReports.length === 0 ? (
                    <div className="text-center py-12">
                      <Flag className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                      <div className="text-zinc-400">No reports found</div>
                    </div>
                  ) : (
                    filteredReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-6 hover:border-yellow-500/30 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start space-x-4 flex-1">
                            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Flag className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getReasonBadge(report.reason)}`}>
                                  {report.reason.replace('_', ' ').toUpperCase()}
                                </span>
                                <div className="flex items-center space-x-1">
                                  {getStatusIcon(report.status)}
                                  <span className="text-xs text-zinc-400 capitalize">{report.status}</span>
                                </div>
                                <span className="text-xs text-zinc-500">
                                  {new Date(report.createdAt).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-zinc-400 text-sm mb-1">
                                  <span className="text-yellow-400 font-medium">{report.reporterName}</span> reported{' '}
                                  <span className="text-red-400 font-medium">{report.reportedUserName}</span>
                                </p>
                                <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-3 mt-2">
                                  <p className="text-white text-sm">{report.messageContent}</p>
                                </div>
                              </div>

                              {report.description && (
                                <p className="text-zinc-400 text-sm italic">"{report.description}"</p>
                              )}
                            </div>
                          </div>

                          {report.status === 'pending' && (
                            <div className="flex space-x-2 ml-4">
                              <button
                                onClick={() => handleReportAction(report.id, 'resolve')}
                                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                              >
                                <CheckCircle className="w-4 h-4" />
                                <span>Resolve</span>
                              </button>
                              <button
                                onClick={() => handleReportAction(report.id, 'dismiss')}
                                className="px-4 py-2 bg-zinc-600 hover:bg-zinc-500 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Dismiss</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Message History Toggle */}
                        {report.reportedUserMessageHistory && report.reportedUserMessageHistory.length > 0 && (
                          <div className="mt-4 border-t border-zinc-700 pt-4">
                            <button
                              onClick={() => setExpandedReportId(expandedReportId === report.id ? null : report.id)}
                              className="flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors text-sm"
                            >
                              {expandedReportId === report.id ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                              <span>
                                View Message History ({report.reportedUserMessageHistory.length} messages)
                              </span>
                            </button>

                            {expandedReportId === report.id && (
                              <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
                                {report.reportedUserMessageHistory.map((msg, idx) => (
                                  <div key={idx} className="bg-zinc-900/50 border border-zinc-700 rounded p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-xs text-zinc-500">
                                        {new Date(msg.createdAt).toLocaleString()}
                                      </span>
                                      {msg.moderated && (
                                        <span className="text-xs text-yellow-500">Moderated</span>
                                      )}
                                    </div>
                                    <p className="text-zinc-300 text-sm">{msg.message}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Moderation Logs Tab */}
            {activeTab === 'logs' && (
              <div className="p-6">
                <div className="space-y-2">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                      <div className="text-zinc-400">No moderation logs</div>
                    </div>
                  ) : (
                    logs.slice(0, 50).map((log, idx) => (
                      <div
                        key={idx}
                        className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${
                            log.reason === 'spam_detected' ? 'bg-red-400' :
                            log.reason === 'profanity_filtered' ? 'bg-yellow-400' :
                            'bg-blue-400'
                          }`}></div>
                          <div>
                            <p className="text-white text-sm font-medium">
                              {log.type || log.reason.replace('_', ' ')}
                            </p>
                            {log.message && (
                              <p className="text-zinc-400 text-xs mt-1 truncate max-w-md">
                                "{log.message}"
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-zinc-500 text-xs">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                          {log.userId && (
                            <p className="text-zinc-600 text-xs">User {log.userId}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'users' && (
              <div className="p-6">
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
                  <div className="text-zinc-400 mb-4">User management features coming soon</div>
                  <p className="text-zinc-500 text-sm">Ban users, view user activity, and more</p>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'stats' && (
              <div className="p-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-4">Reports by Reason</h3>
                    <div className="space-y-3">
                      {['spam', 'harassment', 'hate_speech', 'inappropriate_content', 'scam', 'impersonation', 'other'].map(reason => {
                        const count = reports.filter(r => r.reason === reason).length;
                        const percentage = reports.length > 0 ? (count / reports.length) * 100 : 0;
                        return (
                          <div key={reason}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-zinc-400 capitalize">{reason.replace('_', ' ')}</span>
                              <span className="text-white">{count}</span>
                            </div>
                            <div className="w-full bg-zinc-700 rounded-full h-2">
                              <div 
                                className="bg-yellow-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-6">
                    <h3 className="text-white font-bold mb-4">Moderation Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Profanity Filtered</span>
                        <span className="text-2xl font-bold text-yellow-400">{stats.messagesModerated}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">Spam Blocked</span>
                        <span className="text-2xl font-bold text-red-400">{stats.spamBlocked}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-400">User Reports</span>
                        <span className="text-2xl font-bold text-blue-400">{stats.totalReports}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
