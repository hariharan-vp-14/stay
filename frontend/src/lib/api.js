import axios from "axios";

// ✅ Backend runs on port 5000
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

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
