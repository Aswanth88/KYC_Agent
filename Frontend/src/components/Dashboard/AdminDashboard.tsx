import React, { useState, useEffect } from 'react';
import { KYCApplication, KYCStatusUpdate } from '../../types/kyc';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Eye,
  FileText,
} from 'lucide-react';
import {
  getAllKYCApplications,
  updateKYCStatus,
} from '../../services/kycApi';

export const AdminDashboard: React.FC = () => {
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<KYCApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch all KYC applications from backend
  useEffect(() => {
    // In your fetchApplications function
    const fetchApplications = async () => {
      try {
        const response = await getAllKYCApplications();
        if (response.success && response.data) {
          // Ensure all applications have required fields
          const validatedApplications = response.data.map(app => ({
            id: app.id,
            userId: app.userId || '',
            status: app.status || 'pending',
            personalInfo: app.personalInfo || {
              firstName: '',
              lastName: '',
              dateOfBirth: '',
              nationality: '',
              phoneNumber: '',
              address: { street: '', city: '', state: '', zipCode: '', country: '' }
            },
            identification: app.identification || {
              documentType: 'national_id',
              documentNumber: '',
              expiryDate: ''
            },
            financialInfo: app.financialInfo || {
              sourceOfFunds: '',
              estimatedTransactionVolume: '',
              purposeOfAccount: '',
              employmentStatus: '',
              annualIncome: ''
            },
            submittedAt: app.submittedAt || new Date().toISOString(),
            auditTrail: app.auditTrail || []
          }));
          setApplications(validatedApplications);
        } else {
          console.error('Error fetching KYC applications:', response.error);
          // Set empty array instead of showing broken data
          setApplications([]);
        }
      } catch (error) {
        console.error('Error fetching KYC applications:', error);
        setApplications([]);
      } finally {
        setLoading(false);
      }
    };
    fetchApplications();
  }, []);

  // Filter applications based on search & status
  const filteredApplications = applications.filter((app) => {
    const matchesSearch =
      searchTerm === '' ||
      app.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.personalInfo.phoneNumber.includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Status icon for each state
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'under_review':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Status color styles
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Text for each status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'under_review':
        return 'Under Review';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  // Update KYC status
  const handleStatusUpdate = async (id: number, status: KYCStatusUpdate) => {
    // Now status can only be 'approved' | 'rejected' | 'under_review'
    if (status === 'rejected' && !rejectionReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    try {
      const result = await updateKYCStatus(
        id,
        status,
        status === 'rejected' ? rejectionReason : undefined
      );

      if (result.success) {
        setApplications((prev) =>
          prev.map((app) =>
            app.id === id ? {
              ...app,
              status,
              rejectionReason: status === 'rejected' ? rejectionReason : app.rejectionReason
            } : app
          )
        );
        setSelectedApplication(null);
        setRejectionReason('');
      } else {
        alert(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating KYC status:', error);
      alert('Failed to update application status. Try again later.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen text-gray-600">
        Loading KYC applications...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          KYC Applications Management
        </h2>

        {/* Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search applications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="under_review">Under Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            Total: {applications.length} | Filtered: {filteredApplications.length}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Document Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.map((application) => (
                <tr
                  key={application.id}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {application.personalInfo.firstName}{' '}
                        {application.personalInfo.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {application.personalInfo.phoneNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        application.status
                      )}`}
                    >
                      {getStatusIcon(application.status)}
                      <span className="ml-1 capitalize">
                        {getStatusText(application.status)}
                      </span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(application.submittedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {application.identification.documentType.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedApplication(application)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-700 transition-colors duration-200"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500">No applications found</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                Review Application - {selectedApplication.personalInfo.firstName}{' '}
                {selectedApplication.personalInfo.lastName}
              </h3>
              <button
                onClick={() => setSelectedApplication(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal Info */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Name:</span>{' '}
                    {selectedApplication.personalInfo.firstName}{' '}
                    {selectedApplication.personalInfo.lastName}
                  </div>
                  <div>
                    <span className="text-gray-600">Date of Birth:</span>{' '}
                    {selectedApplication.personalInfo.dateOfBirth}
                  </div>
                  <div>
                    <span className="text-gray-600">Nationality:</span>{' '}
                    {selectedApplication.personalInfo.nationality}
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>{' '}
                    {selectedApplication.personalInfo.phoneNumber}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Address:</span>{' '}
                    {selectedApplication.personalInfo.address.street},{' '}
                    {selectedApplication.personalInfo.address.city},{' '}
                    {selectedApplication.personalInfo.address.state}{' '}
                    {selectedApplication.personalInfo.address.zipCode},{' '}
                    {selectedApplication.personalInfo.address.country}
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Identification
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Document Type:</span>{' '}
                    {selectedApplication.identification.documentType.replace('_', ' ')}
                  </div>
                  <div>
                    <span className="text-gray-600">Document Number:</span>{' '}
                    {selectedApplication.identification.documentNumber}
                  </div>
                  <div>
                    <span className="text-gray-600">Expiry Date:</span>{' '}
                    {selectedApplication.identification.expiryDate}
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-3">
                  Financial Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Source of Funds:</span>{' '}
                    {selectedApplication.financialInfo.sourceOfFunds}
                  </div>
                  <div>
                    <span className="text-gray-600">Annual Income:</span>{' '}
                    {selectedApplication.financialInfo.annualIncome}
                  </div>
                  <div>
                    <span className="text-gray-600">Employment:</span>{' '}
                    {selectedApplication.financialInfo.employmentStatus}
                  </div>
                  <div>
                    <span className="text-gray-600">Transaction Volume:</span>{' '}
                    {selectedApplication.financialInfo.estimatedTransactionVolume}
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Purpose:</span>{' '}
                    {selectedApplication.financialInfo.purposeOfAccount}
                  </div>
                </div>
              </div>

              {/* Review Actions */}
              {selectedApplication.status === 'pending' && (
                <div className="border-t pt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-3">
                    Review Actions
                  </h4>
                  <div className="space-y-4">
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Provide rejection reason (optional)"
                    />
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'approved')}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'under_review')}
                        className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Under Review
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(selectedApplication.id, 'rejected')}
                        className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
