let AUTH_TOKEN = null;
let REFRESH_TOKEN = null;
let TOKEN_UPDATE_HANDLER = null;

const envUrl = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_BASE_URL) || "https://asimos-backend.onrender.com";
const RAW_API_BASE_URL = envUrl.trim();
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

let refreshPromise = null;

async function refreshSessionOrThrow() {
  if (!REFRESH_TOKEN) throw new Error("No refresh token");

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const doRefresh = async (retryCount = 0) => {
      try {
        console.log(`[Auth Refresh] Attempt ${retryCount + 1}`);
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ refreshToken: REFRESH_TOKEN }),
          redirect: "follow",
          cache: "no-store",
        });

        const data = await res.json().catch(() => null);

        if (!res.ok) {
          const msg = data?.error || "Refresh failed";
          const err = new Error(msg);
          err.status = res.status;
          throw err;
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
      } catch (e) {
        const isNetworkError = e?.message?.includes("Network request failed") || e?.message?.includes("failed to fetch");
        if (retryCount < 5 && isNetworkError) {
          console.warn(`[Auth Retry] Refresh failed, retrying in ${(retryCount + 1) * 3}s...`);
          const delay = (retryCount + 1) * 3000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return doRefresh(retryCount + 1);
        }
        throw e;
      }
    };

    try {
      return await doRefresh();
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

async function request(path, { method = "GET", body, retryCount = 0 } = {}) {
  const p = (path || "/").startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${p}`;
  const headers = { "Accept": "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (AUTH_TOKEN) headers.Authorization = `Bearer ${AUTH_TOKEN}`;

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      redirect: "follow",
      cache: "no-store",
    });

    if (res.status === 401 && retryCount === 0 && REFRESH_TOKEN) {
      try {
        await refreshSessionOrThrow();
        return request(path, { method, body, retryCount: 1 });
      } catch (e) {}
    }

    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (!res.ok) {
        const error = new Error(data?.error || data?.message || "Request failed");
        error.status = res.status;
        error.data = data;
        throw error;
    }

    return data;
  } catch (e) {
    const isNetworkError = e?.message?.includes("Network request failed") || e?.message?.includes("failed to fetch");
    if (retryCount < 1 && isNetworkError) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      return request(path, { method, body, retryCount: 1 });
    }
    throw e;
  }
}


function qs(params) {
  const entries = Object.entries(params || {}).filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  const query = entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `?${query}`;
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  verifyOtp: (payload) => request("/auth/verify-otp", { method: "POST", body: payload }),
  resendOtp: ({ email }) => request("/auth/resend-otp", { method: "POST", body: { email } }),
  refresh: (refreshToken) => request("/auth/refresh", { method: "POST", body: { refreshToken } }),

  forgotPassword: (email) => request("/auth/forgot-password", { method: "POST", body: { email } }),
  resetPassword: (payload) => request("/auth/reset-password", { method: "POST", body: payload }),

  updateProfile: (payload) => {
    if ('fullName' in payload) return request("/me/name", { method: "PATCH", body: payload });
    if ('phone' in payload) return request("/me/phone", { method: "PATCH", body: payload });
    return Promise.resolve(null);
  },
  updateMyLocation: (location) => request("/me/location", { method: "PATCH", body: { location } }),
  setPushToken: (expoPushToken) => request("/me/push-token", { method: "POST", body: { expoPushToken } }),
  clearPushToken: () => request("/me/push-token", { method: "DELETE" }),

  listJobs: () => request("/jobs"),
  listMyJobs: (createdBy) => request(`/jobs?createdBy=${encodeURIComponent(createdBy)}`),
  activateDueJobs: () => request("/jobs/activate-due", { method: "POST" }),
  listJobsWithSearch: ({ q, lat, lng, radius_m, daily, jobType, minWage, maxWage, categories, page, limit }) => request(`/jobs${qs({ q, lat, lng, radius_m, daily, jobType, minWage, maxWage, categories: Array.isArray(categories) ? categories.join(",") : categories, page, limit })}`),
  getJobById: (id) => request(`/jobs/${encodeURIComponent(String(id))}`),
  createJob: (payload) => request("/jobs", { method: "POST", body: payload }),
  updateJob: (id, payload) => request(`/jobs/${encodeURIComponent(String(id))}`, { method: "PATCH", body: payload }),
  closeJob: (id, { reason } = {}) => request(`/jobs/${encodeURIComponent(String(id))}/close`, { method: "PATCH", body: { reason } }),
  reopenJob: (id) => request(`/jobs/${encodeURIComponent(String(id))}/reopen`, { method: "PATCH" }),

  listCategories: () => request("/categories"),
  getContent: (slug) => request(`/content/${encodeURIComponent(slug)}`),

  listMyNotifications: ({ limit = 50, offset = 0 } = {}) => request(`/me/notifications${qs({ limit, offset })}`),
  getUnreadNotificationsCount: () => request("/me/notifications/unread-count"),
  markNotificationRead: (id) => request(`/me/notifications/${encodeURIComponent(String(id))}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () => request("/me/notifications/read-all", { method: "POST" }),

  rateUser: (payload) => request("/ratings", { method: "POST", body: payload }),

  listMyAlerts: () => request("/me/alerts"),
  createAlert: (payload) => request("/me/alerts", { method: "POST", body: payload }),
  deleteAlert: (id) => request(`/me/alerts/${encodeURIComponent(String(id))}`, { method: "DELETE" }),
  deleteMyAccount: (reason) => request("/me/account", { method: "DELETE", body: reason ? { reason } : {} }),

  listTickets: () => request("/support"),
  getSupportStats: () => request("/support/stats"),
  markTicketRead: (id) => request(`/support/${encodeURIComponent(String(id))}/read`, { method: "PATCH" }),
  createTicket: (payload) => request("/support", { method: "POST", body: payload }),
  replyTicket: (id, message) => request(`/support/${encodeURIComponent(String(id))}/reply`, { method: "POST", body: { message } }),
  deleteTicket: (id) => request(`/support/${encodeURIComponent(String(id))}`, { method: "DELETE" }),
};
