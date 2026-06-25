"use client";

const accessTokenKey = "access_token";
const userIdKey = "user_id";
const userDetailsKey = "admin_user";

export type AdminUser = {
  _id?: string;
  email_id?: string;
  first_name?: string;
  last_name?: string;
  profile_pic_url?: string;
  profilePicUrl?: string;
  user_access?: string[];
};

export function getAccessToken() {
  return window.sessionStorage.getItem(accessTokenKey) || "";
}

export function setAccessToken(token: string) {
  window.sessionStorage.setItem(accessTokenKey, token);
}

export function removeAccessToken() {
  window.sessionStorage.removeItem(accessTokenKey);
}

export function getUserId() {
  try {
    const rawUserId = window.sessionStorage.getItem(userIdKey);

    return rawUserId ? String(JSON.parse(rawUserId) || "") : "";
  } catch {
    return window.sessionStorage.getItem(userIdKey) || "";
  }
}

export function setUserId(userId: string) {
  window.sessionStorage.setItem(userIdKey, JSON.stringify(userId));
}

export function removeUserId() {
  window.sessionStorage.removeItem(userIdKey);
}

export function getStoredUser() {
  try {
    const rawUser = window.sessionStorage.getItem(userDetailsKey);

    return rawUser ? (JSON.parse(rawUser) as AdminUser) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AdminUser) {
  window.sessionStorage.setItem(userDetailsKey, JSON.stringify(user));
}

export function removeStoredUser() {
  window.sessionStorage.removeItem(userDetailsKey);
}

export function clearAuthStorage() {
  removeAccessToken();
  removeUserId();
  removeStoredUser();
}
