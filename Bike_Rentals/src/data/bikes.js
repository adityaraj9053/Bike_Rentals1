import { resolveImage } from '../assets/images';

export const RAW_BIKES_DATA = [
  {
    id: "night-hawk-cruiser",
    name: "Night Hawk Cruiser",
    model: "Royal Enfield Meteor 350",
    category: "Cruiser Bikes",
    categoryKey: "cruiser",
    tagline: "Ultimate comfort for long highway rides.",
    pricePerDay: 1500,
    deposit: 3000,
    rating: 4.9,
    reviewsCount: 142,
    badge: "PREMIUM CHOICE",
    badgeType: "premium", // cyan
    availability: "Available for immediate booking",
    statusBadge: "LIMITED",
    isFeatured: true,
    image: "/images/night-hawk-cruiser.jpg",
    gallery: [
      "/images/night-hawk-cruiser.jpg",
      "/images/cockpit.jpg",
      "/images/engine.jpg"
    ],
    specs: {
      displacement: "349.34 CC",
      power: "20.2 BHP @ 6100 rpm",
      transmission: "5-Speed Manual",
      fuelSystem: "Electronic Fuel Injection",
      tankCapacity: "15 Liters",
      mileage: "35-40 kmpl",
      seating: "2 Persons",
      weight: "191 kg",
      braking: "Dual Channel ABS",
      fuelType: "Petrol"
    },
    features: [
      "Ergonomic Low-Slung Touring Seat",
      "Tripper Navigation Display Support",
      "Dual Disc Brakes with ABS",
      "Pillion Backrest for Passenger Comfort",
      "USB Charging Port On-Board"
    ],
    guidelines: {
      duration: "Minimum rental duration is 24 hours. Rental starts from the time of pickup till the same time next day.",
      documents: "Valid Original Driving Licence (A-Category), Aadhaar Card or Passport, and 2 passport-size photographs are mandatory.",
      deposit: "A refundable security deposit of ₹3,000* is required at the time of pickup. Fully refundable after inspection.",
      rules: "Helmets are mandatory (1 complimentary provided). Only authorized licensed riders. Riding outside city limits requires prior intimation."
    }
  },
  {
    id: "eagle-commuter-x",
    name: "Eagle Commuter X",
    model: "Hero Splendor Pro 150",
    category: "Commuter Bikes",
    categoryKey: "commuter",
    tagline: "Perfect for daily city navigation & maximum efficiency.",
    pricePerDay: 800,
    deposit: 2000,
    rating: 4.8,
    reviewsCount: 218,
    badge: "POPULAR",
    badgeType: "popular", // cyan
    availability: "Available for immediate booking",
    statusBadge: "AVAILABLE",
    isFeatured: true,
    image: "/images/commuter.jpg",
    gallery: [
      "/images/commuter.jpg",
      "/images/cockpit.jpg"
    ],
    specs: {
      displacement: "150 CC",
      power: "14.1 BHP @ 8500 rpm",
      transmission: "Manual Transmission",
      fuelSystem: "Carburetor with Intelligent Spark",
      tankCapacity: "12 Liters",
      mileage: "55-60 kmpl",
      seating: "2 Persons",
      weight: "135 kg",
      braking: "Front Disc / Rear Drum",
      fuelType: "Petrol"
    },
    features: [
      "Ultra High Fuel Efficiency",
      "Lightweight Agility for Dense City Traffic",
      "Comfortable Upright Rider Posture",
      "Sturdy Luggage Carrier Rack",
      "Electric Push Start & Kick Backup"
    ],
    guidelines: {
      duration: "Minimum rental duration is 24 hours.",
      documents: "Valid Driving Licence & Government ID (Aadhaar/Voter ID).",
      deposit: "Refundable security deposit of ₹2,000* collected at pickup.",
      rules: "City riding allowed. Standard fuel return policy applies."
    }
  },
  {
    id: "phantom-sport",
    name: "Phantom Sport",
    model: "Yamaha YZF-R1 Superbike",
    category: "Premium Bikes",
    categoryKey: "premium",
    tagline: "Adrenaline on two wheels. Track ready performance.",
    pricePerDay: 2200,
    deposit: 5000,
    rating: 5.0,
    reviewsCount: 89,
    badge: "PREMIUM",
    badgeType: "premium",
    availability: "Available for immediate booking",
    statusBadge: "LIMITED",
    isFeatured: true,
    image: "/images/phantom-sport.jpg",
    gallery: [
      "/images/phantom-sport.jpg",
      "/images/cockpit.jpg",
      "/images/engine.jpg"
    ],
    specs: {
      displacement: "650 CC",
      power: "73.4 BHP @ 8750 rpm",
      transmission: "6-Speed Manual",
      fuelSystem: "Electronic Twin Fuel Injection",
      tankCapacity: "14 Liters",
      mileage: "18-22 kmpl",
      seating: "2 Persons",
      weight: "182 kg",
      braking: "Dual Channel Brembo ABS",
      fuelType: "Petrol"
    },
    features: [
      "Aerodynamic Racing Fairing & Winglets",
      "Traction Control System (TCS) & Quickshifter",
      "Full Color TFT Instrument Console",
      "Twin LED Projector Headlights",
      "High Grip Radial Track Tyres"
    ],
    guidelines: {
      duration: "Minimum rental duration is 24 hours.",
      documents: "Valid Driving Licence (min 2 years riding experience recommended) & ID Proof.",
      deposit: "Refundable security deposit of ₹5,000* collected at pickup.",
      rules: "Strictly adhere to speed limits. Full riding gear advised."
    }
  },
  {
    id: "apex-sport-s",
    name: "Apex Sport S",
    model: "Kawasaki Ninja 650",
    category: "Sports Bikes",
    categoryKey: "sports",
    tagline: "Precision engineering for true sport enthusiasts.",
    pricePerDay: 2000,
    deposit: 4500,
    rating: 4.9,
    reviewsCount: 104,
    badge: "SPORT RACING",
    badgeType: "sport",
    availability: "Available for immediate booking",
    statusBadge: "AVAILABLE",
    isFeatured: false,
    image: "/images/apex-sport.jpg",
    gallery: [
      "/images/apex-sport.jpg",
      "/images/engine.jpg"
    ],
    specs: {
      displacement: "600 CC",
      power: "68 BHP @ 8000 rpm",
      transmission: "6-Speed Manual",
      fuelSystem: "Dual Throttle Valves Injection",
      tankCapacity: "15 Liters",
      mileage: "21-25 kmpl",
      seating: "2 Persons",
      weight: "196 kg",
      braking: "Dual Petal Disc ABS",
      fuelType: "Petrol"
    },
    features: [
      "Assist & Slipper Clutch",
      "Smartphone Connectivity (Rideology App)",
      "Sharp Aggressive Sugomi Styling",
      "High Windscreen for Highway Touring"
    ],
    guidelines: {
      duration: "Minimum rental duration is 24 hours.",
      documents: "Valid Driving Licence & Aadhaar/Passport.",
      deposit: "Refundable security deposit of ₹4,500*.",
      rules: "No stunting permitted. Speed governor installed."
    }
  },
  {
    id: "heritage-cruiser",
    name: "Heritage Cruiser",
    model: "Royal Enfield Classic 500",
    category: "Cruiser Bikes",
    categoryKey: "cruiser",
    tagline: "Classic style meets timeless thumping reliability.",
    pricePerDay: 1800,
    deposit: 3500,
    rating: 4.8,
    reviewsCount: 167,
    badge: "CLASSIC VINTAGE",
    badgeType: "vintage",
    availability: "Available for immediate booking",
    statusBadge: "AVAILABLE",
    isFeatured: false,
    image: "/images/heritage-cruiser.jpg",
    gallery: [
      "/images/heritage-cruiser.jpg",
      "/images/cockpit.jpg"
    ],
    specs: {
      displacement: "500 CC",
      power: "27.2 BHP @ 5250 rpm",
      transmission: "5-Speed Manual",
      fuelSystem: "Electronic Fuel Injection",
      tankCapacity: "13.5 Liters",
      mileage: "30-34 kmpl",
      seating: "2 Persons",
      weight: "195 kg",
      braking: "Dual Channel ABS",
      fuelType: "Petrol"
    },
    features: [
      "Iconic Single Spring Saddle Rider Seat",
      "Heavy Flywheel Classic Exhaust Beat",
      "Spoke Wheels & Retro Round Indicators",
      "Metal Body Built to Last Any Highway Journey"
    ],
    guidelines: {
      duration: "Minimum rental duration is 24 hours.",
      documents: "Valid Driving Licence & Aadhaar/Passport.",
      deposit: "Refundable security deposit of ₹3,500*.",
      rules: "Standard touring policies apply."
    }
  },
  {
    id: "city-glide-20",
    name: "City Glide 2.0",
    model: "Ather / Ola Smart EV 110",
    category: "Scooters",
    categoryKey: "scooters",
    tagline: "The ultimate effortless urban mobility solution.",
    pricePerDay: 600,
    deposit: 1500,
    rating: 4.7,
    reviewsCount: 312,
    badge: "ECO FRIENDLY",
    badgeType: "eco",
    availability: "Available for immediate booking",
    statusBadge: "AVAILABLE",
    isFeatured: false,
    image: "/images/scooter.jpg",
    gallery: [
      "/images/scooter.jpg",
      "/images/cockpit.jpg"
    ],
    specs: {
      displacement: "110 CC / EV",
      power: "8.2 BHP (Instant Torque)",
      transmission: "Automatic (Twist & Go)",
      fuelSystem: "Smart BMS Lithium-Ion / Petrol",
      tankCapacity: "5.5 L / 3.7 kWh Battery",
      mileage: "50 kmpl / 120 km range",
      seating: "2 Persons",
      weight: "108 kg",
      braking: "Combi Brake System (CBS)",
      fuelType: "Electric / Petrol"
    },
    features: [
      "Massive 22-Liter Underseat Storage",
      "Touchscreen Smart Dashboard with GPS",
      "Reverse Parking Assist Mode",
      "Silent Zero Vibration Powertrain"
    ],
    guidelines: {
      duration: "Minimum rental duration is 24 hours.",
      documents: "Valid Two-Wheeler Licence & Aadhaar.",
      deposit: "Refundable security deposit of ₹1,500*.",
      rules: "Home charger kit provided complimentary."
    }
  }
];

