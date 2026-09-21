import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Auto-set dev token if none exists in localStorage
if (!localStorage.getItem('token') && import.meta.env.VITE_DEV_TOKEN) {
  localStorage.setItem('token', import.meta.env.VITE_DEV_TOKEN)
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
