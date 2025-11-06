import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getMyKYCApplications } from '../../services/kycApi';
import { KYCApplication } from '../../types/kyc';
import { CheckCircle, Clock, XCircle, AlertCircle, FileText, User } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [application, setApplication] = useState<KYCApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const result = await getMyKYCApplications();
        if (result.success && result.data && result.data.length > 0) {
          // Get the latest application
          setApplication(result.data[0]);
        }
      } catch (error) {
        console.error('Error fetching KYC applications:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchApplications();
    }
  }, [user]);

  if (!user) return null;

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected': return <XCircle className="h-5 w-5 text-red-500" />;
      case 'under_review': return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'under_review': return 'Under Review';
      case 'pending': return 'Pending Review';
      default: return 'Not Started';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'approved': return 'text-green-700 bg-green-50 border-green-200';
      case 'rejected': return 'text-red-700 bg-red-50 border-red-200';
      case 'under_review': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'pending': return 'text-blue-700 bg-blue-50 border-blue-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <User className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Account Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Account Status</p>
                <p className="text-2xl font-bold text-blue-900">
                  {application?.status ? 'Active' : 'Pending Setup'}
                </p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Verification</p>
                <p className="text-2xl font-bold text-green-900">
                  {application?.status === 'approved' ? 'Verified' : 'In Progress'}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Documents</p>
                <p className="text-2xl font-bold text-purple-900">
                  {application ? 'Submitted' : 'Required'}
                </p>
              </div>
              <FileText className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">KYC Verification Status</h3>
        
        {application ? (
          <div className="space-y-4">
            <div className={`flex items-center justify-between p-4 rounded-lg border-2 ${getStatusColor(application.status)}`}>
              <div className="flex items-center space-x-3">
                {getStatusIcon(application.status)}
                <div>
                  <p className="font-medium">{getStatusText(application.status)}</p>
                  <p className="text-sm opacity-75">
                    Submitted on {new Date(application.submittedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {application.status === 'rejected' && application.rejectionReason && (
                <div className="text-right">
                  <p className="text-sm font-medium">Rejection Reason:</p>
                  <p className="text-sm">{application.rejectionReason}</p>
                </div>
              )}
            </div>

            {application.status === 'approved' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-800 mb-2">Congratulations!</h4>
                <p className="text-sm text-green-700">
                  Your identity has been verified. You now have full access to all platform features.
                </p>
              </div>
            )}

            {application.auditTrail && application.auditTrail.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Application Timeline</h4>
                <div className="space-y-2">
                  {application.auditTrail.map((entry: any) => (
                    <div key={entry.id} className="flex items-start space-x-3 text-sm">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-2" />
                      <div>
                        <p className="text-gray-900 font-medium">{entry.action}</p>
                        <p className="text-gray-600">
                          {new Date(entry.timestamp).toLocaleString()} by {entry.performedBy}
                        </p>
                        {entry.details && (
                          <p className="text-gray-500 mt-1">{entry.details}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">Complete Your KYC Verification</h4>
            <p className="text-gray-600 mb-6">
              To access all features and ensure compliance, please complete your identity verification.
            </p>
            <button
              onClick={() => window.location.href = '/kyc-agent'}
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              Start Verification
            </button>
          </div>
        )}
      </div>
    </div>
  );
};