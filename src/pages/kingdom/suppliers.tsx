import { useState, useEffect } from 'react';
import Head from 'next/head';
import DashboardLayout from '@/components/DashboardLayout';
import { useRouter } from 'next/router';

interface SupplierApplication {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  productCategories: string;
  businessDescription: string;
  website: string;
  yearsInBusiness: string;
  expectedVolume: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

interface Supplier {
  id: string;
  name: string;
  email: string;
  supplierCode: string;
  companyName: string;
  status: 'active' | 'pending' | 'suspended';
  joinedDate: string;
  contactPerson: string;
  phone: string;
  address: string;
  productCategories: string[];
  totalProducts: number;
  totalSales: number;
  rating: number;
}

export default function KingdomSuppliers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<SupplierApplication[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [activeTab, setActiveTab] = useState<'applications' | 'suppliers'>('applications');

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = localStorage.getItem("isAdmin") === "true";
      if (!isAdmin) {
        router.replace("/admin-login");
      } else {
        setLoading(false);
        loadSupplierData();
      }
    }
  }, [router]);
  const loadSupplierData = async () => {
    try {
      // Load applications
      const applicationsRes = await fetch('/api/auth/supplier-registration');
      if (applicationsRes.ok) {
        const applicationsData = await applicationsRes.json();
        setApplications(applicationsData.applications || []);
      }

      // Load existing suppliers (from suppliers.json)
      const suppliersRes = await fetch('/api/admin/suppliers');
      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.suppliers || []);
      }
    } catch (error) {
      console.error('Failed to load supplier data:', error);
    }
  };
  const handleApplicationAction = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const response = await fetch('/api/admin/process-supplier-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local state
        setApplications(prev => prev.map(app => 
          app.id === applicationId 
            ? { ...app, status: action === 'approve' ? 'approved' : 'rejected' }
            : app
        ));        if (action === 'approve') {
          alert(`Application approved! Supplier credentials have been sent to the applicant's email. Supplier Code: ${data.supplier?.supplierCode}`);
          // Reload supplier data to show the new supplier
          await loadSupplierData();
          // Switch to suppliers tab to show the new active supplier
          setActiveTab('suppliers');
        } else {
          alert('Application rejected successfully.');
        }
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error processing application:', error);
      alert('Failed to process application. Please try again.');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      'pending': 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      'approved': 'bg-green-500/20 text-green-300 border-green-500/30',
      'rejected': 'bg-red-500/20 text-red-300 border-red-500/30',
      'active': 'bg-green-500/20 text-green-300 border-green-500/30',
      'suspended': 'bg-red-500/20 text-red-300 border-red-500/30'
    };
    return badges[status as keyof typeof badges] || badges['pending'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Suppliers Management - Kingdom Admin</title>
      </Head>

      <div className="p-6 space-y-6 bg-gradient-to-br from-zinc-950 via-zinc-900 to-black min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent">
              Suppliers Management
            </h1>
            <p className="text-gray-400 mt-2">Manage supplier applications and existing suppliers</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-lg border border-yellow-500/20">
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'applications'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Applications ({applications.filter(app => app.status === 'pending').length})
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'suppliers'
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Active Suppliers ({suppliers.filter(s => s.status === 'active').length})
          </button>
        </div>

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Supplier Applications</h2>
            </div>
            <div className="p-6">
              {applications.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No supplier applications yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {applications.map((application) => (
                    <div key={application.id} className="bg-zinc-800/50 border border-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">{application.companyName}</h3>
                          <p className="text-gray-400">Contact: {application.contactPerson}</p>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full border ${getStatusBadge(application.status)}`}>
                          {application.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                        <div>
                          <span className="text-gray-400 text-sm">Email:</span>
                          <p className="text-white">{application.email}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Phone:</span>
                          <p className="text-white">{application.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Years in Business:</span>
                          <p className="text-white">{application.yearsInBusiness}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Expected Volume:</span>
                          <p className="text-white">{application.expectedVolume}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Categories:</span>
                          <p className="text-white">{application.productCategories}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Submitted:</span>
                          <p className="text-white">{new Date(application.submittedAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-gray-400 text-sm">Business Description:</span>
                        <p className="text-white mt-1">{application.businessDescription}</p>
                      </div>

                      {application.status === 'pending' && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApplicationAction(application.id, 'approve')}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleApplicationAction(application.id, 'reject')}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div className="bg-zinc-900/50 border border-yellow-500/20 rounded-lg">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-xl font-bold text-white">Active Suppliers</h2>
            </div>
            <div className="p-6">
              {suppliers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No active suppliers yet.</p>
                </div>
              ) : (
                <div className="space-y-4">                  {suppliers.map((supplier) => (
                    <div key={supplier.id} className="bg-zinc-800/50 border border-gray-700 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-white mb-1">{supplier.companyName}</h3>
                          <p className="text-gray-400 mb-2">{supplier.email}</p>
                          <div className="flex items-center space-x-4">
                            <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-sm font-mono border border-yellow-500/30">
                              {supplier.supplierCode}
                            </span>
                            <span className="text-gray-400 text-sm">Contact: {supplier.contactPerson}</span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-sm rounded-full border ${getStatusBadge(supplier.status)}`}>
                          {supplier.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-gray-400 text-sm">Joined:</span>
                          <p className="text-white">{new Date(supplier.joinedDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Products:</span>
                          <p className="text-white">{supplier.totalProducts}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Total Sales:</span>
                          <p className="text-white">${supplier.totalSales.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="text-gray-400 text-sm">Rating:</span>
                          <p className="text-white">{supplier.rating}/5.0</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Phone:</span>
                          <p className="text-white">{supplier.phone}</p>
                        </div>
                        <div>
                          <span className="text-gray-400">Categories:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {supplier.productCategories.map((category, index) => (
                              <span key={index} className="bg-zinc-700 text-gray-300 px-2 py-1 rounded text-xs">
                                {category}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-sm">
                        <span className="text-gray-400">Address:</span>
                        <p className="text-white">{supplier.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}


// Disable footer for Kingdom pages
(KingdomSuppliers as any).showFooter = false;