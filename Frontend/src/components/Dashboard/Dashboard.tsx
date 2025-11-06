import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { getAuthHeaders } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  LayoutDashboard,
  FileText,
  Clock,
  CheckCircle,
  Users,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Settings,
  UploadCloud,
  FileDown,
  Bell,
  Camera,
  Bot,
  ArrowRight,
  UserCheck,
  Sparkles,
} from 'lucide-react';

interface ChartData {
  name: string;
  applications: number;
}

interface UserWithRole {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  role?: string;
}

interface KYCApplication {
  id: number;
  userId: number;
  status: string;
  personalInfo: any;
  identification: any;
  financialInfo: any;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
}

interface DashboardStats {
  totalApplications: number;
  pendingReviews: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeUsers?: number;
  fraudAlerts?: number;
}

interface Alert {
  text: string;
  time: string;
  type: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const Dashboard: React.FC = () => {
  const { user: authUser } = useAuth();
  const navigate = useNavigate();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [applications, setApplications] = useState<KYCApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const user = authUser as UserWithRole;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const headers = getAuthHeaders();

        // Fetch all KYC applications for admin, user's applications for others
        let appsResponse;
        if (user?.role === 'admin') {
          appsResponse = await fetch(`${API_BASE_URL}/kyc/all`, { headers });
        } else {
          appsResponse = await fetch(`${API_BASE_URL}/kyc/my-applications`, { headers });
        }

        if (appsResponse.ok) {
          const appsData = await appsResponse.json();
          setApplications(appsData);
          
          // Calculate real stats from applications data
          const dashboardStats = calculateStats(appsData, user?.role);
          setStats(dashboardStats);

          // Generate real alerts from application data
          const realAlerts = generateAlerts(appsData, user?.role);
          setAlerts(realAlerts);
        }

        // Fetch chart data for admin
        if (user?.role === 'admin') {
          const chartResponse = await fetch(`${API_BASE_URL}/kyc/stats/monthly`, { headers });
          if (chartResponse.ok) {
            const chartData = await chartResponse.json();
            setChartData(chartData);
          }
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const calculateStats = (apps: KYCApplication[], role?: string): DashboardStats => {
    const totalApplications = apps.length;
    const pendingReviews = apps.filter(app => app.status === 'pending' || app.status === 'under_review').length;
    const approvedApplications = apps.filter(app => app.status === 'approved').length;
    const rejectedApplications = apps.filter(app => app.status === 'rejected').length;

    if (role === 'admin') {
      return {
        totalApplications,
        pendingReviews,
        approvedApplications,
        rejectedApplications,
        fraudAlerts: apps.filter(app => 
          app.rejectionReason?.toLowerCase().includes('fraud') || 
          app.status === 'rejected'
        ).length,
        activeUsers: new Set(apps.map(app => app.userId)).size
      };
    }

    return {
      totalApplications,
      pendingReviews,
      approvedApplications,
      rejectedApplications
    };
  };

  const generateAlerts = (apps: KYCApplication[], role?: string): Alert[] => {
    const alerts: Alert[] = [];
    const now = new Date();

    if (role === 'admin') {
      // Recent pending applications
      const recentPending = apps
        .filter(app => app.status === 'pending')
        .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
        .slice(0, 3);

      recentPending.forEach(app => {
        const submittedTime = new Date(app.submittedAt);
        const timeDiff = Math.floor((now.getTime() - submittedTime.getTime()) / (1000 * 60));
        const timeText = timeDiff < 60 ? `${timeDiff}m ago` : `${Math.floor(timeDiff / 60)}h ago`;
        
        alerts.push({
          text: `New KYC application submitted by ${app.personalInfo?.firstName || 'User'}`,
          time: timeText,
          type: 'new'
        });
      });

      // Recent rejections
      const recentRejections = apps
        .filter(app => app.status === 'rejected' && app.reviewedAt)
        .sort((a, b) => new Date(b.reviewedAt!).getTime() - new Date(a.reviewedAt!).getTime())
        .slice(0, 2);

      recentRejections.forEach(app => {
        const reviewedTime = new Date(app.reviewedAt!);
        const timeDiff = Math.floor((now.getTime() - reviewedTime.getTime()) / (1000 * 60 * 60));
        const timeText = timeDiff < 24 ? `${timeDiff}h ago` : `${Math.floor(timeDiff / 24)}d ago`;
        
        alerts.push({
          text: `Application rejected for ${app.personalInfo?.firstName || 'User'} - ${app.rejectionReason || 'No reason provided'}`,
          time: timeText,
          type: 'failed'
        });
      });
    } else {
      // User-specific alerts
      const userApps = apps.slice(0, 3);
      userApps.forEach(app => {
        const appTime = new Date(app.submittedAt);
        const timeDiff = Math.floor((now.getTime() - appTime.getTime()) / (1000 * 60 * 60 * 24));
        const timeText = timeDiff === 0 ? 'Today' : timeDiff === 1 ? 'Yesterday' : `${timeDiff}d ago`;

        let alertText = '';
        let alertType = 'info';

        switch (app.status) {
          case 'approved':
            alertText = 'Your KYC application has been approved';
            alertType = 'passed';
            break;
          case 'rejected':
            alertText = `Your KYC application was rejected: ${app.rejectionReason || 'No reason provided'}`;
            alertType = 'failed';
            break;
          case 'pending':
            alertText = 'Your KYC application is under review';
            alertType = 'new';
            break;
          default:
            alertText = `Application status: ${app.status}`;
            alertType = 'info';
        }

        alerts.push({
          text: alertText,
          time: timeText,
          type: alertType
        });
      });
    }

    return alerts.slice(0, 5); // Limit to 5 alerts
  };

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDashboardStats = () => {
    const iconClass = "h-8 w-8";
    
    if (!stats) {
      // Return loading state stats
      return [
        { label: 'Loading...', value: '...', icon: <FileText className={iconClass} />, color: 'blue' },
        { label: 'Loading...', value: '...', icon: <Clock className={iconClass} />, color: 'yellow' },
        { label: 'Loading...', value: '...', icon: <AlertTriangle className={iconClass} />, color: 'red' },
        { label: 'Loading...', value: '...', icon: <Users className={iconClass} />, color: 'indigo' },
      ];
    }

    switch (user?.role) {
      case 'admin':
        return [
          { label: 'Total Applications', value: stats.totalApplications.toString(), icon: <FileText className={iconClass} />, color: 'blue' },
          { label: 'Pending Reviews', value: stats.pendingReviews.toString(), icon: <Clock className={iconClass} />, color: 'yellow' },
          { label: 'Rejected Applications', value: (stats.fraudAlerts || 0).toString(), icon: <AlertTriangle className={iconClass} />, color: 'red' },
          { label: 'Active Users', value: (stats.activeUsers || 0).toString(), icon: <Users className={iconClass} />, color: 'indigo' },
        ];
      case 'auditor':
        return [
          { label: 'Reviews Completed', value: stats.approvedApplications.toString(), icon: <LayoutDashboard className={iconClass} />, color: 'blue' },
          { label: 'Approval Rate', value: stats.totalApplications > 0 ? `${Math.round((stats.approvedApplications / stats.totalApplications) * 100)}%` : '0%', icon: <ShieldCheck className={iconClass} />, color: 'green' },
          { label: 'Pending Reviews', value: stats.pendingReviews.toString(), icon: <AlertTriangle className={iconClass} />, color: 'red' },
          { label: 'Total Reviewed', value: stats.totalApplications.toString(), icon: <TrendingUp className={iconClass} />, color: 'indigo' },
        ];
      case 'user':
      default:
        const userStatus = applications.find(app => app.status === 'approved') ? 'Verified' : 'Pending';
        const kycStatus = applications.length > 0 ? (applications[0].status === 'approved' ? 'Verified' : applications[0].status) : 'Not Started';
        
        return [
          { label: 'Account Status', value: 'Active', icon: <CheckCircle className={iconClass} />, color: 'green' },
          { label: 'KYC Status', value: kycStatus, icon: <ShieldCheck className={iconClass} />, color: kycStatus === 'Verified' ? 'green' : 'yellow' },
          { label: 'Applications', value: stats.totalApplications.toString(), icon: <FileText className={iconClass} />, color: 'indigo' },
          { label: 'Last Activity', value: applications.length > 0 ? new Date(applications[0].submittedAt).toLocaleDateString() : 'Never', icon: <Clock className={iconClass} />, color: 'blue' },
        ];
    }
  };

  const getQuickActions = () => {
    switch (user?.role) {
      case 'admin':
        return [
          { label: 'KYC Applications', action: () => navigate('/admin/dashboard'), icon: <TrendingUp /> },
          { label: 'User Management', action: () => navigate('/admin/users'), icon: <Users /> },
        ];
      case 'auditor':
        return [
          { label: 'Review Applications', action: () => navigate('/admin/dashboard'), icon: <LayoutDashboard /> },
          { label: 'Compliance Reports', action: () => navigate('/audit/compliance'), icon: <ShieldCheck /> },
        ];
      case 'user':
      default:
        const hasPendingApp = applications.some(app => app.status === 'pending' || app.status === 'under_review');
        const hasVerifiedApp = applications.some(app => app.status === 'approved');
        
        if (hasVerifiedApp) {
          return [
            { label: 'View Application', action: () => navigate('/manual-kyc'), icon: <FileText /> },
            { label: 'Re-verify Face', action: () => navigate('/face-verification'), icon: <Camera /> },
          ];
        } else if (hasPendingApp) {
          return [
            { label: 'Check Status', action: () => navigate('/manual-kyc'), icon: <FileText /> },
            { label: 'AI Assistant', action: () => navigate('/ai-assistant'), icon: <Bot /> },
          ];
        } else {
          return [
            { label: 'Manual KYC (Form)', action: () => navigate('/manual-kyc'), icon: <FileText /> },
            { label: 'AI Assistant', action: () => navigate('/ai-assistant'), icon: <Bot /> },
          ];
        }
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-100 text-blue-600',
      yellow: 'bg-yellow-100 text-yellow-600', 
      red: 'bg-red-100 text-red-600',
      green: 'bg-green-100 text-green-600',
      indigo: 'bg-indigo-100 text-indigo-600',
      purple: 'bg-purple-100 text-purple-600'
    };
    return colorMap[color] || colorMap.blue;
  };

  // KYC Options Section for Users
  const KYCUserOptions = () => {
    const hasPendingApp = applications.some(app => app.status === 'pending' || app.status === 'under_review');
    const hasVerifiedApp = applications.some(app => app.status === 'approved');

    if (hasVerifiedApp) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <UserCheck className="h-6 w-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800">Verification Complete!</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Your identity has been successfully verified. You can view your application or re-verify if needed.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/manual-kyc')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">View Application</h3>
                  <p className="text-sm text-gray-600">Check your submitted details</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={() => navigate('/face-verification')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Camera className="h-8 w-8 text-purple-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Re-verify Face</h3>
                  <p className="text-sm text-gray-600">Update your facial verification</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      );
    }

    if (hasPendingApp) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="h-6 w-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-800">Application Pending</h2>
          </div>
          <p className="text-gray-600 mb-4">
            Your KYC application is being reviewed. You can check the status or get help from our AI Assistant.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/manual-kyc')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Check Status</h3>
                  <p className="text-sm text-gray-600">View application progress</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <Bot className="h-8 w-8 text-green-600" />
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">AI Assistant</h3>
                  <p className="text-sm text-gray-600">Get help with your application</p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>
      );
    }

