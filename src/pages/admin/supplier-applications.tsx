import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, Eye, FileText } from 'lucide-react';

interface SupplierApplication {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string;
  category: string;
  description: string;
  experience: string;
  motivation: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

export default function SupplierApplicationsAdmin() {
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<SupplierApplication | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/admin/supplier-applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (applicationId: string, status: 'approved' | 'rejected') => {
    setIsUpdating(true);
    try {
      const response = await fetch('/api/admin/supplier-applications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          applicationId,
          status,
          reviewNotes
        }),
      });

      if (response.ok) {
        await fetchApplications();
        setSelectedApplication(null);
        setReviewNotes('');
        alert(`Application ${status} successfully!`);
      } else {
        alert('Failed to update application');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-400 bg-green-400/10';
      case 'rejected':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-yellow-400 bg-yellow-400/10';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-white">Loading applications...</div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Supplier Applications - MIGISTUS Admin</title>
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white">
        {/* Header */}
        <div className="bg-zinc-900/50 border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <img src="/images/migistus_logo.png" alt="MIGISTUS" className="h-8 w-auto" />
                  <span className="text-xl font-bold text-yellow-400">MIGISTUS</span>
                </Link>
                <span className="text-zinc-400">Admin</span>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/suppliers" className="text-zinc-400 hover:text-white transition-colors">
                  Supplier Landing
                </Link>
                <Link href="/suppliers-tracking" className="text-zinc-400 hover:text-white transition-colors">
                  Supplier Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Supplier Applications</h1>
            <p className="text-zinc-400">Review and manage supplier applications</p>
          </div>

          {applications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-zinc-400 mb-2">No Applications</h3>
              <p className="text-zinc-500">No supplier applications have been submitted yet.</p>
            </div>
          ) : (
            <div className="grid gap-6">
              {applications.map((application) => (
                <div key={application.id} className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-white">{application.companyName}</h3>
                      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${getStatusColor(application.status)}`}>
                        {getStatusIcon(application.status)}
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="flex items-center gap-2 text-yellow-400 hover:text-yellow-300 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Review
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p className="text-zinc-400 text-sm">Contact</p>
                      <p className="text-white">{application.contactName}</p>
                      <p className="text-zinc-300 text-sm">{application.email}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm">Category</p>
                      <p className="text-white">{application.category}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm">Website</p>
                      <p className="text-white">{application.website || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-sm">Submitted</p>
                      <p className="text-white">{new Date(application.submittedAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-zinc-400 text-sm mb-2">Description</p>
                    <p className="text-zinc-300 text-sm line-clamp-3">{application.description}</p>
                  </div>

                  {application.reviewNotes && (
                    <div className="bg-zinc-800/50 border border-zinc-600 rounded p-3">
                      <p className="text-zinc-400 text-sm mb-1">Review Notes</p>
                      <p className="text-zinc-300 text-sm">{application.reviewNotes}</p>
                      {application.reviewedAt && (
                        <p className="text-zinc-500 text-xs mt-2">
                          Reviewed on {new Date(application.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-zinc-900 border border-zinc-700 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white">Review Application</h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-zinc-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Company Information</h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-zinc-400 text-sm">Company Name</p>
                        <p className="text-white">{selectedApplication.companyName}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm">Contact Person</p>
                        <p className="text-white">{selectedApplication.contactName}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm">Email</p>
                        <p className="text-white">{selectedApplication.email}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm">Phone</p>
                        <p className="text-white">{selectedApplication.phone || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm">Website</p>
                        <p className="text-white">{selectedApplication.website || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm">Category</p>
                        <p className="text-white">{selectedApplication.category}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Application Details</h3>
                    <div className="space-y-4">
                      <div>
                        <p className="text-zinc-400 text-sm mb-2">Company Description</p>
                        <p className="text-zinc-300 text-sm bg-zinc-800/50 p-3 rounded">{selectedApplication.description}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm mb-2">Experience & Background</p>
                        <p className="text-zinc-300 text-sm bg-zinc-800/50 p-3 rounded">{selectedApplication.experience || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-zinc-400 text-sm mb-2">Why MIGISTUS?</p>
                        <p className="text-zinc-300 text-sm bg-zinc-800/50 p-3 rounded">{selectedApplication.motivation}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedApplication.status === 'pending' && (
                  <div className="border-t border-zinc-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Review Decision</h3>
                    <div className="mb-4">
                      <label className="block text-zinc-400 text-sm mb-2">Review Notes (Optional)</label>
                      <textarea
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:border-yellow-500 focus:outline-none"
                        placeholder="Add any notes about your decision..."
                      />
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                        disabled={isUpdating}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        {isUpdating ? 'Updating...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                        disabled={isUpdating}
                        className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        {isUpdating ? 'Updating...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}

                {selectedApplication.status !== 'pending' && selectedApplication.reviewNotes && (
                  <div className="border-t border-zinc-700 pt-6">
                    <h3 className="text-lg font-semibold text-white mb-2">Review Notes</h3>
                    <p className="text-zinc-300 bg-zinc-800/50 p-3 rounded">{selectedApplication.reviewNotes}</p>
                    <p className="text-zinc-500 text-sm mt-2">
                      Reviewed on {selectedApplication.reviewedAt && new Date(selectedApplication.reviewedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
