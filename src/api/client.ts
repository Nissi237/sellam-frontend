import axios from "axios";

// Central axios instance. Base URL comes from VITE_API_URL (see .env), falling
// back to the local backend. A request interceptor attaches the JWT (stored by
// AuthContext) to every call so protected endpoints just work.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const TOKEN_KEY = "sellam_token";
export const USER_KEY = "sellam_user";

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/** Extract a human-readable message from an axios error. */
export function apiError(err: unknown, fallback = "Une erreur est survenue"): string {
  if (typeof err === "object" && err !== null && "response" in err) {
    const resp = (err as any).response;
    if (resp?.data?.message) return resp.data.message as string;
  }
  return fallback;
}
