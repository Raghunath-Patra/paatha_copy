// frontend/utils/userTokenService.ts - Simplified User-Scoped Token Service

import { useState, useEffect } from 'react';

interface UserTokenStatus {
  // Raw API data
  input_limit: number;
  output_limit: number;
  input_used: number;
  output_used: number;
  input_remaining: number;
  output_remaining: number;
  limit_reached: boolean;
  questions_used_today: number;
  plan_name: string;
  display_name: string;
  
  // Computed fields
  usage_percentage: number;
  questions_remaining_estimate: number;
  can_fetch_question: boolean;
  can_submit_answer: boolean;
  warning_level: 'safe' | 'warning' | 'critical' | 'blocked';
  timestamp: number;
}

const TOKEN_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes
const TOKEN_CACHE_KEY = 'user_token_status'; // Single key for user

// Token cost estimates
const TOKEN_COSTS = {
  QUESTION_FETCH: 50,
  ANSWER_SUBMISSION: 200,
  FOLLOW_UP_CHAT: 100
};

class UserTokenService {
  private static instance: UserTokenService;
  private cachedStatus: UserTokenStatus | null = null;
  private isRunning = false;
  private updateCallbacks: Set<Function> = new Set();

  static getInstance(): UserTokenService {
    if (!UserTokenService.instance) {
      UserTokenService.instance = new UserTokenService();
    }
    return UserTokenService.instance;
  }

  constructor() {
    this.loadCache();
  }

  private loadCache(): void {
    try {
      const cached = localStorage.getItem(TOKEN_CACHE_KEY);
      if (cached) {
        this.cachedStatus = JSON.parse(cached);
        console.log('🎯 Loaded user token cache:', this.cachedStatus?.plan_name);
      }
    } catch (error) {
      console.warn('Error loading user token cache:', error);
      this.cachedStatus = null;
    }
  }

