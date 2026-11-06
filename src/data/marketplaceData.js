// Rich realistic mock data for Bike Rental Marketplace - Owner Listings, Verification, and Admin Operations

export const INITIAL_OWNERS = [
  {
    id: 'OWN-1001',
    name: 'Vikram Malhotra',
    phone: '+91 98201 44521',
    email: 'vikram.malhotra@gmail.com',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'B-402, Sea Breeze Apts, Bandra West',
    pincode: '400050',
    idStatus: 'Verified',
    idType: 'Aadhaar + PAN',
    idNumber: '•••• •••• 8912',
    registeredDate: '2026-10-12',
    status: 'Approved',
    listedBikesCount: 2,
    activeBookings: 1,
    rating: 4.85,
    earnings: 48500,
    verificationHistory: [
      { date: '2026-10-12', action: 'Submitted documents', by: 'System' },
      { date: '2026-10-13', action: 'Aadhaar OTP Verified', by: 'Automated KYC' },
      { date: '2026-10-13', action: 'Approved by Senior Verifier', by: 'Admin (Rohan S.)' }
    ],
    documents: [
      { name: 'Aadhaar Front & Back', type: 'PDF', size: '1.4 MB', date: '2026-10-12', status: 'Verified' },
      { name: 'PAN Card Copy', type: 'JPG', size: '820 KB', date: '2026-10-12', status: 'Verified' },
      { name: 'Electricity Bill (Address Proof)', type: 'PDF', size: '1.1 MB', date: '2026-10-12', status: 'Verified' }
    ]
  },
  {
    id: 'OWN-1002',
    name: 'Ananya Deshmukh',
    phone: '+91 97654 32189',
    email: 'ananya.d@outlook.com',
    city: 'Pune',
    state: 'Maharashtra',
    address: 'Flat 12, Sky High Towers, Kothrud',
    pincode: '411038',
    idStatus: 'Pending Review',
    idType: 'Aadhaar Card',
    idNumber: '•••• •••• 4421',
    registeredDate: '2026-11-04',
    status: 'Pending',
    listedBikesCount: 1,
    activeBookings: 0,
    rating: 5.0,
    earnings: 0,
    verificationHistory: [
      { date: '2026-11-04', action: 'Submitted listing & ID', by: 'System' },
      { date: '2026-11-04', action: 'Phone verified via OTP', by: 'System' }
    ],
    documents: [
      { name: 'Aadhaar Card Scan', type: 'PDF', size: '2.1 MB', date: '2026-11-04', status: 'Pending Review' }
    ]
  },
  {
    id: 'OWN-1003',
    name: 'Rajesh K. Verma',
    phone: '+91 94120 78654',
    email: 'rajesh.verma.bikes@gmail.com',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: '88, 4th Cross, Indiranagar',
    pincode: '560038',
    idStatus: 'Needs Correction',
    idType: 'Driving Licence',
    idNumber: 'KA-01-2019-004312',
    registeredDate: '2026-11-02',
    status: 'Needs Correction',
    listedBikesCount: 1,
    activeBookings: 0,
    rating: 0,
    earnings: 0,
    verificationHistory: [
      { date: '2026-11-02', action: 'Submitted profile', by: 'System' },
      { date: '2026-11-03', action: 'Address proof blurry - re-upload requested', by: 'Admin (Priya M.)' }
    ],
    documents: [
      { name: 'Driving Licence Copy', type: 'JPG', size: '540 KB', date: '2026-11-02', status: 'Needs Correction' }
    ]
  },
  {
    id: 'OWN-1004',
    name: 'Arjun Nambiar',
    phone: '+91 98450 11982',
    email: 'arjun.nambiar@techcorp.in',
    city: 'Bengaluru',
    state: 'Karnataka',
    address: 'Villa 14, Palm Meadows, Whitefield',
    pincode: '560066',
    idStatus: 'Verified',
    idType: 'Passport + Aadhaar',
    idNumber: '•••• •••• 9031',
    registeredDate: '2026-09-20',
    status: 'Approved',
    listedBikesCount: 3,
    activeBookings: 2,
    rating: 4.92,
    earnings: 92400,
    verificationHistory: [
      { date: '2026-09-20', action: 'Submitted documents', by: 'System' },
      { date: '2026-09-21', action: 'Verified & Approved', by: 'Admin (Rohan S.)' }
    ],
    documents: [
      { name: 'Passport Front & Back', type: 'PDF', size: '3.2 MB', date: '2026-09-20', status: 'Verified' },
      { name: 'Aadhaar Card', type: 'PDF', size: '1.2 MB', date: '2026-09-20', status: 'Verified' }
    ]
  },
  {
    id: 'OWN-1005',
    name: 'Sunil Chettri (Auto Club)',
    phone: '+91 99001 77210',
    email: 'sunil.autoclub@gmail.com',
    city: 'New Delhi',
    state: 'Delhi',
    address: 'Plot 45, Okhla Industrial Area Phase 2',
    pincode: '110020',
    idStatus: 'Suspended',
    idType: 'GSTIN / Commercial Reg',
    idNumber: '07AAAAA0000A1Z5',
    registeredDate: '2026-08-15',
    status: 'Suspended',
    listedBikesCount: 4,
    activeBookings: 0,
    rating: 3.4,
    earnings: 120000,
    verificationHistory: [
      { date: '2026-08-15', action: 'Approved', by: 'Admin (Rohan S.)' },
      { date: '2026-10-28', action: 'Suspended due to unmaintained vehicle complaints', by: 'Admin (Priya M.)' }
    ],
    documents: [
      { name: 'GST Certificate', type: 'PDF', size: '890 KB', date: '2026-08-15', status: 'Suspended' }
    ]
  }
];

