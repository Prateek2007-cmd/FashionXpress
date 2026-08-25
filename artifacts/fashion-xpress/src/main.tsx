import { createRoot } from 'react-dom/client';
import { setBaseUrl } from '@workspace/api-client-react';
import { getApiBaseUrl } from './lib/api-config';

import App from './App';
import './index.css';

setBaseUrl(getApiBaseUrl());

createRoot(document.getElementById('root')!).render(<App />);