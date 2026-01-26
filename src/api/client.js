let AUTH_TOKEN = null;
let REFRESH_TOKEN = null;
let TOKEN_UPDATE_HANDLER = null;

// Set this in Expo:
// EXPO_PUBLIC_API_BASE_URL=https://YOUR-SERVICE.onrender.com
const RAW_API_BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || "https://asimos-backend.onrender.com").trim();
export const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");


export function setAuthToken(token) {
  AUTH_TOKEN = token || null;
}

export function setRefreshToken(token) {
  REFRESH_TOKEN = token || null;
}

export function clearAuthToken() {
  AUTH_TOKEN = null;
  REFRESH_TOKEN = null;
}

export function setTokenUpdateHandler(fn) {
  TOKEN_UPDATE_HANDLER = fn || null;
}

async function refreshSessionOrThrow() {
  if (!REFRESH_TOKEN) throw new Error("No refresh token");

  let res;
  try {
    // NOTE: Don't set hop-by-hop headers (e.g. Connection). iOS can reject them.
    res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ refreshToken: REFRESH_TOKEN }),
      redirect: "follow",
      cache: "no-store",
    });
  } catch (e) {
    const msg = e?.message || "Network request failed";
    throw new Error(`${msg}\n\nURL: ${API_BASE_URL}/auth/refresh`);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = data?.error || "Refresh failed";
    throw new Error(msg);
  }

  AUTH_TOKEN = data.token || AUTH_TOKEN;
  REFRESH_TOKEN = data.refreshToken || REFRESH_TOKEN;

  if (TOKEN_UPDATE_HANDLER) {
    TOKEN_UPDATE_HANDLER({
      token: AUTH_TOKEN,
      refreshToken: REFRESH_TOKEN,
      user: data.user || null,
    });
  }

  return { token: AUTH_TOKEN, refreshToken: REFRESH_TOKEN, user: data.user || null };
}

async function request(path, { method = "GET", body, _retry = false } = {}) {
  const p = (path || "/").startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${p}`;
  // NOTE: Don't set hop-by-hop headers (e.g. Connection). iOS can reject them.
  const headers = { "Accept": "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (AUTH_TOKEN) headers.Authorization = `Bearer ${AUTH_TOKEN}`;

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "follow",
      cache: "no-store",
    });
  } catch (e) {
    const msg = e?.message || "Network request failed";
    throw new Error(`${msg}\n\nURL: ${url}`);
  }

  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  // If token expired, refresh once and retry
  if (res.status === 401 && !_retry && REFRESH_TOKEN) {
    try {
      await refreshSessionOrThrow();
      return request(path, { method, body, _retry: true });
    } catch (e) {
      // fallthrough to error
    }
  }

  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function qs(params) {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `?${query}`;
}

export const api = {
  // Auth
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  verifyOtp: (payload) => request("/auth/verify-otp", { method: "POST", body: payload }),
  resendOtp: ({ email }) => request("/auth/resend-otp", { method: "POST", body: { email } }),
  refresh: (refreshToken) => request("/auth/refresh", { method: "POST", body: { refreshToken } }),

  // Location
  updateMyLocation: (location) => request("/me/location", { method: "PATCH", body: { location } }),
  setPushToken: (expoPushToken) => request("/me/push-token", { method: "POST", body: { expoPushToken } }),
  clearPushToken: () => request("/me/push-token", { method: "DELETE" }),

  // Jobs
  listJobs: () => request("/jobs"),
  listMyJobs: (createdBy) => request(`/jobs?createdBy=${encodeURIComponent(createdBy)}`),
  listJobsWithSearch: ({ q, lat, lng, radius_m, daily }) => request(`/jobs${qs({ q, lat, lng, radius_m, daily })}`),
  createJob: (payload) => request("/jobs", { method: "POST", body: payload }),
};
