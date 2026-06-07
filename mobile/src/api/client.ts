import axios from 'axios';
import { CONTENT_TYPE_JSON, DEFAULT_API_URL, resolveApiUrl } from '../constants/api.constants';

const API_URL = resolveApiUrl(process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL);

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': CONTENT_TYPE_JSON },
});
