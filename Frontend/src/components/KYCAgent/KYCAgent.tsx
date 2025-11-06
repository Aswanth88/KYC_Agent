import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Bot, User, UploadCloud, FileCheck, FileX, Loader, Check, Camera, Info, FileText, ArrowLeft, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { FaceVerification } from '../FaceDetection/FaceDetection';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Define proper types for the conversation
interface ChatMessage {
  sender: string;
  message: string | React.ReactNode;
}

const ChatBubble = ({ message, sender }: { message: string | React.ReactNode, sender: 'user' | 'agent' }) => {
    const isAgent = sender === 'agent';
    return (
        <div className={`flex items-start gap-3 ${isAgent ? 'justify-start' : 'justify-end'}`}>
            {isAgent && <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white"><Bot size={20} /></div>}
            <div className={`p-3 rounded-lg max-w-full ${isAgent ? 'bg-gray-200 text-gray-800' : 'bg-blue-500 text-white'}`}>
                {message}
            </div>
            {!isAgent && <div className="w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center text-white"><User size={20} /></div>}
        </div>
    );
};

const GuidedTip = ({ text }: { text: string }) => (
    <div className="flex items-center text-xs text-gray-500 my-2">
        <Info size={14} className="mr-2" />
        {text}
    </div>
);

// Document Upload Component (Only used in document step)
interface DocumentUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, disabled = false }) => {
  const [dragging, setDragging] = useState(false);
  
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    if (!disabled) setDragging(true); 
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { 
    e.preventDefault(); 
    setDragging(false); 
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled && e.dataTransfer.files && e.dataTransfer.files[0]) {
      onUpload(e.dataTransfer.files[0]);
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled && e.target.files && e.target.files[0]) {
      onUpload(e.target.files[0]);
    }
  };
  
  return (
    <>
      <GuidedTip text="Make sure the image is clear and all text is readable. Supported formats: JPG, PNG" />
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragging ? 'border-blue-500 bg-blue-50' : 
          disabled ? 'border-gray-200 bg-gray-100 cursor-not-allowed' : 
          'border-gray-300 hover:border-blue-400 cursor-pointer'
        }`} 
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className={`mx-auto h-12 w-12 ${disabled ? 'text-gray-400' : 'text-gray-400'}`} />
        <p className={`mt-2 text-sm ${disabled ? 'text-gray-400' : 'text-gray-600'}`}>
          {disabled ? 'Processing document...' : 'Drag & drop or '}
          {!disabled && (
            <label className="text-blue-500 cursor-pointer hover:text-blue-600">
              browse
              <input 
                type="file" 
                className="hidden" 
                onChange={handleFileChange}
                accept=".jpg,.jpeg,.png,.JPG,.JPEG,.PNG"
                disabled={disabled}
              />
            </label>
          )}
        </p>
        {!disabled && (
          <p className="text-xs text-gray-500 mt-1">Max file size: 5MB</p>
        )}
      </div>
    </>
  );
};

type ConversationStep = 'welcome' | 'document-upload' | 'document-processing' | 'face-verification' | 'verification-processing' | 'complete';

interface KYCAgentProps {
  onComplete?: () => void;
}

export const KYCAgent: React.FC<KYCAgentProps> = ({ onComplete }) => {
  const [conversation, setConversation] = useState<ChatMessage[]>([
    { 
      sender: 'agent', 
      message: 'Hi! I\'m your KYC Agent 🤖. I\'ll help you complete your verification quickly and securely.' 
    }
  ]);
  const [currentStep, setCurrentStep] = useState<ConversationStep>('welcome');
  const [extractedData, setExtractedData] = useState<any>(null);
  const [formPrefillData, setFormPrefillData] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [faceVerificationComplete, setFaceVerificationComplete] = useState(false);
  const [showFaceVerification, setShowFaceVerification] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<File | null>(null);
  const navigate = useNavigate();

  const addMessage = useCallback((sender: 'user' | 'agent', message: string | React.ReactNode) => {
    setConversation(prev => [...prev, { sender, message }]);
  }, []);

  const handleStartVerification = useCallback(() => {
    addMessage('user', 'Start Verification');
    addMessage('agent', 'Great! Let\'s begin with document verification. Please upload your ID proof (Aadhaar, PAN, or any identity document).');
    addMessage('agent', <DocumentUpload onUpload={handleDocumentUpload} />);
    setCurrentStep('document-upload');
  }, [addMessage]);

  const handleDocumentUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      addMessage('agent', <div className="flex items-center text-red-600"><FileX className="mr-2" /> Please upload an image file (JPG, PNG)</div>);
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      addMessage('agent', <div className="flex items-center text-red-600"><FileX className="mr-2" /> File size should be less than 5MB</div>);
      return;
    }

    addMessage('user', <div className="flex items-center"><FileCheck className="mr-2 text-green-500" /> {file.name}</div>);
    setUploadedDocument(file);
    setCurrentStep('document-processing');
    setIsProcessing(true);

    try {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('use_api', 'true');

    const token = localStorage.getItem('auth_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/extract-kyc-data`, {
      method: 'POST',
      body: formData,
      headers: headers,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.success) {
        setExtractedData(result.kyc_data);
        setFormPrefillData(result.kyc_data);
        addMessage('agent', '✅ Document processed successfully! I\'ve extracted your information.');
        
        // Show extracted data
        if (result.kyc_data) {
          const dataMessage = (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 mb-2">Extracted Information:</h4>
              <div className="space-y-1 text-sm text-green-700">
                {result.kyc_data.name && result.kyc_data.name.length > 0 && (
                  <div><span className="font-medium">Name:</span> {result.kyc_data.name.join(' ')}</div>
                )}
                {result.kyc_data.date_of_birth && (
                  <div><span className="font-medium">Date of Birth:</span> {result.kyc_data.date_of_birth}</div>
                )}
                {result.kyc_data.gender && (
                  <div><span className="font-medium">Gender:</span> {result.kyc_data.gender}</div>
                )}
                {result.kyc_data.aadhaar_number && (
                  <div><span className="font-medium">Aadhaar:</span> {result.kyc_data.aadhaar_number}</div>
                )}
                {result.kyc_data.mobile_number && (
                  <div><span className="font-medium">Mobile:</span> {result.kyc_data.mobile_number}</div>
                )}
              </div>
            </div>
          );
          addMessage('agent', dataMessage);
        }
        
        addMessage('agent', 'Now let\'s verify your identity with face recognition. Please use the camera below to complete face verification.');
        
        // Show face verification without document upload
        setShowFaceVerification(true);
        setCurrentStep('face-verification');
      } else {
        throw new Error(result.message || 'Failed to process document');
      }
    } else {
      throw new Error('Server error: ' + response.status);
    }
  } catch (error) {
    console.error('Document processing error:', error);
    addMessage('agent', <div className="flex items-center text-red-600"><FileX className="mr-2" /> I couldn\'t read this document clearly. Please upload a clearer image.</div>);
    addMessage('agent', <DocumentUpload onUpload={handleDocumentUpload} />);
    setCurrentStep('document-upload');
  } finally {
    setIsProcessing(false);
  }
}, [addMessage]);


  const handleFaceVerified = useCallback((success: boolean, extractedData?: any) => {
    if (success) {
      setFaceVerificationComplete(true);
      setShowFaceVerification(false);
      addMessage('user', 'Face verification successful');
      addMessage('agent', '✅ Face verification completed! Your identity has been verified.');
      setCurrentStep('verification-processing');
      
      // Final processing
      setTimeout(() => {
        addMessage('agent', 'Finalizing your verification... ⏳');
        
        setTimeout(() => {
          addMessage('agent', 
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-800">
                <Check size={20} className="mr-2" />
                <span className="font-semibold">KYC Verification Complete!</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Your identity has been successfully verified. You can now proceed to the form.
              </p>
            </div>
          );
          setCurrentStep('complete');
          
          // Auto-navigate to form after completion
          setTimeout(() => {
            if (onComplete) {
              onComplete();
            }
          }, 2000);
        }, 2000);
      }, 1000);
    } else {
      setShowFaceVerification(false);
      addMessage('user', 'Face verification failed');
      addMessage('agent', 
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center text-yellow-800">
            <Info size={20} className="mr-2" />
            <span className="font-semibold">Face Verification Required</span>
          </div>
          <p className="text-yellow-700 text-sm mt-1">
            Please try again with better lighting and make sure your face is clearly visible.
          </p>
        </div>
      );
      
      // Show retry option
      addMessage('agent', 
        <button
          onClick={() => setShowFaceVerification(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry Face Verification
        </button>
      );
    }
  }, [addMessage, onComplete]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    const chatContainer = document.querySelector('.overflow-y-auto');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [conversation, showFaceVerification]);

  const CompleteScreen = () => (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">KYC Complete!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for completing the KYC verification process. 
          Your information has been successfully verified and extracted.
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

  // Check if currentStep is 'complete' using proper type
  if (currentStep === 'complete') {
    return <CompleteScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg flex flex-col h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 bg-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Bot size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-800">KYC Verification Assistant</h1>
                <p className="text-xs text-gray-500">Secure • Fast • Automated</p>
              </div>
            </div>
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              currentStep === 'complete' ? 'bg-green-100 text-green-800' :
              currentStep === 'welcome' ? 'bg-gray-100 text-gray-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {currentStep === 'complete' ? 'Verified' :
               currentStep === 'welcome' ? 'Ready' : 'In Progress'}
            </div>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
          {conversation.map((msg, index) => (
            <ChatBubble 
              key={index} 
              message={msg.message} 
              sender={msg.sender as 'user' | 'agent'} 
            />
          ))}
          
          {/* Show FaceVerification without document upload */}
          {showFaceVerification && (
            <div className="flex justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                <Bot size={20} />
              </div>
              <div className="bg-gray-200 text-gray-800 p-3 rounded-lg max-w-full">
                {/* Custom Face Verification without document upload */}
                <div className="p-4 bg-white rounded-lg shadow-md">
                  <h3 className="text-lg font-semibold mb-4 text-center">Face Verification</h3>
                  <p className="text-sm text-gray-600 mb-4 text-center">
                    Please look into the camera for face verification and liveness detection
                  </p>
                  
                  <FaceVerification 
                    onVerified={handleFaceVerified}
                    prefillData={setFormPrefillData}
                    compact={true}
                    hideDocumentUpload={true} // This prop should hide document upload in FaceVerification
                  />
                </div>
              </div>
            </div>
          )}
          
          {isProcessing && (
            <div className="flex justify-center">
              <div className="bg-white rounded-lg p-4 shadow-md border border-gray-200">
                <div className="flex items-center space-x-3">
                  <Loader className="animate-spin text-blue-500" size={20} />
                  <span className="text-gray-600">Processing document...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Welcome Step Actions */}
        {currentStep === 'welcome' && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="flex justify-end space-x-3">
              <button 
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Learn More
              </button>
              <button 
                onClick={handleStartVerification}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center"
              >
                Start Verification
                <ArrowLeft className="ml-2 transform rotate-180" size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Document Upload Step Actions - Only show when needed */}
        {currentStep === 'document-upload' && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-3">Upload your document to continue</p>
              <DocumentUpload onUpload={handleDocumentUpload} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};