// Enrich bikes with React Native image sources
export const BIKES_DATA = RAW_BIKES_DATA.map((bike) => ({
  ...bike,
  imageSource: resolveImage(bike.image),
  gallerySources: (bike.gallery || [bike.image]).map((img) => resolveImage(img)),
}));

export const CATEGORIES_DATA = [
  {
    id: "all",
    label: "All Bikes",
    description: "Browse our entire curated lineup of bikes & scooters"
  },
  {
    id: "scooters",
    label: "Scooters",
    categoryKey: "scooters",
    image: "/images/scooter.jpg",
    imageSource: resolveImage('/images/scooter.jpg'),
    description: "Lightweight, automatic, and perfect for city traffic."
  },
  {
    id: "commuter",
    label: "Commuter Bikes",
    categoryKey: "commuter",
    image: "/images/commuter.jpg",
    imageSource: resolveImage('/images/commuter.jpg'),
    description: "Budget-friendly everyday workhorses with great mileage."
  },
  {
    id: "cruiser",
    label: "Cruiser Bikes",
    categoryKey: "cruiser",
    image: "/images/night-hawk-cruiser.jpg",
    imageSource: resolveImage('/images/night-hawk-cruiser.jpg'),
    description: "Low-slung comfort engineered for long open highway trips."
  },
  {
    id: "premium",
    label: "Premium Bikes",
    categoryKey: "premium",
    image: "/images/phantom-sport.jpg",
    imageSource: resolveImage('/images/phantom-sport.jpg'),
    description: "High performance racing superbikes with pure power."
  }
];

