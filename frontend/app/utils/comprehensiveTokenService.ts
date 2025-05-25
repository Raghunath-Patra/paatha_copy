// interface ComprehensiveTokenStatus {
//   // Detailed token info (same as QuestionLimitIndicator)
//   input_limit: number;
//   output_limit: number;
//   input_used: number;
//   output_used: number;
//   input_remaining: number;
//   output_remaining: number;
//   limit_reached: boolean;
//   questions_used_today: number;
//   plan_name: string;
//   display_name: string;
  
//   // Additional computed fields for smart decisions
//   usage_percentage: number;
//   questions_remaining_estimate: number;
//   can_fetch_question: boolean;
//   can_submit_answer: boolean;
//   warning_level: 'safe' | 'warning' | 'critical' | 'blocked';
//   timestamp: number;
// }

// interface TokenCache {
//   [key: string]: ComprehensiveTokenStatus;
// }

// const TOKEN_CACHE_DURATION = 3 * 60 * 1000; // 3 minutes (shorter for real-time accuracy)
// const TOKEN_CACHE_KEY = 'comprehensive_token_cache';

// // Token cost estimates (adjust based on your API costs)
// const TOKEN_COSTS = {
//   QUESTION_FETCH: 50, // Estimated tokens for fetching a question
//   ANSWER_SUBMISSION: 200, // Estimated tokens for answer grading
//   FOLLOW_UP_CHAT: 100 // Estimated tokens for follow-up questions
// };

// class ComprehensiveTokenService {
//   private static instance: ComprehensiveTokenService;
//   private isRunning = false;
//   private cache: TokenCache = {};
//   private updateCallbacks: Set<Function> = new Set();

//   static getInstance(): ComprehensiveTokenService {
//     if (!ComprehensiveTokenService.instance) {
//       ComprehensiveTokenService.instance = new ComprehensiveTokenService();
//     }
//     return ComprehensiveTokenService.instance;
//   }

//   constructor() {
//     this.loadCache();
//   }

//   private loadCache(): void {
//     try {
//       const cached = localStorage.getItem(TOKEN_CACHE_KEY);
//       if (cached) {
//         this.cache = JSON.parse(cached);
//         console.log('🎯 Loaded comprehensive token cache:', Object.keys(this.cache));
//       }
//     } catch (error) {
//       console.warn('Error loading comprehensive token cache:', error);
//       this.cache = {};
//     }
//   }

//   private saveCache(): void {
//     try {
//       localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(this.cache));
//     } catch (error) {
//       console.warn('Error saving comprehensive token cache:', error);
//     }
//   }

//   private getCacheKey(board: string, classLevel: string): string {
//     return `${board}_${classLevel}`;
//   }

//   private isCacheValid(tokenStatus: ComprehensiveTokenStatus): boolean {
//     const now = Date.now();
//     return (now - tokenStatus.timestamp) < TOKEN_CACHE_DURATION;
//   }

//   // Compute smart fields from raw token data
//   private computeSmartFields(rawTokenData: any): ComprehensiveTokenStatus {
//     const inputPercentage = (rawTokenData.input_used / rawTokenData.input_limit) * 100;
//     const outputPercentage = (rawTokenData.output_used / rawTokenData.output_limit) * 100;
//     const usage_percentage = Math.max(inputPercentage, outputPercentage);

//     // Estimate remaining questions based on available tokens
//     const remainingTokens = Math.min(rawTokenData.input_remaining, rawTokenData.output_remaining);
//     const questions_remaining_estimate = Math.floor(remainingTokens / TOKEN_COSTS.ANSWER_SUBMISSION);

//     // Smart decision making
//     const can_fetch_question = !rawTokenData.limit_reached && remainingTokens >= TOKEN_COSTS.QUESTION_FETCH;
//     const can_submit_answer = !rawTokenData.limit_reached && remainingTokens >= TOKEN_COSTS.ANSWER_SUBMISSION;

//     // Warning levels
//     let warning_level: 'safe' | 'warning' | 'critical' | 'blocked' = 'safe';
//     if (rawTokenData.limit_reached) {
//       warning_level = 'blocked';
//     } else if (usage_percentage >= 90) {
//       warning_level = 'critical';
//     } else if (usage_percentage >= 70) {
//       warning_level = 'warning';
//     }

