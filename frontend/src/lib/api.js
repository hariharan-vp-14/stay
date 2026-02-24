import axios from "axios";

// ── Base URLs ──
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

const SERVER_BASE =
  import.meta.env.VITE_SERVER_BASE || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor: attach JWT from localStorage (skip public auth routes) ──
api.interceptors.request.use((reqConfig) => {
  try {
    // Don't attach stale JWT on public auth endpoints
    const url = reqConfig.url || '';
    const isPublicAuth = /\/(google-login|google|login|register)$/i.test(url);
    if (isPublicAuth) return reqConfig;

    const stored = localStorage.getItem("pg-auth");
    if (stored) {
      const { token } = JSON.parse(stored);
      if (token) {
        reqConfig.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // ignore
  }
  return reqConfig;
});

// ── Response interceptor: auto-logout on 401 (skip auth endpoints) ──
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't wipe auth or redirect if the 401 is from a login/register/google endpoint
      const reqUrl = error.config?.url || '';
      const isAuthRoute = /\/(google-login|google|login|register)/i.test(reqUrl);
      if (!isAuthRoute) {
        localStorage.removeItem("pg-auth");
        const path = window.location.pathname;
        if (!path.includes("/login") && !path.includes("/register")) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export async function apiRequest(
  path,
  { method = "GET", body, token, headers: extraHeaders } = {}
) {
  const config = {
    method,
    url: path,
    data: body,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extraHeaders,
    },
  };

  const response = await api(config);
  return response.data;
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
}

export function getServerBase() {
  return SERVER_BASE;
}

/**
 * Convert a stored image path (e.g. "/uploads/properties/img.jpg")
 * into a full URL pointing at the backend static server.
 * Already-absolute URLs (http/https) are returned as-is.
 */
export function getImageUrl(path) {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${SERVER_BASE}${path.startsWith("/") ? "" : "/"}${path}`;
}
