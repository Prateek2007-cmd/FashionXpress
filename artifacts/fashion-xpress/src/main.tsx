import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';

import App from './App';
import './index.css';

// Set the backend API base URL
setBaseUrl(
  import.meta.env.VITE_API_URL || "https://fashionxpress.onrender.com"
);

createRoot(document.getElementById('root')!).render(<App />);