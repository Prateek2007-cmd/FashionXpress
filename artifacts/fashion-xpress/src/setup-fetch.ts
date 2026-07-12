// Monkey patch fetch to automatically inject the auth token into generated Orval hooks.
const originalFetch = window.fetch;

window.fetch = async (resource: RequestInfo | URL, config?: RequestInit) => {
  const token = localStorage.getItem('token');

  if (token) {
    config = config || {};
    
    // Handle both Headers instances and plain objects
    if (config.headers instanceof Headers) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else if (Array.isArray(config.headers)) {
      config.headers = [...config.headers, ['Authorization', `Bearer ${token}`]];
    } else {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`
      };
    }
  }

  return originalFetch(resource, config);
};
