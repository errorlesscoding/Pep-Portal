import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios';

// Configure Axios default base URL for local development vs production API deployments
const apiBaseUrl = (import.meta.env.VITE_API_URL || 'https://ai-interview-prep-api-teok.onrender.com').trim().replace(/\/+$/, '');

axios.defaults.baseURL = apiBaseUrl;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
