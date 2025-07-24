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

// Skeleton loading components
const BalanceSkeleton = () => (
  <div className="max-w-4xl mx-auto mb-8">
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-32 mb-2"></div>
          <div className="h-9 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-40 mb-2"></div>
          <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-28"></div>
        </div>
        <div className="text-right">
          <div className="w-16 h-16 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
);

const PackageSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm p-6 border">
    <div className="text-center">
      <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-24 mx-auto mb-2"></div>
      <div className="h-9 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-16 mx-auto mb-1"></div>
      <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-12 mx-auto mb-4"></div>
      <div className="h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-20 mx-auto mb-1"></div>
      <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-24 mx-auto mb-6"></div>
      <div className="h-10 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-full"></div>
    </div>
  </div>
);

export default function VideoCreditsPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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
      } finally {
        setInitialLoading(false);
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
          color: '#6366F1'
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
    <>
      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="container-fluid px-8 py-6">
          <div className="max-w-[1600px] mx-auto w-full">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center space-x-4">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span>Back</span>
                </button>
                <h1 className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Video Credits
                </h1>
              </div>
              <Navigation />
            </div>

            {/* Current Balance */}
            {initialLoading ? (
              <BalanceSkeleton />
            ) : userBalance ? (
              <div className="max-w-4xl mx-auto mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-purple-50/50"></div>
                  <div className="relative flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-medium text-gray-800 mb-2">Current Balance</h2>
                      <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {formatNumber(userBalance.available_credits)} Credits
                      </div>
                      {userBalance.current_package && (
                        <p className="text-gray-600 mt-1">
                          {userBalance.current_package.name} Package
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Credit Packages */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">Buy More Credits</h2>
              
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6 flex items-center space-x-2">
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {initialLoading ? (
                  // Show skeleton loading
                  Array.from({ length: 3 }).map((_, i) => (
                    <PackageSkeleton key={i} />
                  ))
                ) : (
                  packages.filter(pkg => pkg.price > 0).map((pkg) => (
                    <div key={pkg.id} className="bg-white rounded-xl shadow-sm border border-indigo-100 p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-300 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="text-center relative">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">{pkg.name}</h3>
                        <div className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                          {formatNumber(pkg.credits)}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">Credits</p>
                        
                        <div className="text-2xl font-bold text-gray-800 mb-1">
                          {formatPrice(pkg.price)}
                        </div>
                        <p className="text-gray-500 text-sm mb-6">
                          ₹{pkg.price_per_credit.toFixed(4)} per credit
                        </p>

                        <button
                          onClick={() => handlePurchase(pkg)}
                          disabled={loading && selectedPackage?.id === pkg.id}
                          className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                        >
                          {loading && selectedPackage?.id === pkg.id ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              <span>Processing...</span>
                            </div>
                          ) : (
                            'Buy Now'
                          )}
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {!scriptLoaded && !initialLoading && (
                <div className="text-center text-gray-500 mt-6 flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Loading payment gateway...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}