export const INITIAL_BIKE_LISTINGS = [
  {
    id: 'BIKE-8801',
    brand: 'Royal Enfield',
    model: 'Himalayan 450',
    year: '2024',
    category: 'Adventure Tourer',
    registrationNumber: 'MH 02 FJ 9042',
    chassisNumber: 'ME3H450XXXX88291',
    engineNumber: 'H450E882910',
    ownerId: 'OWN-1001',
    ownerName: 'Vikram Malhotra',
    ownerPhone: '+91 98201 44521',
    ownerEmail: 'vikram.malhotra@gmail.com',
    dailyPrice: 1600,
    deposit: 3500,
    minDuration: 1,
    maxDuration: 14,
    pickupLocation: 'Bandra West, Mumbai',
    pickupAddress: 'Plot 12, Near Bandra Station West',
    pickupTimings: '07:00 AM - 09:00 PM',
    deliveryAvailable: true,
    rules: 'No rash riding, mandatory helmet, 200 km/day limit, return with full fuel.',
    submissionDate: '2026-10-14',
    status: 'Approved',
    rcStatus: 'Verified',
    insuranceStatus: 'Verified',
    pucStatus: 'Verified',
    images: {
      front: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      rear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      left: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
      right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80'
    },
    documents: {
      rc: {
        fileName: 'MH02FJ9042_RC_SmartCard.pdf',
        fileSize: '1.8 MB',
        uploadedDate: '2026-10-14',
        status: 'Verified',
        extracted: {
          ownerName: 'Vikram Malhotra',
          regNo: 'MH 02 FJ 9042',
          model: 'Royal Enfield Himalayan 450',
          chassis: 'ME3H450XXXX88291',
          fuel: 'Petrol',
          mfgYear: '2024'
        }
      },
      insurance: {
        fileName: 'ICICI_Lombard_Comprehensive_Policy.pdf',
        policyNumber: '3005/2024/9812401',
        expiryDate: '2027-05-18',
        fileSize: '2.4 MB',
        uploadedDate: '2026-10-14',
        status: 'Verified',
        extracted: {
          policyNo: '3005/2024/9812401',
          insurer: 'ICICI Lombard GIC Ltd',
          expiryDate: '2027-05-18',
          vehicleNo: 'MH 02 FJ 9042'
        }
      },
      puc: {
        fileName: 'PUCC_Valid_Certificate.pdf',
        expiryDate: '2027-04-10',
        fileSize: '650 KB',
        uploadedDate: '2026-10-14',
        status: 'Verified',
        extracted: {
          certNo: 'MH02-2024-PUC-99120',
          expiryDate: '2027-04-10',
          vehicleNo: 'MH 02 FJ 9042'
        }
      },
      ownerIdentity: {
        fileName: 'Aadhaar_Vikram_Malhotra.pdf',
        fileSize: '1.4 MB',
        status: 'Verified'
      },
      authorization: {
        type: 'Registered Vehicle Owner',
        declared: true
      }
    },
    comparison: [
      { field: 'Owner Name', submitted: 'Vikram Malhotra', extracted: 'Vikram Malhotra', match: true },
      { field: 'Registration Number', submitted: 'MH 02 FJ 9042', extracted: 'MH 02 FJ 9042', match: true },
      { field: 'Bike Model', submitted: 'Royal Enfield Himalayan 450', extracted: 'Royal Enfield Himalayan 450', match: true },
      { field: 'Chassis Number', submitted: 'ME3H450XXXX88291', extracted: 'ME3H450XXXX88291', match: true }
    ],
    verificationOutcome: 'Passed',
    notes: 'All documents clear and verified. Smart card RC matches registration database.'
  },
  {
    id: 'BIKE-8802',
    brand: 'KTM',
    model: 'Duke 390 Gen-3',
    year: '2024',
    category: 'Sports Naked',
    registrationNumber: 'MH 12 QP 5510',
    chassisNumber: 'VBK9930XXL302194',
    engineNumber: 'KTM390E49102',
    ownerId: 'OWN-1002',
    ownerName: 'Ananya Deshmukh',
    ownerPhone: '+91 97654 32189',
    ownerEmail: 'ananya.d@outlook.com',
    dailyPrice: 1800,
    deposit: 4000,
    minDuration: 1,
    maxDuration: 7,
    pickupLocation: 'Kothrud, Pune',
    pickupAddress: 'Opp. MIT College Gate 2, Kothrud',
    pickupTimings: '08:00 AM - 08:00 PM',
    deliveryAvailable: false,
    rules: 'High octane fuel only. Helmets compulsory. Speed monitored via telematics above 100km/h.',
    submissionDate: '2026-11-04',
    status: 'Pending Verification',
    rcStatus: 'Pending Review',
    insuranceStatus: 'Needs Manual Review',
    pucStatus: 'Pending Review',
    images: {
      front: 'https://images.unsplash.com/photo-1558981854-32f416c14175?w=800&auto=format&fit=crop&q=80',
      rear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      left: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80'
    },
    documents: {
      rc: {
        fileName: 'RC_KTM_Duke_390.pdf',
        fileSize: '2.1 MB',
        uploadedDate: '2026-11-04',
        status: 'Pending Review',
        extracted: {
          ownerName: 'Ananya Deshmukh',
          regNo: 'MH 12 QP 5510',
          model: 'KTM 390 Duke ABS',
          chassis: 'VBK9930XXL302194',
          fuel: 'Petrol',
          mfgYear: '2024'
        }
      },
      insurance: {
        fileName: 'Bajaj_Allianz_Policy_Copy.pdf',
        policyNumber: 'OG-25-1901-1802-0004910',
        expiryDate: '2026-11-15', // Expiring soon!
        fileSize: '1.9 MB',
        uploadedDate: '2026-11-04',
        status: 'Needs Manual Review',
        extracted: {
          policyNo: 'OG-25-1901-1802-0004910',
          insurer: 'Bajaj Allianz General Insurance',
          expiryDate: '2026-11-15',
          vehicleNo: 'MH 12 QP 5510'
        }
      },
      puc: {
        fileName: 'PUC_KTM.pdf',
        expiryDate: '2027-02-28',
        fileSize: '890 KB',
        uploadedDate: '2026-11-04',
        status: 'Pending Review',
        extracted: {
          certNo: 'MH12-PUC-40912',
          expiryDate: '2027-02-28',
          vehicleNo: 'MH 12 QP 5510'
        }
      },
      ownerIdentity: {
        fileName: 'Aadhaar_Ananya_D.pdf',
        fileSize: '1.2 MB',
        status: 'Pending Review'
      },
      authorization: {
        type: 'Registered Vehicle Owner',
        declared: true
      }
    },
    comparison: [
      { field: 'Owner Name', submitted: 'Ananya Deshmukh', extracted: 'Ananya Deshmukh', match: true },
      { field: 'Registration Number', submitted: 'MH 12 QP 5510', extracted: 'MH 12 QP 5510', match: true },
      { field: 'Bike Model', submitted: 'KTM Duke 390 Gen-3', extracted: 'KTM 390 Duke ABS', match: true },
      { field: 'Chassis Number', submitted: 'VBK9930XXL302194', extracted: 'VBK9930XXL302194', match: true }
    ],
    verificationOutcome: 'Needs Manual Review',
    notes: 'Insurance is expiring in 11 days. Recommend requesting renewal certificate before live listing.'
  },
  {
    id: 'BIKE-8803',
    brand: 'Yamaha',
    model: 'YZF-R15 V4 Racing Blue',
    year: '2023',
    category: 'Sports Track',
    registrationNumber: 'KA 01 EK 7712',
    chassisNumber: 'ME1RG631XXXX90211',
    engineNumber: 'G3E901248',
    ownerId: 'OWN-1003',
    ownerName: 'Rajesh K. Verma',
    ownerPhone: '+91 94120 78654',
    ownerEmail: 'rajesh.verma.bikes@gmail.com',
    dailyPrice: 1100,
    deposit: 3000,
    minDuration: 2,
    maxDuration: 10,
    pickupLocation: 'Indiranagar, Bengaluru',
    pickupAddress: 'Metro Pillar 82, CMH Road, Indiranagar',
    pickupTimings: '09:00 AM - 07:00 PM',
    deliveryAvailable: true,
    rules: 'No track day usage. Regular unleaded petrol. Driving licence MCWG required.',
    submissionDate: '2026-11-02',
    status: 'Needs Correction',
    rcStatus: 'Rejected',
    insuranceStatus: 'Verified',
    pucStatus: 'Verified',
    images: {
      front: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      rear: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      left: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
      right: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
    },
    documents: {
      rc: {
        fileName: 'RC_Scan_Cutoff.jpg',
        fileSize: '420 KB',
        uploadedDate: '2026-11-02',
        status: 'Rejected',
        extracted: {
          ownerName: 'Sunita Verma', // Mismatch!
          regNo: 'KA 01 EK 7712',
          model: 'Yamaha YZF R15',
          chassis: 'ME1RG631XXXX90211',
          fuel: 'Petrol',
          mfgYear: '2023'
        }
      },
      insurance: {
        fileName: 'HDFC_ERGO_Policy.pdf',
        policyNumber: '2311/2001/4491029',
        expiryDate: '2027-09-12',
        fileSize: '1.6 MB',
        uploadedDate: '2026-11-02',
        status: 'Verified',
        extracted: {
          policyNo: '2311/2001/4491029',
          insurer: 'HDFC ERGO General Insurance',
          expiryDate: '2027-09-12',
          vehicleNo: 'KA 01 EK 7712'
        }
      },
      puc: {
        fileName: 'PUC_KA01.pdf',
        expiryDate: '2027-08-30',
        fileSize: '720 KB',
        uploadedDate: '2026-11-02',
        status: 'Verified',
        extracted: {
          certNo: 'KA01-PUC-2024-819',
          expiryDate: '2027-08-30',
          vehicleNo: 'KA 01 EK 7712'
        }
      },
      ownerIdentity: {
        fileName: 'Rajesh_Verma_DL.jpg',
        fileSize: '540 KB',
        status: 'Needs Correction'
      },
      authorization: {
        type: 'Authorized Representative (Family Member)',
        declared: false // Missing authorization deed!
      }
    },
    comparison: [
      { field: 'Owner Name', submitted: 'Rajesh K. Verma', extracted: 'Sunita Verma', match: false },
      { field: 'Registration Number', submitted: 'KA 01 EK 7712', extracted: 'KA 01 EK 7712', match: true },
      { field: 'Bike Model', submitted: 'Yamaha YZF-R15 V4 Racing Blue', extracted: 'Yamaha YZF R15', match: true },
      { field: 'Chassis Number', submitted: 'ME1RG631XXXX90211', extracted: 'ME1RG631XXXX90211', match: true }
    ],
    verificationOutcome: 'Failed',
    notes: 'RC registered under Sunita Verma but listing submitted by Rajesh Verma without Authorization Letter / Power of Attorney.'
  },
  {
    id: 'BIKE-8804',
    brand: 'TVS',
    model: 'Apache RTR 310',
    year: '2024',
    category: 'Sports Naked',
    registrationNumber: 'KA 04 MP 1902',
    chassisNumber: 'MD625BM3XXXX99120',
    engineNumber: 'TVS310E99120',
    ownerId: 'OWN-1004',
    ownerName: 'Arjun Nambiar',
    ownerPhone: '+91 98450 11982',
    ownerEmail: 'arjun.nambiar@techcorp.in',
    dailyPrice: 1400,
    deposit: 3500,
    minDuration: 1,
    maxDuration: 21,
    pickupLocation: 'Whitefield, Bengaluru',
    pickupAddress: 'Near Hopefarm Junction, Whitefield',
    pickupTimings: '06:00 AM - 10:00 PM',
    deliveryAvailable: true,
    rules: 'Dual helmets included. Clean bike return expected. Quick start guidance provided.',
    submissionDate: '2026-09-22',
    status: 'Approved',
    rcStatus: 'Verified',
    insuranceStatus: 'Verified',
    pucStatus: 'Verified',
    images: {
      front: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
      rear: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      left: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      right: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80'
    },
    documents: {
      rc: {
        fileName: 'TVS_RTR310_RC.pdf',
        fileSize: '1.5 MB',
        uploadedDate: '2026-09-22',
        status: 'Verified',
        extracted: {
          ownerName: 'Arjun Nambiar',
          regNo: 'KA 04 MP 1902',
          model: 'TVS Apache RTR 310',
          chassis: 'MD625BM3XXXX99120',
          fuel: 'Petrol',
          mfgYear: '2024'
        }
      },
      insurance: {
        fileName: 'TATA_AIG_Policy.pdf',
        policyNumber: '0163882910/00',
        expiryDate: '2027-10-01',
        fileSize: '2.0 MB',
        uploadedDate: '2026-09-22',
        status: 'Verified',
        extracted: {
          policyNo: '0163882910/00',
          insurer: 'Tata AIG General Insurance',
          expiryDate: '2027-10-01',
          vehicleNo: 'KA 04 MP 1902'
        }
      },
      puc: {
        fileName: 'PUC_Cert.pdf',
        expiryDate: '2027-09-15',
        fileSize: '510 KB',
        uploadedDate: '2026-09-22',
        status: 'Verified',
        extracted: {
          certNo: 'KA04-PUC-44109',
          expiryDate: '2027-09-15',
          vehicleNo: 'KA 04 MP 1902'
        }
      },
      ownerIdentity: {
        fileName: 'Passport_Arjun_N.pdf',
        fileSize: '3.2 MB',
        status: 'Verified'
      },
      authorization: {
        type: 'Registered Vehicle Owner',
        declared: true
      }
    },
    comparison: [
      { field: 'Owner Name', submitted: 'Arjun Nambiar', extracted: 'Arjun Nambiar', match: true },
      { field: 'Registration Number', submitted: 'KA 04 MP 1902', extracted: 'KA 04 MP 1902', match: true },
      { field: 'Bike Model', submitted: 'TVS Apache RTR 310', extracted: 'TVS Apache RTR 310', match: true },
      { field: 'Chassis Number', submitted: 'MD625BM3XXXX99120', extracted: 'MD625BM3XXXX99120', match: true }
    ],
    verificationOutcome: 'Passed',
    notes: 'Fully verified. Highly rated owner with clean records.'
  },
  {
    id: 'BIKE-8805',
    brand: 'Honda',
    model: 'Activa 6G Premium',
    year: '2023',
    category: 'Scooter',
    registrationNumber: 'DL 08 BV 3144',
    chassisNumber: 'ME4JF50XXXX110294',
    engineNumber: 'JF50E110294',
    ownerId: 'OWN-1005',
    ownerName: 'Sunil Chettri (Auto Club)',
    ownerPhone: '+91 99001 77210',
    ownerEmail: 'sunil.autoclub@gmail.com',
    dailyPrice: 500,
    deposit: 1500,
    minDuration: 1,
    maxDuration: 30,
    pickupLocation: 'Okhla, New Delhi',
    pickupAddress: 'Shop 14, Main Market, Okhla Phase 2',
    pickupTimings: '09:00 AM - 09:00 PM',
    deliveryAvailable: false,
    rules: 'Helmet included. City driving only.',
    submissionDate: '2026-08-16',
    status: 'Suspended',
    rcStatus: 'Verified',
    insuranceStatus: 'Expired',
    pucStatus: 'Expired',
    images: {
      front: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
      rear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
      left: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
      right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80'
    },
    documents: {
      rc: {
        fileName: 'Activa_RC.pdf',
        fileSize: '1.1 MB',
        uploadedDate: '2026-08-16',
        status: 'Verified',
        extracted: {
          ownerName: 'Sunil Chettri',
          regNo: 'DL 08 BV 3144',
          model: 'Honda Activa 6G',
          chassis: 'ME4JF50XXXX110294',
          fuel: 'Petrol',
          mfgYear: '2023'
        }
      },
      insurance: {
        fileName: 'Old_Insurance.pdf',
        policyNumber: '1102/990/2023',
        expiryDate: '2026-09-01', // Expired!
        fileSize: '1.2 MB',
        uploadedDate: '2026-08-16',
        status: 'Expired',
        extracted: {
          policyNo: '1102/990/2023',
          insurer: 'National Insurance Co',
          expiryDate: '2026-09-01',
          vehicleNo: 'DL 08 BV 3144'
        }
      },
      puc: {
        fileName: 'Old_PUC.pdf',
        expiryDate: '2026-08-30', // Expired!
        fileSize: '400 KB',
        uploadedDate: '2026-08-16',
        status: 'Expired',
        extracted: {
          certNo: 'DL08-PUC-112',
          expiryDate: '2026-08-30',
          vehicleNo: 'DL 08 BV 3144'
        }
      },
      ownerIdentity: {
        fileName: 'GST_Cert.pdf',
        fileSize: '890 KB',
        status: 'Suspended'
      },
      authorization: {
        type: 'Commercial Fleet Listing',
        declared: true
      }
    },
    comparison: [
      { field: 'Owner Name', submitted: 'Sunil Chettri', extracted: 'Sunil Chettri', match: true },
      { field: 'Registration Number', submitted: 'DL 08 BV 3144', extracted: 'DL 08 BV 3144', match: true },
      { field: 'Bike Model', submitted: 'Honda Activa 6G Premium', extracted: 'Honda Activa 6G', match: true },
      { field: 'Chassis Number', submitted: 'ME4JF50XXXX110294', extracted: 'ME4JF50XXXX110294', match: true }
    ],
    verificationOutcome: 'Failed',
    notes: 'Listing suspended automatically due to expired mandatory third-party insurance and PUC certification.'
  }
];

