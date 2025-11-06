export interface KYCApplication {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    nationality: string;
    phoneNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  identification: {
    documentType: 'passport' | 'drivers_license' | 'national_id';
    documentNumber: string;
    expiryDate: string;
    documentFront?: string; // Base64 or URL
    documentBack?: string;  // Base64 or URL
  };
  financialInfo: {
    sourceOfFunds: string;
    estimatedTransactionVolume: string;
    purposeOfAccount: string;
    employmentStatus: string;
    annualIncome: string;
  };
  additionalDocuments?: {
    proofOfAddress?: string;
    bankStatement?: string;
    utilityBill?: string;
  };
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  action: string;
  performedBy: string;
  timestamp: string;
  details?: string;
}

export type KYCStatus = 'pending' | 'approved' | 'rejected' | 'under_review';
export type KYCStatusUpdate = Exclude<KYCStatus, 'pending'>; // 'approved' | 'rejected' | 'under_review'