import { getApiBaseUrl } from './lib/api-config';

// Monkey patch fetch to automatically inject API base URL and Auth Token across all fetch calls (string, URL, or Request objects)
const originalFetch = window.fetch;

window.fetch = async (resource: RequestInfo | URL, config?: RequestInit) => {
  const token = localStorage.getItem('token');
  const apiBase = getApiBaseUrl();

  let targetResource = resource;

  if (apiBase) {
    if (typeof resource === 'string') {
      if (resource.startsWith('/api')) {
        targetResource = `${apiBase}${resource}`;
      }
    } else if (resource instanceof URL) {
      if (resource.pathname.startsWith('/api')) {
        targetResource = `${apiBase}${resource.pathname}${resource.search}`;
      }
    } else if (typeof Request !== 'undefined' && resource instanceof Request) {
      try {
        const urlObj = new URL(resource.url, window.location.origin);
        if (urlObj.pathname.startsWith('/api')) {
          const fullUrl = `${apiBase}${urlObj.pathname}${urlObj.search}`;
          targetResource = new Request(fullUrl, resource);
        }
      } catch {
        /* fallback */
      }
    }
  }

  if (token) {
    config = config || {};
    
    if (config.headers instanceof Headers) {
      if (!config.headers.has('Authorization')) {
        config.headers.set('Authorization', `Bearer ${token}`);
      }
    } else if (Array.isArray(config.headers)) {
      if (!config.headers.some(([k]) => k.toLowerCase() === 'authorization')) {
        config.headers = [...config.headers, ['Authorization', `Bearer ${token}`]];
      }
    } else {
      const headersObj = (config.headers || {}) as Record<string, string>;
      if (!headersObj.Authorization && !headersObj.authorization) {
        config.headers = {
          ...headersObj,
          Authorization: `Bearer ${token}`
        };
      }
    }
  }

  return originalFetch(targetResource, config);
};
