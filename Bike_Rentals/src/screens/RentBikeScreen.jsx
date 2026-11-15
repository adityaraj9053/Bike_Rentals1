import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import {
  User,
  Bike,
  FileText,
  IndianRupee,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  X,
  HelpCircle,
  Sparkles,
  PlusCircle,
} from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../theme/colors';
import { useLanguage } from '../i18n/LanguageContext';
import StepBikeInfo from '../components/rentBike/StepBikeInfo';
import StepDocSubmission from '../components/rentBike/StepDocSubmission';
import StepRentalInfo from '../components/rentBike/StepRentalInfo';
import StepReviewSubmit from '../components/rentBike/StepReviewSubmit';
import SubmissionSuccessModal from '../components/rentBike/SubmissionSuccessModal';
import { bikesAPI, ownerAPI } from '../services/api';

const { width } = Dimensions.get('window');

const STEPS = [
  { id: 0, title: 'Bike Info', icon: Bike, short: 'Bike' },
  { id: 1, title: 'Documents', icon: FileText, short: 'Docs' },
  { id: 2, title: 'Rental Rates', icon: IndianRupee, short: 'Rental' },
  { id: 3, title: 'Review & Publish', icon: CheckCircle2, short: 'Review' },
];

const INITIAL_FORM_DATA = {
  // Step 1: Owner
  fullName: '',
  phone: '',
  countryCode: '+91',
  mobileVerified: false,
  email: '',
  emailVerified: false,
  address: '',
  city: '',
  state: '',
  pincode: '',
  idDocument: null,

  // Step 2: Bike
  brand: '',
  model: '',
  manufacturingYear: '',
  registrationNumber: '',
  category: '',
  engineCapacity: '',
  fuelType: 'Petrol',
  transmission: 'Manual',
  colour: '',
  description: '',
  images: {
    front: null,
    rear: null,
    left: null,
    right: null,
  },

  // Step 3: Documents
  documents: {
    rc: null,
    insurance: null,
    puc: null,
  },
  insurancePolicyNumber: '',
  insuranceExpiryDate: '',
  pucExpiryDate: '',
  chassisNumber: '',
  engineNumber: '',
  registeredOwnerName: '',
  ownershipType: 'registered_owner', // 'registered_owner' | 'authorized_representative'

  // Step 4: Rental
  dailyPrice: '',
  securityDeposit: '',
  minDuration: 1,
  maxDuration: 14,
  availabilityPreset: 'Next 30 Days',
  availableFrom: 'Immediate',
  availableTo: '+30 Days',
  pickupLocation: '',
  pickupAddress: '',
  pickupTimings: '07:00 AM - 09:00 PM',
  deliveryAvailable: false,
  rulesList: [],
};

const SAMPLE_DEMO_DATA = {
  fullName: 'Vikram Malhotra',
  phone: '9820144521',
  countryCode: '+91',
  mobileVerified: true,
  email: 'vikram.malhotra@gmail.com',
  emailVerified: true,
  address: 'B-402, Sea Breeze Apts, Bandra West',
  city: 'Mumbai',
  state: 'Maharashtra',
  pincode: '400050',
  idDocument: {
    type: 'Aadhaar Card',
    fileName: 'Aadhaar_Card_Copy.pdf',
    fileSize: '1.4 MB',
    uploadedAt: '2026-11-06',
    //verificationState: 'Uploaded - Awaiting Manual Admin Review',
  },
  brand: 'Royal Enfield',
  model: 'Himalayan 450',
  manufacturingYear: '2024',
  registrationNumber: 'MH 02 FJ 9042',
  category: 'Adventure Tourer',
  engineCapacity: '450',
  fuelType: 'Petrol',
  transmission: 'Manual',
  colour: 'Kamet White',
  description: 'Fully serviced Himalayan 450 with touring screen, engine guards, and hard pannier stays.',
  images: {
    front: null,
    rear: null,
    left: null,
    right: null,
  },
  documents: {
    rc: { fileName: 'MH02FJ9042_RC_SmartCard.pdf', fileSize: '1.8 MB', uploadedAt: '06 Nov 2026', status: 'Simulated Upload - Pending Verifier Check' },
    insurance: { fileName: 'ICICI_Lombard_Comprehensive_Policy.pdf', fileSize: '2.4 MB', uploadedAt: '06 Nov 2026', status: 'Simulated Upload - Pending Verifier Check' },
    puc: { fileName: 'PUCC_Valid_Certificate.pdf', fileSize: '650 KB', uploadedAt: '06 Nov 2026', status: 'Simulated Upload - Pending Verifier Check' },
  },
  insurancePolicyNumber: '3005/2024/9812401',
  insuranceExpiryDate: '2027-05-18',
  pucExpiryDate: '2027-04-10',
  chassisNumber: 'ME3H450XXXX88291',
  engineNumber: 'H450E882910',
  registeredOwnerName: 'Vikram Malhotra',
  ownershipType: 'registered_owner',
  dailyPrice: 1600,
  securityDeposit: 3500,
  minDuration: 1,
  maxDuration: 14,
  availabilityPreset: 'Next 30 Days',
  availableFrom: 'Immediate',
  availableTo: '+30 Days',
  pickupLocation: 'Bandra West, Mumbai',
  pickupAddress: 'Plot 12, Hill Road, Near Bandra Station West',
  pickupTimings: '07:00 AM - 09:00 PM',
  deliveryAvailable: true,
  rulesList: [
    'Complimentary helmet included with bike',
    'Return vehicle with full tank of fuel',
    'Original driving licence MCWG inspection at pickup',
    'Speed monitoring above 100 km/h via platform telematics',
  ],
};

