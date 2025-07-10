// Create a new file: frontend/app/components/notifications/StudentNotifications.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useSupabaseAuth } from '../../contexts/SupabaseAuthContext';
import { supabase } from '../../utils/supabase';
import {
  Bell,
  X,
  Check,
  XCircle,
  Clock,
  Mail,
  Users,
  AlertCircle,
  Eye,
  Trash2,
  CheckCircle,
  RefreshCw,
  Filter,
  MoreVertical,
  School,
  Calendar,
  User
} from 'lucide-react';

interface NotificationData {
  id: string;
  type: string;
  scope: string;
  title: string;
  message: string;
  status: string;
  priority: string;
  metadata: Record<string, any>;
  created_at: string;
  expires_at?: string;
  responded_at?: string;
  course?: {
    id: string;
    course_name: string;
    course_code: string;
  };
  teacher?: {
    id: string;
    full_name: string;
    email: string;
  };
}

interface NotificationStats {
  total_count: number;
  unread_count: number;
  pending_invitations: number;
  unread_notices: number;
}

interface StudentNotificationsProps {
  isOpen: boolean;
  onClose: () => void;
  onNotificationUpdate?: () => void;
}

export default function StudentNotifications({ isOpen, onClose, onNotificationUpdate }: StudentNotificationsProps) {
  const { user } = useSupabaseAuth();
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    total_count: 0,
    unread_count: 0,
    pending_invitations: 0,
    unread_notices: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'invitations' | 'notices'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const fetchNotifications = async () => {
    if (!user || !isOpen) return;

    try {
      setLoading(true);
      setError(null);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      // Build query parameters based on filter
      const params = new URLSearchParams();
      
      switch (filter) {
        case 'pending':
          params.append('unread_only', 'true');
          break;
        case 'invitations':
          params.append('type', 'course_invitation');
          break;
        case 'notices':
          params.append('type', 'public_notice');
          break;
      }

      params.append('limit', '50');

      const response = await fetch(`${API_URL}/api/student/courses/notifications?${params}`, {
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data.notifications);
      setStats(data.stats);

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const respondToNotification = async (notificationId: string, response: 'accepted' | 'declined' | 'read') => {
    if (!user) return;

    try {
      setActionLoading(notificationId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const apiResponse = await fetch(`${API_URL}/api/student/courses/notifications/${notificationId}/respond`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ response })
      });

      const result = await apiResponse.json();

      if (!apiResponse.ok) {
        throw new Error(result.error || 'Failed to respond to notification');
      }

      // Show success message
      if (response === 'accepted') {
        alert('✅ Successfully joined the course!');
      } else if (response === 'declined') {
        alert('❌ Invitation declined');
      }

      // Refresh notifications
      fetchNotifications();
      onNotificationUpdate?.();

    } catch (err) {
      console.error('Error responding to notification:', err);
      alert(err instanceof Error ? err.message : 'Failed to respond to notification');
    } finally {
      setActionLoading(null);
    }
  };

  const dismissNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      setActionLoading(notificationId);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_URL}/api/student/courses/notifications/${notificationId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to dismiss notification');
      }

      // Refresh notifications
      fetchNotifications();
      onNotificationUpdate?.();

    } catch (err) {
      console.error('Error dismissing notification:', err);
      alert(err instanceof Error ? err.message : 'Failed to dismiss notification');
    } finally {
      setActionLoading(null);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const headers = {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      };

      const response = await fetch(`${API_URL}/api/student/courses/notifications/mark-all-read`, {
        method: 'PATCH',
        headers
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read');
      }

      // Refresh notifications
      fetchNotifications();
      onNotificationUpdate?.();

    } catch (err) {
      console.error('Error marking all as read:', err);
      alert(err instanceof Error ? err.message : 'Failed to mark all as read');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, filter]);

  const getNotificationIcon = (type: string, priority: string) => {
    switch (type) {
      case 'course_invitation':
        return <Users className="h-5 w-5 text-blue-600" />;
      case 'public_notice':
        return priority === 'high' ? <AlertCircle className="h-5 w-5 text-red-600" /> : <Bell className="h-5 w-5 text-purple-600" />;
      default:
        return <Mail className="h-5 w-5 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500 bg-red-50';
      case 'medium': return 'border-l-yellow-500 bg-yellow-50';
      case 'low': return 'border-l-green-500 bg-green-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pending</span>;
      case 'read':
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Read</span>;
      case 'accepted':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Accepted</span>;
      case 'declined':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Declined</span>;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (filter) {
      case 'pending':
        return notification.status === 'pending';
      case 'invitations':
        return notification.type === 'course_invitation';
      case 'notices':
        return notification.type === 'public_notice';
      default:
        return true;
    }
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-600">
                {stats.unread_count} unread • {stats.pending_invitations} pending invitations
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              disabled={loading}
            >
              Mark All Read
            </button>
            <button
              onClick={fetchNotifications}
              className="p-2 text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="border-b overflow-x-auto">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'all', label: 'All', count: notifications.length },
              { key: 'pending', label: 'Unread', count: stats.unread_count },
              { key: 'invitations', label: 'Invitations', count: stats.pending_invitations },
              { key: 'notices', label: 'Notices', count: stats.unread_notices }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  filter === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading && notifications.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchNotifications}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No notifications found</p>
              <p className="text-gray-400 text-sm">
                {filter === 'all' ? 'You\'re all caught up!' : 'No notifications match the current filter'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border rounded-lg p-4 ${getPriorityColor(notification.priority)} border-l-4 ${
                    notification.status === 'pending' ? 'bg-opacity-75' : 'bg-opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        {getNotificationIcon(notification.type, notification.priority)}
                        <h3 className="font-medium text-gray-900">{notification.title}</h3>
                        {getStatusBadge(notification.status)}
                      </div>
                      
                      <p className="text-gray-700 mb-3">{notification.message}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                        {notification.course && (
                          <div className="flex items-center space-x-1">
                            <School className="h-4 w-4" />
                            <span>{notification.course.course_name} ({notification.course.course_code})</span>
                          </div>
                        )}
                        {notification.teacher && (
                          <div className="flex items-center space-x-1">
                            <User className="h-4 w-4" />
                            <span>{notification.teacher.full_name}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(notification.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                    <div className="flex space-x-2">
                      {notification.type === 'course_invitation' && notification.status === 'pending' && (
                        <>
                          <button
                            onClick={() => respondToNotification(notification.id, 'accepted')}
                            disabled={actionLoading === notification.id}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 text-sm"
                          >
                            {actionLoading === notification.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
                            <span>Accept</span>
                          </button>
                          <button
                            onClick={() => respondToNotification(notification.id, 'declined')}
                            disabled={actionLoading === notification.id}
                            className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>Decline</span>
                          </button>
                        </>
                      )}
                      
                      {notification.status === 'pending' && notification.type !== 'course_invitation' && (
                        <button
                          onClick={() => respondToNotification(notification.id, 'read')}
                          disabled={actionLoading === notification.id}
                          className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
                        >
                          <Eye className="h-4 w-4" />
                          <span>Mark as Read</span>
                        </button>
                      )}
                    </div>

                    {notification.status !== 'pending' || notification.type === 'public_notice' ? (
                      <button
                        onClick={() => dismissNotification(notification.id)}
                        disabled={actionLoading === notification.id}
                        className="flex items-center space-x-1 px-2 py-1 text-gray-500 hover:text-red-600 text-sm"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Dismiss</span>
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t p-4 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}