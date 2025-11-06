import React, { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Camera, CheckCircle, Home } from 'lucide-react';
import { KYCForm } from './KYCForm';
import { FaceVerification } from '../FaceDetection/FaceDetection';
import { useNavigate } from 'react-router-dom';

type ManualKYCStep = 'welcome' | 'face-verification' | 'form' | 'complete';

export const ManualKYC: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<ManualKYCStep>('welcome');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formPrefillData, setFormPrefillData] = useState<any>({});
  const [showFormTrigger, setShowFormTrigger] = useState(false);
  const navigate = useNavigate();

  const handleFaceVerificationComplete = (success: boolean, data?: any) => {
    if (success) {
      setExtractedData(data);
      // Only show success message, form will be shown automatically when data is ready
      console.log("✅ Face verification completed successfully");
    }
  };

  // NEW: Handle form prefill data and automatically show form
  const handlePrefillData = (prefillData: any) => {
    console.log("📝 Received prefill data:", prefillData);
    setFormPrefillData(prefillData);
    
    // Auto-show form when we have valid data
    if (prefillData && (prefillData.name?.length > 0 || prefillData.aadhaarNumber || prefillData.dateOfBirth)) {
      console.log("🚀 Auto-showing form with extracted data");
      setCurrentStep('form');
    }
  };

  // NEW: Manual trigger to show form
  const handleShowForm = () => {
    setCurrentStep('form');
  };

  const CompleteScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">KYC Complete!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for completing the KYC verification process. 
          Your application is being reviewed and you'll be notified once it's processed.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center mx-auto"
        >
          <Home className="h-4 w-4 mr-2" />
          Go to Dashboard
        </button>
      </div>
    </div>
  );

  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="h-10 w-10 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Complete KYC Verification
          </h1>
          <p className="text-gray-600 mb-8 text-lg">
            Verify your identity and extract contact information from business cards or documents
          </p>
          
          <div className="space-y-6 mb-8">
            <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Camera className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Document + Face Verification</h3>
                <p className="text-gray-600 text-sm">Upload document + Face verification + Automatic data extraction</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-lg">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Auto-filled Form</h3>
                <p className="text-gray-600 text-sm">Your details will be automatically filled from the document</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-lg">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Smart Data Extraction</h3>
                <p className="text-gray-600 text-sm">Extracts names, companies, emails, phones, and more from any document</p>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </button>
            <button
              onClick={() => setCurrentStep('face-verification')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
            >
              Start Verification
              <Camera className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const FaceVerificationStep = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => setCurrentStep('welcome')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Identity Verification
          </h1>
          <p className="text-gray-600">
            Upload your document/business card and verify your face. We'll automatically extract your details.
          </p>
        </div>

        {/* Show data extraction status */}
        {Object.keys(formPrefillData).length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">Data extracted successfully!</span>
              </div>
              <button
                onClick={handleShowForm}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Continue to Form
              </button>
            </div>
            <div className="mt-2 text-sm text-green-600">
              Form has been prefilled with your extracted information.
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-6">
          <FaceVerification 
            onVerified={handleFaceVerificationComplete}
            onDataExtracted={() => {}} // Keep for compatibility
            prefillData={handlePrefillData}
          />
        </div>

        {/* Manual form navigation */}
        <div className="mt-6 text-center">
          <button
            onClick={handleShowForm}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Skip to Form
          </button>
        </div>
      </div>
    </div>
  );

  const FormStep = () => (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={() => setCurrentStep('face-verification')}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Verification
        </button>
        
        {/* Show prefill status */}
        {Object.keys(formPrefillData).length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center text-green-700">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span className="font-medium">Form has been prefilled with extracted data!</span>
            </div>
            <div className="mt-2 text-sm text-green-600">
              Review and edit the information below as needed.
            </div>
          </div>
        )}

        <KYCForm 
          onComplete={() => setCurrentStep('complete')}
          prefillData={formPrefillData}
        />
      </div>
    </div>
  );

  switch (currentStep) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'face-verification':
      return <FaceVerificationStep />;
    case 'form':
      return <FormStep />;
    case 'complete':
      return <CompleteScreen />;
    default:
      return <WelcomeScreen />;
  }
};