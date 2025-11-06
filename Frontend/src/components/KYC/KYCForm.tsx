import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { submitKYCApplication } from '../../services/kycApi';
import { useNotify } from '../../hooks/useNotify';

interface FormDataState {
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
  };
  financialInfo: {
    sourceOfFunds: string;
    estimatedTransactionVolume: string;
    purposeOfAccount: string;
    employmentStatus: string;
    annualIncome: string;
  };
}

interface KYCFormProps {
  onComplete?: () => void;
  prefillData?: {
    name?: string[];
    gender?: string | null;
    dateOfBirth?: string | null;
    mobileNumber?: string | null;
    aadhaarNumber?: string | null;
    address?: string;
  };
}

export const KYCForm: React.FC<KYCFormProps> = ({ onComplete, prefillData }) => {
  const { user } = useAuth();
  const notify = useNotify();
  const [currentStep, setCurrentStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataState>({
    personalInfo: {
      firstName: prefillData?.name?.[0] || user?.firstName || '',
      lastName: prefillData?.name?.[1] || user?.lastName || '',
      dateOfBirth: prefillData?.dateOfBirth || '',
      nationality: 'Indian',
      phoneNumber: prefillData?.mobileNumber || '',
      address: {
        street: prefillData?.address || '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
      },
    },
    identification: {
      documentType: 'national_id',
      documentNumber: prefillData?.aadhaarNumber || '',
      expiryDate: '',
    },
    financialInfo: {
      sourceOfFunds: '',
      estimatedTransactionVolume: '',
      purposeOfAccount: '',
      employmentStatus: '',
      annualIncome: '',
    },
  });

  // Fix the useEffect with proper typing
  React.useEffect(() => {
    if (prefillData) {
      setFormData((prev: FormDataState) => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          firstName: prefillData.name?.[0] || prev.personalInfo.firstName,
          lastName: prefillData.name?.[1] || prev.personalInfo.lastName,
          dateOfBirth: prefillData.dateOfBirth || prev.personalInfo.dateOfBirth,
          phoneNumber: prefillData.mobileNumber || prev.personalInfo.phoneNumber,
          address: {
            ...prev.personalInfo.address,
            street: prefillData.address || prev.personalInfo.address.street,
          }
        },
        identification: {
          ...prev.identification,
          documentNumber: prefillData.aadhaarNumber || prev.identification.documentNumber,
        }
      }));
    }
  }, [prefillData]);

  const handleChange = (section: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value,
      },
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      personalInfo: {
        ...prev.personalInfo,
        address: {
          ...prev.personalInfo.address,
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const result = await submitKYCApplication(formData);
      if (result.success) {
        setSubmitted(true);
        notify.success('KYC application submitted successfully!');
        // Call onComplete after successful submission
        if (onComplete) {
          setTimeout(() => onComplete(), 2000);
        }
      } else {
        notify.error(result.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting KYC:', error);
      notify.error('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Your KYC application has been submitted successfully. Our team will review your information
            and get back to you within 2-3 business days.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              You will receive an email notification once your application status is updated.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">KYC Verification</h2>
          <p className="text-gray-600 mt-1">Complete your identity verification to access all features</p>
          
          <div className="flex items-center mt-6">
            {[1, 2, 3].map((step) => (
              <React.Fragment key={step}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  currentStep >= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
                } transition-all duration-200`}>
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                  } transition-all duration-200`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          {/* Step 1: Personal Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    value={formData.personalInfo.firstName}
                    onChange={(e) => handleChange('personalInfo', 'firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    type="text"
                    required
                    value={formData.personalInfo.lastName}
                    onChange={(e) => handleChange('personalInfo', 'lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    required
                    value={formData.personalInfo.dateOfBirth}
                    onChange={(e) => handleChange('personalInfo', 'dateOfBirth', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nationality</label>
                  <select
                    required
                    value={formData.personalInfo.nationality}
                    onChange={(e) => handleChange('personalInfo', 'nationality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select nationality</option>
                    <option value="US">United States</option>
                    <option value="UK">United Kingdom</option>
                    <option value="CA">Canada</option>
                    <option value="AU">Australia</option>
                    <option value="DE">Germany</option>
                    <option value="FR">India</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={formData.personalInfo.phoneNumber}
                    onChange={(e) => handleChange('personalInfo', 'phoneNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Address Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      required
                      value={formData.personalInfo.address.street}
                      onChange={(e) => handleAddressChange('street', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      required
                      value={formData.personalInfo.address.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
                    <input
                      type="text"
                      required
                      value={formData.personalInfo.address.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP/Postal Code</label>
                    <input
                      type="text"
                      required
                      value={formData.personalInfo.address.zipCode}
                      onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <select
                      required
                      value={formData.personalInfo.address.country}
                      onChange={(e) => handleAddressChange('country', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select country</option>
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">India</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Identification */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Identity Verification</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Type</label>
                  <select
                    required
                    value={formData.identification.documentType}
                    onChange={(e) => handleChange('identification', 'documentType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="passport">Passport</option>
                    <option value="drivers_license">Driver's License</option>
                    <option value="national_id">National ID</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Document Number</label>
                  <input
                    type="text"
                    required
                    value={formData.identification.documentNumber}
                    onChange={(e) => handleChange('identification', 'documentNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formData.identification.expiryDate}
                    onChange={(e) => handleChange('identification', 'expiryDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-lg font-medium text-gray-900">Document Upload</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Front of Document</p>
                    <button type="button" className="text-blue-600 text-sm hover:underline">
                      Upload File
                    </button>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors duration-200">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-600 mb-2">Back of Document</p>
                    <button type="button" className="text-blue-600 text-sm hover:underline">
                      Upload File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Financial Information */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Financial Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source of Funds</label>
                  <select
                    required
                    value={formData.financialInfo.sourceOfFunds}
                    onChange={(e) => handleChange('financialInfo', 'sourceOfFunds', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select source</option>
                    <option value="salary">Salary/Employment</option>
                    <option value="business">Business Income</option>
                    <option value="investment">Investment Returns</option>
                    <option value="inheritance">Inheritance</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
                  <select
                    required
                    value={formData.financialInfo.annualIncome}
                    onChange={(e) => handleChange('financialInfo', 'annualIncome', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select range</option>
                    <option value="under_50k">Under $50,000</option>
                    <option value="50k_100k">$50,000 - $100,000</option>
                    <option value="100k_250k">$100,000 - $250,000</option>
                    <option value="250k_500k">$250,000 - $500,000</option>
                    <option value="over_500k">Over $500,000</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Status</label>
                  <select
                    required
                    value={formData.financialInfo.employmentStatus}
                    onChange={(e) => handleChange('financialInfo', 'employmentStatus', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select status</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="unemployed">Unemployed</option>
                    <option value="retired">Retired</option>
                    <option value="student">Student</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Transaction Volume</label>
                  <select
                    required
                    value={formData.financialInfo.estimatedTransactionVolume}
                    onChange={(e) => handleChange('financialInfo', 'estimatedTransactionVolume', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select volume</option>
                    <option value="under_10k">Under $10,000/month</option>
                    <option value="10k_50k">$10,000 - $50,000/month</option>
                    <option value="50k_100k">$50,000 - $100,000/month</option>
                    <option value="over_100k">Over $100,000/month</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Purpose of Account</label>
                <textarea
                  required
                  value={formData.financialInfo.purposeOfAccount}
                  onChange={(e) => handleChange('financialInfo', 'purposeOfAccount', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the intended use of your account..."
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => setCurrentStep(prev => prev - 1)}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors duration-200"
              >
                Previous
              </button>
            )}
            
            <div className="ml-auto">
              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep(prev => prev + 1)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  <span>{loading ? 'Submitting...' : 'Submit Application'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};