export const INITIAL_RENTERS = [
  {
    id: 'RNT-501',
    name: 'Sameer Singhania',
    phone: '+91 98112 34567',
    email: 'sameer.singhania@gmail.com',
    city: 'Mumbai',
    idStatus: 'Verified',
    dlStatus: 'Verified',
    dlNumber: 'MH-03-2021-0091823',
    dlExpiry: '2036-04-18',
    vehicleClass: 'MCWG & LMV (Motorcycle With Gear & Light Motor Vehicle)',
    eligibleForGearBikes: true,
    verificationStatus: 'Approved',
    registeredDate: '2026-07-10',
    totalTrips: 8,
    rating: 4.9,
    documents: [
      { name: 'Driving Licence (Front & Back)', status: 'Verified', expiry: '2036-04-18' },
      { name: 'Aadhaar Card', status: 'Verified', expiry: 'N/A' }
    ],
    bookingHistory: [
      { bookingId: 'BK-9410', bike: 'Royal Enfield Himalayan 450', date: '2026-10-20', status: 'Completed', amount: 4800 },
      { bookingId: 'BK-9428', bike: 'KTM Duke 390 Gen-3', date: '2026-11-01', status: 'Active', amount: 5400 }
    ]
  },
  {
    id: 'RNT-502',
    name: 'Kavita Sundaram',
    phone: '+91 97200 48192',
    email: 'kavita.s@yahoo.com',
    city: 'Bengaluru',
    idStatus: 'Verified',
    dlStatus: 'Pending Review',
    dlNumber: 'KA-05-2023-0182741',
    dlExpiry: '2038-09-24',
    vehicleClass: 'MCWOG (Motorcycle Without Gear Only - Scooters)',
    eligibleForGearBikes: false,
    verificationStatus: 'Pending',
    registeredDate: '2026-11-03',
    totalTrips: 0,
    rating: 0,
    documents: [
      { name: 'Driving Licence Scan', status: 'Pending Review', expiry: '2038-09-24' },
      { name: 'PAN Card', status: 'Verified', expiry: 'N/A' }
    ],
    bookingHistory: []
  },
  {
    id: 'RNT-503',
    name: 'Farhan Akhtar',
    phone: '+91 99881 22334',
    email: 'farhan.akhtar99@gmail.com',
    city: 'Pune',
    idStatus: 'Verified',
    dlStatus: 'Expired',
    dlNumber: 'MH-14-2015-0012984',
    dlExpiry: '2026-10-10', // Expired!
    vehicleClass: 'MCWG',
    eligibleForGearBikes: false,
    verificationStatus: 'Needs Correction',
    registeredDate: '2026-09-18',
    totalTrips: 3,
    rating: 4.6,
    documents: [
      { name: 'Driving Licence (Expired)', status: 'Expired', expiry: '2026-10-10' }
    ],
    bookingHistory: [
      { bookingId: 'BK-8902', bike: 'Yamaha FZ-S', date: '2026-09-25', status: 'Completed', amount: 2400 }
    ]
  },
  {
    id: 'RNT-504',
    name: 'David Miller',
    phone: '+44 7700 900123',
    email: 'david.miller@uktravels.co.uk',
    city: 'International (UK) / Visiting Delhi',
    idStatus: 'Verified',
    dlStatus: 'Verified',
    dlNumber: 'IDP-UK-9041289',
    dlExpiry: '2027-01-30',
    vehicleClass: 'International Driving Permit (Class A)',
    eligibleForGearBikes: true,
    verificationStatus: 'Approved',
    registeredDate: '2026-10-25',
    totalTrips: 1,
    rating: 5.0,
    documents: [
      { name: 'Passport Copy + Visa', status: 'Verified', expiry: '2027-04-15' },
      { name: 'International Driving Permit', status: 'Verified', expiry: '2027-01-30' }
    ],
    bookingHistory: [
      { bookingId: 'BK-9390', bike: 'Royal Enfield Meteor 350', date: '2026-10-28', status: 'Completed', amount: 6000 }
    ]
  }
];

