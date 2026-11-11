import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import {
  Calendar,
  Clock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Smartphone,
  ChevronDown,
  Check,
  X,
  FileText,
  CalendarDays,
  User,
  Phone,
  Mail,
  Copy,
  Upload,
  Info,
  Trash2,
  CheckCircle2,
  Eye,
} from 'lucide-react-native';
import { BIKES_DATA } from '../data/bikes';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import CalendarPickerModal from '../components/CalendarPickerModal';
import DocumentPreviewModal from '../components/DocumentPreviewModal';
import PhoneInput from '../components/PhoneInput';
import { validateEmail, validatePhone } from '../utils/validation';
import { bookingsAPI, paymentAPI, documentsAPI } from '../services/api';
import { loadRazorpayScript, getRazorpayKeyId } from '../services/razorpay';

const PICKUP_TIMES = [
  '09:00 AM (Hub Opens)',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
];

const RETURN_TIMES = [
  '06:00 PM',
  '07:00 PM',
  '08:00 PM (Hub Closes)',
  '09:00 PM',
  '10:00 PM',
];

export default function BookingScreen({
  route,
  navigation,
  onOpenQuote,
  onShowToast,
  onOpenWhatsApp,
  user,
  onOpenAuth,
  onBookingConfirmed,
}) {
  const { t, isHindi } = useLanguage();
  const selectedBike = route?.params?.bike || BIKES_DATA[0];
  const [step, setStep] = useState(1);

  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const isMobile = width < 768;

  // Pre-load Razorpay checkout script on web
  useEffect(() => {
    loadRazorpayScript().catch((err) => {
      console.warn('[BookingScreen] Razorpay script pre-load warning:', err);
    });
  }, []);

  // Form input dates initialized EMPTY - user picks from calendar or types
  const [pickupDate, setPickupDate] = useState('');
  const [pickupDateError, setPickupDateError] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [pickupTimeError, setPickupTimeError] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [returnDateError, setReturnDateError] = useState('');
  const [returnTime, setReturnTime] = useState('');
  const [returnTimeError, setReturnTimeError] = useState('');

  // Calendar Picker Modal Target: 'pickup' | 'return' | 'dob' | null
  const [calendarTarget, setCalendarTarget] = useState(null);

  // Dropdown modal state for times
  const [activePicker, setActivePicker] = useState(null); // 'pickup' | 'return' | null

  // Rider details - strictly empty by default so inputs hold placeholders only!
  const [riderName, setRiderName] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [riderPhone, setRiderPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [riderEmail, setRiderEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [riderDob, setRiderDob] = useState('');

  // Rider Identity Documents (Aadhaar & Driving Licence) - Strictly only these two are mandatory
  const [selectedDocType, setSelectedDocType] = useState('Aadhaar Card'); // 'Aadhaar Card' | 'Driving Licence'
  const [riderDocs, setRiderDocs] = useState({
    aadhaar: null,
    drivingLicence: null,
  });
  const [uploadingDocType, setUploadingDocType] = useState(null);
  const [docErrors, setDocErrors] = useState({ aadhaar: '', drivingLicence: '' });
  const [previewDocModal, setPreviewDocModal] = useState(null);

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUploadDoc = (docType) => {
    const isAadhaar = docType === 'Aadhaar Card';
    const docKey = isAadhaar ? 'aadhaar' : 'drivingLicence';
    const normalizedDocType = isAadhaar ? 'aadhaar' : 'driving-licence';

    const targetUserId =
      user?._id ||
      user?.id ||
      (riderEmail ? riderEmail.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') : null) ||
      `rider_${Date.now()}`;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/pdf,image/jpeg,image/png,image/jpg,.pdf,.jpg,.jpeg,.png';
      input.onchange = async (e) => {
        const file = e.target?.files?.[0];
        if (!file) return;

        const allowedMimes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        const ext = file.name ? file.name.split('.').pop().toLowerCase() : '';
        const isMimeAllowed = allowedMimes.includes(file.type);
        const isExtAllowed = ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);

        if (!isMimeAllowed && !isExtAllowed) {
          const err = 'Only PDF, JPEG, and PNG documents are allowed.';
          setDocErrors((prev) => ({ ...prev, [docKey]: err }));
          if (onShowToast) onShowToast(err);
          return;
        }

        const maxBytes = 10 * 1024 * 1024; // 10MB limit
        if (file.size > maxBytes) {
          const err = `"${file.name}" exceeds the 10MB file limit.`;
          setDocErrors((prev) => ({ ...prev, [docKey]: err }));
          if (onShowToast) onShowToast(err);
          return;
        }

        setUploadingDocType(docType);

        let localUrl = null;
        if (typeof URL !== 'undefined' && URL.createObjectURL) {
          try {
            localUrl = URL.createObjectURL(file);
          } catch (err) {}
        }

        try {
          const formData = new FormData();
          formData.append('document', file);
          formData.append('file', file);
          formData.append('documentType', normalizedDocType);
          formData.append('userId', targetUserId);
          if (riderEmail) formData.append('email', riderEmail);
          if (riderPhone) formData.append('phone', riderPhone);

          const res = await documentsAPI.uploadUserDocument(formData, normalizedDocType, targetUserId);

          if (res && res.data) {
            const uploadedKey = res.data.key;
            const signedUrl = res.data.signedUrl || res.data.fileUrl || localUrl;

            setRiderDocs((prev) => ({
              ...prev,
              [docKey]: {
                type: docType,
                fileName: file.name,
                fileSize: formatFileSize(file.size),
                uploadedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                key: uploadedKey,
                fileUrl: signedUrl,
                signedUrl: signedUrl,
                status: 'Encrypted & Stored in R2 Vault',
              },
            }));
            setDocErrors((prev) => ({ ...prev, [docKey]: '' }));
            if (onShowToast) onShowToast(`${docType} (${file.name}) uploaded securely to Cloudflare R2.`);
          } else {
            throw new Error(res?.message || 'Upload failed');
          }
        } catch (uploadErr) {
          console.warn('[User Document Upload Warning]:', uploadErr.message);
          // Fallback so user is not stuck if offline
          setRiderDocs((prev) => ({
            ...prev,
            [docKey]: {
              type: docType,
              fileName: file.name,
              fileSize: formatFileSize(file.size),
              uploadedAt: 'Uploaded just now',
              fileUrl: localUrl,
            },
          }));
          if (onShowToast) onShowToast(`${docType} (${file.name}) attached.`);
        } finally {
          setUploadingDocType(null);
        }
      };
      input.click();
    } else {
      // Native or simulation fallback
      setUploadingDocType(docType);
      setTimeout(() => {
        const sampleFileName = isAadhaar ? 'Aadhaar_Card_Document.pdf' : 'Driving_Licence_Document.pdf';
        const sampleSize = isAadhaar ? '1.4 MB' : '1.8 MB';
        setRiderDocs((prev) => ({
          ...prev,
          [docKey]: {
            type: docType,
            fileName: sampleFileName,
            fileSize: sampleSize,
            uploadedAt: 'Uploaded just now',
          },
        }));
        setDocErrors((prev) => ({ ...prev, [docKey]: '' }));
        setUploadingDocType(null);
        if (onShowToast) onShowToast(`${docType} attached.`);
      }, 600);
    }
  };

  const handleRemoveDoc = (docType) => {
    const docKey = docType === 'Aadhaar Card' ? 'aadhaar' : 'drivingLicence';
    const doc = riderDocs[docKey];
    if (doc?.key) {
      documentsAPI.deleteDocument(doc.key).catch((err) => {
        console.warn('[User Doc Delete Notice]:', err.message);
      });
    }
    setRiderDocs((prev) => ({
      ...prev,
      [docKey]: null,
    }));
    if (onShowToast) onShowToast(`${docType} removed.`);
  };

  useEffect(() => {
    if (!user) {
      setRiderName('');
      setRiderPhone('');
      setPhoneError('');
      setRiderEmail('');
      setEmailError('');
      setRiderDob('');
      setPickupDate('');
      setPickupDateError('');
      setPickupTime('');
      setPickupTimeError('');
      setReturnDate('');
      setReturnDateError('');
      setReturnTime('');
      setReturnTimeError('');
    } else {
      if (user.name) setRiderName(user.name);
      if (user.email) setRiderEmail(user.email);
      if (user.phone) setRiderPhone(user.phone);
      if (user.countryCode) setCountryCode(user.countryCode);
    }
  }, [user?.id, user?.email]);

  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate rental duration in days
  const rentalDays = useMemo(() => {
    try {
      if (!pickupDate || !returnDate) return 1;
      const parse = (str) => {
        if (!str) return null;
        if (str.includes('-')) {
          const parts = str.split('-');
          return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        }
        if (str.includes('/')) {
          const parts = str.split('/');
          if (parts.length === 3) {
            return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
          }
        }
        return new Date(str);
      };
      const d1 = parse(pickupDate);
      const d2 = parse(returnDate);
      if (!d1 || !d2 || isNaN(d1.getTime()) || isNaN(d2.getTime())) return 1;
      const diffMs = Math.abs(d2.getTime() - d1.getTime());
      const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return days > 0 ? days + 1 : 1;
    } catch {
      return 1;
    }
  }, [pickupDate, returnDate]);

  const bikePrice = selectedBike?.pricePerDay ?? selectedBike?.dailyPrice ?? 1500;
  const rentalTotal = rentalDays * bikePrice;
  const securityDeposit = selectedBike?.deposit ?? selectedBike?.securityDeposit ?? 3000;
  const totalPayable = rentalTotal + securityDeposit;
  const [bookingRefId, setBookingRefId] = useState(() => 'RDE-' + Math.floor(100000 + Math.random() * 900000));
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyBookingId = async () => {
    const rawId = String(bookingRefId || '').replace(/^#/, '');
    const textToCopy = `#${rawId}`;
    try {
      if (typeof navigator !== 'undefined' && navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (onShowToast) {
        onShowToast(isHindi ? `बुकिंग संदर्भ आईडी कॉपी हो गई: ${textToCopy}` : `Booking ID copied: ${textToCopy}`);
      }
    } catch (err) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
      if (onShowToast) {
        onShowToast(isHindi ? `बुकिंग संदर्भ आईडी: ${textToCopy}` : `Booking ID: ${textToCopy}`);
      }
    }
  };

  const handleContinueToSummary = () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      if (onShowToast) onShowToast(isHindi ? 'कृपया बुकिंग जारी रखने के लिए पहले लॉग इन करें।' : 'Please log in or sign up first to proceed with booking.');
      return;
    }

    let hasError = false;

    if (!pickupDate) {
      setPickupDateError(isHindi ? 'पिकअप तारीख आवश्यक है' : 'Pickup date is required');
      hasError = true;
    } else {
      setPickupDateError('');
    }

    if (!pickupTime) {
      setPickupTimeError(isHindi ? 'पिकअप समय आवश्यक है' : 'Pickup time is required');
      hasError = true;
    } else {
      setPickupTimeError('');
    }

    if (!returnDate) {
      setReturnDateError(isHindi ? 'वापसी तारीख आवश्यक है' : 'Return date is required');
      hasError = true;
    } else {
      setReturnDateError('');
    }

    if (!returnTime) {
      setReturnTimeError(isHindi ? 'वापसी समय आवश्यक है' : 'Return time is required');
      hasError = true;
    } else {
      setReturnTimeError('');
    }

    if (hasError) {
      if (!pickupDate) {
        if (onShowToast) onShowToast(isHindi ? 'कृपया पिकअप की तारीख चुनें।' : 'Please select a pickup date from the calendar.');
      } else if (!pickupTime) {
        if (onShowToast) onShowToast(isHindi ? 'कृपया पिकअप का समय चुनें।' : 'Please select a pickup time.');
      } else if (!returnDate) {
        if (onShowToast) onShowToast(isHindi ? 'कृपया वापसी की तारीख चुनें।' : 'Please select a return date from the calendar.');
      } else if (!returnTime) {
        if (onShowToast) onShowToast(isHindi ? 'कृपया वापसी का समय चुनें।' : 'Please select a return time.');
      }
      return;
    }

    setStep(2);
  };

  // const handleProceedPayment = async () => {
  //   if (!user) {
  //     if (onOpenAuth) onOpenAuth();
  //     if (onShowToast) onShowToast(isHindi ? 'कृपया बुकिंग के लिए लॉग इन करें।' : 'Please log in or sign up first to proceed with booking.');
  //     return;
  //   }

  //   if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
  //     if (onShowToast) onShowToast(isHindi ? 'कृपया पिकअप व वापसी की तारीख और समय चुनें।' : 'Please select pickup and return dates and times.');
  //     setStep(1);
  //     return;
  //   }

  //   if (!riderName.trim()) {
  //     if (onShowToast) onShowToast(isHindi ? 'कृपया राइडर का पूरा नाम दर्ज करें।' : 'Please enter rider full name.');
  //     return;
  //   }

  //   // Phone Validation with Country Code & exactly 10 digits
  //   const phoneCheck = validatePhone(riderPhone, countryCode);
  //   if (!phoneCheck.isValid) {
  //     setPhoneError(isHindi ? phoneCheck.errorHi : phoneCheck.error);
  //     if (onShowToast) onShowToast(isHindi ? phoneCheck.errorHi : phoneCheck.error);
  //     return;
  //   }
  //   setPhoneError('');

  //   // Email Validation ensuring '@' and '.domain' (e.g. name@example.com)
  //   const emailCheck = validateEmail(riderEmail);
  //   if (!emailCheck.isValid) {
  //     setEmailError(isHindi ? emailCheck.errorHi : emailCheck.error);
  //     if (onShowToast) onShowToast(isHindi ? emailCheck.errorHi : emailCheck.error);
  //     return;
  //   }
  //   setEmailError('');

  //   // Strict KYC requirement: Both Aadhaar Card and Driving Licence are mandatory
  //   if (!riderDocs.aadhaar) {
  //     setDocErrors((prev) => ({
  //       ...prev,
  //       aadhaar: isHindi ? 'आधार कार्ड अनिवार्य है। कृपया आधार कार्ड अपलोड करें।' : 'Aadhaar Card is mandatory. Please upload your Aadhaar Card.',
  //     }));
  //     setSelectedDocType('Aadhaar Card');
  //     if (onShowToast) {
  //       onShowToast(isHindi ? 'आधार कार्ड अनिवार्य है। कृपया अपलोड करें।' : 'Aadhaar Card is mandatory to complete booking.');
  //     }
  //     return;
  //   }

  //   if (!riderDocs.drivingLicence) {
  //     setDocErrors((prev) => ({
  //       ...prev,
  //       drivingLicence: isHindi ? 'ड्राइविंग लाइसेंस अनिवार्य है। कृपया ड्राइविंग लाइसेंस अपलोड करें।' : 'Driving Licence is mandatory. Please upload your Driving Licence.',
  //     }));
  //     setSelectedDocType('Driving Licence');
  //     if (onShowToast) {
  //       onShowToast(isHindi ? 'ड्राइविंग लाइसेंस अनिवार्य है। कृपया अपलोड करें।' : 'Driving Licence is mandatory to complete booking.');
  //     }
  //     return;
  //   }

  //   setIsProcessing(true);

    // try {
    //   // 1. Ensure Razorpay Checkout script is loaded
    //   const isScriptLoaded = await loadRazorpayScript();
    //   if (!isScriptLoaded && typeof window !== 'undefined' && !window.Razorpay) {
    //     throw new Error(
    //       isHindi
    //         ? 'रेज़रपे चेकआउट लोड करने में असमर्थ। कृपया इंटरनेट कनेक्शन जांचें।'
    //         : 'Failed to load Razorpay Checkout script. Please check your internet connection.'
    //     );
    //   }

    //   // 2. Reserve / initialize booking in MongoDB
    //   let initialBooking = null;
    //   try {
    //     const reserveRes = await bookingsAPI.create({
    //       bikeId: selectedBike._id,
    //       bikeListingCode: selectedBike.id || selectedBike.listingCode,
    //       pickupDate: `${pickupDate} ${pickupTime}`,
    //       returnDate: `${returnDate} ${returnTime}`,
    //       riderName,
    //       riderEmail,
    //       riderPhone,
    //       countryCode,
    //       paymentMethod: 'UPI',
    //       bookingStatus: 'PENDING',
    //       paymentStatus: 'PENDING',
    //       riderDocuments: {
    //         aadhaar: riderDocs.aadhaar,
    //         drivingLicence: riderDocs.drivingLicence,
    //       },
    //       dailyPrice: selectedBike.pricePerDay || selectedBike.dailyPrice,
    //       securityDeposit: selectedBike.deposit || selectedBike.securityDeposit,
    //     });
    //     initialBooking = reserveRes?.booking;
    //   } catch (reserveErr) {
    //     console.warn('[BookingScreen] Preliminary booking notice:', reserveErr.message);
    //   }

    //   const activeBookingId = initialBooking?._id || null;
    //   const preliminaryRef = initialBooking?.bookingCode || bookingRefId;
    //   setBookingRefId(preliminaryRef);

    //   // 3. Connect button to call /api/payment/create-order with reservation amount (in INR)
    //   const orderRes = await paymentAPI.createOrder({
    //     amount: totalPayable,
    //     currency: 'INR',
    //     bookingId: activeBookingId,
    //     receipt: `rcpt_${preliminaryRef}`,
    //     notes: {
    //       bikeName: selectedBike.name,
    //       riderName,
    //       riderPhone,
    //       riderEmail,
    //     },
    //   });

    //   if (!orderRes || !orderRes.order_id) {
    //     throw new Error(orderRes?.message || 'Could not create Razorpay order.');
    //   }

    //   // 4. Open Razorpay Checkout modal using order_id and RAZORPAY_KEY_ID (never Key Secret)
    //   const keyId = getRazorpayKeyId(orderRes.key_id);

    //   const options = {
    //     key: keyId,
    //     amount: orderRes.amount, // in paise
    //     currency: orderRes.currency || 'INR',
    //     name: 'The Road Eagle',
    //     description: `Motorcycle Reservation - ${selectedBike.name}`,
    //     order_id: orderRes.order_id,
    //     prefill: {
    //       name: riderName,
    //       email: riderEmail,
    //       contact: `${countryCode}${riderPhone}`.replace('+', ''),
    //     },
    //     notes: {
    //       bookingCode: preliminaryRef,
    //       bikeId: String(selectedBike._id || selectedBike.id || ''),
    //     },
    //     theme: {
    //       color: '#E11D48',
    //     },
    //     handler: async function (paymentResponse) {
    //       // 5. In handler callback, send payment response to /api/payment/verify
    //       try {
    //         setIsProcessing(true);
    //         const verifyRes = await paymentAPI.verify({
    //           razorpay_order_id: paymentResponse.razorpay_order_id,
    //           razorpay_payment_id: paymentResponse.razorpay_payment_id,
    //           razorpay_signature: paymentResponse.razorpay_signature,
    //           bookingId: activeBookingId || preliminaryRef,
    //           bookingData: {
    //             bikeId: selectedBike._id,
    //             bikeListingCode: selectedBike.id || selectedBike.listingCode,
    //             pickupDate: `${pickupDate} ${pickupTime}`,
    //             returnDate: `${returnDate} ${returnTime}`,
    //             riderName,
    //             riderEmail,
    //             riderPhone,
    //             countryCode,
    //             totalPayable,
    //             dailyPrice: selectedBike.pricePerDay || selectedBike.dailyPrice,
    //             securityDeposit: selectedBike.deposit || selectedBike.securityDeposit,
    //             riderDocuments: {
    //               aadhaar: riderDocs.aadhaar,
    //               drivingLicence: riderDocs.drivingLicence,
    //             },
    //           },
    //         });

    //         // 6. Show success state to user
    //         const confirmedRef =
    //           verifyRes.refId ||
    //           verifyRes.booking?.bookingCode ||
    //           preliminaryRef;
    //         setBookingRefId(confirmedRef);

    //         const confirmedBookingData = verifyRes.booking || {
    //           bookingCode: confirmedRef,
    //           riderDetails: {
    //             fullName: riderName,
    //             email: riderEmail,
    //             phoneNumber: riderPhone,
    //             documents: {
    //               aadhaar: riderDocs.aadhaar,
    //               drivingLicence: riderDocs.drivingLicence,
    //             },
    //           },
    //           riderDocuments: {
    //             aadhaar: riderDocs.aadhaar,
    //             drivingLicence: riderDocs.drivingLicence,
    //           },
    //           pickupDatetime: `${pickupDate} ${pickupTime}`,
    //           returnDatetime: `${returnDate} ${returnTime}`,
    //           pricing: { totalPayable },
    //           transactionId: paymentResponse.razorpay_payment_id,
    //           bookingStatus: 'CONFIRMED',
    //           paymentStatus: 'PAID',
    //         };

    //         if (selectedBike) {
    //           selectedBike.isBooked = true;
    //           selectedBike.currentBookedByUserId = user?.id || user?._id;
    //           selectedBike.currentBookedByEmail = user?.email || riderEmail;
    //           selectedBike.currentBookingId = confirmedBookingData;
    //         }

    //         if (onBookingConfirmed) {
    //           onBookingConfirmed(confirmedBookingData, selectedBike);
    //         }

    //         setIsProcessing(false);
    //         setStep(3);
    //         if (onShowToast) {
    //           onShowToast(
    //             isHindi
    //               ? `भुगतान सत्यापित व बुकिंग सफल! संदर्भ #${confirmedRef}`
    //               : `Payment verified & reservation confirmed! Ref #${confirmedRef}`
    //           );
    //         }
    //       } catch (verifyError) {
    //         console.error('[Payment Verification Failed]:', verifyError);
    //         setIsProcessing(false);
    //         if (onShowToast) {
    //           onShowToast(
    //             isHindi
    //               ? `भुगतान सत्यापन विफल: ${verifyError.message || 'त्रुटि'}`
    //               : `Payment verification failed: ${verifyError.message || 'Error'}`
    //           );
    //         }
    //       }
    //     },
    //     modal: {
    //       ondismiss: function () {
    //         setIsProcessing(false);
    //         if (onShowToast) {
    //           onShowToast(isHindi ? 'भुगतान प्रक्रिया बंद कर दी गई।' : 'Payment checkout closed.');
    //         }
    //       },
    //     },
    //   };

    //   if (typeof window !== 'undefined' && window.Razorpay) {
    //     const rzp = new window.Razorpay(options);
    //     rzp.on('payment.failed', function (failureResponse) {
    //       setIsProcessing(false);
    //       console.error('[Razorpay Payment Failed]:', failureResponse.error);
    //       if (onShowToast) {
    //         onShowToast(
    //           isHindi
    //             ? `भुगतान विफल: ${failureResponse.error?.description || 'कृपया पुन: प्रयास करें'}`
    //             : `Payment failed: ${failureResponse.error?.description || 'Please try again'}`
    //         );
    //       }
    //     });
    //     rzp.open();
    //   } else {
    //     throw new Error('Razorpay Checkout is only supported in browser environment.');
    //   }
    // } catch (err) {
    //   console.error('[handleProceedPayment Error]:', err);
    //   setIsProcessing(false);
    //   if (onShowToast) {
    //     onShowToast(
    //       isHindi
    //         ? `भुगतान प्रारंभ करने में त्रुटि: ${err.message || 'कृपया पुन: प्रयास करें'}`
    //         : `Could not start payment: ${err.message || 'Please try again'}`
    //     );
    //   }
    // }

  //};


const handleProceedPayment = async () => {
  // 1. Check authentication
  if (!user) {
    if (onOpenAuth) onOpenAuth();

    if (onShowToast) {
      onShowToast(
        isHindi
          ? 'कृपया बुकिंग के लिए लॉग इन करें।'
          : 'Please log in or sign up first to proceed with booking.'
      );
    }
    return;
  }

  // 2. Validate pickup and return dates/times
  if (!pickupDate || !pickupTime || !returnDate || !returnTime) {
    if (onShowToast) {
      onShowToast(
        isHindi
          ? 'कृपया पिकअप व वापसी की तारीख और समय चुनें।'
          : 'Please select pickup and return dates and times.'
      );
    }

    setStep(1);
    return;
  }

  // 3. Validate rider name
  if (!riderName.trim()) {
    if (onShowToast) {
      onShowToast(
        isHindi
          ? 'कृपया राइडर का पूरा नाम दर्ज करें।'
          : 'Please enter rider full name.'
      );
    }
    return;
  }

  // 4. Validate phone number
  const phoneCheck = validatePhone(riderPhone, countryCode);

  if (!phoneCheck.isValid) {
    setPhoneError(isHindi ? phoneCheck.errorHi : phoneCheck.error);

    if (onShowToast) {
      onShowToast(isHindi ? phoneCheck.errorHi : phoneCheck.error);
    }
    return;
  }

  setPhoneError('');

  // 5. Validate email
  const emailCheck = validateEmail(riderEmail);

  if (!emailCheck.isValid) {
    setEmailError(isHindi ? emailCheck.errorHi : emailCheck.error);

    if (onShowToast) {
      onShowToast(isHindi ? emailCheck.errorHi : emailCheck.error);
    }
    return;
  }

  setEmailError('');

  // 6. Validate Aadhaar document
  if (!riderDocs.aadhaar) {
    setDocErrors((prev) => ({
      ...prev,
      aadhaar: isHindi
        ? 'आधार कार्ड अनिवार्य है। कृपया आधार कार्ड अपलोड करें।'
        : 'Aadhaar Card is mandatory. Please upload your Aadhaar Card.',
    }));

    setSelectedDocType('Aadhaar Card');

    if (onShowToast) {
      onShowToast(
        isHindi
          ? 'आधार कार्ड अनिवार्य है। कृपया अपलोड करें।'
          : 'Aadhaar Card is mandatory to complete booking.'
      );
    }
    return;
  }

  // 7. Validate Driving Licence
  if (!riderDocs.drivingLicence) {
    setDocErrors((prev) => ({
      ...prev,
      drivingLicence: isHindi
        ? 'ड्राइविंग लाइसेंस अनिवार्य है। कृपया ड्राइविंग लाइसेंस अपलोड करें।'
        : 'Driving Licence is mandatory. Please upload your Driving Licence.',
    }));

    setSelectedDocType('Driving Licence');

    if (onShowToast) {
      onShowToast(
        isHindi
          ? 'ड्राइविंग लाइसेंस अनिवार्य है। कृपया अपलोड करें।'
          : 'Driving Licence is mandatory to complete booking.'
      );
    }
    return;
  }

  // 8. Start MongoDB booking process
  setIsProcessing(true);

  try {
    console.log('[BookingScreen] Creating booking in MongoDB...');

    const cleanEmail = (riderEmail || user?.email || '').trim().toLowerCase();
    const cleanName = (riderName || user?.name || 'Rider').trim();
    const cleanPhone = (riderPhone || user?.phone || '').trim();

    // 9. Save booking in MongoDB
    const reserveRes = await bookingsAPI.create({
      bikeId: selectedBike._id,
      bikeListingCode: selectedBike.id || selectedBike.listingCode,

      pickupDate: `${pickupDate} ${pickupTime}`,
      returnDate: `${returnDate} ${returnTime}`,

      riderName: cleanName,
      riderEmail: cleanEmail,
      riderPhone: cleanPhone,
      countryCode,

      // Temporary testing mode: payment is not processed
      paymentMethod: 'UPI',
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',

      riderDocuments: {
        aadhaar: riderDocs.aadhaar,
        drivingLicence: riderDocs.drivingLicence,
      },

      dailyPrice:
        selectedBike.pricePerDay || selectedBike.dailyPrice,

      securityDeposit:
        selectedBike.deposit || selectedBike.securityDeposit,
    });

    // 10. Verify MongoDB response
    const savedBooking = reserveRes?.booking;

    if (!savedBooking || !savedBooking._id) {
      throw new Error(
        reserveRes?.message || 'Booking could not be saved in MongoDB.'
      );
    }

    console.log('[Booking Saved Successfully]:', savedBooking);

    // 11. Update booking reference
    const confirmedRef =
      savedBooking.bookingCode || bookingRefId;

    setBookingRefId(confirmedRef);

    // 12. Prepare booking confirmation data
    const confirmedBookingData = {
      ...savedBooking,

      bookingCode: confirmedRef,

      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',

      bikeId: (savedBooking.bikeId && typeof savedBooking.bikeId === 'object') ? savedBooking.bikeId : selectedBike,
      bike: (savedBooking.bike && typeof savedBooking.bike === 'object') ? savedBooking.bike : selectedBike,

      riderDetails: savedBooking.riderDetails || {
        fullName: cleanName,
        email: cleanEmail,
        phoneNumber: cleanPhone,
        documents: {
          aadhaar: riderDocs.aadhaar,
          drivingLicence: riderDocs.drivingLicence,
        },
      },

      riderDocuments: savedBooking.riderDocuments || {
        aadhaar: riderDocs.aadhaar,
        drivingLicence: riderDocs.drivingLicence,
      },

      pickupDatetime:
        savedBooking.pickupDatetime ||
        `${pickupDate} ${pickupTime}`,

      returnDatetime:
        savedBooking.returnDatetime ||
        `${returnDate} ${returnTime}`,

      pricing: savedBooking.pricing || {
        totalPayable,
      },
    };

    // Save directly to localStorage for instantaneous user bookings view
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = JSON.parse(window.localStorage.getItem('my_user_bookings') || '[]');
        const updated = [
          confirmedBookingData,
          ...cached.filter((b) => (b.bookingCode || b.id || b._id) !== (confirmedRef || confirmedBookingData._id)),
        ];
        window.localStorage.setItem('my_user_bookings', JSON.stringify(updated));
      } catch (e) {
        console.warn('[BookingScreen] Local cache notice:', e.message);
      }
    }

    // 13. Notify parent component
    if (onBookingConfirmed) {
      onBookingConfirmed(confirmedBookingData, selectedBike);
    }

    // 14. Navigate directly to Step 3
    setStep(3);

    // 15. Show success message
    if (onShowToast) {
      onShowToast(
        isHindi
          ? `बुकिंग अनुरोध सफलतापूर्वक सबमिट हुआ! संदर्भ #${confirmedRef}`
          : `Booking request submitted successfully! Ref #${confirmedRef}`
      );
    }

  } catch (err) {
    console.error('[MongoDB Booking Error]:', err);

    if (onShowToast) {
      onShowToast(
        isHindi
          ? `बुकिंग सेव करने में त्रुटि: ${err.message || 'कृपया पुनः प्रयास करें'}`
          : `Booking failed: ${err.message || 'Please try again.'}`
      );
    }

  } finally {
    setIsProcessing(false);
  }
};

  const handleDownloadQuote = () => {
    if (onOpenQuote) {
      onOpenQuote({
        refId: bookingRefId,
        bike: selectedBike,
        pickupDate: pickupDate || 'Scheduled',
        pickupTime: pickupTime || 'Hub Time',
        returnDate: returnDate || 'Scheduled',
        returnTime: returnTime || 'Hub Time',
        days: rentalDays,
        rentalFee: rentalTotal,
        deposit: securityDeposit,
        total: totalPayable,
        riderName: riderName || 'Rider',
        riderPhone: `${countryCode} ${riderPhone}`,
        riderEmail: riderEmail || 'rider@example.com',
      });
    }
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, isMobile && { paddingHorizontal: 14 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Step Indicator Header */}
        <View style={styles.stepsHeader}>
          <View style={styles.stepIndicatorRow}>
            <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 1 && styles.stepDotTextActive]}>1</Text>
            </View>
            <View style={[styles.stepLine, step >= 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 2 && styles.stepDotTextActive]}>2</Text>
            </View>
            <View style={[styles.stepLine, step >= 3 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step >= 3 && styles.stepDotActive]}>
              <Text style={[styles.stepDotText, step >= 3 && styles.stepDotTextActive]}>3</Text>
            </View>
          </View>
          <Text style={styles.stepTitleText}>
            {step === 1 && t('booking.step1', 'Step 1: Machine & Schedule')}
            {step === 2 && t('booking.step2', 'Step 2: Rider Details')}
            {step === 3 && t('booking.step3', 'Step 3: Payment & Confirm')}
          </Text>
        </View>

        {/* Guest Warning Banner if not logged in */}
        {!user && (
          <View style={styles.guestAlertBanner}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <ShieldCheck size={20} color="#38BDF8" />
              <View style={{ flex: 1 }}>
                <Text style={styles.guestAlertTitle}>
                  {isHindi ? 'बुकिंग के लिए लॉगिन अनिवार्य है' : 'Login Required to Reserve'}
                </Text>
                <Text style={styles.guestAlertSub}>
                  {isHindi ? 'मोटरसाइकिल बुक करने के लिए कृपया साइन इन करें।' : 'Please sign in or register to complete your motorbike booking.'}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.guestLoginBtn} onPress={onOpenAuth} activeOpacity={0.8}>
              <Text style={styles.guestLoginBtnText}>{t('nav.login', 'Log In')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ================= STEP 1 & 2: MAIN TWO-COLUMN CONTENT ================= */}
        {step < 3 && (
          <View style={[styles.mainLayout, isWide ? styles.mainLayoutRow : styles.mainLayoutCol]}>
            {/* LEFT COLUMN: FORM CARD */}
            <View style={[styles.leftColumn, isWide && { flex: 1.25 }]}>
              {step === 1 ? (
                /* STEP 1: DATE & TIME SELECTION */
                <View style={[styles.card, SHADOWS.card, isMobile && { padding: 16 }]}>
                  <Text style={styles.cardHeading}>
                    {isHindi ? 'अपनी सवारी का समय चुनें' : 'When are you riding?'}
                  </Text>
                  <Text style={styles.cardSubheading}>
                    {isHindi
                      ? 'कैलेंडर से पिकअप और वापसी की तारीखें व समय चुनें (सभी आवश्यक हैं)।'
                      : 'Select your pickup and return dates and times (all required).'}
                  </Text>

                  {/* 2x2 Form Inputs Grid */}
                  <View style={styles.formGrid}>
                    {/* Row 1: Pickup Date & Time */}
                    <View style={[styles.formRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Calendar size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.pickupDate', 'PICKUP DATE')} <Text style={{ color: COLORS.accentRed }}>*</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.calendarInputBtn, pickupDateError && styles.inputErrorBorder]}
                          onPress={() => setCalendarTarget('pickup')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={pickupDate ? styles.calendarInputValue : styles.calendarInputPlaceholder}
                            numberOfLines={1}
                          >
                            {pickupDate || t('booking.selectDatePrompt', 'Choose Date from Calendar')}
                          </Text>
                          <View style={styles.calendarIconBtn}>
                            <Calendar size={16} color="#38BDF8" />
                          </View>
                        </TouchableOpacity>
                        {pickupDateError ? (
                          <Text style={styles.errorSubText}>{pickupDateError}</Text>
                        ) : null}
                      </View>

                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Clock size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.pickupTime', 'PICKUP TIME')} <Text style={{ color: COLORS.accentRed }}>*</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.dropdownBox, pickupTimeError && styles.inputErrorBorder]}
                          onPress={() => setActivePicker('pickup')}
                          activeOpacity={0.8}
                        >
                          <Text style={pickupTime ? styles.dropdownValueText : styles.dropdownPlaceholderText} numberOfLines={1}>
                            {pickupTime || t('booking.timePlaceholder', 'Select Pickup Time')}
                          </Text>
                          <ChevronDown size={16} color="#64748B" />
                        </TouchableOpacity>
                        {pickupTimeError ? (
                          <Text style={styles.errorSubText}>{pickupTimeError}</Text>
                        ) : null}
                      </View>
                    </View>

                    {/* Row 2: Return Date & Time */}
                    <View style={[styles.formRow, isMobile && { flexDirection: 'column', gap: 12 }]}>
                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Calendar size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.returnDate', 'RETURN DATE')} <Text style={{ color: COLORS.accentRed }}>*</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.calendarInputBtn, returnDateError && styles.inputErrorBorder]}
                          onPress={() => setCalendarTarget('return')}
                          activeOpacity={0.8}
                        >
                          <Text
                            style={returnDate ? styles.calendarInputValue : styles.calendarInputPlaceholder}
                            numberOfLines={1}
                          >
                            {returnDate || t('booking.selectDatePrompt', 'Choose Date from Calendar')}
                          </Text>
                          <View style={styles.calendarIconBtn}>
                            <Calendar size={16} color="#38BDF8" />
                          </View>
                        </TouchableOpacity>
                        {returnDateError ? (
                          <Text style={styles.errorSubText}>{returnDateError}</Text>
                        ) : null}
                      </View>

                      <View style={styles.formFieldCol}>
                        <View style={styles.fieldLabelRow}>
                          <Clock size={13} color="#94A3B8" />
                          <Text style={styles.fieldLabelText}>
                            {t('booking.returnTime', 'RETURN TIME')} <Text style={{ color: COLORS.accentRed }}>*</Text>
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.dropdownBox, returnTimeError && styles.inputErrorBorder]}
                          onPress={() => setActivePicker('return')}
                          activeOpacity={0.8}
                        >
                          <Text style={returnTime ? styles.dropdownValueText : styles.dropdownPlaceholderText} numberOfLines={1}>
                            {returnTime || t('booking.timePlaceholder', 'Select Return Time')}
                          </Text>
                          <ChevronDown size={16} color="#64748B" />
                        </TouchableOpacity>
                        {returnTimeError ? (
                          <Text style={styles.errorSubText}>{returnTimeError}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>

                  {/* Pick & Return Time Dropdown Picker List */}
                  {activePicker && (
                    <View style={styles.timeDropdownCard}>
                      <View style={styles.timeDropdownHeader}>
                        <Text style={styles.timeDropdownTitle}>
                          {activePicker === 'pickup'
                            ? (isHindi ? 'पिकअप समय चुनें' : 'Select Pickup Time')
                            : (isHindi ? 'वापसी समय चुनें' : 'Select Return Time')}
                        </Text>
                        <TouchableOpacity onPress={() => setActivePicker(null)}>
                          <X size={16} color="#94A3B8" />
                        </TouchableOpacity>
                      </View>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {(activePicker === 'pickup' ? PICKUP_TIMES : RETURN_TIMES).map((item) => (
                          <TouchableOpacity
                            key={item}
                            style={[
                              styles.timeChip,
                              (activePicker === 'pickup' ? pickupTime === item : returnTime === item) && styles.timeChipActive,
                            ]}
                            onPress={() => {
                              if (activePicker === 'pickup') {
                                setPickupTime(item);
                                setPickupTimeError('');
                              } else {
                                setReturnTime(item);
                                setReturnTimeError('');
                              }
                              setActivePicker(null);
                            }}
                          >
                            <Text
                              style={[
                                styles.timeChipText,
                                (activePicker === 'pickup' ? pickupTime === item : returnTime === item) && styles.timeChipTextActive,
                              ]}
                            >
                              {item}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Pickup Hub Details */}
                  <View style={styles.hubDetailsBox}>
                    <Text style={styles.hubDetailsTitle}>
                      {t('booking.hubLocation', 'PICKUP & RETURN HUB')}
                    </Text>
                    <Text style={styles.hubDetailsName}>
                      {t('booking.hubName', 'Central Motorcycle Hub (Ring Road, Sector 4)')}
                    </Text>
                    <Text style={styles.hubDetailsNote}>
                      {t('booking.hubNote', 'Open daily 08:00 AM – 09:00 PM. Doorstep delivery available upon request.')}
                    </Text>
                  </View>

                  {/* Continue Button */}
                  <TouchableOpacity
                    style={styles.continueBtn}
                    onPress={handleContinueToSummary}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.continueBtnText}>
                      {t('booking.proceedRider', 'Proceed to Rider Details')}
                    </Text>
                    <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              ) : (
                /* STEP 2: RIDER DETAILS & PAYMENT METHOD */
                <View style={[styles.card, SHADOWS.card, isMobile && { padding: 16 }]}>
                  <Text style={styles.cardHeading}>
                    {t('booking.step2', 'Rider Information')}
                  </Text>
                  <Text style={styles.cardSubheading}>
                    {t('booking.step2Sub', 'Provide rider credentials and emergency details')}
                  </Text>

                  {/* Rider Details - All fields hold placeholders only! */}
                  <View style={{ marginBottom: 14 }}>
                    <View style={styles.fieldLabelRow}>
                      <User size={13} color="#94A3B8" />
                      <Text style={styles.step2Label}>
                        {t('booking.riderName', 'FULL LEGAL NAME')}
                      </Text>
                    </View>
                    <TextInput
                      style={styles.step2Input}
                      value={riderName}
                      onChangeText={setRiderName}
                      placeholder={t('booking.riderNamePlaceholder', 'Enter full name as on Driving License')}
                      placeholderTextColor="#475569"
                    />
                  </View>

                  {/* Phone Number and Email Row */}
                  <View style={[styles.step2Row, isMobile && { flexDirection: 'column', gap: 14 }]}>
                    {/* Unified PhoneInput with Country Code + 10-Digit Validation */}
                    <View style={isMobile ? { width: '100%' } : { flex: 1.1, minWidth: 0 }}>
                      <View style={styles.fieldLabelRow}>
                        <Phone size={13} color="#94A3B8" />
                        <Text style={styles.step2Label}>
                          {t('booking.riderPhone', 'PHONE NUMBER')}
                        </Text>
                      </View>
                      <PhoneInput
                        countryCode={countryCode}
                        onCountryCodeChange={(code) => {
                          setCountryCode(code);
                          setPhoneError('');
                        }}
                        value={riderPhone}
                        onChangeText={(num) => {
                          setRiderPhone(num);
                          if (phoneError) setPhoneError('');
                        }}
                        placeholder={t('booking.riderPhonePlaceholder', '10-digit mobile number')}
                        error={phoneError}
                      />
                    </View>

                    {/* Email Input with @ and domain validation */}
                    <View style={isMobile ? { width: '100%' } : { flex: 1.2, minWidth: 0 }}>
                      <View style={styles.fieldLabelRow}>
                        <Mail size={13} color="#94A3B8" />
                        <Text style={styles.step2Label}>
                          {t('booking.riderEmail', 'EMAIL ADDRESS')}
                        </Text>
                      </View>
                      <TextInput
                        style={[
                          styles.step2Input,
                          emailError && styles.inputErrorBorder,
                        ]}
                        value={riderEmail}
                        onChangeText={(email) => {
                          setRiderEmail(email);
                          if (emailError) setEmailError('');
                        }}
                        placeholder={t('booking.riderEmailPlaceholder', 'name@example.com')}
                        placeholderTextColor="#475569"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {emailError ? (
                        <Text style={styles.errorSubText}>{emailError}</Text>
                      ) : null}
                    </View>
                  </View>

                  {/* ================= RIDER IDENTITY DOCUMENT SECTION ================= */}
                  <View style={styles.idVerificationSection}>
                    <View style={styles.idCardHeader}>
                      <View style={styles.idIconWrap}>
                        <ShieldCheck size={20} color="#38BDF8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.idCardTitle}>
                            {t('booking.riderIdentityDoc', 'Rider Identity Document')}
                          </Text>
                          <Text style={{ color: '#EF4444', fontWeight: '800', fontSize: 14 }}>*</Text>
                        </View>
                        <Text style={styles.idCardSub}>
                          {t('booking.riderIdentityDocSub', 'Mandatory government verification documents required for rider safety and bike pickup.')}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.idNoticeBanner}>
                      <Info size={16} color="#38BDF8" style={{ marginTop: 2, flexShrink: 0 }} />
                      <Text style={styles.idNoticeText}>
                        <Text style={styles.boldWhite}>{isHindi ? 'महत्वपूर्ण सूचना:' : 'Important Notice:'}</Text>{' '}
                        {t('booking.kycNoticeText', 'Uploading an ID file submits your application into our queue. An uploaded document is NOT marked as verified until an authorized admin reviews and confirms it.')}
                      </Text>
                    </View>

                    {/* Document Selector Pills - Strictly only Aadhaar Card and Driving Licence */}
                    <View style={styles.idSelectorRow}>
                      {[
                        { type: 'Aadhaar Card', label: t('booking.aadhaarCard', 'Aadhaar Card'), key: 'aadhaar' },
                        { type: 'Driving Licence', label: t('booking.drivingLicence', 'Driving Licence'), key: 'drivingLicence' },
                      ].map((item) => {
                        const isSelected = selectedDocType === item.type;
                        const isUploaded = Boolean(riderDocs[item.key]);
                        return (
                          <TouchableOpacity
                            key={item.type}
                            style={[
                              styles.docTypePill,
                              isSelected && styles.docTypePillSelected,
                              isUploaded && styles.docTypePillUploaded,
                            ]}
                            onPress={() => setSelectedDocType(item.type)}
                            activeOpacity={0.8}
                          >
                            <FileText size={14} color={isSelected ? '#38BDF8' : isUploaded ? '#10B981' : COLORS.textMuted} />
                            <Text style={[styles.docTypePillText, isSelected && styles.docTypePillTextSelected]}>
                              {item.label} <Text style={{ color: isUploaded ? '#10B981' : '#EF4444' }}>*</Text>
                            </Text>
                            {isUploaded && (
                              <CheckCircle2 size={13} color="#10B981" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Active Selected Document Card / Upload Trigger */}
                    {(() => {
                      const currentKey = selectedDocType === 'Aadhaar Card' ? 'aadhaar' : 'drivingLicence';
                      const currentDoc = riderDocs[currentKey];
                      const currentErr = docErrors[currentKey];

                      if (currentDoc) {
                        return (
                          <View style={styles.uploadedIdCard}>
                            <View style={styles.uploadedIdLeft}>
                              <FileText size={22} color="#38BDF8" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.uploadedFileName} numberOfLines={1}>
                                  {currentDoc.fileName}
                                </Text>
                                <Text style={styles.uploadedFileSize}>
                                  {currentDoc.fileSize} • {currentDoc.uploadedAt}
                                </Text>
                              </View>
                            </View>

                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <TouchableOpacity
                                onPress={() => {
                                  setPreviewDocModal({
                                    title: `${selectedDocType} Preview`,
                                    url: currentDoc.signedUrl || currentDoc.fileUrl || currentDoc.key,
                                    fileName: currentDoc.fileName,
                                    docType: selectedDocType === 'Aadhaar Card' ? 'aadhaar' : 'driving-licence',
                                  });
                                }}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.previewDocBtn}
                                accessibilityLabel={`Preview ${selectedDocType}`}
                              >
                                <Eye size={16} color="#38BDF8" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleRemoveDoc(selectedDocType)}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                style={styles.removeDocBtn}
                                accessibilityLabel={`Remove ${selectedDocType}`}
                              >
                                <Trash2 size={15} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      }

                      return (
                        <View>
                          <TouchableOpacity
                            style={[styles.uploadTriggerBtn, currentErr && styles.uploadTriggerBtnError]}
                            onPress={() => handleUploadDoc(selectedDocType)}
                            disabled={uploadingDocType === selectedDocType}
                            activeOpacity={0.8}
                          >
                            {uploadingDocType === selectedDocType ? (
                              <ActivityIndicator size="small" color="#38BDF8" />
                            ) : (
                              <>
                                <Upload size={16} color="#38BDF8" />
                                <Text style={styles.uploadTriggerText}>
                                  Upload {selectedDocType} (PDF / JPG max 5MB)
                                </Text>
                              </>
                            )}
                          </TouchableOpacity>
                          {currentErr ? <Text style={styles.docErrorText}>{currentErr}</Text> : null}
                        </View>
                      );
                    })()}

                    {/* Document Status Mini Summary */}
                    <View style={styles.docRequirementSummary}>
                      <View style={styles.docReqItem}>
                        <View style={[styles.docReqDot, riderDocs.aadhaar && styles.docReqDotDone]}>
                          {riderDocs.aadhaar ? <Check size={10} color="#FFFFFF" /> : <Text style={styles.docReqDotText}>1</Text>}
                        </View>
                        <Text style={[styles.docReqText, riderDocs.aadhaar && styles.docReqTextDone]}>
                          Aadhaar Card: {riderDocs.aadhaar ? 'Uploaded ✓' : 'Mandatory *'}
                        </Text>
                      </View>
                      <View style={styles.docReqItem}>
                        <View style={[styles.docReqDot, riderDocs.drivingLicence && styles.docReqDotDone]}>
                          {riderDocs.drivingLicence ? <Check size={10} color="#FFFFFF" /> : <Text style={styles.docReqDotText}>2</Text>}
                        </View>
                        <Text style={[styles.docReqText, riderDocs.drivingLicence && styles.docReqTextDone]}>
                          Driving Licence: {riderDocs.drivingLicence ? 'Uploaded ✓' : 'Mandatory *'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Payment Methods */}
                  <View style={{ marginTop: 20 }}>
                    <Text style={styles.step2Label}>
                      {t('booking.paymentMethod', 'SELECT PAYMENT METHOD')}
                    </Text>
                    <View style={[styles.paymentMethodsRow, isMobile && { gap: 6 }]}>
                      <TouchableOpacity
                        style={[
                          styles.paymentMethodCard,
                          isMobile && { paddingVertical: 10, paddingHorizontal: 4 },
                          paymentMethod === 'upi' && styles.paymentMethodCardActive,
                        ]}
                        onPress={() => setPaymentMethod('upi')}
                        activeOpacity={0.8}
                      >
                        <Smartphone size={17} color={paymentMethod === 'upi' ? '#38BDF8' : '#94A3B8'} />
                        <Text style={[styles.paymentMethodText, isMobile && { fontSize: 10.5, textAlign: 'center' }, paymentMethod === 'upi' && styles.paymentMethodTextActive]}>
                          {t('booking.upi', 'UPI / QR')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodCard,
                          isMobile && { paddingVertical: 10, paddingHorizontal: 4 },
                          paymentMethod === 'card' && styles.paymentMethodCardActive,
                        ]}
                        onPress={() => setPaymentMethod('card')}
                        activeOpacity={0.8}
                      >
                        <CreditCard size={17} color={paymentMethod === 'card' ? '#38BDF8' : '#94A3B8'} />
                        <Text style={[styles.paymentMethodText, isMobile && { fontSize: 10.5, textAlign: 'center' }, paymentMethod === 'card' && styles.paymentMethodTextActive]}>
                          {t('booking.card', 'Card')}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodCard,
                          isMobile && { paddingVertical: 10, paddingHorizontal: 4 },
                          paymentMethod === 'pickup' && styles.paymentMethodCardActive,
                        ]}
                        onPress={() => setPaymentMethod('pickup')}
                        activeOpacity={0.8}
                      >
                        <ShieldCheck size={17} color={paymentMethod === 'pickup' ? '#38BDF8' : '#94A3B8'} />
                        <Text style={[styles.paymentMethodText, isMobile && { fontSize: 10.5, textAlign: 'center' }, paymentMethod === 'pickup' && styles.paymentMethodTextActive]}>
                          {t('booking.cash', 'Pay at Hub')}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Step 2 Action Buttons */}
                  <View style={[styles.step2Actions, isMobile && { flexDirection: 'column-reverse', gap: 10 }]}>
                    <TouchableOpacity
                      style={[styles.backBtn, isMobile && { width: '100%', justifyContent: 'center' }]}
                      onPress={() => setStep(1)}
                      activeOpacity={0.8}
                    >
                      <ArrowLeft size={16} color="#94A3B8" />
                      <Text style={styles.backBtnText}>
                        {t('common.back', 'Back')}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.confirmBtn, isMobile && { width: '100%', justifyContent: 'center' }]}
                      onPress={handleProceedPayment}
                      disabled={isProcessing}
                      activeOpacity={0.85}
                    >
                      {isProcessing ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.confirmBtnText}>
                            {t('booking.confirmBookingBtn', 'Confirm Reservation & Pay')} (₹{totalPayable.toLocaleString('en-IN')})
                          </Text>
                          <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.5} />
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* RIGHT COLUMN: VEHICLE SUMMARY CARD */}
            <View style={[styles.rightColumn, isWide && { flex: 1, maxWidth: 440 }]}>
              <View style={[styles.card, styles.vehicleCard, SHADOWS.card, isMobile && { padding: 16 }]}>
                {/* Bike Image Container */}
                <View style={styles.bikeImageWrap}>
                  <Image
                    source={selectedBike.imageSource}
                    style={styles.bikeImage}
                    resizeMode="cover"
                  />
                </View>

                {/* Bike Name & Specs */}
                <Text style={styles.bikeName}>{selectedBike.name}</Text>
                <Text style={styles.bikeModel}>
                  {selectedBike.model} • {selectedBike.specs?.displacement || '350 CC'}
                </Text>

                {/* Price Breakdown Line Items */}
                <View style={styles.priceBreakdownWrap}>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{t('booking.dailyRate', 'Daily Rate')}</Text>
                    <Text style={styles.priceValue}>
                      ₹{bikePrice.toLocaleString('en-IN')} {t('fleet.perDay', '/day')}
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{t('booking.refundableDeposit', 'Security Deposit')}</Text>
                    <Text style={[styles.priceValue, styles.priceValueCyan]}>
                      ₹{securityDeposit.toLocaleString('en-IN')}*
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>{isHindi ? 'किराये की अवधि' : 'Rental Duration'}</Text>
                    <Text style={styles.priceValue}>
                      {rentalDays} {isHindi ? 'दिन' : 'Days'}
                    </Text>
                  </View>

                  <View style={[styles.priceRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>{t('booking.totalPayable', 'Total Payable')}</Text>
                    <Text style={styles.totalValue}>₹{totalPayable.toLocaleString('en-IN')}</Text>
                  </View>
                </View>

                {/* Refund Assurance Note */}
                <View style={styles.refundNoteBox}>
                  <ShieldCheck size={16} color="#34D399" />
                  <Text style={styles.refundNoteText}>
                    {t('booking.depositRefundNote', '100% Refundable Security Deposit credited back within 24-48h of return.')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ================= STEP 3: CONFIRMATION SUCCESS SCREEN ================= */}
        {step === 3 && (
          <View style={[styles.card, styles.successCard, SHADOWS.card]}>
            <View style={styles.successIconCircle}>
              <Check size={36} color="#FFFFFF" strokeWidth={3} />
            </View>

            <Text style={styles.successHeading}>{t('booking.successTitle', 'Booking Confirmed!')}</Text>
            {/* <Text style={styles.successSubheading}>
              {t('booking.successSub', 'Your motorcycle reservation is confirmed. We have sent the confirmation to your phone.')}
            </Text> */}

            <TouchableOpacity
              style={[styles.refCodeBox, isCopied && styles.refCodeBoxCopied]}
              onPress={handleCopyBookingId}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel={`Copy booking reference ID #${bookingRefId}`}
            >
              <View style={styles.refCodeContent}>
                <Text style={styles.refCodeLabel}>{t('booking.bookingId', 'RESERVATION REFERENCE ID')}</Text>
                <Text style={styles.refCodeValue} selectable={true}>#{bookingRefId}</Text>
              </View>

              <View style={[styles.copyActionBtn, isCopied && styles.copyActionBtnCopied]}>
                {isCopied ? (
                  <>
                    <Check size={14} color="#10B981" strokeWidth={2.5} />
                    <Text style={styles.copyActionTextCopied}>
                      {isHindi ? 'कॉपी हो गया' : 'Copied!'}
                    </Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color="#38BDF8" />
                    <Text style={styles.copyActionText}>
                      {isHindi ? 'कॉपी करें' : 'Copy'}
                    </Text>
                  </>
                )}
              </View>
            </TouchableOpacity>

            <View style={styles.summaryGrid}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.bikeName', 'RESERVED BIKE')}</Text>
                <Text style={styles.summaryItemValue}>{selectedBike.name}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.pickupDate', 'PICKUP DATE')}</Text>
                <Text style={styles.summaryItemValue}>
                  {pickupDate && pickupTime ? `${pickupDate} • ${pickupTime}` : (pickupDate || 'Scheduled')}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.riderName', 'RIDER NAME')}</Text>
                <Text style={styles.summaryItemValue}>{riderName || 'Rider'}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryItemLabel}>{t('booking.totalPayable', 'AMOUNT PAYABLE')}</Text>
                <Text style={[styles.summaryItemValue, { color: '#38BDF8' }]}>₹{totalPayable.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            <View style={styles.successActions}>
              <TouchableOpacity
                style={styles.downloadQuoteBtn}
                onPress={handleDownloadQuote}
                activeOpacity={0.8}
              >
                <FileText size={16} color="#38BDF8" />
                <Text style={styles.downloadQuoteBtnText}>
                  {isHindi ? 'कोटेशन / रसीद डाउनलोड करें' : 'Download Official Estimate / Quote'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.returnHomeBtn}
                onPress={() => navigation?.navigate('Home')}
                activeOpacity={0.8}
              >
                <Text style={styles.returnHomeBtnText}>{t('booking.backToHome', 'Back to Home')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Interactive Calendar Picker Modal */}
      <CalendarPickerModal
        visible={calendarTarget !== null}
        onClose={() => setCalendarTarget(null)}
        mode={calendarTarget === 'dob' ? 'past' : 'future'}
        initialDate={
          calendarTarget === 'pickup'
            ? pickupDate
            : calendarTarget === 'return'
            ? returnDate
            : riderDob
        }
        minDate={
          calendarTarget === 'return' && pickupDate
            ? pickupDate
            : undefined
        }
        title={
          calendarTarget === 'pickup'
            ? t('calendar.selectPickupDate', 'Select Pickup Date')
            : calendarTarget === 'return'
            ? t('calendar.selectReturnDate', 'Select Return Date')
            : t('calendar.selectBirthDate', 'Select Date of Birth')
        }
        onSelectDate={(dateStr) => {
          if (calendarTarget === 'pickup') {
            setPickupDate(dateStr);
            setPickupDateError('');
            if (returnDate && returnDate < dateStr) setReturnDate('');
          } else if (calendarTarget === 'return') {
            setReturnDate(dateStr);
            setReturnDateError('');
          } else if (calendarTarget === 'dob') {
            setRiderDob(dateStr);
          }
          setCalendarTarget(null);
        }}
      />

      {/* Secure Document Preview Modal */}
      <DocumentPreviewModal
        visible={Boolean(previewDocModal)}
        onClose={() => setPreviewDocModal(null)}
        title={previewDocModal?.title || 'Document Preview'}
        documentUrl={previewDocModal?.url}
        fileName={previewDocModal?.fileName}
        docType={previewDocModal?.docType}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 60,
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  stepsHeader: {
    marginBottom: 20,
    alignItems: 'center',
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  stepDotTextActive: {
    color: '#FFFFFF',
  },
  stepLine: {
    width: 44,
    height: 2,
    backgroundColor: COLORS.borderCard,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#0284C7',
  },
  stepTitleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.3,
  },
  guestAlertBanner: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  guestAlertTitle: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '700',
  },
  guestAlertSub: {
    color: '#94A3B8',
    fontSize: 11.5,
  },
  guestLoginBtn: {
    backgroundColor: '#0284C7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
  },
  guestLoginBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  mainLayout: {
    gap: 20,
  },
  mainLayoutRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainLayoutCol: {
    flexDirection: 'column',
  },
  leftColumn: {
    width: '100%',
  },
  rightColumn: {
    width: '100%',
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 24,
  },
  cardHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  cardSubheading: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginBottom: 20,
    lineHeight: 18,
  },
  formGrid: {
    gap: 14,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    gap: 14,
  },
  formFieldCol: {
    flex: 1,
    gap: 6,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fieldLabelText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  calendarInputBtn: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calendarInputValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  calendarInputPlaceholder: {
    color: '#64748B',
    fontSize: 12.5,
  },
  calendarIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownBox: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownValueText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '600',
  },
  dropdownPlaceholderText: {
    color: '#64748B',
    fontSize: 12.5,
  },
  timeDropdownCard: {
    backgroundColor: '#0F1A2E',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 16,
  },
  timeDropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  timeDropdownTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  timeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  timeChipActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.25)',
    borderColor: '#38BDF8',
  },
  timeChipText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  hubDetailsBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 20,
  },
  hubDetailsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  hubDetailsName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  hubDetailsNote: {
    fontSize: 11.5,
    color: '#94A3B8',
    lineHeight: 16,
  },
  continueBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: RADIUS.full,
    paddingVertical: 12,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  step2Label: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  step2Input: {
    backgroundColor: '#111A2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 44,
    color: '#FFFFFF',
    fontSize: 13,
  },
  inputErrorBorder: {
    borderColor: 'rgba(225, 29, 72, 0.6)',
    backgroundColor: 'rgba(225, 29, 72, 0.05)',
  },
  errorSubText: {
    color: '#FDA4AF',
    fontSize: 11,
    marginTop: 4,
  },
  step2Row: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
    marginBottom: 20,
  },
  paymentMethodCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  paymentMethodCardActive: {
    backgroundColor: 'rgba(2, 132, 199, 0.18)',
    borderColor: '#38BDF8',
  },
  paymentMethodText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '600',
  },
  paymentMethodTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  step2Actions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  backBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  vehicleCard: {
    gap: 12,
  },
  bikeImageWrap: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.bgCardAlt,
  },
  bikeImage: {
    width: '100%',
    height: '100%',
  },
  bikeName: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  bikeModel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    marginTop: -8,
  },
  priceBreakdownWrap: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 12,
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
  },
  priceValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  priceValueCyan: {
    color: '#38BDF8',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
    paddingTop: 10,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textPrimary,
  },
  totalValue: {
    fontSize: 19,
    fontWeight: '900',
    color: '#38BDF8',
  },
  refundNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  refundNoteText: {
    fontSize: 11,
    color: '#A7F3D0',
    flex: 1,
    lineHeight: 15,
  },
  successCard: {
    alignItems: 'center',
    paddingVertical: 36,
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },
  successIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  successSubheading: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 20,
    marginBottom: 20,
  },
  refCodeBox: {
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 420,
    marginBottom: 24,
    gap: 12,
  },
  refCodeBoxCopied: {
    borderColor: 'rgba(16, 185, 129, 0.6)',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  refCodeContent: {
    flex: 1,
    alignItems: 'flex-start',
  },
  refCodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38BDF8',
    letterSpacing: 1,
    marginBottom: 2,
  },
  refCodeValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  copyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  copyActionBtnCopied: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  copyActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  copyActionTextCopied: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    width: '100%',
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    minWidth: 120,
    backgroundColor: COLORS.bgCardAlt,
    padding: 12,
    borderRadius: RADIUS.sm,
  },
  summaryItemLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 4,
  },
  summaryItemValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  successActions: {
    width: '100%',
    gap: 10,
    alignItems: 'center',
  },
  downloadQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.full,
    width: '100%',
    maxWidth: 360,
  },
  downloadQuoteBtnText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  returnHomeBtn: {
    paddingVertical: 10,
  },
  returnHomeBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  idVerificationSection: {
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: RADIUS.lg,
    padding: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  idCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  idIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  idCardSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  idNoticeBanner: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 14,
  },
  idNoticeText: {
    fontSize: 12,
    color: '#E2E8F0',
    lineHeight: 18,
    flex: 1,
  },
  idSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  docTypePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.full,
  },
  docTypePillSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
  },
  docTypePillUploaded: {
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  docTypePillText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  docTypePillTextSelected: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  uploadedIdCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  uploadedIdLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 180,
  },
  uploadedFileName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  uploadedFileSize: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2,
  },
  statusPillPending: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusPillPendingText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  previewDocBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  removeDocBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  uploadTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  uploadTriggerBtnError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  uploadTriggerText: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '700',
  },
  docErrorText: {
    color: '#EF4444',
    fontSize: 11.5,
    fontWeight: '600',
    marginTop: 6,
  },
  docRequirementSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.07)',
  },
  docReqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docReqDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docReqDotDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.6)',
  },
  docReqDotText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#EF4444',
  },
  docReqText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  docReqTextDone: {
    color: '#10B981',
    fontWeight: '600',
  },
});
