import axios from 'axios';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';

const TOKEN_KEY = 'accessToken';
const VISITOR_KEY = 'visitorId';
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

let visitorId: string | null = null;

async function getVisitorId(): Promise<string> {
  if (visitorId) return visitorId;
  const stored = await SecureStore.getItemAsync(VISITOR_KEY);
  if (stored) {
    visitorId = stored;
    return stored;
  }
  const uuid = await Crypto.randomUUID();
  await SecureStore.setItemAsync(VISITOR_KEY, uuid);
  visitorId = uuid;
  return uuid;
}

const client = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const vid = await getVisitorId();
  config.headers['x-visitor-id'] = vid;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      router.replace('/(auth)/login');
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  if (url.startsWith('/uploads')) return `${API_URL.replace('/api/v1', '')}${url}`;
  return url;
};

// ── Tracking helpers (fire-and-forget) ──

export type TrackEventType =
  | 'product_click'
  | 'add_to_cart'
  | 'remove_from_cart'
  | 'checkout_start'
  | 'checkout_complete';

export function trackSearch(query: string, resultsCount?: number) {
  client.post('/suggestions/track-search', { query, resultsCount }).catch(() => {});
}

export function trackView(productId: string) {
  client.post('/suggestions/track-view', { productId }).catch(() => {});
}

export function trackEvent(eventType: TrackEventType, productId?: string, metadata?: Record<string, any>) {
  client.post('/suggestions/track-event', { eventType, productId, metadata }).catch(() => {});
}

export default client;
