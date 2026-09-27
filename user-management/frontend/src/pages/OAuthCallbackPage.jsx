import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { redirectToApp } from '@taskmaster/shared-ui/appLinks';
import { useAuth } from '../context/AuthContext';

/**
 * OAuthCallbackPage — public route: /oauth-callback
 *
 * Receives the opaque exchange `code` from the backend OAuth redirect:
 *   /oauth-callback?code=<64-char-hex>
 *
 * Security properties:
 *  - The code is read once from the URL and immediately removed from the
 *    browser address bar using history.replaceState.
 *  - The code is never stored in localStorage or sessionStorage.
 *  - The JWT/user are stored via AuthContext (localStorage) only after a
 *    successful server-side exchange.
 *  - No tokens, codes, or raw error objects are logged to the console.
 *  - A useRef guard prevents double-invocation caused by React StrictMode
 *    mounting the component twice in development.
 */
export default function OAuthCallbackPage() {
  const [status, setStatus] = useState('loading'); // 'loading' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const { completeGoogleOAuth } = useAuth();
  const navigate = useNavigate();

  // StrictMode guard: prevents the exchange from being called twice.
  // React StrictMode intentionally mounts/unmounts components twice in dev,
  // which would trigger the effect twice and exhaust the single-use ticket.
  const hasExchangedRef = useRef(false);

  useEffect(() => {
    // Only run the exchange once, even under React StrictMode.
    if (hasExchangedRef.current) return;
    hasExchangedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');

    // Immediately remove the code from the visible browser URL.
    // This prevents the code from being bookmarked, shared, or logged by
    // browser history sync — without triggering a page reload.
    window.history.replaceState({}, document.title, window.location.pathname);

    // Use a Promise chain for all state updates so they are consistently
    // asynchronous — this satisfies the react-hooks/set-state-in-effect rule.
    Promise.resolve().then(() => {
      if (!code) {
        setErrorMessage('No authentication code was received from Google. Please try signing in again.');
        setStatus('error');
        return;
      }

      return completeGoogleOAuth(code)
        .then((user) => {
          if (user.role === 'Admin') {
            navigate('/admin', { replace: true });
          } else {
            return redirectToApp('task');
          }
        })
        .catch(() => {
          // Do not expose raw error details (may contain server internals).
          setErrorMessage('Google sign-in could not be completed. The link may have expired. Please try again.');
          setStatus('error');
        });
    });
  }, [completeGoogleOAuth, navigate]);

  if (status === 'loading') {
    return (
      <div className="bg-[#0f172a] min-h-screen flex flex-col items-center justify-center gap-6 px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="size-12 text-[#144bb8]">
            <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z"></path>
            </svg>
          </div>
          <span className="material-symbols-outlined text-[#144bb8] text-5xl animate-spin" aria-hidden="true">
            progress_activity
          </span>
          <h1 className="text-white text-xl font-semibold tracking-tight">Completing Google sign-in…</h1>
          <p className="text-slate-400 text-sm">Please wait while we verify your account.</p>
        </div>
      </div>
    );
  }

  // status === 'error'
  return (
    <div className="bg-[#0f172a] min-h-screen flex flex-col items-center justify-center gap-6 px-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] shadow-lg p-10 flex flex-col items-center gap-6 text-center" style={{ maxWidth: '420px', width: '100%' }}>
        <div className="size-12 text-[#144bb8]">
          <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6H42L36 24L42 42H6L12 24L6 6Z"></path>
          </svg>
        </div>

        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <span className="material-symbols-outlined text-red-400 text-3xl" aria-hidden="true">error</span>
          </div>
          <h1 className="text-white text-xl font-bold">Sign-in Failed</h1>
          <p className="text-slate-400 text-sm leading-relaxed">{errorMessage}</p>
        </div>

        <Link
          to="/login"
          className="w-full flex items-center justify-center gap-2 rounded-lg h-11 px-4 bg-[#144bb8] hover:bg-[#113d96] text-white text-sm font-bold transition-colors"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
          Return to Login
        </Link>
      </div>
    </div>
  );
}
