export const API_BASE_URL = "http://10.0.2.2:4000"; 
// Android emulator: 10.0.2.2
// Real device: use your PC IP, e.g. http://192.168.1.10:4000

async function request(path, { method="GET", body } = {}) {
  const url = `${API_BASE_URL}${path}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const message = data?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}

function qs(params) {
  const entries = Object.entries(params || {}).filter(([,v]) => v !== undefined && v !== null && v !== "");
  if (!entries.length) return "";
  const query = entries.map(([k,v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join("&");
  return `?${query}`;
}

export const api = {
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),

  listJobs: () => request("/jobs"),
  listMyJobs: (createdBy) => request(`/jobs?createdBy=${encodeURIComponent(createdBy)}`),

  listJobsWithSearch: ({ q, lat, lng, radius_m, daily }) => {
    return request(`/jobs${qs({ q, lat, lng, radius_m, daily })}`);
  },

  createJob: (payload) => request("/jobs", { method: "POST", body: payload }),
};
