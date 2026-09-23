import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Exchange a single-use handoff code for a JWT (secure cross-app auth).
// The handoff code arrives as ?handoff=<hex> — the JWT never appears in the URL.
// Legacy JWT URL handoff support has been deliberately removed.
//
// StrictMode guard: this runs before React mount so there is only one execution.
// The code is read once, stripped from the URL, exchanged, and never stored.
async function processHandoff() {
  const params = new URLSearchParams(window.location.search);
  const handoffCode = params.get('handoff');

  if (handoffCode) {
    // 1. Immediately remove the handoff code from the visible URL
    params.delete('handoff');
    const cleanSearch = params.toString();
    const cleanUrl = window.location.pathname + (cleanSearch ? `?${cleanSearch}` : '');
    window.history.replaceState({}, '', cleanUrl);

    // 2. Exchange the single-use code for a JWT
    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
      const response = await fetch(`${apiBase}/api/users/auth/handoff/exchange`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: handoffCode }),
      });

      if (response.ok) {
        const body = await response.json();
        const token = body?.data?.token;
        if (token) {
          localStorage.setItem('token', token);
        }
      }
    } catch (e) {
      // Exchange failed — app will redirect to login
    }
  }
}

// Auto-set dev token if none exists in localStorage
if (!localStorage.getItem('token') && import.meta.env.VITE_DEV_TOKEN) {
  localStorage.setItem('token', import.meta.env.VITE_DEV_TOKEN)
}

// Process handoff before rendering so the JWT is in localStorage when App mounts.
// Running before createRoot also prevents StrictMode double-execution issues.
processHandoff().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
