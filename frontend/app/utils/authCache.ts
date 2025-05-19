const CACHED_PROFILE_KEY = 'cached_profile';
const CACHE_VERSION = '1.0';  // Increment this when cache structure changes

interface CacheData {
  version: string;
  timestamp: number;
  profile: any;
}

export const setCachedProfile = (profile: any) => {
  try {
    const cacheData: CacheData = {
      version: CACHE_VERSION,
      timestamp: Date.now(),
      profile
    };
    localStorage.setItem(CACHED_PROFILE_KEY, JSON.stringify(cacheData));
  } catch (err) {
    console.error('Error caching profile:', err);
  }
};

export const getCachedProfile = () => {
  try {
    const cached = localStorage.getItem(CACHED_PROFILE_KEY);
    if (!cached) return null;

    const cacheData: CacheData = JSON.parse(cached);
    
    // Clear cache if version mismatch or cache is too old (24 hours)
    if (cacheData.version !== CACHE_VERSION || 
        Date.now() - cacheData.timestamp > 24 * 60 * 60 * 1000) {
      clearCachedProfile();
      return null;
    }

    return cacheData.profile;
  } catch (err) {
    console.error('Error reading cached profile:', err);
    clearCachedProfile();
    return null;
  }
};

export const clearCachedProfile = () => {
  try {
    localStorage.removeItem(CACHED_PROFILE_KEY);
  } catch (err) {
    console.error('Error clearing cached profile:', err);
  }
};