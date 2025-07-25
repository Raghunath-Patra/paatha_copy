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
  <div className="w-full max-w-7xl mx-auto mb-6 sm:mb-8 lg:mb-10 px-4 sm:px-6 lg:px-8">
    <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
        <div className="flex-1 w-full sm:w-auto">
          <div className="h-5 sm:h-6 lg:h-7 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-32 sm:w-40 lg:w-48 mb-2 sm:mb-3"></div>
          <div className="h-7 sm:h-8 lg:h-10 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-36 sm:w-44 lg:w-52 mb-2 sm:mb-3"></div>
          <div className="h-3 sm:h-4 lg:h-5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-24 sm:w-28 lg:w-32"></div>
        </div>
        <div className="flex-shrink-0">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
);

const PackageSkeleton = () => (
  <div className="bg-white rounded-lg sm:rounded-xl shadow-sm p-4 sm:p-6 lg:p-8 border">
    <div className="text-center">
      <div className="h-5 sm:h-6 lg:h-7 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-20 sm:w-24 lg:w-28 mx-auto mb-2 sm:mb-3"></div>
      <div className="h-7 sm:h-8 lg:h-10 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-12 sm:w-16 lg:w-20 mx-auto mb-1 sm:mb-2"></div>
      <div className="h-3 sm:h-4 lg:h-5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-10 sm:w-12 lg:w-14 mx-auto mb-3 sm:mb-4 lg:mb-6"></div>
      <div className="h-6 sm:h-7 lg:h-8 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-16 sm:w-20 lg:w-24 mx-auto mb-1 sm:mb-2"></div>
      <div className="h-3 sm:h-4 lg:h-5 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-20 sm:w-24 lg:w-28 mx-auto mb-4 sm:mb-6 lg:mb-8"></div>
      <div className="h-8 sm:h-10 lg:h-12 bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 bg-[length:200%_100%] animate-[shimmer_2s_infinite] rounded w-full"></div>
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
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200/50">
          <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="flex justify-between items-center py-4 lg:py-6">
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button 
                  onClick={() => router.back()}
                  className="flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 text-sm sm:text-base text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all duration-200"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="hidden sm:inline">Back</span>
                </button>
                <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Video Credits
                </h1>
              </div>
              <div className="hidden lg:block">
                <Navigation />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="w-full max-w-[2000px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 lg:py-12">
          {/* Current Balance */}
          {initialLoading ? (
            <BalanceSkeleton />
          ) : userBalance ? (
            <div className="w-full max-w-7xl mx-auto mb-6 sm:mb-8 lg:mb-12">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-indigo-100 p-4 sm:p-6 lg:p-8 xl:p-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 via-transparent to-purple-50/50"></div>
                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 lg:gap-8">
                  <div className="flex-1">
                    <h2 className="text-base sm:text-lg lg:text-xl xl:text-2xl font-medium text-gray-800 mb-2 sm:mb-3">
                      Current Balance
                    </h2>
                    <div className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1 sm:mb-2">
                      {formatNumber(userBalance.available_credits)} Credits
                    </div>
                    {userBalance.current_package && (
                      <p className="text-sm sm:text-base lg:text-lg text-gray-600">
                        {userBalance.current_package.name} Package
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 xl:w-24 xl:h-24 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold text-indigo-600">₹</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Credit Packages */}
          <div className="w-full max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 lg:mb-10">
              <h2 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-semibold text-gray-800">
                Buy More Credits
              </h2>
              <div className="text-sm sm:text-base text-gray-600 bg-white px-3 sm:px-4 py-2 rounded-lg border border-gray-200">
                {packages.filter(pkg => pkg.price > 0).length} packages available
              </div>
            </div>
            
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 sm:p-5 lg:p-6 rounded-lg sm:rounded-xl mb-6 sm:mb-8 flex items-start space-x-3">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-medium mb-1">Payment Error</h3>
                  <p className="text-sm sm:text-base">{error}</p>
                </div>
              </div>
            )}

            {/* Packages Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {initialLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <PackageSkeleton key={i} />
                ))
              ) : (
                packages.filter(pkg => pkg.price > 0).map((pkg) => (
                  <div key={pkg.id} className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-indigo-100 p-4 sm:p-6 lg:p-8 hover:border-indigo-300 hover:shadow-lg transition-all duration-300 relative overflow-hidden group transform hover:scale-[1.02] active:scale-[0.98]">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/30 to-purple-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="text-center relative">
                      <div className="mb-3 sm:mb-4">
                        <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                        </div>
                        <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-800 mb-2">
                          {pkg.name}
                        </h3>
                      </div>
                      
                      <div className="mb-4 sm:mb-6">
                        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-1">
                          {formatNumber(pkg.credits)}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">Credits</p>
                        
                        <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-1">
                          {formatPrice(pkg.price)}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500">
                          ₹{pkg.price_per_credit.toFixed(4)} per credit
                        </p>
                      </div>

                      <button
                        onClick={() => handlePurchase(pkg)}
                        disabled={loading && selectedPackage?.id === pkg.id}
                        className="w-full py-2.5 sm:py-3 lg:py-4 px-4 sm:px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm sm:text-base rounded-lg sm:rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
                      >
                        {loading && selectedPackage?.id === pkg.id ? (
                          <div className="flex items-center justify-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Processing...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 3H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
                            </svg>
                            <span>Buy Now</span>
                          </div>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!scriptLoaded && !initialLoading && (
              <div className="text-center text-gray-500 mt-8 sm:mt-10 lg:mt-12 flex items-center justify-center space-x-2 bg-white p-4 sm:p-6 rounded-lg sm:rounded-xl border border-gray-200">
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm sm:text-base">Loading payment gateway...</span>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <Navigation />
        </div>
      </div>
    </>
  );
}