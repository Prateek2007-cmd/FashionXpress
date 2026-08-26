export function getApiBaseUrl(): string {
  // VITE_API_URL is baked in at build time by Vite (set in vercel.json buildCommand)
  // Falls back to hostname detection for any other deployment
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string;
  }
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    // On any non-localhost deployment (Vercel, Netlify, etc.) always go to Render
    return 'https://fashionxpress.onrender.com';
  }
  return '';
}
