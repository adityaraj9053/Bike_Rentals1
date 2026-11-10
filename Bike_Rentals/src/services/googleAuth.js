import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

// Complete any pending auth session in web popup
WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  process.env.REACT_APP_GOOGLE_CLIENT_ID;

export const GOOGLE_CLIENT_SECRET =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_SECRET ||
  process.env.REACT_APP_GOOGLE_CLIENT_SECRET;

/**
 * Safely parse a JWT payload (such as a Google id_token)
 */
export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    let jsonStr = '';
    if (typeof window !== 'undefined' && typeof window.atob === 'function') {
      jsonStr = decodeURIComponent(
        window
          .atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } else {
      jsonStr = Buffer.from(base64, 'base64').toString('utf-8');
    }
    return JSON.parse(jsonStr);
  } catch (err) {
    console.warn('[GoogleAuth] Failed to parse JWT token:', err);
    return null;
  }
}

/**
 * Fetch Google User Info using an access token
 */
export async function fetchGoogleUserInfo(accessToken) {
  if (!accessToken) return null;
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) {
    throw new Error(`Google UserInfo request failed with status ${res.status}`);
  }
  return await res.json();
}

let gsiScriptLoadingPromise = null;

/**
 * Dynamically load Google Identity Services (GIS) on Web
 */
export function loadGsiScript() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return Promise.resolve(null);
  }

  if (window.google?.accounts?.id || window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google);
  }

  if (gsiScriptLoadingPromise) {
    return gsiScriptLoadingPromise;
  }

  gsiScriptLoadingPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-gsi-client');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-client';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log('[GoogleAuth] Google Identity Services script loaded successfully.');
      resolve(window.google);
    };
    script.onerror = (err) => {
      gsiScriptLoadingPromise = null;
      console.error('[GoogleAuth] Failed to load Google Identity Services script:', err);
      reject(new Error('Failed to load Google Identity Services script. Check your internet connection.'));
    };
    document.head.appendChild(script);
  });

  return gsiScriptLoadingPromise;
}

/**
 * Web-based Google Sign-In using Google Identity Services (GIS) Popup Flow
 * Returns { user, idToken, accessToken }
 */
export function signInWithGoogleWebGsi({ clientId = GOOGLE_CLIENT_ID } = {}) {
  return new Promise((resolve, reject) => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return reject(new Error('Google Web Sign-In is only supported on web.'));
    }

    const initAndPrompt = () => {
      try {
        if (!window.google?.accounts) {
          return reject(new Error('Google Identity Services SDK is not available.'));
        }

        // Initialize Google One-Tap / Identity Services for idToken
        let resolved = false;

        if (window.google.accounts.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: (credentialResponse) => {
              if (resolved) return;
              resolved = true;
              const idToken = credentialResponse?.credential;
              const decoded = parseJwt(idToken);
              console.log('[GoogleAuth] GIS ID Token received:', { idToken, profile: decoded });

              const profile = {
                name: decoded?.name || decoded?.email?.split('@')[0] || 'Google User',
                email: decoded?.email || '',
                avatar: decoded?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
                googleId: decoded?.sub || '',
                idToken: idToken || '',
                loginMethod: 'google',
              };

              resolve({ profile, idToken });
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });
        }

        // OAuth2 Token Client Popup
        if (window.google.accounts.oauth2) {
          const client = window.google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: 'openid email profile',
            callback: async (tokenResponse) => {
              if (resolved) return;
              if (tokenResponse.error) {
                if (tokenResponse.error === 'popup_closed_by_user' || tokenResponse.error === 'access_denied') {
                  return reject({ isCancelled: true, message: 'Google sign-in popup was closed.' });
                }
                return reject(new Error(tokenResponse.error_description || tokenResponse.error));
              }

              resolved = true;
              try {
                const userInfo = await fetchGoogleUserInfo(tokenResponse.access_token);
                console.log('[GoogleAuth] OAuth UserInfo received:', userInfo);

                const profile = {
                  name: userInfo?.name || userInfo?.email?.split('@')[0] || 'Google User',
                  email: userInfo?.email || '',
                  avatar: userInfo?.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
                  googleId: userInfo?.sub || '',
                  idToken: tokenResponse.id_token || null,
                  accessToken: tokenResponse.access_token,
                  loginMethod: 'google',
                };

                resolve({ profile, idToken: tokenResponse.id_token, accessToken: tokenResponse.access_token });
              } catch (fetchErr) {
                reject(fetchErr);
              }
            },
            error_callback: (error) => {
              if (resolved) return;
              if (error?.type === 'popup_closed') {
                return reject({ isCancelled: true, message: 'Google sign-in popup was closed.' });
              }
              reject(new Error(error?.message || 'Google sign-in failed.'));
            },
          });

          client.requestAccessToken({ prompt: 'select_account' });
        } else if (window.google.accounts.id) {
          window.google.accounts.id.prompt((notification) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              console.warn('[GoogleAuth] One-Tap prompt not displayed or skipped:', notification.getNotDisplayedReason?.());
            }
          });
        }
      } catch (err) {
        reject(err);
      }
    };

    if (window.google?.accounts?.oauth2 || window.google?.accounts?.id) {
      initAndPrompt();
    } else {
      loadGsiScript()
        .then(() => initAndPrompt())
        .catch(reject);
    }
  });
}

