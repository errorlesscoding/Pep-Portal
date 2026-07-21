import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios';

// Configure Axios default base URL for local development vs production API deployments
const apiBaseUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');

if (import.meta.env.PROD && !apiBaseUrl) {
  console.error('VITE_API_URL is missing. Production API requests will not reach the backend.');
}

axios.defaults.baseURL = apiBaseUrl;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
