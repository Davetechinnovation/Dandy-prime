/**
 * Global fetch interceptor that automatically adds cache-busting to API calls
 * This ensures all API requests get fresh data every 2 minutes
 */

// Store original fetch
const originalFetch = globalThis.fetch;

// Cache-busting timestamp with different intervals based on endpoint
function getCacheBusterTimestamp(url: string): number {
  // Different cache intervals based on data type
  if (url.includes('/details')) {
    // Movie details change rarely - 5 minutes is fine
    const fiveMinutesInMs = 5 * 60 * 1000;
    return Math.floor(Date.now() / fiveMinutesInMs);
  } else if (url.includes('/search') || url.includes('/hero')) {
    // Search results and hero content - 2 minutes
    const twoMinutesInMs = 2 * 60 * 1000;
    return Math.floor(Date.now() / twoMinutesInMs);
  } else if (url.includes('/trending') || url.includes('/popular')) {
    // Trending/popular lists change more frequently - 1 minute
    const oneMinuteInMs = 1 * 60 * 1000;
    return Math.floor(Date.now() / oneMinuteInMs);
  } else {
    // Default: 2 minutes for other endpoints
    const twoMinutesInMs = 2 * 60 * 1000;
    return Math.floor(Date.now() / twoMinutesInMs);
  }
}

// Override global fetch
globalThis.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Convert input to string URL if needed
  let url: string;
  if (typeof input === 'string') {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input instanceof Request) {
    url = input.url;
  } else {
    url = String(input);
  }

  // Only add cache buster to our API routes
  if (url.includes('/api/')) {
    const separator = url.includes('?') ? '&' : '?';
    const cacheBustedUrl = `${url}${separator}v=${getCacheBusterTimestamp(url)}`;
    
    // Handle different input types
    if (typeof input === 'string') {
      input = cacheBustedUrl;
    } else if (input instanceof URL) {
      input = new URL(cacheBustedUrl);
    } else if (input instanceof Request) {
      input = new Request(cacheBustedUrl, input);
    }
  }

  // Call original fetch with modified URL
  return originalFetch.call(this, input, init);
};

export {}; // Make this a module
