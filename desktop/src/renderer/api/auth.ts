import { apiClient } from './client';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  created_at: string;
}

export const authApi = {
  login: (usernameOrEmail: string, password: string) =>
    apiClient
      .post<AuthResponse>('/auth/login', { username_or_email: usernameOrEmail, password })
      .then((r) => r.data),

  register: (username: string, email: string, password: string) =>
    apiClient
      .post<AuthResponse>('/auth/register', { username, email, password })
      .then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post('/auth/logout', { refresh_token: refreshToken }),

  logoutAll: () =>
    apiClient.post('/auth/logout-all'),

  refresh: (refreshToken: string) =>
    apiClient
      .post<AuthResponse>('/auth/refresh', { refresh_token: refreshToken })
      .then((r) => r.data),

  me: () =>
    apiClient.get<UserProfile>('/users/me').then((r) => r.data),
};
