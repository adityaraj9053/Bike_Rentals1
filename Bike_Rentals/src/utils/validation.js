/**
 * Centralized validation utilities for email and phone numbers across The Road Eagle platform.
 */

// Email regex ensuring standard email format: username@domain.extension (e.g., name@example.com)
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * Validates an email address.
 * Checks for non-empty, presence of '@', presence of '.', and valid domain extension.
 * @param {string} email
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateEmail(email) {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return {
      isValid: false,
      error: 'Email address is required.',
      errorHi: 'ईमेल पता दर्ज करना अनिवार्य है।',
    };
  }

  if (!trimmed.includes('@')) {
    return {
      isValid: false,
      error: "Email must include '@' symbol (e.g. name@example.com).",
      errorHi: "ईमेल में '@' होना अनिवार्य है (उदा. name@example.com)।",
    };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2 || !parts[1].includes('.')) {
    return {
      isValid: false,
      error: "Email domain must include a valid extension like '.com' or '.in'.",
      errorHi: "ईमेल डोमेन में मान्य एक्सटेंशन (जैसे '.com' या '.in') होना अनिवार्य है।",
    };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address (e.g. name@example.com).',
      errorHi: 'कृपया मान्य ईमेल पता दर्ज करें (उदा. name@example.com)।',
    };
  }

  return { isValid: true, error: '', errorHi: '' };
}

/**
 * Validates a 10-digit phone number.
 * Strips non-digits and checks for exactly 10 digits.
 * @param {string} phone
 * @param {string} countryCode
 * @returns {{ isValid: boolean, error: string, digits: string }}
 */
export function validatePhone(phone, countryCode = '+91') {
  const digits = (phone || '').replace(/\D/g, '');

  if (!digits) {
    return {
      isValid: false,
      error: 'Mobile number is required.',
      errorHi: 'मोबाइल नंबर दर्ज करना अनिवार्य है।',
      digits: '',
    };
  }

  if (digits.length !== 10) {
    return {
      isValid: false,
      error: `Mobile number must be exactly 10 digits (currently ${digits.length}).`,
      errorHi: `मोबाइल नंबर ठीक 10 अंकों का होना चाहिए (वर्तमान: ${digits.length})।`,
      digits,
    };
  }

  return { isValid: true, error: '', errorHi: '', digits };
}