export const INITIAL_BOOKINGS = [
  {
    id: 'BK-9428',
    bikeId: 'BIKE-8802',
    bikeName: 'KTM Duke 390 Gen-3',
    bikeRegNo: 'MH 12 QP 5510',
    ownerId: 'OWN-1002',
    ownerName: 'Ananya Deshmukh',
    renterId: 'RNT-501',
    renterName: 'Sameer Singhania',
    pickupDate: '2026-11-05',
    returnDate: '2026-11-08',
    pickupTime: '10:00 AM',
    returnTime: '10:00 AM',
    durationDays: 3,
    dailyRate: 1800,
    rentalTotal: 5400,
    platformFee: 540,
    ownerPayout: 4860,
    securityDeposit: 4000,
    depositStatus: 'Held in Escrow',
    paymentStatus: 'Paid (Escrow)',
    bookingStatus: 'Active',
    agreementStatus: 'Digitally Signed',
    pickupInspection: {
      completed: true,
      odometer: '12,410 km',
      fuelLevel: '100% Full',
      existingScratches: 'Minor scratch on left exhaust guard',
      photosTaken: 4,
      signedByRenter: true,
      time: '2026-11-05 10:14 AM'
    },
    returnInspection: {
      completed: false,
      scheduledTime: '2026-11-08 10:00 AM'
    },
    timeline: [
      { time: '2026-11-04 16:20', event: 'Booking requested by Sameer Singhania' },
      { time: '2026-11-04 16:35', event: 'Accepted by Owner Ananya Deshmukh' },
      { time: '2026-11-04 16:40', event: 'Payment ₹9,400 received (Rent ₹5,400 + Deposit ₹4,000)' },
      { time: '2026-11-05 10:14', event: 'Vehicle picked up & inspection signed' }
    ]
  },
  {
    id: 'BK-9410',
    bikeId: 'BIKE-8801',
    bikeName: 'Royal Enfield Himalayan 450',
    bikeRegNo: 'MH 02 FJ 9042',
    ownerId: 'OWN-1001',
    ownerName: 'Vikram Malhotra',
    renterId: 'RNT-501',
    renterName: 'Sameer Singhania',
    pickupDate: '2026-10-20',
    returnDate: '2026-10-23',
    pickupTime: '08:00 AM',
    returnTime: '08:00 AM',
    durationDays: 3,
    dailyRate: 1600,
    rentalTotal: 4800,
    platformFee: 480,
    ownerPayout: 4320,
    securityDeposit: 3500,
    depositStatus: 'Refunded',
    paymentStatus: 'Settled',
    bookingStatus: 'Completed',
    agreementStatus: 'Digitally Signed',
    pickupInspection: {
      completed: true,
      odometer: '8,200 km',
      fuelLevel: '100%',
      signedByRenter: true
    },
    returnInspection: {
      completed: true,
      odometer: '8,620 km',
      fuelLevel: '100%',
      damageFound: 'None',
      depositRefundApproved: true
    },
    timeline: [
      { time: '2026-10-19 12:00', event: 'Booking created and paid' },
      { time: '2026-10-20 08:15', event: 'Pickup completed' },
      { time: '2026-10-23 08:10', event: 'Return completed, no damage, full deposit ₹3,500 refunded' },
      { time: '2026-10-23 09:00', event: 'Owner payout ₹4,320 released' }
    ]
  },
  {
    id: 'BK-9440',
    bikeId: 'BIKE-8804',
    bikeName: 'TVS Apache RTR 310',
    bikeRegNo: 'KA 04 MP 1902',
    ownerId: 'OWN-1004',
    ownerName: 'Arjun Nambiar',
    renterId: 'RNT-504',
    renterName: 'David Miller',
    pickupDate: '2026-11-10',
    returnDate: '2026-11-14',
    pickupTime: '09:00 AM',
    returnTime: '09:00 AM',
    durationDays: 4,
    dailyRate: 1400,
    rentalTotal: 5600,
    platformFee: 560,
    ownerPayout: 5040,
    securityDeposit: 3500,
    depositStatus: 'Held in Escrow',
    paymentStatus: 'Paid (Escrow)',
    bookingStatus: 'Upcoming',
    agreementStatus: 'Digitally Signed',
    pickupInspection: { completed: false },
    returnInspection: { completed: false },
    timeline: [
      { time: '2026-11-05 14:10', event: 'Booking confirmed for upcoming tour' }
    ]
  },
  {
    id: 'BK-9388',
    bikeId: 'BIKE-8801',
    bikeName: 'Royal Enfield Himalayan 450',
    bikeRegNo: 'MH 02 FJ 9042',
    ownerId: 'OWN-1001',
    ownerName: 'Vikram Malhotra',
    renterId: 'RNT-503',
    renterName: 'Farhan Akhtar',
    pickupDate: '2026-10-10',
    returnDate: '2026-10-12',
    pickupTime: '11:00 AM',
    returnTime: '11:00 AM',
    durationDays: 2,
    dailyRate: 1600,
    rentalTotal: 3200,
    platformFee: 320,
    ownerPayout: 2880,
    securityDeposit: 3500,
    depositStatus: 'Partially Deducted',
    paymentStatus: 'Disputed',
    bookingStatus: 'Disputed',
    agreementStatus: 'Digitally Signed',
    pickupInspection: { completed: true, odometer: '7,900 km', fuelLevel: '100%' },
    returnInspection: {
      completed: true,
      odometer: '8,190 km',
      fuelLevel: '20% (Short fuel)',
      damageFound: 'Broken right rearview mirror and scratched clutch lever',
      repairEstimate: 1200
    },
    timeline: [
      { time: '2026-10-10 11:00', event: 'Pickup completed' },
      { time: '2026-10-12 18:30', event: 'Late return by 7.5 hours with mirror damage' },
      { time: '2026-10-12 19:00', event: 'Dispute opened by Owner Vikram Malhotra' }
    ]
  }
];