  private saveCache(): void {
    try {
      if (this.cachedStatus) {
        localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(this.cachedStatus));
      }
    } catch (error) {
      console.warn('Error saving user token cache:', error);
    }
  }

  private isCacheValid(): boolean {
    if (!this.cachedStatus) return false;
    const now = Date.now();
    return (now - this.cachedStatus.timestamp) < TOKEN_CACHE_DURATION;
  }

  // Compute smart fields from raw token data
  private computeSmartFields(rawTokenData: any): UserTokenStatus {
    const inputPercentage = (rawTokenData.input_used / rawTokenData.input_limit) * 100;
    const outputPercentage = (rawTokenData.output_used / rawTokenData.output_limit) * 100;
    const usage_percentage = Math.max(inputPercentage, outputPercentage);

    const remainingTokens = Math.min(rawTokenData.input_remaining, rawTokenData.output_remaining);
    const questions_remaining_estimate = Math.floor(remainingTokens / TOKEN_COSTS.ANSWER_SUBMISSION);

    const can_fetch_question = !rawTokenData.limit_reached && remainingTokens >= TOKEN_COSTS.QUESTION_FETCH;
    const can_submit_answer = !rawTokenData.limit_reached && remainingTokens >= TOKEN_COSTS.ANSWER_SUBMISSION;

    let warning_level: 'safe' | 'warning' | 'critical' | 'blocked' = 'safe';
    if (rawTokenData.limit_reached) {
      warning_level = 'blocked';
    } else if (usage_percentage >= 90) {
      warning_level = 'critical';
    } else if (usage_percentage >= 70) {
      warning_level = 'warning';
    }

    return {
      ...rawTokenData,
      usage_percentage,
      questions_remaining_estimate,
      can_fetch_question,
      can_submit_answer,
      warning_level,
      timestamp: Date.now()
    };
  }

  // Public method: Get user token status
  getTokenStatus(): UserTokenStatus | null {
    if (this.cachedStatus && this.isCacheValid()) {
      console.log('✅ User token status from cache:', { 
        warningLevel: this.cachedStatus.warning_level,
        questionsRemaining: this.cachedStatus.questions_remaining_estimate
      });
      return this.cachedStatus;
    }
    
    console.log('❌ User token cache miss or expired');
    return null;
  }

  // Background fetch user token status
  async fetchUserTokenStatus(): Promise<void> {
    if (this.isRunning) {
      console.log('🔄 User token fetch already running...');
      return;
    }

    // Check if we already have fresh data
    if (this.cachedStatus && this.isCacheValid()) {
      console.log('✅ User token status already fresh');
      return;
    }

    console.log('🚀 Starting background user token fetch');
    this.isRunning = true;

    try {
      const authHeaders = await this.getAuthHeaders();
      if (!authHeaders.isAuthorized) {
        console.log('❌ Not authorized for user token fetch');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
      // Fetch user question status (contains all needed token data)
      const response = await fetch(`${API_URL}/api/user/question-status`, { 
        headers: authHeaders.headers 
      });

      if (response.ok) {
        const tokenData = await response.json();
        // Compute smart fields
        this.cachedStatus = this.computeSmartFields(tokenData);
        this.saveCache();

        console.log('✅ User token fetch completed:', { 
          warningLevel: this.cachedStatus.warning_level,
          questionsRemaining: this.cachedStatus.questions_remaining_estimate,
          canFetchQuestion: this.cachedStatus.can_fetch_question,
          canSubmitAnswer: this.cachedStatus.can_submit_answer
        });

        // Notify all listeners
        this.notifyUpdateCallbacks();
        this.emitTokenStatusUpdate();
      } else {
        console.warn('❌ Failed to fetch user question status:', response.status);
      }
    } catch (error) {
      console.warn('❌ User token fetch error:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Simplified action check (no board/class needed)
  canPerformAction(action: 'fetch_question' | 'submit_answer' | 'follow_up'): {
    allowed: boolean;
    reason?: string;
    tokensNeeded?: number;
    tokensRemaining?: number;
  } {
    const status = this.getTokenStatus();
    
    if (!status) {
      return { allowed: true }; // Optimistic if no cached data
    }

    const actionCosts = {
      fetch_question: TOKEN_COSTS.QUESTION_FETCH,
      submit_answer: TOKEN_COSTS.ANSWER_SUBMISSION,
      follow_up: TOKEN_COSTS.FOLLOW_UP_CHAT
    };

    const tokensNeeded = actionCosts[action];
    const tokensRemaining = Math.min(status.input_remaining, status.output_remaining);

    if (status.limit_reached) {
      return {
        allowed: false,
        reason: "Daily usage limit reached. Please upgrade or try again tomorrow.",
        tokensNeeded,
        tokensRemaining
      };
    }

    if (tokensRemaining < tokensNeeded) {
      return {
        allowed: false,
        reason: `Insufficient tokens remaining. Need ${tokensNeeded}, have ${tokensRemaining}.`,
        tokensNeeded,
        tokensRemaining
      };
    }

    return { allowed: true, tokensNeeded, tokensRemaining };
  }

  // Update token usage after action
  updateTokenUsage(tokensUsed: { input?: number; output?: number; questionSubmitted?: boolean }): void {
    if (this.cachedStatus && this.isCacheValid()) {
      // Update usage counters
      if (tokensUsed.input) {
        this.cachedStatus.input_used += tokensUsed.input;
        this.cachedStatus.input_remaining = Math.max(0, this.cachedStatus.input_remaining - tokensUsed.input);
      }
      if (tokensUsed.output) {
        this.cachedStatus.output_used += tokensUsed.output;
        this.cachedStatus.output_remaining = Math.max(0, this.cachedStatus.output_remaining - tokensUsed.output);
      }

      // Update question count when a question is submitted
      if (tokensUsed.questionSubmitted) {
        this.cachedStatus.questions_used_today += 1;
        console.log('📈 Question count incremented to:', this.cachedStatus.questions_used_today);
      }

      // Recompute smart fields
      this.cachedStatus = this.computeSmartFields(this.cachedStatus);
      this.saveCache();

      console.log('🔄 User token usage updated:', {
        tokens: tokensUsed,
        questionsToday: this.cachedStatus.questions_used_today
      });
      this.notifyUpdateCallbacks();

      // BACKGROUND SYNC: Sync with backend database after a short delay
      this.scheduleBackgroundSync();
    }
  }

  // Background sync to keep cache consistent with database
  private syncScheduled = false;
  private scheduleBackgroundSync(): void {
    // Only schedule sync if a meaningful action occurred (not just page refresh)
    if (this.syncScheduled) return;
    
    this.syncScheduled = true;
    console.log('📅 Background sync scheduled for 2 seconds...');
    
    // Sync after 2 seconds to batch multiple updates
    setTimeout(() => {
      this.syncWithBackend();
      this.syncScheduled = false;
    }, 2000);
  }

  private async syncWithBackend(): Promise<void> {
    try {
      console.log('🔄 Background sync: Refreshing token status from backend...');
      
      const authHeaders = await this.getAuthHeaders();
      if (!authHeaders.isAuthorized) return;

      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/user/question-status`, { 
        headers: authHeaders.headers 
      });

      if (response.ok) {
        const serverTokenData = await response.json();
        
        // Check if server data differs significantly from cache
        if (this.cachedStatus) {
          const cacheDrift = Math.abs(
            this.cachedStatus.questions_used_today - serverTokenData.questions_used_today
          );
          
          if (cacheDrift > 0) {
            console.log('🔄 Cache drift detected, syncing with backend:', {
              cached: this.cachedStatus.questions_used_today,
              server: serverTokenData.questions_used_today,
              drift: cacheDrift
            });
          } else {
            console.log('✅ Cache is in sync with backend, no updates needed');
          }
        }

        // IMPORTANT: Only update cache with server data, don't trigger callbacks for background sync
        // This prevents UI updates from background sync unless there's actual drift
        const oldStatus = this.cachedStatus;
        this.cachedStatus = this.computeSmartFields(serverTokenData);
        this.saveCache();
        
        // Only notify listeners if there's meaningful change
        if (!oldStatus || 
            oldStatus.questions_used_today !== this.cachedStatus.questions_used_today ||
            oldStatus.limit_reached !== this.cachedStatus.limit_reached) {
          console.log('📢 Notifying UI of meaningful changes');
          this.notifyUpdateCallbacks();
        }
        
        console.log('✅ Background sync completed');
      }
    } catch (error) {
      console.warn('❌ Background sync failed (non-critical):', error);
    }
  }

  // Register callback for token updates
  onTokenUpdate(callback: Function): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  private notifyUpdateCallbacks(): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(this.cachedStatus);
      } catch (error) {
        console.error('Error in token update callback:', error);
      }
    });
  }

  private emitTokenStatusUpdate(): void {
    const event = new CustomEvent('userTokenUpdate', {
      detail: { status: this.cachedStatus }
    });
    window.dispatchEvent(event);
  }

  private async getAuthHeaders(): Promise<{ headers: HeadersInit; isAuthorized: boolean }> {
    try {
      const { getAuthHeaders } = await import('./auth');
      return await getAuthHeaders();
    } catch (error) {
      console.error('Error getting auth headers:', error);
      return { headers: {}, isAuthorized: false };
    }
  }

  clearCache(): void {
    this.cachedStatus = null;
    localStorage.removeItem(TOKEN_CACHE_KEY);
    console.log('🗑️ User token cache cleared');
  }

  // Force immediate sync with backend (useful for testing or critical moments)
  async forceSyncWithBackend(): Promise<boolean> {
    try {
      await this.syncWithBackend();
      return true;
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      return false;
    }
  }

  getCacheStats() {
    return {
      hasCachedData: !!this.cachedStatus,
      isValid: this.isCacheValid(),
      warningLevel: this.cachedStatus?.warning_level || 'unknown',
      questionsRemaining: this.cachedStatus?.questions_remaining_estimate || 0,
      questionsUsedToday: this.cachedStatus?.questions_used_today || 0,
      syncScheduled: this.syncScheduled,
      lastUpdated: this.cachedStatus?.timestamp ? new Date(this.cachedStatus.timestamp).toISOString() : 'never'
    };
  }
}

export const userTokenService = UserTokenService.getInstance();

// Convenience hook for React components
export const useUserTokenStatus = () => {
  const [status, setStatus] = useState<UserTokenStatus | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Get initial cached status
    const cachedStatus = userTokenService.getTokenStatus();
    setStatus(cachedStatus);

    // Subscribe to updates
    const unsubscribe = userTokenService.onTokenUpdate((newStatus: UserTokenStatus) => {
      setStatus(newStatus);
      setIsRefreshing(false);
    });

    // Trigger background refresh if no cached data
    if (!cachedStatus) {
      setIsRefreshing(true);
      userTokenService.fetchUserTokenStatus();
    }

    return unsubscribe;
  }, []);

  return { status, isRefreshing };
};

// Debug utilities for development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).tokenService = {
    getStats: () => userTokenService.getCacheStats(),
    clearCache: () => userTokenService.clearCache(),
    forceSync: () => userTokenService.forceSyncWithBackend(),
    getStatus: () => userTokenService.getTokenStatus()
  };
  console.log('🛠️ Token service debug utilities available: window.tokenService');
}