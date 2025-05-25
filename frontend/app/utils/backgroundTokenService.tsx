// interface TokenStatus {
//   limit_reached: boolean;
//   plan_name: string;
//   remaining_tokens?: number;
//   daily_limit?: number;
//   timestamp: number;
// }

// interface TokenCache {
//   [key: string]: TokenStatus;
// }

// const TOKEN_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
// const TOKEN_CACHE_KEY = 'token_status_cache';

// class BackgroundTokenService {
//   private static instance: BackgroundTokenService;
//   private isRunning = false;
//   private cache: TokenCache = {};

//   static getInstance(): BackgroundTokenService {
//     if (!BackgroundTokenService.instance) {
//       BackgroundTokenService.instance = new BackgroundTokenService();
//     }
//     return BackgroundTokenService.instance;
//   }

//   constructor() {
//     this.loadCache();
//   }

//   // Load existing cache from localStorage
//   private loadCache(): void {
//     try {
//       const cached = localStorage.getItem(TOKEN_CACHE_KEY);
//       if (cached) {
//         this.cache = JSON.parse(cached);
//         console.log('🔑 Loaded token cache:', Object.keys(this.cache));
//       }
//     } catch (error) {
//       console.warn('Error loading token cache:', error);
//       this.cache = {};
//     }
//   }

//   // Save cache to localStorage
//   private saveCache(): void {
//     try {
//       localStorage.setItem(TOKEN_CACHE_KEY, JSON.stringify(this.cache));
//     } catch (error) {
//       console.warn('Error saving token cache:', error);
//     }
//   }

//   // Generate cache key for board/class combination
//   private getCacheKey(board: string, classLevel: string): string {
//     return `${board}_${classLevel}`;
//   }

//   // Check if cached token status is still valid
//   private isCacheValid(tokenStatus: TokenStatus): boolean {
//     const now = Date.now();
//     return (now - tokenStatus.timestamp) < TOKEN_CACHE_DURATION;
//   }

//   // Get cached token status (public method for chapter pages to use)
//   getCachedTokenStatus(board: string, classLevel: string): TokenStatus | null {
//     const key = this.getCacheKey(board, classLevel);
//     const cached = this.cache[key];
    
//     if (cached && this.isCacheValid(cached)) {
//       console.log('✅ Token status from cache:', { board, classLevel, limitReached: cached.limit_reached });
//       return cached;
//     }
    
//     console.log('❌ Token cache miss or expired for:', { board, classLevel });
//     return null;
//   }

//   // Background fetch function (runs silently)
//   async fetchTokenStatusInBackground(board: string, classLevel: string): Promise<void> {
//     if (this.isRunning) {
//       console.log('🔄 Token fetch already running, skipping...');
//       return;
//     }

//     const key = this.getCacheKey(board, classLevel);
    
//     // Check if we already have fresh data
//     const existing = this.cache[key];
//     if (existing && this.isCacheValid(existing)) {
//       console.log('✅ Token status already fresh in cache for:', { board, classLevel });
//       return;
//     }

//     console.log('🚀 Starting background token fetch for:', { board, classLevel });
//     this.isRunning = true;

//     try {
//       // Simulate auth headers acquisition (you'll need to adapt this to your auth system)
//       const authHeaders = await this.getAuthHeaders();
//       if (!authHeaders.isAuthorized) {
//         console.log('❌ Not authorized for token fetch');
//         return;
//       }

//       const API_URL = process.env.NEXT_PUBLIC_API_URL;
//       const response = await fetch(`${API_URL}/api/user/token-status`, {
//         headers: authHeaders.headers
//       });

//       if (response.ok) {
//         const tokenData = await response.json();
//         const tokenStatus: TokenStatus = {
//           ...tokenData,
//           timestamp: Date.now()
//         };

//         // Cache the result
//         this.cache[key] = tokenStatus;
//         this.saveCache();

//         console.log('✅ Background token fetch completed:', { 
//           board, 
//           classLevel, 
//           limitReached: tokenStatus.limit_reached,
//           planName: tokenStatus.plan_name
//         });

//         // Emit event for any listeners (optional)
//         this.emitTokenStatusUpdate(board, classLevel, tokenStatus);
//       } else {
//         console.warn('❌ Token status fetch failed:', response.status);
//       }
//     } catch (error) {
//       console.warn('❌ Background token fetch error:', error);
//     } finally {
//       this.isRunning = false;
//     }
//   }

//   // Emit custom event for token status updates (optional)
//   private emitTokenStatusUpdate(board: string, classLevel: string, tokenStatus: TokenStatus): void {
//     const event = new CustomEvent('tokenStatusUpdated', {
//       detail: { board, classLevel, tokenStatus }
//     });
//     window.dispatchEvent(event);
//   }

//   // Auth headers method (adapt to your existing auth system)
//   private async getAuthHeaders(): Promise<{ headers: HeadersInit; isAuthorized: boolean }> {
//     try {
//       // Import your existing getAuthHeaders function
//       const { getAuthHeaders } = await import('../utils/auth');
//       return await getAuthHeaders();
//     } catch (error) {
//       console.error('Error getting auth headers for background token fetch:', error);
//       return { headers: {}, isAuthorized: false };
//     }
//   }

//   // Cleanup method
//   clearCache(): void {
//     this.cache = {};
//     localStorage.removeItem(TOKEN_CACHE_KEY);
//     console.log('🗑️ Token cache cleared');
//   }

//   // Get cache stats (for debugging)
//   getCacheStats(): { totalEntries: number; validEntries: number; expiredEntries: number } {
//     const entries = Object.values(this.cache);
//     const valid = entries.filter(entry => this.isCacheValid(entry));
//     const expired = entries.filter(entry => !this.isCacheValid(entry));
    
//     return {
//       totalEntries: entries.length,
//       validEntries: valid.length,
//       expiredEntries: expired.length
//     };
//   }
// }

// // Export singleton instance
// export const backgroundTokenService = BackgroundTokenService.getInstance();
