/**
 * Role-Based Access Control and Authentication Utilities
 */

export const getOwnerEmail = () => {
  return (
    process.env.EXPO_PUBLIC_OWNER_EMAIL ||
    process.env.OWNER_EMAIL ||
    'gamedevelop06@gmail.com'
  ).trim().toLowerCase();
};

/**
 * Check if the given authenticated user matches the owner email from .env
 */
export const isOwnerUser = (user) => {
  if (!user) return false;
  const ownerEmail = getOwnerEmail();
  const userEmail = (user.email || '').trim().toLowerCase();
  return Boolean(userEmail && userEmail === ownerEmail) || user.role === 'OWNER';
};

/**
 * Check if booking return datetime has passed
 */
export const isBookingExpired = (booking) => {
  if (!booking) return false;
  if (booking.bookingStatus === 'COMPLETED' || booking.bookingStatus === 'CANCELLED') {
    return true;
  }
  const returnTimeStr = booking.returnDatetime || booking.returnDate;
  if (!returnTimeStr) return false;
  const returnTime = new Date(returnTimeStr).getTime();
  if (isNaN(returnTime)) return false;
  return Date.now() >= returnTime;
};

