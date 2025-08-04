/**
 * Generate a cache-busting timestamp that changes every 2 minutes
 * This ensures fresh API data while not overwhelming the server
 */
export function getCacheBusterTimestamp(): number {
  const twoMinutesInMs = 2 * 60 * 1000; // 2 minutes
  return Math.floor(Date.now() / twoMinutesInMs);
}

/**
 * Add cache buster parameter to API URL
 */
export function addCacheBuster(url: string): string {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${getCacheBusterTimestamp()}`;
}