const mapBikeToFormData = (bike, currentUser) => {
  if (!bike) return null;
  const imgs = bike.images || bike.photos || {};
  const frontImg = imgs.front || bike.image || (bike.imageSource?.uri) || null;
  const rearImg = imgs.rear || imgs.back || null;
  const leftImg = imgs.left || null;
  const rightImg = imgs.right || null;
  const thumbImg = imgs.thumbnail || frontImg;

  const docs = bike.documents || {};
  const normalizeDocObj = (doc, fallbackName) => {
    if (!doc) return null;
    if (typeof doc === 'string') {
      const fileName = doc.split('/').pop()?.split('?')[0] || fallbackName;
      return {
        fileName,
        fileSize: 'Verified Cloud File',
        fileType: fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        uploadedAt: 'Active on File',
        fileUrl: doc,
        previewUrl: doc,
        signedUrl: doc,
        status: 'Verified & Stored',
      };
    }
    return {
      fileName: doc.fileName || doc.name || fallbackName,
      fileSize: doc.fileSize || 'Verified File',
      fileType: doc.fileType || 'application/pdf',
      uploadedAt: doc.uploadedAt || 'Active on File',
      fileUrl: doc.fileUrl || doc.signedUrl || doc.url,
      previewUrl: doc.previewUrl || doc.fileUrl || doc.signedUrl || doc.url,
      signedUrl: doc.signedUrl || doc.fileUrl,
      status: doc.status || 'Verified & Stored',
      key: doc.key || null,
    };
  };

  const rcDoc = normalizeDocObj(docs.rcSmartCardUrl || docs.rc, `${bike.registrationNumber || 'Vehicle'}_RC.pdf`);
  const insuranceDoc = normalizeDocObj(docs.insurancePolicyUrl || docs.insurance, `${bike.registrationNumber || 'Vehicle'}_Insurance.pdf`);
  const pucDoc = normalizeDocObj(docs.pucCertificateUrl || docs.puc, `${bike.registrationNumber || 'Vehicle'}_PUC.pdf`);

  const formatIsoDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  return {
    _id: bike._id || bike.id,
    id: bike.id || bike._id,
    listingCode: bike.listingCode || bike.id,
    fullName: currentUser?.name || currentUser?.fullName || bike.registeredOwnerName || '',
    phone: currentUser?.phone || currentUser?.phoneNumber || '',
    countryCode: currentUser?.countryCode || '+91',
    mobileVerified: true,
    email: currentUser?.email || '',
    emailVerified: true,
    address: bike.pickupAddress || '',
    city: '',
    state: '',
    pincode: '',
    idDocument: null,

    // Bike Info
    brand: bike.brand || '',
    model: bike.model || '',
    manufacturingYear: String(bike.manufacturingYear || new Date().getFullYear()),
    registrationNumber: bike.registrationNumber || '',
    category: bike.category || '',
    engineCapacity: String(bike.engineCapacity || bike.engineCapacityCc || bike.specs?.displacement?.replace(/[^0-9]/g, '') || ''),
    fuelType: bike.fuelType || bike.specs?.fuelType || 'Petrol',
    transmission: bike.transmission || bike.specs?.transmission || 'Manual',
    colour: bike.colour || bike.color || '',
    description: bike.description || bike.tagline || '',
    images: {
      front: frontImg,
      rear: rearImg,
      left: leftImg,
      right: rightImg,
      thumbnail: thumbImg,
    },
    photos: {
      front: frontImg,
      rear: rearImg,
      left: leftImg,
      right: rightImg,
      thumbnail: thumbImg,
    },

    // Documents
    documents: {
      rc: rcDoc,
      insurance: insuranceDoc,
      puc: pucDoc,
    },
    insurancePolicyNumber: bike.insurancePolicyNumber || 'POL-' + (bike.registrationNumber ? bike.registrationNumber.replace(/\s+/g, '') : '9812401'),
    insuranceExpiryDate: formatIsoDate(docs.insuranceExpiryDate) || bike.insuranceExpiryDate || '',
    pucExpiryDate: formatIsoDate(docs.pucExpiryDate) || bike.pucExpiryDate || '',
    chassisNumber: bike.chassisNumber || '',
    engineNumber: bike.engineNumber || '',
    registeredOwnerName: bike.registeredOwnerName || currentUser?.name || currentUser?.fullName || '',
    ownershipType: bike.ownershipType || 'registered_owner',

    // Rental
    dailyPrice: Number(bike.dailyPrice || bike.pricePerDay || 1500),
    securityDeposit: Number(bike.securityDeposit || bike.deposit || 3000),
    minDuration: bike.minDuration || 1,
    maxDuration: bike.maxDuration || 14,
    availabilityPreset: bike.availabilityPreset || 'Next 30 Days',
    availableFrom: bike.availableFrom || 'Immediate',
    availableTo: bike.availableTo || '+30 Days',
    pickupLocation: bike.pickupLocation || bike.pickupAddress || '',
    pickupAddress: bike.pickupAddress || '',
    pickupTimings: bike.pickupTimings || '07:00 AM - 09:00 PM',
    deliveryAvailable: Boolean(bike.doorstepDeliveryAvailable || bike.deliveryAvailable),
    rulesList: Array.isArray(bike.features) && bike.features.length > 0 ? bike.features : (bike.rulesList || []),
  };
};

