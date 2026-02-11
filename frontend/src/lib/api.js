import axios from "axios";

// ✅ Backend runs on port 5000
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Server root (without /api) — used for static assets like uploaded images
const SERVER_BASE =
  import.meta.env.VITE_SERVER_BASE || "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function apiRequest(
  path,
  { method = "GET", body, token } = {}
) {
  const config = {
    method,
    url: path,
    data: body,
    headers: token
      ? { Authorization: `Bearer ${token}` }
      : {},
  };

  const response = await api(config);
  return response.data;
}

export function getGoogleClientId() {
  return import.meta.env.VITE_GOOGLE_CLIENT_ID || "";
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
