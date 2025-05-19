// frontend/app/partner-stats/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '../contexts/SupabaseAuthContext';
import Navigation from '../components/navigation/Navigation';
import { getAuthHeaders } from '../utils/auth';

interface Redemption {
  id: string;
  subscriber_email: string;
  subscription_amount: number;
  subscription_type: string;
  commission_amount: number;
  is_paid: boolean;
  created_at: string;
}

interface PartnerStats {
  promo_code: string;
  total_redemptions: number;
  total_commission: number;
  paid_commission: number;
  unpaid_commission: number;
  redemptions: Redemption[];
}

export default function PartnerStatsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<PartnerStats | null>(null);
  const router = useRouter();
  const { profile } = useSupabaseAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);

        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${API_URL}/api/promo-code/partner/stats`, { headers });

        if (response.status === 403) {
          setError("You don't have access to this page. Contact admin if you should be a marketing partner.");
          setLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to load partner statistics');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching partner stats:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [API_URL, router]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container-fluid px-8 py-6">
        <div className="max-w-[1600px] mx-auto w-full">
          <div className="flex justify-between mb-8">
            <h1 className="text-2xl font-medium">Marketing Partner Dashboard</h1>
            <Navigation />
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg">
              {error}
            </div>
          ) : stats ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="text-sm text-blue-600 font-medium mb-1">Your Promo Code</div>
                    <div className="text-2xl font-bold">{stats.promo_code}</div>
                    <div className="text-xs text-blue-500 mt-1">Share this with potential subscribers</div>
                  </div>
                  
                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="text-sm text-green-600 font-medium mb-1">Total Commissions</div>
                    <div className="text-2xl font-bold">{formatAmount(stats.total_commission)}</div>
                    <div className="text-xs text-green-500 mt-1">{stats.total_redemptions} successful conversions</div>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="text-sm text-purple-600 font-medium mb-1">Paid Commissions</div>
                    <div className="text-2xl font-bold">{formatAmount(stats.paid_commission)}</div>
                    <div className="text-xs text-purple-500 mt-1">Already received</div>
                  </div>
                  
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="text-sm text-yellow-600 font-medium mb-1">Pending Payment</div>
                    <div className="text-2xl font-bold">{formatAmount(stats.unpaid_commission)}</div>
                    <div className="text-xs text-yellow-500 mt-1">Will be paid soon</div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium mb-4">Commission Details</h2>
                  
                  {stats.redemptions.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      No conversions yet. Share your promo code to start earning!
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Plan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Commission
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {stats.redemptions.map((redemption) => (
                            <tr key={redemption.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatDate(redemption.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {redemption.subscriber_email.split('@')[0]}***@***
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {redemption.subscription_type === 'monthly' ? 'Monthly' : 
                                 redemption.subscription_type === 'six_month' ? '6 Months' : 'Yearly'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatAmount(redemption.subscription_amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {formatAmount(redemption.commission_amount)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <span className={`px-2 py-1 text-xs rounded-full ${redemption.is_paid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                  {redemption.is_paid ? 'Paid' : 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-medium mb-4">How to Promote</h2>
                <div className="space-y-4">
                  <div className="border-l-4 border-blue-500 pl-4 py-2">
                    <h3 className="font-medium">Share Your Promo Code</h3>
                    <p className="text-gray-600">
                      Your unique promo code is <span className="font-bold">{stats.promo_code}</span>. 
                      Share it with potential subscribers who will get 1000 extra tokens daily when they subscribe.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-green-500 pl-4 py-2">
                    <h3 className="font-medium">Earn Commissions</h3>
                    <p className="text-gray-600">
                      You earn 5% commission on every subscription made using your promo code.
                      For example, a yearly subscription of ₹2,999 earns you ₹149.95.
                    </p>
                  </div>
                  
                  <div className="border-l-4 border-purple-500 pl-4 py-2">
                    <h3 className="font-medium">Track Performance</h3>
                    <p className="text-gray-600">
                      Monitor your earnings and conversions on this dashboard. Commissions are paid monthly.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}