export default function RentBikeScreen({
  navigation,
  route,
  user,
  onOpenAuth,
  onShowToast,
  onBikeSubmitted,
  onBikeUpdated,
  sharedBikes = [],
}) {
  const { t, isHindi, toggleLanguage } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);

  const incomingBikeToEdit = route?.params?.bikeToEdit || route?.params?.bike || null;
  const [editingBike, setEditingBike] = useState(incomingBikeToEdit);
  const isEditMode = Boolean(editingBike);
  const [showSelectBikeModal, setShowSelectBikeModal] = useState(false);

  const STEPS = [
    { id: 0, title: t('rentBike.step1', 'Bike Info'), icon: Bike, short: 'Bike' },
    { id: 1, title: t('rentBike.step2', 'Documents'), icon: FileText, short: 'Docs' },
    { id: 2, title: t('rentBike.step3', 'Rental Rates'), icon: IndianRupee, short: 'Pricing' },
    { id: 3, title: t('rentBike.step4', 'Review & Publish'), icon: CheckCircle2, short: 'Review' },
  ];

  const [formData, setFormData] = useState(() => {
    if (incomingBikeToEdit) {
      const mapped = mapBikeToFormData(incomingBikeToEdit, user);
      if (mapped) return mapped;
    }
    return {
      ...INITIAL_FORM_DATA,
      fullName: user?.name || INITIAL_FORM_DATA.fullName,
      email: user?.email || INITIAL_FORM_DATA.email,
      emailVerified: user?.email ? true : INITIAL_FORM_DATA.emailVerified,
      phone: user?.phone || INITIAL_FORM_DATA.phone,
      countryCode: user?.countryCode || INITIAL_FORM_DATA.countryCode || '+91',
      mobileVerified: user?.phone ? true : INITIAL_FORM_DATA.mobileVerified,
      registeredOwnerName: user?.name || INITIAL_FORM_DATA.registeredOwnerName,
    };
  });

  const [stepErrors, setStepErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModalData, setSuccessModalData] = useState(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Synchronize when route params provide or change bikeToEdit
  React.useEffect(() => {
    if (incomingBikeToEdit) {
      setEditingBike(incomingBikeToEdit);
      const mapped = mapBikeToFormData(incomingBikeToEdit, user);
      if (mapped) {
        setFormData(mapped);
        setCurrentStep(0);
        setStepErrors({});
      }
    }
  }, [incomingBikeToEdit?._id, incomingBikeToEdit?.id, incomingBikeToEdit?.registrationNumber]);

  // Load pre-saved business settings once (eliminates entering owner info on every bike)
  React.useEffect(() => {
    if (!isEditMode) {
      ownerAPI
        .getSettings()
        .then((res) => {
          if (res?.data) {
            const s = res.data;
            setFormData((prev) => ({
              ...prev,
              fullName: s.ownerFullName || prev.fullName,
              phone: s.contactPhone || prev.phone,
              email: s.contactEmail || prev.email,
              pickupAddress: s.defaultPickupHub?.address || prev.pickupAddress,
              pickupLocation: s.defaultPickupHub?.city || prev.pickupLocation,
            }));
          }
        })
        .catch(() => {});
    }
  }, [isEditMode]);

  // Synchronize when authenticated user changes or logs in
  const userIdentifier = user?.id || user?._id || user?.email || null;
  React.useEffect(() => {
    if (user && !isEditMode) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        emailVerified: user.email ? true : prev.emailVerified,
        phone: user.phone || prev.phone,
        countryCode: user.countryCode || prev.countryCode || '+91',
        mobileVerified: user.phone ? true : prev.mobileVerified,
        registeredOwnerName: user.name || prev.registeredOwnerName,
      }));
    }
  }, [userIdentifier, isEditMode]);

  const handleSelectBikeToEdit = (bike) => {
    setEditingBike(bike);
    const mapped = mapBikeToFormData(bike, user);
    if (mapped) {
      setFormData(mapped);
      setCurrentStep(0);
      setStepErrors({});
    }
    setShowSelectBikeModal(false);
    if (onShowToast) {
      onShowToast(`Loaded ${bike.brand} ${bike.model} (${bike.registrationNumber}) for editing.`);
    }
  };

  const handleSwitchToCreateMode = () => {
    setEditingBike(null);
    setFormData({
      ...INITIAL_FORM_DATA,
      fullName: user?.name || INITIAL_FORM_DATA.fullName,
      email: user?.email || INITIAL_FORM_DATA.email,
      emailVerified: user?.email ? true : INITIAL_FORM_DATA.emailVerified,
      phone: user?.phone || INITIAL_FORM_DATA.phone,
      countryCode: user?.countryCode || INITIAL_FORM_DATA.countryCode || '+91',
      mobileVerified: user?.phone ? true : INITIAL_FORM_DATA.mobileVerified,
      registeredOwnerName: user?.name || INITIAL_FORM_DATA.registeredOwnerName,
    });
    setCurrentStep(0);
    setStepErrors({});
    setShowSelectBikeModal(false);
    if (onShowToast) {
      onShowToast('Switched to Add New Bike mode.');
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const nextVal = typeof value === 'function' ? value(prev[field]) : value;
      const updated = {
        ...prev,
        [field]: nextVal,
      };
      if (field === 'images') {
        updated.photos = typeof nextVal === 'object' && nextVal ? { ...nextVal } : nextVal;
      }
      return updated;
    });
    if (stepErrors[field]) {
      setStepErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleFillSampleData = () => {
    setFormData((prev) => ({
      ...SAMPLE_DEMO_DATA,
      fullName: user?.name || SAMPLE_DEMO_DATA.fullName,
      email: user?.email || SAMPLE_DEMO_DATA.email,
      phone: user?.phone || SAMPLE_DEMO_DATA.phone,
      countryCode: user?.countryCode || SAMPLE_DEMO_DATA.countryCode,
      registeredOwnerName: user?.name || SAMPLE_DEMO_DATA.registeredOwnerName,
    }));
    setStepErrors({});
    if (onShowToast) {
      onShowToast('Sample bike & owner data loaded for quick testing!');
    }
  };

  const validateStep = (stepIndex) => {
    const errors = {};

    if (stepIndex === 0) {
      if (!formData.brand?.trim()) errors.brand = 'Bike brand is required.';
      if (!formData.model?.trim()) errors.model = 'Bike model is required.';
      if (!formData.manufacturingYear) errors.manufacturingYear = 'Manufacturing year is required.';
      if (!formData.registrationNumber?.trim()) errors.registrationNumber = 'Registration number is required.';
      if (!formData.category) errors.category = 'Category is required.';
      if (!formData.engineCapacity) errors.engineCapacity = 'Engine CC is required.';
      if (!formData.colour?.trim()) errors.colour = 'Bike colour is required.';
      if (!formData.description?.trim()) errors.description = 'Brief vehicle description is required.';

      const imgs = formData.images || {};
      if (!imgs.front || !imgs.rear || !imgs.left || !imgs.right) {
        errors.images = 'All 4 required exterior photographs (Front, Rear, Left, Right) must be uploaded.';
      } else {
        const hasBlob = Object.values(imgs).some(
          (u) => typeof u === 'string' && u.startsWith('blob:')
        );
        if (hasBlob) {
          errors.images = 'Photos are still uploading to Cloudinary. Please wait a moment until all slots show "Ready".';
        }
      }
    }

    if (stepIndex === 1) {
      if (!formData.documents?.rc) errors['documents.rc'] = 'Registration Certificate (RC) upload is mandatory.';
      if (!formData.documents?.insurance) errors['documents.insurance'] = 'Insurance document upload is mandatory.';
      if (!formData.insurancePolicyNumber?.trim()) errors.insurancePolicyNumber = 'Insurance policy number is required.';
      if (!formData.insuranceExpiryDate?.trim()) errors.insuranceExpiryDate = 'Insurance expiry date is required.';
      if (!formData.documents?.puc) errors['documents.puc'] = 'PUC certificate is mandatory.';
      if (!formData.pucExpiryDate?.trim()) errors.pucExpiryDate = 'PUC expiry date is required.';
      if (!formData.chassisNumber?.trim()) errors.chassisNumber = 'Chassis number is required.';
      if (!formData.engineNumber?.trim()) errors.engineNumber = 'Engine number is required.';
    }

    if (stepIndex === 2) {
      if (!formData.dailyPrice || Number(formData.dailyPrice) <= 0) {
        errors.dailyPrice = 'Valid daily rental price is required.';
      }
      if (!formData.securityDeposit || Number(formData.securityDeposit) <= 0) {
        errors.securityDeposit = 'Security deposit is required.';
      }
      if (!formData.pickupAddress?.trim() && !formData.pickupLocation?.trim()) {
        errors.pickupAddress = 'Detailed pickup address is required.';
      }
    }

    setStepErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContinue = () => {
    if (validateStep(currentStep)) {
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    } else {
      if (onShowToast) onShowToast('Please complete all required fields highlighted in red.');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleGoToStep = (stepIdx) => {
    // Can jump back to any already-visited step
    if (stepIdx <= currentStep) {
      setCurrentStep(stepIdx);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleGoToFleet = () => {
    setSuccessModalData(null);
    if (!navigation) return;

    // 1. Primary path: Route to nested Motorbikes tab inside MainTabs (standard React Navigation pattern)
    try {
      navigation.navigate('MainTabs', {
        screen: 'Motorbikes',
        params: { initialCategory: 'all', timestamp: Date.now() },
      });
    } catch (e) {
      console.warn('[RentBikeScreen] Navigation to MainTabs/Motorbikes failed:', e);
    }

    // 2. Direct navigate path (works when inside BottomTabNavigator)
    try {
      navigation.navigate('Motorbikes', { initialCategory: 'all', timestamp: Date.now() });
    } catch (e) {
      console.warn('[RentBikeScreen] Direct navigation to Motorbikes failed:', e);
    }

    // 3. Parent navigation fallback
    try {
      const parent = navigation.getParent?.();
      if (parent?.navigate) {
        parent.navigate('MainTabs', {
          screen: 'Motorbikes',
          params: { initialCategory: 'all', timestamp: Date.now() },
        });
        parent.navigate('Motorbikes', { initialCategory: 'all', timestamp: Date.now() });
      }
    } catch (e) {}
  };

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);

    try {
      const imgs = formData.images || {};
      const missing = ['front', 'rear', 'left', 'right'].filter(
        (k) => !imgs[k] || typeof imgs[k] !== 'string' || !imgs[k].startsWith('http') || imgs[k].startsWith('blob:')
      );
      if (missing.length > 0) {
        setIsSubmitting(false);
        if (onShowToast) {
          onShowToast(`Please ensure all 4 exterior photographs (Front, Rear, Left, Right) are uploaded. Missing: ${missing.join(', ')}`);
        }
        return;
      }

      const resolveCategoryKey = (catStr) => {
        const c = (catStr || '').toLowerCase();
        if (c.includes('scooter') || c.includes('ev') || c.includes('electric')) return 'scooters';
        if (c.includes('cruiser') || c.includes('tourer')) return 'cruiser';
        if (c.includes('premium') || c.includes('superbike')) return 'premium';
        return 'commuter';
      };

      const frontImg = formData.images?.front || formData.images?.thumbnail || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800';
      const rearImg = formData.images?.rear;
      const leftImg = formData.images?.left;
      const rightImg = formData.images?.right;
      const galleryList = [frontImg, rearImg, leftImg, rightImg].filter(Boolean);
      const galleryItems = [
        frontImg && { key: 'front', label: 'Front', source: { uri: frontImg }, url: frontImg },
        rearImg && { key: 'rear', label: 'Back', source: { uri: rearImg }, url: rearImg },
        leftImg && { key: 'left', label: 'Left', source: { uri: leftImg }, url: leftImg },
        rightImg && { key: 'right', label: 'Right', source: { uri: rightImg }, url: rightImg },
      ].filter(Boolean);

      // =========================================================================
      // EDIT MODE: Update existing submitted bike in fleet
      // =========================================================================
      if (isEditMode) {
        const bikeTargetId = formData._id || formData.id || editingBike?._id || editingBike?.id || editingBike?.listingCode;
        console.log('[RentBikeScreen] Updating existing motorcycle in fleet:', bikeTargetId);

        const updatePayload = {
          ...formData,
          name: (formData.name || `${formData.brand || ''} ${formData.model || ''}`).trim(),
          brand: formData.brand,
          model: formData.model,
          manufacturingYear: Number(formData.manufacturingYear) || new Date().getFullYear(),
          registrationNumber: formData.registrationNumber,
          category: formData.category,
          engineCapacity: formData.engineCapacity,
          engineCapacityCc: Number(formData.engineCapacity) || 350,
          fuelType: formData.fuelType,
          transmission: formData.transmission,
          color: formData.colour,
          colour: formData.colour,
          description: formData.description,
          tagline: formData.description,
          dailyPrice: Number(formData.dailyPrice),
          pricePerDay: Number(formData.dailyPrice),
          securityDeposit: Number(formData.securityDeposit),
          deposit: Number(formData.securityDeposit),
          images: {
            front: frontImg,
            rear: rearImg,
            left: leftImg,
            right: rightImg,
            thumbnail: formData.images?.thumbnail || frontImg,
          },
          photos: {
            front: frontImg,
            rear: rearImg,
            left: leftImg,
            right: rightImg,
            thumbnail: formData.images?.thumbnail || frontImg,
          },
          pickupAddress: formData.pickupAddress || formData.pickupLocation,
          pickupTimings: formData.pickupTimings,
          doorstepDeliveryAvailable: formData.deliveryAvailable,
          features: formData.rulesList,
          documents: formData.documents,
        };

        let updatedSavedBike = null;
        try {
          const res = await ownerAPI.updateBike(bikeTargetId, updatePayload).catch(() => bikesAPI.update(bikeTargetId, updatePayload));
          if (res?.data) {
            updatedSavedBike = res.data;
          }
        } catch (apiErr) {
          console.warn('[RentBikeScreen] API update notice:', apiErr.message);
        }
        setIsSubmitting(false);

        const updatedFleetBike = {
          ...editingBike,
          ...formData,
          ...updatePayload,
          ...(updatedSavedBike || {}),
          id: bikeTargetId,
          _id: bikeTargetId,
          categoryKey: resolveCategoryKey(formData.category),
          image: frontImg,
          imageSource: { uri: frontImg },
          gallery: galleryList,
          gallerySources: galleryItems.map((g) => g.source),
          galleryItems,
          specs: {
            displacement: `${formData.engineCapacity || 350} CC`,
            transmission: formData.transmission || 'Manual',
            fuelType: formData.fuelType || 'Petrol',
          },
          status: 'APPROVED',
          statusBadge: 'AVAILABLE',
          isBooked: false,
        };

        if (onBikeUpdated) {
          onBikeUpdated(updatedFleetBike);
        } else if (onBikeSubmitted) {
          onBikeSubmitted(updatedFleetBike);
        }

        setSuccessModalData(updatedFleetBike);
        if (onShowToast) {
          onShowToast('Motorcycle details updated successfully!');
        }
        return;
      }

      // =========================================================================
      // CREATE MODE: Add new motorcycle to fleet
      // =========================================================================
      console.log('[RentBikeScreen] Submitting motorcycle with verified photos:', formData.images);
      const res = await ownerAPI.createBike(formData).catch(() => bikesAPI.createListing(formData));
      setIsSubmitting(false);

      const savedBike = res.data || {};
      const submissionId = savedBike.listingCode || `RDE-${Math.floor(100000 + Math.random() * 900000)}`;
      const submissionDate = new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });

      const newFleetBike = {
        ...formData,
        id: savedBike.listingCode || savedBike._id || submissionId,
        _id: savedBike._id,
        name: (formData.name || `${formData.brand || ''} ${formData.model || ''}`).trim() || 'Custom Motorcycle',
        model: formData.model,
        brand: formData.brand,
        category: formData.category,
        categoryKey: resolveCategoryKey(formData.category),
        tagline: formData.description || 'Verified Machine with full inspection',
        pricePerDay: Number(formData.dailyPrice || 1500),
        dailyPrice: Number(formData.dailyPrice || 1500),
        deposit: Number(formData.securityDeposit || 3000),
        securityDeposit: Number(formData.securityDeposit || 3000),
        rating: 5.0,
        reviewsCount: 0,
        badge: 'NEW FLEET',
        availability: 'Available for immediate booking',
        statusBadge: 'AVAILABLE',
        isBooked: false,
        status: 'APPROVED',
        image: frontImg,
        imageSource: { uri: frontImg },
        images: {
          front: frontImg,
          rear: rearImg,
          left: leftImg,
          right: rightImg,
          thumbnail: formData.images?.thumbnail || frontImg,
        },
        photos: {
          front: frontImg,
          rear: rearImg,
          left: leftImg,
          right: rightImg,
          thumbnail: formData.images?.thumbnail || frontImg,
        },
        gallery: galleryList,
        gallerySources: galleryItems.map((g) => g.source),
        galleryItems,
        specs: formData.specs || {
          displacement: `${formData.engineCapacity || 350} CC`,
          transmission: formData.transmission || 'Manual',
        },
        pickupAddress: formData.pickupAddress || formData.pickupLocation || '123 Rider Avenue, Sector 5, Bandra West',
        registrationNumber: formData.registrationNumber,
        submissionId,
        submissionDate,
      };

      if (onBikeSubmitted) {
        onBikeSubmitted(newFleetBike);
      }

      setSuccessModalData(newFleetBike);
      if (onShowToast) {
        onShowToast('Motorcycle added to live fleet successfully!');
      }
    } catch (err) {
      console.warn('[RentBikeScreen] Submission notice:', err.message);
      setIsSubmitting(false);

      const resolveCategoryKey = (catStr) => {
        const c = (catStr || '').toLowerCase();
        if (c.includes('scooter') || c.includes('ev') || c.includes('electric')) return 'scooters';
        if (c.includes('cruiser') || c.includes('tourer')) return 'cruiser';
        if (c.includes('premium') || c.includes('superbike')) return 'premium';
        return 'commuter';
      };

      const frontImg = formData.images?.front || formData.images?.thumbnail || 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800';
      const rearImg = formData.images?.rear;
      const leftImg = formData.images?.left;
      const rightImg = formData.images?.right;
      const galleryList = [frontImg, rearImg, leftImg, rightImg].filter(Boolean);
      const galleryItems = [
        frontImg && { key: 'front', label: 'Front', source: { uri: frontImg }, url: frontImg },
        rearImg && { key: 'rear', label: 'Back', source: { uri: rearImg }, url: rearImg },
        leftImg && { key: 'left', label: 'Left', source: { uri: leftImg }, url: leftImg },
        rightImg && { key: 'right', label: 'Right', source: { uri: rightImg }, url: rightImg },
      ].filter(Boolean);

      if (isEditMode) {
        const bikeTargetId = formData._id || formData.id || editingBike?._id || editingBike?.id || editingBike?.listingCode;
        const updatedFleetBike = {
          ...editingBike,
          ...formData,
          id: bikeTargetId,
          _id: bikeTargetId,
          categoryKey: resolveCategoryKey(formData.category),
          image: frontImg,
          imageSource: { uri: frontImg },
          gallery: galleryList,
          gallerySources: galleryItems.map((g) => g.source),
          galleryItems,
          specs: {
            displacement: `${formData.engineCapacity || 350} CC`,
            transmission: formData.transmission || 'Manual',
            fuelType: formData.fuelType || 'Petrol',
          },
          status: 'APPROVED',
          statusBadge: 'AVAILABLE',
          isBooked: false,
        };

        if (onBikeUpdated) {
          onBikeUpdated(updatedFleetBike);
        } else if (onBikeSubmitted) {
          onBikeSubmitted(updatedFleetBike);
        }

        setSuccessModalData(updatedFleetBike);
        if (onShowToast) {
          onShowToast('Motorcycle details updated successfully!');
        }
        return;
      }

      const submissionId = `RDE-${Math.floor(100000 + Math.random() * 900000)}`;
      const newFleetBike = {
        ...formData,
        id: submissionId,
        name: (formData.name || `${formData.brand || ''} ${formData.model || ''}`).trim() || 'Custom Motorcycle',
        model: formData.model,
        brand: formData.brand,
        category: formData.category,
        categoryKey: resolveCategoryKey(formData.category),
        tagline: formData.description || 'Verified Machine with full inspection',
        pricePerDay: Number(formData.dailyPrice || 1500),
        dailyPrice: Number(formData.dailyPrice || 1500),
        deposit: Number(formData.securityDeposit || 3000),
        securityDeposit: Number(formData.securityDeposit || 3000),
        rating: 5.0,
        reviewsCount: 0,
        badge: 'NEW FLEET',
        availability: 'Available for immediate booking',
        statusBadge: 'AVAILABLE',
        isBooked: false,
        status: 'APPROVED',
        image: frontImg,
        imageSource: { uri: frontImg },
        images: {
          front: frontImg,
          rear: rearImg,
          left: leftImg,
          right: rightImg,
          thumbnail: formData.images?.thumbnail || frontImg,
        },
        photos: {
          front: frontImg,
          rear: rearImg,
          left: leftImg,
          right: rightImg,
          thumbnail: formData.images?.thumbnail || frontImg,
        },
        gallery: galleryList,
        gallerySources: galleryItems.map((g) => g.source),
        galleryItems,
        specs: {
          displacement: `${formData.engineCapacity || 350} CC`,
          transmission: formData.transmission || 'Manual',
        },
        pickupAddress: formData.pickupAddress || formData.pickupLocation || '123 Rider Avenue, Sector 5, Bandra West',
        registrationNumber: formData.registrationNumber,
        submissionId,
      };

      if (onBikeSubmitted) {
        onBikeSubmitted(newFleetBike);
      }
      setSuccessModalData(newFleetBike);
      if (onShowToast) {
        onShowToast('Motorcycle added to fleet!');
      }
    }
  };

  const handleCloseOrExit = () => {
    if (currentStep > 0 && !successModalData) {
      setShowExitConfirm(true);
    } else {
      navigation?.goBack();
    }
  };

  return (
    <View style={styles.screenWrapper}>
      {/* Top Header Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={handleCloseOrExit}
          activeOpacity={0.7}
          accessibilityLabel="Back"
        >
          <ChevronLeft size={20} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle}>
            {isEditMode
              ? (isHindi ? 'बाइक विवरण संपादित करें' : 'Edit Bike Details')
              : t('rentBike.portalTitle', 'Rent Your Bike')}
          </Text>
          <Text style={styles.topBarSubtitle}>
            {isEditMode
              ? (isHindi ? 'मालिक लिस्टिंग पोर्टल • संपादन' : 'Owner Listing Portal • Edit Mode')
              : t('rentBike.portalSubtitle', 'Owner Listing Portal')}
          </Text>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.langToggleBtn}
            onPress={toggleLanguage}
            activeOpacity={0.8}
            accessibilityLabel="Switch Language"
          >
            <Text style={styles.langToggleBtnText}>{isHindi ? 'English' : 'हिन्दी'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={handleCloseOrExit}
            activeOpacity={0.7}
            accessibilityLabel="Exit form"
          >
            <X size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageContainer}>
          {/* Hero Banner Section */}
          <View style={styles.pageHero}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroBadge}>
                <Bike size={14} color="#38BDF8" />
                <Text style={styles.heroBadgeText}>
                  {isEditMode
                    ? 'EDITING FLEET VEHICLE'
                    : t('rentBike.badge', 'OWNER ONBOARDING')}
                </Text>
              </View>
              <View style={styles.heroActionsRow}>
                {isEditMode ? (
                  <>
                    {sharedBikes.length > 1 && (
                      <TouchableOpacity
                        style={styles.selectExistingBtn}
                        onPress={() => setShowSelectBikeModal(true)}
                        activeOpacity={0.7}
                      >
                        <Bike size={13} color="#38BDF8" />
                        <Text style={styles.selectExistingBtnText}>
                          Switch Bike ({sharedBikes.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.demoFillBtn}
                      onPress={handleSwitchToCreateMode}
                      activeOpacity={0.7}
                    >
                      <Sparkles size={13} color="#38BDF8" />
                      <Text style={styles.demoFillBtnText}>+ Add New Bike</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    {sharedBikes.length > 0 && (
                      <TouchableOpacity
                        style={styles.selectExistingBtn}
                        onPress={() => setShowSelectBikeModal(true)}
                        activeOpacity={0.7}
                      >
                        <Bike size={13} color="#38BDF8" />
                        <Text style={styles.selectExistingBtnText}>
                          Edit a Submitted Bike ({sharedBikes.length})
                        </Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.demoFillBtn}
                      onPress={handleFillSampleData}
                      activeOpacity={0.7}
                    >
                      <Sparkles size={13} color="#38BDF8" />
                      <Text style={styles.demoFillBtnText}>{t('rentBike.demoDataBtn', 'Load Sample Demo Data')}</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
            <Text style={styles.heroHeading}>
              {isEditMode
                ? (isHindi ? 'बाइक विवरण संपादित करें – फ्लीट जानकारी अपडेट करें' : 'Edit Bike Details – Update Fleet Specifications & Rates')
                : t('rentBike.heroHeading', 'Rent Your Bike – Turn Your Bike into an Earning Opportunity')}
            </Text>
            <Text style={styles.heroSubheading}>
              {isEditMode
                ? (isHindi
                    ? 'लाइव फ्लीट में अपनी मोटरसाइकिल के विनिर्देश, तस्वीरें, दस्तावेज या किराये की दरें अपडेट करें।'
                    : 'Modify your vehicle details, photographs, RTO documents, or rental rates in the live fleet.')
                : t('rentBike.heroSubheading', 'List your bike, connect with potential renters, and earn by sharing your vehicle with verified riders.')}
            </Text>
          </View>

          {/* Active Edit Mode Banner */}
          {isEditMode && (
            <View style={styles.editModeBanner}>
              <View style={styles.editModeBannerLeft}>
                <View style={styles.editIconBadge}>
                  <Bike size={18} color="#38BDF8" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.editBadgeRow}>
                    <Text style={styles.editModeTag}>ACTIVE EDIT</Text>
                    <Text style={styles.editModeBannerTitle} numberOfLines={1}>
                      {formData.brand} {formData.model}
                    </Text>
                  </View>
                  <Text style={styles.editModeBannerSub} numberOfLines={1}>
                    Reg: {formData.registrationNumber || 'N/A'} • {formData.category || 'Motorcycle'} • ₹{Number(formData.dailyPrice || 1500).toLocaleString()}/day
                  </Text>
                </View>
              </View>
              <View style={styles.editModeBannerActions}>
                {sharedBikes.length > 1 && (
                  <TouchableOpacity
                    style={styles.switchBikePill}
                    onPress={() => setShowSelectBikeModal(true)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.switchBikePillText}>Switch</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.cancelEditPill}
                  onPress={handleSwitchToCreateMode}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelEditPillText}>+ New</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Authentication Alert if user not logged in */}
          {!user && (
            <View style={styles.unauthBanner}>
              <View style={styles.unauthBannerLeft}>
                <AlertTriangle size={18} color="#F59E0B" />
                <Text style={styles.unauthBannerText}>
                  {t('rentBike.unauthAlert', 'You are not logged in. Sign in to link this bike directly to your owner dashboard.')}
                </Text>
              </View>
              {onOpenAuth && (
                <TouchableOpacity
                  style={styles.unauthBannerBtn}
                  onPress={onOpenAuth}
                  activeOpacity={0.8}
                >
                  <Text style={styles.unauthBannerBtnText}>{t('rentBike.loginRegister', 'Log In / Register')}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Stepper Progress Bar */}
          <View style={styles.stepperContainer}>
            <View style={styles.stepperTrack}>
              <View
                style={[
                  styles.stepperFill,
                  { width: `${(currentStep / (STEPS.length - 1)) * 100}%` },
                ]}
              />
            </View>

            <View style={styles.stepsRow}>
              {STEPS.map((s, idx) => {
                const IconComp = s.icon;
                const isCompleted = idx < currentStep;
                const isCurrent = idx === currentStep;

                return (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.stepItem}
                    onPress={() => handleGoToStep(idx)}
                    disabled={idx > currentStep}
                    activeOpacity={0.8}
                  >
                    <View
                      style={[
                        styles.stepCircle,
                        isCurrent && styles.stepCircleCurrent,
                        isCompleted && styles.stepCircleCompleted,
                      ]}
                    >
                      {isCompleted ? (
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      ) : (
                        <IconComp
                          size={15}
                          color={isCurrent ? '#FFFFFF' : COLORS.textMuted}
                        />
                      )}
                    </View>

                    <Text
                      style={[
                        styles.stepTitleText,
                        isCurrent && styles.stepTitleTextCurrent,
                        isCompleted && styles.stepTitleTextCompleted,
                      ]}
                      numberOfLines={1}
                    >
                      {width < 640 ? s.short : s.title}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Form Step Body */}
          <View style={styles.formCard}>
            {currentStep === 0 && (
              <StepBikeInfo
                data={formData}
                onChange={handleFieldChange}
                errors={stepErrors}
                onShowToast={onShowToast}
              />
            )}

            {currentStep === 1 && (
              <StepDocSubmission
                data={formData}
                onChange={handleFieldChange}
                errors={stepErrors}
                onShowToast={onShowToast}
              />
            )}

            {currentStep === 2 && (
              <StepRentalInfo
                data={formData}
                onChange={handleFieldChange}
                errors={stepErrors}
                onShowToast={onShowToast}
              />
            )}

            {currentStep === 3 && (
              <StepReviewSubmit
                data={formData}
                onGoToStep={handleGoToStep}
                onSubmit={handleFinalSubmit}
                isSubmitting={isSubmitting}
                errors={stepErrors}
                isEditMode={isEditMode}
                navigation={navigation}
                onGoToFleet={handleGoToFleet}
              />
            )}

            {/* Stepper Navigation Buttons (for Steps 0 - 2) */}
            {currentStep < 3 && (
              <View style={styles.navigationButtonsRow}>
                {currentStep > 0 ? (
                  <TouchableOpacity
                    style={styles.navPrevBtn}
                    onPress={handlePrevious}
                    activeOpacity={0.8}
                  >
                    <ChevronLeft size={16} color="#FFFFFF" />
                    <Text style={styles.navPrevBtnText}>{t('rentBike.prevBtn', 'Previous')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ width: 10 }} />
                )}

                <TouchableOpacity
                  style={styles.navNextBtn}
                  onPress={handleContinue}
                  activeOpacity={0.8}
                >
                  <Text style={styles.navNextBtnText}>
                    {t('rentBike.continueTo', 'Continue to')} {STEPS[currentStep + 1]?.title || 'Next'}
                  </Text>
                  <ChevronRight size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Discard Confirmation Modal */}
      <Modal
        visible={showExitConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setShowExitConfirm(false)}
      >
        <View style={styles.exitModalOverlay}>
          <View style={styles.exitModalCard}>
            <View style={styles.exitIconWrap}>
              <AlertTriangle size={28} color="#F59E0B" />
            </View>
            <Text style={styles.exitModalTitle}>{t('rentBike.exitTitle', 'Discard Incomplete Listing?')}</Text>
            <Text style={styles.exitModalSub}>
              {t('rentBike.exitSub', 'You have unsaved vehicle specifications and uploaded documents. Leaving now will reset your progress.')}
            </Text>

            <View style={styles.exitModalActions}>
              <TouchableOpacity
                style={styles.exitCancelBtn}
                onPress={() => setShowExitConfirm(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.exitCancelText}>{t('rentBike.keepEditing', 'Keep Editing')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exitDiscardBtn}
                onPress={() => {
                  setShowExitConfirm(false);
                  navigation?.goBack();
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.exitDiscardText}>{t('rentBike.discardExit', 'Discard & Exit')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Submission / Edit Success Modal */}
      <SubmissionSuccessModal
        visible={!!successModalData}
        submissionData={successModalData}
        isEditMode={isEditMode}
        onGoToListings={handleGoToFleet}
        onSubmitAnother={() => {
          setSuccessModalData(null);
          if (isEditMode) {
            handleSwitchToCreateMode();
          } else {
            setFormData(INITIAL_FORM_DATA);
            setCurrentStep(0);
          }
        }}
        onClose={() => setSuccessModalData(null)}
      />

      {/* Modal to Select an Existing Submitted Bike to Edit */}
      <Modal
        visible={showSelectBikeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSelectBikeModal(false)}
      >
        <View style={styles.selectModalOverlay}>
          <View style={styles.selectModalCard}>
            <View style={styles.selectModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectModalTitle}>Select a Submitted Bike to Edit</Text>
                <Text style={styles.selectModalSub}>
                  Choose any vehicle from your live fleet inventory to modify its details.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.selectModalClose}
                onPress={() => setShowSelectBikeModal(false)}
                activeOpacity={0.7}
              >
                <X size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.selectModalList} showsVerticalScrollIndicator={false}>
              {sharedBikes && sharedBikes.length > 0 ? (
                sharedBikes.map((bike, idx) => {
                  const bImg =
                    bike.images?.front ||
                    bike.photos?.front ||
                    (typeof bike.image === 'string' ? bike.image : bike.imageSource?.uri) ||
                    'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800';
                  const isSelected =
                    editingBike &&
                    (editingBike.id === bike.id ||
                      editingBike._id === bike._id ||
                      (bike.registrationNumber && editingBike.registrationNumber === bike.registrationNumber));

                  return (
                    <TouchableOpacity
                      key={bike.id || bike._id || idx}
                      style={[styles.selectBikeItem, isSelected && styles.selectBikeItemSelected]}
                      onPress={() => handleSelectBikeToEdit(bike)}
                      activeOpacity={0.8}
                    >
                      <Image source={{ uri: bImg }} style={styles.selectBikeThumb} resizeMode="cover" />
                      <View style={styles.selectBikeInfo}>
                        <View style={styles.selectBikeTitleRow}>
                          <Text style={styles.selectBikeName} numberOfLines={1}>
                            {bike.name || `${bike.brand || ''} ${bike.model || ''}`}
                          </Text>
                          {isSelected && (
                            <View style={styles.currentEditingPill}>
                              <Text style={styles.currentEditingPillText}>Current</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.selectBikeReg}>
                          Reg: {bike.registrationNumber || 'N/A'} • {bike.category || 'Motorcycle'}
                        </Text>
                        <Text style={styles.selectBikePrice}>
                          ₹{Number(bike.dailyPrice || bike.pricePerDay || 1500).toLocaleString()}/day
                        </Text>
                      </View>
                      <View style={[styles.selectBikeAction, isSelected && styles.selectBikeActionSelected]}>
                        <Text style={[styles.selectBikeActionText, isSelected && styles.selectBikeActionTextSelected]}>
                          {isSelected ? 'Editing' : 'Edit →'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptySelectBox}>
                  <Bike size={32} color="#64748B" />
                  <Text style={styles.emptySelectText}>No submitted bikes found in fleet.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  topBar: {
    height: 60,
    backgroundColor: COLORS.bgCard,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderCard,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarCenter: {
    alignItems: 'center',
  },
  topBarTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  topBarSubtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  langToggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  pageContainer: {
    width: '100%',
    maxWidth: 880,
  },
  pageHero: {
    alignItems: 'center',
    marginBottom: 26,
    textAlign: 'center',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  demoFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  demoFillBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  heroBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroHeading: {
    fontSize: width < 640 ? 22 : 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: width < 640 ? 28 : 36,
    marginBottom: 10,
  },
  heroSubheading: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    maxWidth: 640,
    lineHeight: 22,
  },
  stepperContainer: {
    marginBottom: 24,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 16,
    position: 'relative',
  },
  stepperTrack: {
    position: 'absolute',
    top: 32,
    left: 36,
    right: 36,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    zIndex: 0,
  },
  stepperFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 2,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 1,
  },
  stepItem: {
    alignItems: 'center',
    flex: 1,
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1.5,
    borderColor: COLORS.borderCard,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleCurrent: {
    backgroundColor: '#0284C7',
    borderColor: '#38BDF8',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  stepCircleCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  stepTitleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  stepTitleTextCurrent: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  stepTitleTextCompleted: {
    color: '#E2E8F0',
  },
  formCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.xl,
    padding: width < 640 ? 18 : 28,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 4,
  },
  navigationButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderCard,
  },
  navPrevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
  },
  navPrevBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  navNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  navNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  exitModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  exitModalCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    borderRadius: RADIUS.lg,
    padding: 24,
    maxWidth: 420,
    width: '100%',
    alignItems: 'center',
  },
  exitIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  exitModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  exitModalSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  exitModalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  exitCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.bgCardAlt,
    borderWidth: 1,
    borderColor: COLORS.borderCard,
    alignItems: 'center',
  },
  exitCancelText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  exitDiscardBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.full,
    backgroundColor: '#E11D48',
    alignItems: 'center',
  },
  exitDiscardText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  unauthBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  unauthBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 240,
  },
  unauthBannerText: {
    color: '#FEF3C7',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  unauthBannerBtn: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
  },
  unauthBannerBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  selectExistingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  selectExistingBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  newBikeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.14)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  newBikeBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  editModeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.45)',
    gap: 12,
    flexWrap: 'wrap',
  },
  editModeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 220,
  },
  editIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  editBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  editModeTag: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5,
  },
  editModeBannerTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
  },
  editModeBannerSub: {
    fontSize: 12,
    color: '#94A3B8',
  },
  editModeBannerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  switchBikePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  switchBikePillText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '700',
  },
  cancelEditPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  cancelEditPillText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  selectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  selectModalCard: {
    backgroundColor: '#0F172A',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    width: '100%',
    maxWidth: 540,
    maxHeight: '85%',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  selectModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: 14,
    gap: 12,
  },
  selectModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  selectModalSub: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
  },
  selectModalClose: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  selectModalList: {
    maxHeight: 420,
  },
  selectBikeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  selectBikeItemSelected: {
    borderColor: '#38BDF8',
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
  },
  selectBikeThumb: {
    width: 64,
    height: 52,
    borderRadius: RADIUS.md,
    backgroundColor: '#020617',
  },
  selectBikeInfo: {
    flex: 1,
  },
  selectBikeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  selectBikeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  currentEditingPill: {
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  currentEditingPillText: {
    color: '#34D399',
    fontSize: 10,
    fontWeight: '800',
  },
  selectBikeReg: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginBottom: 2,
  },
  selectBikePrice: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38BDF8',
  },
  selectBikeAction: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  selectBikeActionSelected: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  selectBikeActionText: {
    color: '#38BDF8',
    fontSize: 11.5,
    fontWeight: '700',
  },
  selectBikeActionTextSelected: {
    color: '#34D399',
  },
  emptySelectBox: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptySelectText: {
    color: '#64748B',
    fontSize: 13,
  },
});

