// Monkey patch fetch to automatically inject the auth token into generated Orval hooks.
const originalFetch = window.fetch;

window.fetch = async (...args) => {
  let [resource, config] = args;
  const token = localStorage.getItem('token');
  
  if (token) {
    config = config || {};
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`
    };
  }
  
  return originalFetch(resource, config);
};
