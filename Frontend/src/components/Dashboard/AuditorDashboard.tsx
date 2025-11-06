import React, { useState } from 'react';
import { useKYC } from '../../contexts/KYCContext';
import { Shield, TrendingUp, BarChart3, FileSearch } from 'lucide-react';

export const AuditorDashboard: React.FC = () => {
  const { getAllApplications } = useKYC();
  const applications = getAllApplications();

  const stats = {
    total: applications.length,
    pending: applications.filter(app => app.status === 'pending').length,
    approved: applications.filter(app => app.status === 'approved').length,
    rejected: applications.filter(app => app.status === 'rejected').length,
    underReview: applications.filter(app => app.status === 'under_review').length,
  };

  const getApprovalRate = () => {
    const processed = stats.approved + stats.rejected;
    return processed > 0 ? Math.round((stats.approved / processed) * 100) : 0;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Shield className="h-6 w-6 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">Audit Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Applications</p>
                <p className="text-3xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <FileSearch className="h-8 w-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-900">{stats.pending + stats.underReview}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Approved</p>
                <p className="text-3xl font-bold text-green-900">{stats.approved}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Approval Rate</p>
                <p className="text-3xl font-bold text-purple-900">{getApprovalRate()}%</p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {applications
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .slice(0, 5)
              .map((app) => (
                <div key={app.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      app.status === 'approved' ? 'bg-green-500' :
                      app.status === 'rejected' ? 'bg-red-500' :
                      app.status === 'under_review' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }`} />
                    <span className="text-sm text-gray-900">
                      {app.personalInfo.firstName} {app.personalInfo.lastName}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(app.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Compliance Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Processing Time (Avg)</span>
              <span className="text-sm font-medium text-gray-900">2.3 days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Rejection Rate</span>
              <span className="text-sm font-medium text-gray-900">{100 - getApprovalRate()}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Documents Reviewed</span>
              <span className="text-sm font-medium text-gray-900">{stats.total * 2}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Compliance Score</span>
              <span className="text-sm font-medium text-green-600">98.5%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};