export const FAQS_DATA = [
  {
    question: "How can I rent a bike?",
    answer: "Renting is simple! Browse our fleet, pick your bike, choose your rental dates, and click 'Continue to Summary'. You can confirm directly on WhatsApp or complete the reservation online with instant verification."
  },
  {
    question: "What documents are required?",
    answer: "You will need: 1) A valid original Driving Licence (Two-Wheeler / Motorcycle category), 2) Government-issued photo ID (Aadhaar, Passport, or Voter ID), and 3) Two passport-size photographs or instant selfie verification."
  },
  {
    question: "Is a driving licence mandatory?",
    answer: "Yes, holding a valid two-wheeler driving licence is strictly mandatory by law. Learners licences or expired licences are not accepted."
  },
  {
    question: "Is a security deposit required?",
    answer: "Yes, a fully refundable security deposit starting at ₹1,500 to ₹5,000 (depending on bike class) is collected at pickup. It is 100% refunded within 24-48 hours after vehicle return inspection."
  },
  {
    question: "Do you provide helmets with the rental?",
    answer: "Yes! Every rental includes one sanitized ISI/DOT approved helmet complimentary. An extra helmet for the pillion passenger can be rented for a nominal ₹50/day fee."
  },
  {
    question: "What is your fuel policy?",
    answer: "We follow a 'same-to-same' fuel policy. Whatever fuel level the bike has at the time of pickup must be matched at the time of drop-off."
  }
];

export const TESTIMONIALS_DATA = [
  {
    name: "Rahul Sharma",
    city: "Mumbai",
    rating: 5,
    date: "October 2024",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80",
    review: "Rented the Night Hawk Cruiser for a weekend trip to the hills. The bike was in pristine condition, thoroughly serviced, and the booking process was super smooth. Highly recommend The Road Eagle!"
  },
  {
    name: "Ananya Verma",
    city: "Bengaluru",
    rating: 5,
    date: "September 2024",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
    review: "The electric scooters are perfect for city traffic. Very affordable, eco-friendly, and the customer support was extremely responsive on WhatsApp. Picked it up in under 5 minutes!"
  },
  {
    name: "David Miller",
    city: "Delhi / Goa Traveler",
    rating: 5,
    date: "August 2024",
    avatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=120&q=80",
    review: "Best bike rental service in the city. The USPs they mention are actually true—transparent pricing with zero hidden charges. Very welcoming and helpful staff."
  }
];
