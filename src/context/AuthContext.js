import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "ASIMOS_AUTH_V1";

export function AuthProvider({ children }) {
  const [booting, setBooting] = useState(true);
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          setToken(parsed.token || null);
          setUser(parsed.user || null);
        }
      } finally {
        setBooting(false);
      }
    })();
  }, []);

  async function persist(nextToken, nextUser) {
    setToken(nextToken);
    setUser(nextUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ token: nextToken, user: nextUser }));
  }

  const value = useMemo(() => ({
    booting,
    token,
    user,
    signIn: async ({ email, password }) => {
      const res = await api.login({ email, password });
      await persist(res.token, res.user);
      return res.user;
    },
    register: async (payload) => {
      const res = await api.register(payload);
      await persist(res.token, res.user);
      return res.user;
    },
    signOut: async () => {
      setToken(null);
      setUser(null);
      await AsyncStorage.removeItem(STORAGE_KEY);
    }
  }), [booting, token, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
