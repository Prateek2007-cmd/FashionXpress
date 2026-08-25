export function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== "undefined" && window.location.hostname.includes("vercel.app")) {
    return "https://fashionxpress.onrender.com";
  }
  return "";
}