export const INITIAL_TRANSACTIONS = [
  {
    id: 'TXN-90812',
    bookingId: 'BK-9428',
    renterName: 'Sameer Singhania',
    ownerName: 'Ananya Deshmukh',
    bookingAmount: 5400,
    platformCommission: 540,
    ownerPayout: 4860,
    securityDeposit: 4000,
    type: 'Booking Payment',
    status: 'Successful',
    paymentMethod: 'UPI (GPay)',
    date: '2026-11-04 16:40'
  },
  {
    id: 'TXN-90810',
    bookingId: 'BK-9440',
    renterName: 'David Miller',
    ownerName: 'Arjun Nambiar',
    bookingAmount: 5600,
    platformCommission: 560,
    ownerPayout: 5040,
    securityDeposit: 3500,
    type: 'Booking Payment',
    status: 'Successful',
    paymentMethod: 'Credit Card (Visa Intl)',
    date: '2026-11-05 14:12'
  },
  {
    id: 'TXN-90795',
    bookingId: 'BK-9410',
    renterName: 'Sameer Singhania',
    ownerName: 'Vikram Malhotra',
    bookingAmount: 4800,
    platformCommission: 480,
    ownerPayout: 4320,
    securityDeposit: 3500,
    type: 'Settlement & Deposit Refund',
    status: 'Successful',
    paymentMethod: 'NetBanking HDFC',
    date: '2026-10-23 09:00'
  },
  {
    id: 'TXN-90740',
    bookingId: 'BK-9388',
    renterName: 'Farhan Akhtar',
    ownerName: 'Vikram Malhotra',
    bookingAmount: 3200,
    platformCommission: 320,
    ownerPayout: 2880,
    securityDeposit: 3500,
    type: 'Disputed Deposit Hold',
    status: 'Pending',
    paymentMethod: 'UPI',
    date: '2026-10-12 19:15'
  },
  {
    id: 'TXN-90690',
    bookingId: 'BK-9201',
    renterName: 'Pooja Hegde',
    ownerName: 'Arjun Nambiar',
    bookingAmount: 2200,
    platformCommission: 220,
    ownerPayout: 0,
    securityDeposit: 3000,
    type: 'Cancellation Refund',
    status: 'Refunded',
    paymentMethod: 'Debit Card',
    date: '2026-10-08 11:20'
  }
];

