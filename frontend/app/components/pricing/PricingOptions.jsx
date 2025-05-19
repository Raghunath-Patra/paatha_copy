// frontend/app/components/pricing/PricingOptions.jsx
import React, { useState } from 'react';
import Link from 'next/link';

const PricingOptions = ({ onSelectPlan }) => {
  const [selectedDuration, setSelectedDuration] = useState('monthly');

  const handleDurationChange = (duration) => {
    setSelectedDuration(duration);
  };

  const handleGetStarted = () => {
    onSelectPlan(selectedDuration);
  };

  return (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-6 border border-gray-200">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Premium Access</h2>
        <p className="text-gray-600">Unlock more daily questions and enhance your learning</p>
      </div>

      {/* Pricing Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg inline-flex">
          <button
            className={`px-4 py-2 rounded-md ${selectedDuration === 'monthly' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => handleDurationChange('monthly')}
          >
            Monthly
          </button>
          <button
            className={`px-4 py-2 rounded-md ${selectedDuration === 'six_month' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => handleDurationChange('six_month')}
          >
            6 Months
          </button>
          <button
            className={`px-4 py-2 rounded-md ${selectedDuration === 'yearly' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-200'}`}
            onClick={() => handleDurationChange('yearly')}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Price Display */}
      <div className="text-center mb-6">
        {selectedDuration === 'monthly' && (
          <div>
            <span className="text-4xl font-bold">₹299</span>
            <span className="text-gray-600">/month</span>
            <p className="text-sm text-gray-500">+ GST (if applicable)</p>
          </div>
        )}
        {selectedDuration === 'six_month' && (
          <div>
            <span className="text-4xl font-bold">₹1,599</span>
            <span className="text-gray-600">/6 months</span>
            <p className="text-sm text-gray-500">+ GST (if applicable)</p>
            <p className="text-sm text-green-600 font-medium">Save 10.9% compared to monthly plan</p>
          </div>
        )}
        {selectedDuration === 'yearly' && (
          <div>
            <span className="text-4xl font-bold">₹2,999</span>
            <span className="text-gray-600">/year</span>
            <p className="text-sm text-gray-500">+ GST (if applicable)</p>
            <p className="text-sm text-green-600 font-medium">Save 16.4% compared to monthly plan</p>
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="space-y-4 max-w-lg mx-auto mb-8">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p className="font-semibold">More than 10 times daily usage limit</p>
            <p className="text-gray-600 text-sm">compared to free version</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p className="font-semibold">Engages student for 1-2 hours daily</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p className="font-semibold">Extended chat usage limits</p>
            <p className="text-gray-600 text-sm">per question</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p className="font-semibold">About 30-50 questions per day</p>
            <p className="text-gray-600 text-sm">depending on question usage</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p className="font-semibold">Detailed performance analytics</p>
          </div>
        </div>
        
        <div className="flex items-start">
          <svg className="w-5 h-5 text-green-500 mt-1 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <div>
            <p className="font-semibold">Priority support</p>
          </div>
        </div>
      </div>

      {/* Get Started Button */}
      <div className="text-center">
        <button
          onClick={handleGetStarted}
          className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Get Started
        </button>
        
        <p className="text-xs text-gray-500 mt-4">
          By upgrading, you agree to our {' '}
          <Link href="/terms" className="text-blue-600 hover:underline">Terms & Conditions</Link>
          {' '} and {' '}
          <Link href="/refund" className="text-blue-600 hover:underline">Refund Policy</Link>.
        </p>
      </div>
    </div>
  );
};

export default PricingOptions;