    // No application - show both options
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <UserCheck className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Start Identity Verification</h2>
        </div>
        <p className="text-gray-600 mb-6">
          Choose your preferred method to complete your KYC verification and access all platform features.
        </p>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Manual KYC Option */}
          <div className="border-2 border-blue-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Manual KYC</h3>
                <p className="text-sm text-blue-600 font-medium">Traditional Form</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Complete your verification using our step-by-step form. Perfect if you prefer filling out information at your own pace.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Face verification first
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Detailed form submission
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                Complete control over data
              </li>
            </ul>
            <button
              onClick={() => navigate('/manual-kyc')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-semibold"
            >
              Start Manual KYC
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>

          {/* AI Assistant Option */}
          <div className="border-2 border-green-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-green-50 to-white">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Bot className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">AI Assistant</h3>
                <p className="text-sm text-green-600 font-medium">Guided Experience</p>
              </div>
            </div>
            <p className="text-gray-600 mb-4 text-sm">
              Let our AI guide you through the entire process with built-in face verification and real-time assistance.
            </p>
            <ul className="space-y-2 mb-6">
              <li className="flex items-center text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-green-500 mr-2" />
                Conversational guidance
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-green-500 mr-2" />
                Built-in face verification
              </li>
              <li className="flex items-center text-sm text-gray-600">
                <Sparkles className="h-4 w-4 text-green-500 mr-2" />
                Instant feedback & support
              </li>
            </ul>
            <button
              onClick={() => navigate('/ai-assistant')}
              className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center font-semibold"
            >
              Start with AI Assistant
              <ArrowRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">
          {getWelcomeMessage()}, {user?.firstName}!
        </h1>
        <p className="text-gray-500 mt-2">
          Welcome to your {user?.role} dashboard
        </p>
      </div>

      {/* KYC Options for Users */}
      {user?.role === 'user' && <KYCUserOptions />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {getDashboardStats().map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow-md p-6 flex items-center">
            <div className={`p-3 rounded-full ${getColorClass(stat.color)} mr-4`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {user?.role === 'admin' && (
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Application Trends</h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="applications" fill="#8884d8" name="Applications" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex justify-center items-center h-64 text-gray-500">
                No chart data available
              </div>
            )}
          </div>
        )}

        <div className="space-y-6">
          {(user?.role === 'admin' || user?.role === 'user') && alerts.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Bell className="mr-2" /> Recent Activity
              </h2>
              <ul>
                {alerts.map((alert, index) => (
                  <li key={index} className="flex items-start py-2 border-b last:border-b-0">
                    <div
                      className={`w-2 h-2 rounded-full mt-1.5 mr-3 ${
                        alert.type === 'failed' ? 'bg-red-500' : 
                        alert.type === 'passed' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                    ></div>
                    <div>
                      <p className="font-semibold text-sm">{alert.text}</p>
                      <p className="text-xs text-gray-500">{alert.time}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Actions - Only show for admin/auditor now */}
          {(user?.role === 'admin' || user?.role === 'auditor') && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {getQuickActions().map((action, index) => (
                  <button
                    key={index}
                    onClick={action.action}
                    className="w-full flex items-center px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-md hover:bg-gray-50 transition-colors"
                  >
                    {React.cloneElement(action.icon, { className: "mr-3 h-5 w-5" })}
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {user?.role === 'admin' && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4">Reports</h2>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">
                  Export compliance reports and analytics.
                </p>
                <button 
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition-colors"
                  onClick={() => {/* Add export functionality */}}
                >
                  <FileDown className="mr-2 h-5 w-5" />
                  Export Report
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};