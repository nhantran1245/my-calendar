import { Platform } from 'react-native';

export const ANDROID_EMULATOR_HOST = '10.0.2.2';
export const CONTENT_TYPE_JSON = 'application/json';

const DEFAULT_API_BASE = 'http://localhost:3000/api';

export function resolveApiUrl(url: string): string {
  if (Platform.OS === 'android' && url.includes('localhost')) {
    return url.replace('localhost', ANDROID_EMULATOR_HOST);
  }
  return url;
}

export const DEFAULT_API_URL = resolveApiUrl(DEFAULT_API_BASE);
