/**
 * Razorpay Payment Gateway Helper for Web and Expo Web
 */

const RAZORPAY_SCRIPT_URL = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Loads the Razorpay checkout.js script asynchronously in web environment.
 * @returns {Promise<boolean>} Resolves to true when the script is loaded, false otherwise.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }

    // Already loaded
    if (window.Razorpay) {
      return resolve(true);
    }

    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      if (window.Razorpay) return resolve(true);
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = RAZORPAY_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = (err) => {
      console.error('[Razorpay] Failed to load Razorpay checkout script:', err);
      resolve(false);
    };

    document.body.appendChild(script);
  });
};

/**
 * Helper to get the Razorpay Key ID
 * Prioritizes the key returned from the backend, then env variable, then default test key.
 * (Never uses Key Secret on frontend)
 */
export const getRazorpayKeyId = (serverKeyId) => {
  return (
    serverKeyId ||
    process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID ||
    'rzp_test_TyUC9t3NIpiH4a'
  );
};

