import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import axios from 'axios';

// Configure Axios default base URL for local development vs production API deployments
axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
