'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import { getAuthHeaders } from '../utils/auth';
import Link from 'next/link';
import Navigation from '../components/navigation/Navigation';

interface PricingInfo {
  monthly_price: number;
  six_month_price?: number;
  yearly_price?: number;
  daily_question_limit: number;
  monthly_question_limit: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function UpgradePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'six_month' | 'yearly'>('monthly');
  const [planInfo, setPlanInfo] = useState<PricingInfo>({
    monthly_price: 29900, // Default price in paise (₹299)
    six_month_price: 159900, // Default price in paise (₹1,599)
    yearly_price: 299900, // Default price in paise (₹2,999)
    daily_question_limit: 30,
    monthly_question_limit: 900,
    carry_forward: true
  });
  const [promoCode, setPromoCode] = useState('');
  const [promoCodeStatus, setPromoCodeStatus] = useState<{
    valid: boolean;
    message: string;
    bonus: number;
  } | null>(null);
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { profile } = useSupabaseAuth();
  const razorpayScriptRef = useRef<HTMLScriptElement | null>(null);

  // Add Razorpay script
  useEffect(() => {
    // Only load script once
    if (!razorpayScriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        console.log('Razorpay script loaded successfully');
        setScriptLoaded(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay script');
        setError('Failed to load payment gateway. Please refresh the page and try again.');
      };
      
      document.body.appendChild(script);
      razorpayScriptRef.current = script;
    }
    
    return () => {
      // Don't remove the script on unmount to prevent reloading issues
      // The script is global and can be reused
    };
  }, []);
  
  // Fetch premium plan details
  useEffect(() => {
    const fetchPlanInfo = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;
        
        const response = await fetch(`${API_URL}/api/subscriptions/plans`, { headers });
        
        if (response.ok) {
          const plans = await response.json();
          // Find premium plan
          const premiumPlan = plans.find((plan: any) => plan.name === 'premium');
          
          if (premiumPlan) {
            setPlanInfo({
              monthly_price: premiumPlan.monthly_price,
              six_month_price: premiumPlan.six_month_price,
              yearly_price: premiumPlan.yearly_price,
              daily_question_limit: premiumPlan.daily_question_limit,
              monthly_question_limit: premiumPlan.monthly_question_limit
            });
          }
        }
      } catch (error) {
        console.error('Error fetching plan info:', error);
        // Keep using default values
      }
    };
    
