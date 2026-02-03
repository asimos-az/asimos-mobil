import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDeviceLocationOrNull } from "../utils/deviceLocation";
import { api, setAuthToken, setRefreshToken, clearAuthToken, setTokenUpdateHandler } from "../api/client";
import { navigationRef } from "../navigation/navigationRef";

const AuthContext = createContext(null);
const STORAGE_KEY = "ASIMOS_AUTH_V2";
const ROLE_HINT_KEY = "ASIMOS_ROLE_HINT_V1";

function normalizeRole(input) {
  if (input === null || input === undefined) return null;
  const raw = String(input).trim();
  if (!raw) return null;

  const lowered = raw.toLowerCase();
  const simple = lowered
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ə/g, "e")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/\s+/g, " ")
    .trim();

  if (["seeker", "jobseeker", "job_seeker", "alici", "is axtaran", "is_axtaran"].includes(simple)) return "seeker";
  if (["employer", "hirer", "company", "satici", "isci axtaran", "isci_axtaran"].includes(simple)) return "employer";

  if (["seeker", "employer"].includes(lowered)) return lowered;
  return null;
}

export function AuthProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [refreshToken, setRefreshTokenState] = useState(null);
  const [user, setUser] = useState(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setTokenUpdateHandler(async ({ token: nextToken, refreshToken: nextRefresh, user: nextUser }) => {
      if (nextToken) setToken(nextToken);
      if (nextRefresh) setRefreshTokenState(nextRefresh);
      if (nextUser) setUser(nextUser);

      try {
        await AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ token: nextToken, refreshToken: nextRefresh, user: nextUser ?? user })
        );
      } catch { }
    });

    (async () => {
      try {
        // 1. Load persisted session
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return;

        const parsed = JSON.parse(raw);
        const loadedUser = parsed.user
          ? { ...parsed.user, role: normalizeRole(parsed.user?.role) || null }
          : null;

        // Hydrate state immediately
        if (!cancelled) {
          setToken(parsed.token || null);
          setRefreshTokenState(parsed.refreshToken || null);
          setUser(loadedUser);
        }
        setAuthToken(parsed.token || null);
        setRefreshToken(parsed.refreshToken || null);

        // 2. Auto-Update Location (LIVE LOCATION)
        if (parsed.token) {
          // Fire and forget - don't block
          getDeviceLocationOrNull({ timeoutMs: 5000 }).then(async (loc) => {
            if (loc && !cancelled) {
              // Update local state silently
              setUser(prev => ({ ...prev, location: loc }));
              // Sync to backend
              try { await api.updateMyLocation(loc); } catch { }
            }
          });
        }

        // Proactive refresh on app start:
        // If access token is expired, some screens hit the API immediately and show "Invalid token".
        // We refresh once here (silently) so the first API call already has a fresh access token.
        if (parsed.refreshToken) {
          try {
            const refreshed = await api.refresh(parsed.refreshToken);
            const nextUser = { ...(refreshed.user || loadedUser || {}) };
            nextUser.role = normalizeRole(nextUser.role) || nextUser.role || null;

            await persist(refreshed.token, refreshed.refreshToken || parsed.refreshToken, nextUser);
          } catch (e) {
            // Only force re-login if explicit auth failure
            if (e.status === 401 || e.status === 403) {
              try { await AsyncStorage.removeItem(STORAGE_KEY); } catch { }
              clearAuthToken();
              if (!cancelled) {
                setToken(null);
                setRefreshTokenState(null);
                setUser(null);
              }
            } else {
              console.log("[Auth] Refresh failed but keeping session (network?):", e.message);
              // Keep the expired token in memory/storage so we can try again later
              // or let the next API call fail and trigger logic there.
            }
          }
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function persist(nextToken, nextRefresh, nextUser) {
    const safeUser = nextUser ? { ...nextUser, role: normalizeRole(nextUser?.role) || null } : null;
    setToken(nextToken);
    setRefreshTokenState(nextRefresh);
    setUser(safeUser);
    setAuthToken(nextToken);
    setRefreshToken(nextRefresh);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, refreshToken: nextRefresh, user: safeUser }));
  }

  const value = useMemo(() => ({
    booting,
    isSigningOut,
    token,
    refreshToken,
    user,

    signIn: async ({ email, password, roleHint }) => {
      const res = await api.login({ email, password });
      const nextUser = { ...(res.user || {}) };
      // Backend role gəlməsə də (köhnə user və ya boş profil) UI-də seçilən rolu fallback kimi saxla.
      nextUser.role = normalizeRole(nextUser.role) || null;
      if (!nextUser.role && roleHint) {
        const hint = normalizeRole(roleHint) || roleHint;
        nextUser.role = hint;
        await AsyncStorage.setItem(ROLE_HINT_KEY, hint).catch(() => { });
      }
      await persist(res.token, res.refreshToken, nextUser);

      // Auto-ask for push
      setTimeout(() => {
        import("../utils/pushNotifications").then(({ registerForPushNotificationsAsync }) => {
          registerForPushNotificationsAsync().then(token => {
            if (token) api.setPushToken(token).catch(() => { });
          });
        });
      }, 500);

      return nextUser;
    },

    // Step 1: send OTP email (signup confirmation)
    startRegister: async (payload) => {
      return api.register(payload); // { ok, needsOtp, ... }
    },

    // Step 2: verify OTP => session tokens
    verifyEmailOtp: async ({ email, code, password, role, fullName, companyName, phone }) => {
      const res = await api.verifyOtp({ email, code, password, role, fullName, companyName, phone });

      // If pending approval, don't login/persist
      if (res.pendingApproval) {
        return res;
      }

      const nextUser = { ...(res.user || {}) };
      nextUser.role = normalizeRole(nextUser.role) || null;
      if (!nextUser.role) {
        const hintRaw = role || (await AsyncStorage.getItem(ROLE_HINT_KEY).catch(() => null));
        const hint = normalizeRole(hintRaw) || hintRaw;
        if (hint) nextUser.role = hint;
      }
      await persist(res.token, res.refreshToken, nextUser);

      // Auto-ask for push
      setTimeout(() => {
        import("../utils/pushNotifications").then(({ registerForPushNotificationsAsync }) => {
          registerForPushNotificationsAsync().then(token => {
            if (token) api.setPushToken(token).catch(() => { });
          });
        });
      }, 500);

      return nextUser;
    },

    resendEmailOtp: async ({ email }) => api.resendOtp({ email }),

    resetPassword: async ({ email, code, password }) => {
      const res = await api.resetPassword({ email, code, password });
      if (res?.token && res?.user) {
        const nextUser = { ...(res.user || {}) };
        nextUser.role = normalizeRole(nextUser.role) || null;
        await persist(res.token, res.refreshToken, nextUser);

        // Auto-ask for push
        setTimeout(() => {
          import("../utils/pushNotifications").then(({ registerForPushNotificationsAsync }) => {
            registerForPushNotificationsAsync().then(token => {
              if (token) api.setPushToken(token).catch(() => { });
            });
          });
        }, 1000);

        return nextUser;
      }
      return null;
    },

    updateLocation: async (location) => {
      const nextUser = { ...(user || {}), location };
      setUser(nextUser);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token, refreshToken, user: nextUser }));
      try {
        const res = await api.updateMyLocation(location);
        if (res?.user) await persist(token, refreshToken, res.user);
      } catch { }
      return nextUser;
    },

    signOut: async () => {
      // Prevent a 1-frame flash of the guest-gate UI while we reset navigation
      setIsSigningOut(true);

      // First: navigate away from Profile to Jobs list
      try {
        if (navigationRef.isReady()) {
          navigationRef.resetRoot({
            index: 0,
            routes: [{ name: "SeekerTabs", params: { screen: "SeekerJobs" } }],
          });
        }
      } catch {
        // ignore
      }

      // Then: clear auth state + persisted session
      setToken(null);
      setRefreshTokenState(null);
      setUser(null);
      clearAuthToken();
      await AsyncStorage.removeItem(STORAGE_KEY);
      await AsyncStorage.removeItem(ROLE_HINT_KEY).catch(() => { });
      // location permission prompt-un bir dəfəlik flag-i
      await AsyncStorage.removeItem("ASIMOS_LOC_ASKED_V1").catch(() => { });
      await AsyncStorage.removeItem("ASIMOS_NOTIF_ENABLED_V2").catch(() => { });
      await AsyncStorage.removeItem("ASIMOS_NOTIF_ASKED_V2").catch(() => { });

      // Small timeout to ensure UI stays clean during navigation transition
      setTimeout(() => setIsSigningOut(false), 300);
    }
  }), [booting, isSigningOut, token, refreshToken, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
