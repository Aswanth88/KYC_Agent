import React, { useState, useEffect } from 'react';
import { getAuthHeaders } from '../../hooks/useAuth';
import { getMyKYCApplications } from '../../services/kycApi';
import { KYCApplication } from '../../types/kyc';

interface VerificationStatusProps {
  userId?: string;
  onStatusUpdate?: (status: any) => void;
}


export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  userId,
  onStatusUpdate,
}) => {
  const [kycStatus, setKycStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch KYC status from API
  const fetchKYCStatus = async (): Promise<any> => {
    try {
      const result = await getMyKYCApplications();
      if (result.success && result.data && result.data.length > 0) {
        // Get the latest application
        const latestApp = result.data[0];
        return transformKYCToStatus(latestApp);
      }
      return null;
    } catch (error) {
      console.error('Error fetching KYC status:', error);
      return null;
    }
  };

  // Transform KYCApplication to status format
  const transformKYCToStatus = (app: KYCApplication) => {
    let currentStep = 1;
    let stepName = 'Submitted';
    
    switch (app.status) {
      case 'pending':
        currentStep = 1;
        stepName = 'Application Submitted';
        break;
      case 'under_review':
        currentStep = 2;
        stepName = 'Under Review';
        break;
      case 'approved':
        currentStep = 4;
        stepName = 'Approved';
        break;
      case 'rejected':
        currentStep = 4;
        stepName = 'Rejected';
        break;
    }

    return {
      id: app.id.toString(),
      status: app.status === 'under_review' ? 'in_review' : app.status,
      submittedAt: app.submittedAt,
      reviewedAt: app.reviewedAt,
      reviewedBy: app.reviewedBy,
      rejectionReason: app.rejectionReason,
      progress: {
        currentStep,
        totalSteps: 4,
        stepName,
      },
      documents: {
        identity: { uploaded: true, verified: app.status === 'approved' },
        address: { uploaded: true, verified: app.status === 'approved' },
        income: { uploaded: true, verified: app.status === 'approved' },
      },
      estimatedCompletionTime: app.status === 'under_review' ? '2-3 business days' : undefined,
    };
  };

  const loadKYCStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await fetchKYCStatus();
      setKycStatus(status);
      onStatusUpdate?.(status);
    } catch (err) {
      setError('Failed to load verification status');
      console.error('KYC Status Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshStatus = async () => {
    setRefreshing(true);
    await loadKYCStatus();
    setRefreshing(false);
  };

  useEffect(() => {
    loadKYCStatus();
  }, [userId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-md p-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading verification status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-md p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button
              onClick={loadKYCStatus}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!kycStatus) {
    return (
      <div className="max-w-2xl mx-auto mt-6 bg-white rounded-lg shadow-md p-6 text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Verification Data</h3>
        <p className="text-gray-600">
          Start your KYC verification process to see status updates here.
        </p>
      </div>
    );
  }

  const progressPercentage = (kycStatus.progress.currentStep / kycStatus.progress.totalSteps) * 100;

  return (
    <div className="max-w-4xl mx-auto mt-6 space-y-6">
      {/* Main Status Card */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Status</h2>
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                kycStatus.status === 'approved' ? 'bg-green-100 text-green-800' :
                kycStatus.status === 'rejected' ? 'bg-red-100 text-red-800' :
                kycStatus.status === 'in_review' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {kycStatus.status === 'approved' ? 'Approved' :
                 kycStatus.status === 'rejected' ? 'Rejected' :
                 kycStatus.status === 'in_review' ? 'Under Review' : 'Pending'}
              </span>
              {kycStatus.status === 'in_review' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>
              )}
            </div>
            <p className="text-gray-600 mb-4">
              {kycStatus.status === 'approved' ? 'Your identity has been successfully verified' :
               kycStatus.status === 'rejected' ? 'Your application requires additional information' :
               kycStatus.status === 'in_review' ? 'Our team is currently reviewing your documents' :
               'Your application is waiting to be reviewed'}
            </p>
          </div>
          <button
            onClick={refreshStatus}
            disabled={refreshing}
            className="px-3 py-2 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Progress Bar */}
        {kycStatus.status === 'in_review' && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">
                Progress: {kycStatus.progress.stepName}
              </span>
              <span className="text-sm text-gray-500">
                {kycStatus.progress.currentStep} of {kycStatus.progress.totalSteps}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            {kycStatus.estimatedCompletionTime && (
              <p className="text-xs text-gray-500 mt-1">
                Estimated completion: {kycStatus.estimatedCompletionTime}
              </p>
            )}
          </div>
        )}

        {/* Rejection Reason */}
        {kycStatus.status === 'rejected' && kycStatus.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-red-800 mb-1">Rejection Reason:</h4>
            <p className="text-red-700">{kycStatus.rejectionReason}</p>
          </div>
        )}

        {/* Submission Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Submitted</p>
            <p className="font-medium">{new Date(kycStatus.submittedAt).toLocaleDateString()}</p>
          </div>
          {kycStatus.reviewedAt && (
            <div>
              <p className="text-gray-500">Reviewed</p>
              <p className="font-medium">{new Date(kycStatus.reviewedAt).toLocaleDateString()}</p>
            </div>
          )}
          {kycStatus.reviewedBy && (
            <div>
              <p className="text-gray-500">Reviewed By</p>
              <p className="font-medium">{kycStatus.reviewedBy}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};