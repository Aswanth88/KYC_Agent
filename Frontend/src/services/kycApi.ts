// kycApi.ts - UPDATED VERSION
import { KYCApplication, KYCStatusUpdate } from '../types/kyc';
import { getAuthHeaders } from '../hooks/useAuth';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ? 
  `${import.meta.env.VITE_API_BASE_URL}/kyc` : 
  'http://localhost:8000/kyc';

// ----------------------------
// 1️⃣ Submit a new KYC Application
// ----------------------------
export const submitKYCApplication = async (applicationData: {
  personalInfo: any;
  identification: any;
  financialInfo: any;
}): Promise<ApiResponse<{ id: number }>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(applicationData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to submit KYC');
    }

    const data = await response.json();
    return { success: true, data: data, message: 'KYC submitted successfully' };
  } catch (error) {
    console.error('Error submitting KYC:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// ----------------------------
// 2️⃣ Get all KYC applications (Admin only)
// ----------------------------
export const getAllKYCApplications = async (): Promise<ApiResponse<KYCApplication[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/all`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch KYC applications');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching all KYC applications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// ----------------------------
// 3️⃣ Get user's own KYC applications
// ----------------------------
export const getMyKYCApplications = async (): Promise<ApiResponse<KYCApplication[]>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/my-applications`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch your KYC applications');
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching user KYC applications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// ----------------------------
// 4️⃣ Update KYC status (Admin)
// ----------------------------
export const updateKYCStatus = async (
  kycId: number,
  status: KYCStatusUpdate,
  reason?: string
): Promise<ApiResponse<{ message: string }>> => {
  try {
    const url = new URL(`${API_BASE_URL}/${kycId}/status`);
    url.searchParams.append('status', status);
    if (reason) {
      url.searchParams.append('reason', reason);
    }

    const response = await fetch(url.toString(), {
      method: 'PUT',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update KYC status');
    }

    const data = await response.json();
    return { success: true, data, message: data.message };
  } catch (error) {
    console.error('Error updating KYC status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};