export const INITIAL_COMPLAINTS = [
  {
    id: 'REP-701',
    bookingId: 'BK-9388',
    reporter: 'Owner (Vikram Malhotra)',
    category: 'Bike Damage & Late Return',
    priority: 'High',
    description: 'Renter returned the motorcycle 7.5 hours past scheduled time without notice. Upon inspection, the right side rearview mirror was broken and clutch lever scraped. Renter refuses to cover replacement cost of ₹1,200.',
    supportingEvidence: ['mirror_damage_photo.jpg', 'inspection_sheet_signed.pdf'],
    dateReported: '2026-10-12',
    status: 'In Investigation',
    assignedAdmin: 'Priya M. (Operations Lead)',
    adminNotes: 'Contacted renter via phone on Oct 14. Renter agreed to partial settlement of ₹800. Awaiting final invoice from Royal Enfield authorized workshop.',
    resolution: ''
  },
  {
    id: 'REP-702',
    bookingId: 'BK-9104',
    reporter: 'Owner (Rajesh K. Verma)',
    category: 'Late Bike Returns',
    priority: 'Medium',
    description: 'Renter failed to return bike at 7 PM. Telematics shows bike stationed at Lonavala expressway dhaba. Renter phone unreachable.',
    supportingEvidence: ['gps_ping_snapshot.png'],
    dateReported: '2026-10-29',
    status: 'Resolved',
    assignedAdmin: 'Rohan S. (Security & Fleet)',
    adminNotes: 'Renter phone had run out of battery. Bike safely returned at 11:30 PM with standard overtime fee applied.',
    resolution: 'Late return fee of ₹600 deducted from deposit and credited to owner. Case closed.'
  },
  {
    id: 'REP-703',
    bookingId: 'N/A',
    reporter: 'Platform Verification Bot',
    category: 'Document Fraud',
    priority: 'Critical',
    description: 'Suspicious duplicate chassis number detected on listing attempt for Yamaha R15. Chassis matches an existing registered vehicle in Delhi circle.',
    supportingEvidence: ['fraud_match_log_chassis.json'],
    dateReported: '2026-11-02',
    status: 'Open',
    assignedAdmin: 'Admin Team',
    adminNotes: 'Listing put on immediate hold. Notification sent to account owner to present physical RC at zonal hub.',
    resolution: ''
  },
  {
    id: 'REP-704',
    bookingId: 'BK-8840',
    reporter: 'Renter (Amitav Joshi)',
    category: 'Owner-Renter Complaints',
    priority: 'Low',
    description: 'Owner arrived 45 minutes late for bike handover at pickup hub, causing renter to miss highway departure group.',
    supportingEvidence: ['chat_screenshots.jpg'],
    dateReported: '2026-10-18',
    status: 'Resolved',
    assignedAdmin: 'Karan T.',
    adminNotes: 'Owner issued warning on punctuality metrics. Renter provided ₹300 platform credit voucher.',
    resolution: 'Resolved with courtesy voucher and warning issued to owner.'
  }
];

