/**
 * Centralized Axios instance.
 *
 * Re-exports the existing axios instance and helpers from lib/api.js
 * so new code can import from either location:
 *
 *   import api, { apiRequest } from "@/api/axios";   // ← new alias
 *   import { api, apiRequest } from "../lib/api";     // ← still works
 *
 * Environment variables (set in Vercel dashboard for production):
 *   VITE_API_BASE    – e.g. https://stay-o1na.onrender.com/api
 *   VITE_SERVER_BASE – e.g. https://stay-o1na.onrender.com
 *   VITE_GOOGLE_CLIENT_ID
 */

export { api as default, api, apiRequest, getGoogleClientId, getServerBase, getImageUrl } from "../lib/api";