//     return {
//       ...rawTokenData,
//       usage_percentage,
//       questions_remaining_estimate,
//       can_fetch_question,
//       can_submit_answer,
//       warning_level,
//       timestamp: Date.now()
//     };
//   }

//   // Public method: Get comprehensive token status
//   getTokenStatus(board: string, classLevel: string): ComprehensiveTokenStatus | null {
//     const key = this.getCacheKey(board, classLevel);
//     const cached = this.cache[key];
    
//     if (cached && this.isCacheValid(cached)) {
//       console.log('✅ Comprehensive token status from cache:', { 
//         board, 
//         classLevel, 
//         warningLevel: cached.warning_level,
//         questionsRemaining: cached.questions_remaining_estimate
//       });
//       return cached;
//     }
    
//     console.log('❌ Comprehensive token cache miss for:', { board, classLevel });
//     return null;
//   }

//   // Background fetch with comprehensive data
//   async fetchComprehensiveTokenStatus(board: string, classLevel: string): Promise<void> {
//     if (this.isRunning) {
//       console.log('🔄 Comprehensive token fetch already running...');
//       return;
//     }

//     const key = this.getCacheKey(board, classLevel);
    
//     // Check if we already have fresh data
//     const existing = this.cache[key];
//     if (existing && this.isCacheValid(existing)) {
//       console.log('✅ Comprehensive token status already fresh for:', { board, classLevel });
//       return;
//     }

//     console.log('🚀 Starting comprehensive background token fetch for:', { board, classLevel });
//     this.isRunning = true;

//     try {
//       const authHeaders = await this.getAuthHeaders();
//       if (!authHeaders.isAuthorized) {
//         console.log('❌ Not authorized for comprehensive token fetch');
//         return;
//       }

//       const API_URL = process.env.NEXT_PUBLIC_API_URL;
      
//       // Fetch both endpoints for complete data
//       const [statusResponse, questionResponse] = await Promise.allSettled([
//         fetch(`${API_URL}/api/user/token-status`, { headers: authHeaders.headers }),//---------------------remove
//         fetch(`${API_URL}/api/user/question-status`, { headers: authHeaders.headers })
//       ]);

//       let tokenData: any = {};

//       // Merge data from both endpoints
//       if (statusResponse.status === 'fulfilled' && statusResponse.value.ok) {
//         const statusData = await statusResponse.value.json();
//         tokenData = { ...tokenData, ...statusData };
//       }

//       if (questionResponse.status === 'fulfilled' && questionResponse.value.ok) {
//         const questionData = await questionResponse.value.json();
//         tokenData = { ...tokenData, ...questionData };
//       }

//       if (Object.keys(tokenData).length > 0) {
//         // Compute smart fields
//         const comprehensiveStatus = this.computeSmartFields(tokenData);

//         // Cache the result
//         this.cache[key] = comprehensiveStatus;
//         this.saveCache();

//         console.log('✅ Comprehensive token fetch completed:', { 
//           board, 
//           classLevel, 
//           warningLevel: comprehensiveStatus.warning_level,
//           questionsRemaining: comprehensiveStatus.questions_remaining_estimate,
//           canFetchQuestion: comprehensiveStatus.can_fetch_question,
//           canSubmitAnswer: comprehensiveStatus.can_submit_answer
//         });

//         // Notify all listeners
//         this.notifyUpdateCallbacks(board, classLevel, comprehensiveStatus);
//         this.emitTokenStatusUpdate(board, classLevel, comprehensiveStatus);
//       }
//     } catch (error) {
//       console.warn('❌ Comprehensive token fetch error:', error);
//     } finally {
//       this.isRunning = false;
//     }
//   }

//   // Smart decision methods
//   canPerformAction(board: string, classLevel: string, action: 'fetch_question' | 'submit_answer' | 'follow_up'): {
//     allowed: boolean;
//     reason?: string;
//     tokensNeeded?: number;
//     tokensRemaining?: number;
//   } {
//     const status = this.getTokenStatus(board, classLevel);
    
