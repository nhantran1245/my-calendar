/**
 * users.ts — Profile-related API calls for Cadence mobile.
 *
 * Note: auth.ts also exposes a lightweight `me()` returning a partial UserProfile
 * (id, username, email, created_at only). This file is the canonical home for
 * full profile data including display_name, bio, avatar_url, and timezone.
 */

import { apiClient } from './client';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  timezone: string;
  created_at: string;
}

export interface UpdateProfileDto {
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  timezone: string;
}

export interface ChangePasswordDto {
  current_password: string;
  new_password: string;
}

export const usersApi = {
  getProfile: () =>
    apiClient.get<UserProfile>('/users/me').then((r) => r.data),

  updateProfile: (dto: UpdateProfileDto) =>
    apiClient.patch<UserProfile>('/users/me', dto).then((r) => r.data),

  changePassword: (dto: ChangePasswordDto) =>
    apiClient
      .patch<{ message: string }>('/users/me/password', dto)
      .then((r) => r.data),

  savePushToken: (pushToken: string | null) =>
    apiClient.patch<void>('/users/me/push-token', { pushToken }).then((r) => r.data),
};
