"use client";

import { useMutation } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getAdminUserInfo, loginAdmin } from "@/api/admin-auth.api";
import {
  clearAuthStorage,
  getAccessToken,
  getStoredUser,
  getUserId,
  setAccessToken,
  setStoredUser,
  setUserId,
  type AdminUser,
} from "@/lib/auth/storage";

type LoginCredentials = {
  email_id: string;
  password: string;
};

type AuthContextValue = {
  error: string;
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  token: string;
  user: AdminUser | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState("");
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const { isPending: isLoggingIn, mutateAsync: loginAdminMutation } = useMutation({
    mutationFn: loginAdmin,
  });

  const logout = useCallback(() => {
    clearAuthStorage();
    setToken("");
    setUser(null);
    setError("");
    setIsLoading(false);
  }, []);

  useEffect(() => {
    let ignoreResult = false;

    async function restoreSession() {
      const storedToken = getAccessToken();
      const storedUserId = getUserId();
      const storedUser = getStoredUser();

      setToken(storedToken);
      setUser(storedUser);

      if (!storedToken || !storedUserId) {
        clearAuthStorage();
        setIsLoading(false);
        return;
      }

      try {
        const userInfo = await getAdminUserInfo(storedUserId);

        if (!ignoreResult) {
          setStoredUser(userInfo);
          setUser(userInfo);
        }
      } catch {
        if (!ignoreResult) {
          logout();
        }
      } finally {
        if (!ignoreResult) {
          setIsLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      ignoreResult = true;
    };
  }, [logout]);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setError("");

    try {
      const loggedInUser = await loginAdminMutation(credentials);
      const { atoken, ...nextUser } = loggedInUser;
      const nextToken = atoken || "";
      const nextUserId = nextUser._id || "";

      setAccessToken(nextToken);
      setUserId(nextUserId);
      setStoredUser(nextUser);
      setToken(nextToken);
      setUser(nextUser);
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : "Unable to log in";

      setError(message);
      throw new Error(message);
    }
  }, [loginAdminMutation]);

  const value = useMemo<AuthContextValue>(
    () => ({
      error,
      isAuthenticated: Boolean(token),
      isLoading,
      isLoggingIn,
      login,
      logout,
      token,
      user,
    }),
    [error, isLoading, isLoggingIn, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
