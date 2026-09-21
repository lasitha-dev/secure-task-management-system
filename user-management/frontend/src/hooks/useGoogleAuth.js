import { useCallback, useRef } from 'react';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

/**
 * Custom hook to handle Google Identity Services (GIS) One Tap / Button flow.
 * Returns a function that triggers the Google sign-in popup and resolves with the credential (ID token).
 */
export default function useGoogleAuth() {
  const initializedRef = useRef(false);
  const callbackRef = useRef(null);

  const triggerGoogleLogin = useCallback(() => {
    return new Promise((resolve, reject) => {
      if (!GOOGLE_CLIENT_ID) {
        reject(new Error('Google Client ID is not configured. Set VITE_GOOGLE_CLIENT_ID in your .env file.'));
        return;
      }

      if (typeof window.google === 'undefined') {
        reject(new Error('Google Identity Services SDK not loaded. Please refresh the page.'));
        return;
      }

      // Store the resolve/reject so the callback can use them
      callbackRef.current = { resolve, reject };

      if (!initializedRef.current) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response.credential) {
              callbackRef.current?.resolve(response.credential);
            } else {
              callbackRef.current?.reject(new Error('Google login failed — no credential returned.'));
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        initializedRef.current = true;
      }

      // Trigger the One Tap / popup prompt
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) {
          // Fallback: if One Tap is blocked (e.g., cooldown, 3P cookies disabled), use the button popup
          const buttonDiv = document.createElement('div');
          buttonDiv.style.display = 'none';
          document.body.appendChild(buttonDiv);

          window.google.accounts.id.renderButton(buttonDiv, {
            type: 'standard',
            size: 'large',
          });

          // Click the hidden rendered button to open popup
          const btn = buttonDiv.querySelector('div[role=button]');
          if (btn) {
            btn.click();
          } else {
            document.body.removeChild(buttonDiv);
            callbackRef.current?.reject(new Error('Google Sign-In is not available. Please try again or check your browser settings.'));
          }

          // Cleanup after a delay
          setTimeout(() => {
            if (document.body.contains(buttonDiv)) {
              document.body.removeChild(buttonDiv);
            }
          }, 60000);
        } else if (notification.isSkippedMoment()) {
          callbackRef.current?.reject(new Error('Google Sign-In was dismissed.'));
        }
      });
    });
  }, []);

  return { triggerGoogleLogin, isGoogleAvailable: !!GOOGLE_CLIENT_ID };
}
