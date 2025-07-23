'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { getAuthHeaders } from '../../utils/auth';
import Navigation from '../../components/navigation/Navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  price_per_credit: number;
}

interface UserBalance {
  available_credits: number;
  current_package: {
    name: string;
    total_credits: number;
  } | null;
  purchased_at: string | null;
}

export default function VideoCreditsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { profile } = useSupabaseAuth();
  const razorpayScriptRef = useRef<HTMLScriptElement | null>(null);

  // Load Razorpay script
  useEffect(() => {
    if (!razorpayScriptRef.current) {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => setScriptLoaded(true);
      script.onerror = () => setError('Failed to load payment gateway');
      document.body.appendChild(script);
      razorpayScriptRef.current = script;
    }
  }, []);

  // Fetch packages and user balance
  useEffect(() => {
    const fetchData = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;

        // Fetch packages
        const packagesResponse = await fetch(`${API_URL}/api/video-credits/packages`, { headers });
        if (packagesResponse.ok) {
          const packagesData = await packagesResponse.json();
          setPackages(packagesData.packages);
        }

        // Fetch user balance
        const balanceResponse = await fetch(`${API_URL}/api/video-credits/balance`, { headers });
        if (balanceResponse.ok) {
          const balanceData = await balanceResponse.json();
          setUserBalance(balanceData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load credit information');
      }
    };

    fetchData();
  }, [API_URL]);

  const handlePurchase = async (packageItem: CreditPackage) => {
    if (!scriptLoaded || typeof window.Razorpay !== 'function') {
      setError('Payment gateway not loaded. Please refresh the page.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSelectedPackage(packageItem);

      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }

      // Create order
      const orderResponse = await fetch(`${API_URL}/api/video-credits/create-order`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ package_id: packageItem.id })
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new Error(errorData.detail || 'Failed to create order');
      }

      const orderData = await orderResponse.json();

      // Open Razorpay
      const razorpayOptions = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Paaṭha AI',
        description: `${packageItem.name} - ${packageItem.credits} credits`,
        order_id: orderData.order_id,
        handler: async function(response: any) {
          await verifyPayment({
            ...response,
            package_id: packageItem.id
          });
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
            setLoading(false);
            setSelectedPackage(null);
          }
        }
      };

      const razorpayInstance = new window.Razorpay(razorpayOptions);
      razorpayInstance.open();

    } catch (error) {
      console.error('Payment initialization error:', error);
      setError(error instanceof Error ? error.message : 'Failed to initiate payment');
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

      const response = await fetch(`${API_URL}/api/video-credits/verify`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentResponse)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Payment verification failed');
      }

      const result = await response.json();
      
      // Refresh user balance
      const balanceResponse = await fetch(`${API_URL}/api/video-credits/balance`, { headers });
      if (balanceResponse.ok) {
        const balanceData = await balanceResponse.json();
        setUserBalance(balanceData);
      }

      // Show success message or redirect
      router.push('/video-credits/success');

    } catch (error) {
      console.error('Payment verification error:', error);
      setError(error instanceof Error ? error.message : 'Payment verification failed');
    } finally {
      setLoading(false);
      setSelectedPackage(null);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-between mb-8">
            <h1 className="text-2xl font-medium">Video Credits</h1>
            <Navigation />
          </div>

          {/* Current Balance */}
          {userBalance && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-medium mb-2">Current Balance</h2>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatNumber(userBalance.available_credits)} Credits
                    </div>
                    {userBalance.current_package && (
                      <p className="text-gray-600 mt-1">
                        {userBalance.current_package.name} Package
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Credit Packages */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-xl font-medium mb-6">Buy More Credits</h2>
            
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packages.filter(pkg => pkg.price > 0).map((pkg) => (
                <div key={pkg.id} className="bg-white rounded-lg shadow-sm p-6 border hover:border-blue-300 transition-colors">
                  <div className="text-center">
                    <h3 className="text-lg font-medium mb-2">{pkg.name}</h3>
                    <div className="text-3xl font-bold text-blue-600 mb-1">
                      {formatNumber(pkg.credits)}
                    </div>
                    <p className="text-gray-600 text-sm mb-4">Credits</p>
                    
                    <div className="text-2xl font-bold mb-1">
                      {formatPrice(pkg.price)}
                    </div>
                    <p className="text-gray-500 text-sm mb-6">
                      ₹{pkg.price_per_credit.toFixed(4)} per credit
                    </p>

                    <button
                      onClick={() => handlePurchase(pkg)}
                      disabled={loading && selectedPackage?.id === pkg.id}
                      className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading && selectedPackage?.id === pkg.id ? 'Processing...' : 'Buy Now'}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {!scriptLoaded && (
              <p className="text-center text-gray-500 mt-6">
                Loading payment gateway...
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}