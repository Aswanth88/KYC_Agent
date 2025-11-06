// components/KYCAgent/SmartKYCFlow.tsx
import React, { useState } from 'react';
import { Bot, FileText, MessageSquare, User, ArrowRight } from 'lucide-react';
import { KYCAgent } from './KYCAgent';
import { KYCForm } from '../KYC/KYCForm';

type KYCView = 'welcome' | 'chat' | 'form' | 'complete';

export const SmartKYCFlow: React.FC = () => {
  const [currentView, setCurrentView] = useState<KYCView>('welcome');
  const [userPreference, setUserPreference] = useState<'chat' | 'form' | null>(null);

  const WelcomeScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="md:flex">
          {/* Left Side - Chat Option */}
          <div 
            className={`p-8 md:p-12 cursor-pointer transition-all duration-300 ${
              userPreference === 'chat' ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50'
            }`}
            onClick={() => setUserPreference('chat')}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bot className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Guided Chat Experience</h3>
              <p className="text-gray-600 mb-6">
                Let our AI assistant guide you through the verification process step by step. 
                Perfect if you prefer a conversational approach.
              </p>
              <ul className="text-left text-gray-600 space-y-2 mb-8">
                <li className="flex items-center">
                  <MessageSquare className="h-4 w-4 text-green-500 mr-2" />
                  Interactive step-by-step guidance
                </li>
                <li className="flex items-center">
                  <User className="h-4 w-4 text-green-500 mr-2" />
                  Real-time document verification
                </li>
                <li className="flex items-center">
                  <Bot className="h-4 w-4 text-green-500 mr-2" />
                  Instant feedback and support
                </li>
              </ul>
            </div>
          </div>

          {/* Right Side - Form Option */}
          <div 
            className={`p-8 md:p-12 cursor-pointer transition-all duration-300 ${
              userPreference === 'form' ? 'bg-blue-50 border-2 border-blue-500' : 'hover:bg-gray-50'
            }`}
            onClick={() => setUserPreference('form')}
          >
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Traditional Form</h3>
              <p className="text-gray-600 mb-6">
                Prefer to fill out everything at once? Use our comprehensive form for 
                complete control over your information.
              </p>
              <ul className="text-left text-gray-600 space-y-2 mb-8">
                <li className="flex items-center">
                  <FileText className="h-4 w-4 text-green-500 mr-2" />
                  Complete all sections at your own pace
                </li>
                <li className="flex items-center">
                  <User className="h-4 w-4 text-green-500 mr-2" />
                  Detailed information submission
                </li>
                <li className="flex items-center">
                  <ArrowRight className="h-4 w-4 text-green-500 mr-2" />
                  Quick navigation between sections
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-center">
            <button
              onClick={() => userPreference && setCurrentView(userPreference)}
              disabled={!userPreference}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Continue with {userPreference === 'chat' ? 'Chat' : 'Form'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (currentView === 'welcome') {
    return <WelcomeScreen />;
  }

  if (currentView === 'chat') {
    return <KYCAgent onComplete={() => setCurrentView('complete')} />;
  }

  if (currentView === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              KYC Verification Form
            </h1>
            <p className="text-gray-600">
              Complete your identity verification using our comprehensive form
            </p>
          </div>
          <KYCForm />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Bot className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Verification Complete!</h2>
        <p className="text-gray-600 mb-6">
          Thank you for completing the KYC verification process. Your application is being reviewed.
        </p>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};