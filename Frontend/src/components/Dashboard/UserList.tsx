import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  status: string;
  lastUpdated: string;
}

interface StatusBadgeProps {
  status: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return 'Approved';
      case 'pending':
        return 'Pending';
      case 'rejected':
        return 'Rejected';
      case 'under_review':
        return 'Under Review';
      default:
        return status;
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusClasses(status)}`}>
      {getStatusText(status)}
    </span>
  );
};

export const UserList: React.FC = () => {
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  // FIXED: Use correct token key
  const getAuthToken = (): string | null => {
    return localStorage.getItem('auth_token') || localStorage.getItem('token');
  };

  const fetchUsers = async (): Promise<void> => {
    try {
      setLoading(true);
      setError('');

      const token = getAuthToken();
      console.log('🔐 Token found:', !!token);
      
      if (!token) {
        setError('Please log in to view users');
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/kyc/all`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Admin privileges required.');
        } else {
          throw new Error(`Server error: ${response.status}`);
        }
      }

      const kycApplications = await response.json();
      console.log('📊 KYC applications received:', kycApplications);
      
      // Transform API data to User format
      const transformedUsers: User[] = kycApplications.map((app: any) => {
        const personalInfo = app.personalInfo || {};
        const firstName = personalInfo.firstName || '';
        const lastName = personalInfo.lastName || '';
        
        return {
          id: app.id,
          name: firstName || lastName ? 
            `${firstName} ${lastName}`.trim() : 
            `User ${app.id}`,
          email: app.userEmail || `user${app.id}@example.com`,
          status: app.status || 'pending',
          lastUpdated: app.submittedAt ? 
            new Date(app.submittedAt).toISOString().split('T')[0] : 
            new Date().toISOString().split('T')[0]
        };
      });

      setUsers(transformedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to load user data');
      
      // Fallback to sample data for demo
      if (users.length === 0) {
        setUsers([
          { id: 1, name: 'John Doe', email: 'john@example.com', status: 'approved', lastUpdated: '2024-07-22' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', status: 'pending', lastUpdated: '2024-07-21' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', status: 'rejected', lastUpdated: '2024-07-20' },
        ]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSelectUser = (id: number): void => {
    setSelectedUsers(prev => 
      prev.includes(id) ? prev.filter(userId => userId !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSelectedUsers(e.target.checked ? users.map(user => user.id) : []);
  };

  const handleApproveSelected = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please log in to perform this action');
        return;
      }

      for (const userId of selectedUsers) {
        const response = await fetch(`${API_BASE_URL}/kyc/${userId}/status?status=approved`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to approve user ${userId}`);
        }
      }

      await fetchUsers(); // Refresh the list
      setSelectedUsers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve users');
    }
  };

  const handleRejectSelected = async (): Promise<void> => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('Please log in to perform this action');
        return;
      }

      for (const userId of selectedUsers) {
        const response = await fetch(`${API_BASE_URL}/kyc/${userId}/status?status=rejected&reason=Manual+rejection`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to reject user ${userId}`);
        }
      }

      await fetchUsers(); // Refresh the list
      setSelectedUsers([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject users');
    }
  };

  const handleRetry = (): void => {
    setError('');
    fetchUsers();
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading users...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
        <button 
          onClick={fetchUsers}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={handleRetry}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Users ({users.length})
            </h2>
            {selectedUsers.length > 0 && (
              <div className="flex gap-2">
                <button 
                  onClick={handleApproveSelected}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  Approve ({selectedUsers.length})
                </button>
                <button 
                  onClick={handleRejectSelected}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  Reject ({selectedUsers.length})
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll}
                    checked={selectedUsers.length === users.length && users.length > 0}
                    className="rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <input 
                      type="checkbox" 
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 text-gray-900">{user.lastUpdated}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setSelectedUsers([user.id]);
                          setTimeout(handleApproveSelected, 100);
                        }}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="Approve"
                      >
                        <CheckCircle size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUsers([user.id]);
                          setTimeout(handleRejectSelected, 100);
                        }}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Reject"
                      >
                        <XCircle size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && !loading && (
            <div className="text-center py-12 text-gray-500">
              <p className="text-lg">No KYC applications found</p>
              <p className="text-sm mt-2">No users have submitted KYC applications yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};