export const INITIAL_LOCATIONS = [
  { id: 'LOC-1', city: 'Mumbai', hubs: ['Bandra West Hub', 'Andheri East Hub', 'Thane West Hub'], activeBikes: 24, status: 'Active' },
  { id: 'LOC-2', city: 'Pune', hubs: ['Kothrud Hub', 'Viman Nagar Hub', 'Hinjewadi IT Hub'], activeBikes: 18, status: 'Active' },
  { id: 'LOC-3', city: 'Bengaluru', hubs: ['Indiranagar Hub', 'Whitefield Hub', 'Koramangala 4th Block'], activeBikes: 32, status: 'Active' },
  { id: 'LOC-4', city: 'New Delhi / NCR', hubs: ['Connaught Place Hub', 'Okhla Hub', 'Cyber City Gurugram'], activeBikes: 21, status: 'Active' },
  { id: 'LOC-5', city: 'Goa', hubs: ['Panaji Riverfront', 'Calangute Hub', 'Madgaon Station'], activeBikes: 15, status: 'Active' }
];

export const PLATFORM_SETTINGS = {
  platformCommissionPercent: 10,
  securityDepositRequirement: 'Mandatory on all listings (Refundable in escrow)',
  idVerificationLevel: 'Aadhaar OTP + Driving Licence (Strict)',
  pucAndInsuranceMandatory: true,
  autoApproveRenewals: false,
  insuranceExpiryBufferDays: 15,
  supportEmail: 'support@theroadeagle.com',
  emergencyPhone: '+91 80000 12345'
};