    fetchPlanInfo();
  }, [API_URL]);
  
  // Validate promo code
  const validatePromoCode = async () => {
    if (!promoCode.trim()) {
      setPromoCodeStatus(null);
      return;
    }
    
    try {
      setError(null);
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }
      
      const response = await fetch(`${API_URL}/api/promo-code/validate`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ promo_code: promoCode })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setPromoCodeStatus({
          valid: true,
          message: `Valid promo code! You'll receive ${data.token_bonus} extra tokens daily.`,
          bonus: data.token_bonus
        });
      } else {
        setPromoCodeStatus({
          valid: false,
          message: data.detail || 'Invalid promo code',
          bonus: 0
        });
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoCodeStatus({
        valid: false,
        message: 'Error validating promo code',
        bonus: 0
      });
    }
  };
  
  const initiatePayment = async () => {
    try {
      // Clear previous errors
      setError(null);
      setLoading(true);
      
      // Check if Razorpay script is loaded
      if (!scriptLoaded || typeof window.Razorpay !== 'function') {
        throw new Error('Payment gateway not loaded. Please refresh the page.');
      }
      
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }
      
      console.log('Creating payment order...', { plan_duration: selectedPlan });
      const response = await fetch(`${API_URL}/api/payments/create-order`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan_duration: selectedPlan,
          promo_code: promoCode.trim() || undefined  // Only include if present
        })
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Error response:', responseText);
        
        let errorMessage = 'Failed to create payment order';
        try {
          // Try to parse as JSON for structured error
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If not JSON, use text as is
          if (responseText) {
            errorMessage = responseText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Order created:', data);
      setOrderData(data);
      
      // Get plan description based on selected plan
      let planDescription = 'Premium Monthly Subscription';
      if (selectedPlan === 'six_month') {
        planDescription = 'Premium 6-Month Subscription';
      } else if (selectedPlan === 'yearly') {
        planDescription = 'Premium Annual Subscription';
      }
      
      const razorpayOptions = {
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'Paaṭha AI',
        description: planDescription,
        order_id: data.order_id,
        handler: async function(response: any) {
          // Add the plan_duration to the response for verification
          const verificationData = {
            ...response,
            plan_duration: selectedPlan
          };
          await verifyPayment(verificationData);
        },
        prefill: {
          name: profile?.full_name || '',
          email: profile?.email || '',
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal dismissed');
            setLoading(false);
          }
        }
      };
      
      console.log('Opening Razorpay...');
      const razorpayInstance = new window.Razorpay(razorpayOptions);
      razorpayInstance.open();
    } catch (error) {
      console.error('Payment initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const verifyPayment = async (paymentResponse: any) => {
    try {
      setLoading(true);
      
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }
      
      console.log('Verifying payment...', paymentResponse);
      const response = await fetch(`${API_URL}/api/payments/verify`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...paymentResponse,
          promo_code: promoCode.trim() || undefined
        })
      });
      
      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = 'Payment verification failed';
        
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          if (responseText) {
            errorMessage = responseText;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      // Use direct navigation for more reliable routing
      window.location.href = '/upgrade/success';
    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error instanceof Error ? error.message : 'Payment verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };
  
  // Format price from paise to rupees
  const formatPrice = (priceInPaise: number) => {
    const priceInRupees = priceInPaise / 100;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(priceInRupees);
  };
  
  // Get the current price based on selected plan
  const getCurrentPrice = () => {
    if (selectedPlan === 'six_month') {
      return planInfo.six_month_price || 159900;
    } else if (selectedPlan === 'yearly') {
      return planInfo.yearly_price || 299900;
    }
    return planInfo.monthly_price;
  };
  
  // Calculate savings percentage compared to monthly plan
  const getSavingsPercentage = () => {
    if (selectedPlan === 'monthly') return null;
    
    const monthlyPrice = planInfo.monthly_price;
    const currentPrice = getCurrentPrice();
    
    if (selectedPlan === 'six_month') {
      // Monthly equivalent of 6-month plan
      const monthlyEquivalent = currentPrice / 6;
      const savingsPercent = ((monthlyPrice - monthlyEquivalent) / monthlyPrice) * 100;
      return savingsPercent.toFixed(1);
    } else if (selectedPlan === 'yearly') {
      // Monthly equivalent of yearly plan
      const monthlyEquivalent = currentPrice / 12;
      const savingsPercent = ((monthlyPrice - monthlyEquivalent) / monthlyPrice) * 100;
      return savingsPercent.toFixed(1);
    }
    
    return null;
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-between mb-8">
            <h1 className="text-2xl font-medium">Upgrade to Premium</h1>
            <Navigation />
          </div>
          
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-sm p-6">
            <div className="space-y-6">
              <div className="bg-blue-50 text-blue-700 p-4 rounded-lg text-center">
                <h2 className="text-xl font-medium mb-2">Premium Access</h2>
                <p>Unlock more daily questions and enhance your learning</p>
              </div>
              
              {/* Plan Duration Selector */}
              <div>
                <div className="flex justify-center space-x-2 mb-4">
                  <button
                    onClick={() => setSelectedPlan('monthly')}
                    className={`px-4 py-2 rounded-lg ${
                      selectedPlan === 'monthly' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setSelectedPlan('six_month')}
                    className={`px-4 py-2 rounded-lg ${
                      selectedPlan === 'six_month' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    6 Months
                  </button>
                  <button
                    onClick={() => setSelectedPlan('yearly')}
                    className={`px-4 py-2 rounded-lg ${
                      selectedPlan === 'yearly' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold">
                  {formatPrice(getCurrentPrice())}
                  <span className="text-base font-normal text-gray-600">
                    {selectedPlan === 'monthly' && '/month'}
                    {selectedPlan === 'six_month' && '/6 months'}
                    {selectedPlan === 'yearly' && '/year'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">+ GST (if applicable)</p>
                
                {getSavingsPercentage() && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Save {getSavingsPercentage()}% compared to monthly plan
                  </p>
                )}
              </div>
              
              <ul className="space-y-2">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong>More than 10 times daily usage limit</strong> compared to free version
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong>Engages student for 1-2 hours daily</strong>
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong>Extended chat usage limits</strong> per question
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>
                    <strong>About 30-50 questions per day</strong> depending on question usage
                  </span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Detailed performance analytics</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Priority support</span>
                </li>
              </ul>
              
              {/* Promo Code Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Promo Code (Optional)
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="flex-1 p-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter promo code"
                  />
                  <button
                    type="button"
                    onClick={validatePromoCode}
                    className="px-4 py-2 bg-gray-200 rounded-r border-t border-r border-b hover:bg-gray-300"
                  >
                    Verify
                  </button>
                </div>
                {promoCodeStatus && (
                  <p className={`mt-1 text-sm ${promoCodeStatus.valid ? 'text-green-600' : 'text-red-600'}`}>
                    {promoCodeStatus.message}
                  </p>
                )}
              </div>
              
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm">
                  {error}
                </div>
              )}
              
              <div className="text-xs text-gray-500 text-center">
                By upgrading, you agree to our <Link href="/terms" className="text-blue-600 hover:underline">Terms & Conditions</Link>
                {' '}and{' '}
                <Link href="/refund" className="text-blue-600 hover:underline">Refund Policy</Link>
              </div>
              
              <button
                onClick={initiatePayment}
                disabled={loading || !scriptLoaded}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Upgrade Now'}
              </button>
              
              {!scriptLoaded && (
                <p className="text-sm text-gray-500 text-center">
                  Loading payment gateway...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}