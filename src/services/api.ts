/**
 * API service for fetching tweet data from X Tracker (Polymarket JSON API)
 */

import { API_BASE_URL, CORS_PROXY_URL, debugLog } from '@/config/constants';
import { PolymarketPost, PolymarketResponse } from '@/types';
import { queueRequest } from '@/utils/performance';

const API_TIMEOUT_MS = 30000;
const QUERY_MONTH_LOOKBACK = 2;

interface ProxyConfig {
  prefix: string;
  encode?: boolean;
  label?: string;
}

const DIRECT_PROXY: ProxyConfig = { prefix: '', label: 'direct' };
const PRIMARY_PROXY: ProxyConfig = { prefix: CORS_PROXY_URL, label: 'primary proxy' };
const FALLBACK_PROXIES: ProxyConfig[] = [
  { prefix: 'https://cors-anywhere.herokuapp.com/', label: 'cors-anywhere' },
  { prefix: 'https://api.allorigins.win/raw?url=', encode: true, label: 'allorigins' },
  { prefix: 'https://proxy.cors.sh/', label: 'cors.sh' },
];

function buildRemoteUrl(): string {
  const endpoint = `${API_BASE_URL}/users/elonmusk/posts`;
  const endDate = new Date();
  const startDate = new Date(endDate);
  startDate.setMonth(startDate.getMonth() - QUERY_MONTH_LOOKBACK);

  const url = new URL(endpoint);
  url.searchParams.set('startDate', startDate.toISOString());
  url.searchParams.set('endDate', endDate.toISOString());
  return url.toString();
}

function validateResponse(payload: PolymarketResponse): PolymarketPost[] {
  if (!payload?.success) {
    throw new Error('API request was not successful');
  }

  if (!Array.isArray(payload.data)) {
    throw new Error('Invalid data format received from API');
  }

  return payload.data;
}

function buildRequestUrl(remoteUrl: string, proxy: ProxyConfig): string {
  if (!proxy.prefix) {
    return remoteUrl;
  }

  const encodedUrl = proxy.encode ? encodeURIComponent(remoteUrl) : remoteUrl;
  return `${proxy.prefix}${encodedUrl}`;
}

async function fetchWithProxies(proxies: ProxyConfig[]): Promise<PolymarketPost[]> {
  const remoteUrl = buildRemoteUrl();
  let lastError: Error | null = null;

  for (const proxy of proxies) {
    const requestUrl = buildRequestUrl(remoteUrl, proxy);
    const proxyLabel = proxy.label ?? (proxy.prefix || 'direct');

    try {
      debugLog(`Attempting fetch via ${proxyLabel}: ${requestUrl}`);

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(API_TIMEOUT_MS),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const json = (await response.json()) as PolymarketResponse;
      const posts = validateResponse(json);
      debugLog(`Successfully fetched ${posts.length} posts via ${proxyLabel}`);
      return posts;
    } catch (error) {
      debugLog(`Failed to fetch via ${proxyLabel}`, error);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          lastError = new Error('Request timed out. Please try again.');
        } else {
          lastError = error;
        }
      } else {
        lastError = new Error('Unknown error occurred during fetch');
      }
    }
  }

  throw lastError ?? new Error('All CORS proxies failed');
}

/**
 * API Module - Handles all API interactions
 */
export const API = {
  /**
   * Fetch tweet data from Polymarket JSON API
   * @returns Array of Polymarket posts
   */
  async fetchTweetData(): Promise<PolymarketPost[]> {
    return queueRequest('tweet-data', async () => {
      debugLog('Fetching tweet data from Polymarket API with CORS proxies...');
      return fetchWithProxies([DIRECT_PROXY, PRIMARY_PROXY]);
    });
  },
};

/**
 * Fallback fetcher for backward compatibility
 */
export async function fetchWithFallback(): Promise<PolymarketPost[]> {
  debugLog('Fallback fetch: trying additional CORS proxies...');
  return fetchWithProxies([PRIMARY_PROXY, ...FALLBACK_PROXIES]);
}

/**
 * Construct direct download URL (GET with query params)
 */
export function getDirectDownloadUrl(): string {
  return buildRemoteUrl();
}

// Export main fetch function for backward compatibility
export const fetchTweetData = API.fetchTweetData.bind(API);