export const ANALYTICS_DATA = {
  kpis: {
    totalUsers: 1420,
    totalOwners: 184,
    totalRenters: 1236,
    totalListedBikes: 96,
    pendingVerifications: 7,
    approvedBikes: 82,
    activeBookings: 14,
    completedBookings: 342,
    totalRevenue: 648500
  },
  revenueByMonth: [
    { month: 'Jun', gmv: 74000, revenue: 7400 },
    { month: 'Jul', gmv: 92000, revenue: 9200 },
    { month: 'Aug', gmv: 110000, revenue: 11000 },
    { month: 'Sep', gmv: 145000, revenue: 14500 },
    { month: 'Oct', gmv: 198000, revenue: 19800 },
    { month: 'Nov (Proj)', gmv: 240000, revenue: 24000 }
  ],
  bookingsByCategory: [
    { name: 'Cruiser Bikes', count: 142, share: '41%' },
    { name: 'Sports & Track', count: 98, share: '29%' },
    { name: 'Adventure Tourer', count: 64, share: '19%' },
    { name: 'Scooters & Commuters', count: 38, share: '11%' }
  ],
  popularLocations: [
    { city: 'Bengaluru', volume: '34%' },
    { city: 'Mumbai', volume: '28%' },
    { city: 'Pune', volume: '20%' },
    { city: 'New Delhi', volume: '18%' }
  ]
};