//     if (!status) {
//       return { allowed: true }; // Allow if no cached data (optimistic)
//     }

//     const actionCosts = {
//       fetch_question: TOKEN_COSTS.QUESTION_FETCH,
//       submit_answer: TOKEN_COSTS.ANSWER_SUBMISSION,
//       follow_up: TOKEN_COSTS.FOLLOW_UP_CHAT
//     };

//     const tokensNeeded = actionCosts[action];
//     const tokensRemaining = Math.min(status.input_remaining, status.output_remaining);

//     if (status.limit_reached) {
//       return {
//         allowed: false,
//         reason: "Daily usage limit reached. Please upgrade or try again tomorrow.",
//         tokensNeeded,
//         tokensRemaining
//       };
//     }

//     if (tokensRemaining < tokensNeeded) {
//       return {
//         allowed: false,
//         reason: `Insufficient tokens remaining. Need ${tokensNeeded}, have ${tokensRemaining}.`,
//         tokensNeeded,
//         tokensRemaining
//       };
//     }

//     return { allowed: true, tokensNeeded, tokensRemaining };
//   }

//   // Register callback for token updates
//   onTokenUpdate(callback: Function): () => void {
//     this.updateCallbacks.add(callback);
//     return () => this.updateCallbacks.delete(callback);
//   }

//   private notifyUpdateCallbacks(board: string, classLevel: string, status: ComprehensiveTokenStatus): void {
//     this.updateCallbacks.forEach(callback => {
//       try {
//         callback(board, classLevel, status);
//       } catch (error) {
//         console.error('Error in token update callback:', error);
//       }
//     });
//   }

//   private emitTokenStatusUpdate(board: string, classLevel: string, status: ComprehensiveTokenStatus): void {
//     const event = new CustomEvent('comprehensiveTokenUpdate', {
//       detail: { board, classLevel, status }
//     });
//     window.dispatchEvent(event);
//   }

//   private async getAuthHeaders(): Promise<{ headers: HeadersInit; isAuthorized: boolean }> {
//     try {
//       const { getAuthHeaders } = await import('./auth');
//       return await getAuthHeaders();
//     } catch (error) {
//       console.error('Error getting auth headers for comprehensive token fetch:', error);
//       return { headers: {}, isAuthorized: false };
//     }
//   }

//   // Update token usage after action (for real-time tracking)
//   updateTokenUsage(board: string, classLevel: string, tokensUsed: { input?: number; output?: number }): void {
//     const key = this.getCacheKey(board, classLevel);
//     const cached = this.cache[key];
    
//     if (cached && this.isCacheValid(cached)) {
//       // Update usage counters
//       if (tokensUsed.input) {
//         cached.input_used += tokensUsed.input;
//         cached.input_remaining = Math.max(0, cached.input_remaining - tokensUsed.input);
//       }
//       if (tokensUsed.output) {
//         cached.output_used += tokensUsed.output;
//         cached.output_remaining = Math.max(0, cached.output_remaining - tokensUsed.output);
//       }

//       // Recompute smart fields
//       const updated = this.computeSmartFields(cached);
//       this.cache[key] = updated;
//       this.saveCache();

//       console.log('🔄 Token usage updated:', { board, classLevel, tokensUsed });
//       this.notifyUpdateCallbacks(board, classLevel, updated);
//     }
//   }

//   clearCache(): void {
//     this.cache = {};
//     localStorage.removeItem(TOKEN_CACHE_KEY);
//     console.log('🗑️ Comprehensive token cache cleared');
//   }

//   getCacheStats() {
//     const entries = Object.values(this.cache);
//     const valid = entries.filter(entry => this.isCacheValid(entry));
    
//     return {
//       totalEntries: entries.length,
//       validEntries: valid.length,
//       expiredEntries: entries.length - valid.length,
//       warningLevels: valid.reduce((acc, entry) => {
//         acc[entry.warning_level] = (acc[entry.warning_level] || 0) + 1;
//         return acc;
//       }, {} as Record<string, number>)
//     };
//   }
// }

// export const comprehensiveTokenService = ComprehensiveTokenService.getInstance();
