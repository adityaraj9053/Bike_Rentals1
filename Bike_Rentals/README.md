# 🏍️ The Road Eagle - React Native (Expo) Mobile App

**The Road Eagle** is a motorcycle and scooter rental mobile application built with **React Native**, **Expo SDK**, and **React Navigation**.

---

## 📱 Features

- **Bottom Tab & Native Stack Navigation**:
  - **Home**: Hero banner with gradient overlay, feature strip, curated lineup with category tabs, value propositions, verified customer reviews carousel, FAQs accordion, and bottom CTA banner.
  - **Motorbikes (Fleet)**: Search bar, sorting (featured, price, rating), horizontal category filter chips, dynamic available count, and motorbike cards.
  - **How It Works (Guide)**: 4-step rental journey, comprehensive rental guidelines (mandatory documents, deposit policies, fuel & mileage terms), and interactive FAQ accordion.
  - **About Us**: Story & mission, milestone metrics (500+ riders, 98% satisfaction, 50+ bikes, 24/7 support), in-house workshop showcase, and core values.
  - **Contact**: Quick action cards (direct call, WhatsApp concierge, email, and Google Maps location), and interactive enquiry message form.
- **Motorbike Details**:
  - Interactive image gallery with thumbnail strip.
  - Pricing badges, availability indicators, and refundable security deposit pills.
  - 8-point technical specifications grid (displacement, power, transmission, fuel system, tank capacity, mileage, braking, weight).
  - Feature highlights with checkmark indicators.
  - Rental requirements and similar bikes horizontal carousel.
  - Sticky bottom action bar for one-thumb booking.
- **3-Step Reservation Flow**:
  1. **Date & Time Selection**: Pickup & return date/time pickers, hub vs doorstep delivery selector, and real-time billing days calculation.
  2. **Summary & Payment**: Cost breakdown (rental charges, security deposit, total payable), rider details form, and payment method selection (UPI/QR, Credit/Debit Card, Pay at Hub Pickup).
  3. **Confirmation Voucher**: Instant reservation ref `#RDE-XXXXXX`, next steps timeline, WhatsApp confirmation trigger, and official quotation voucher sheet.
- **Interactive Modals & Floating Tools**:
  - **Book This Bike Modal**: Quick action bottom sheet with Call Concierge, WhatsApp Concierge, Zalo Concierge, and Reserve Online.
  - **WhatsApp Enquiry Modal**: Pre-fills motorcycle details, dates, and rider notes into WhatsApp API link (`+91 98765 43210`).
  - **Official Quotation Voucher**: Printable/sharable invoice view with breakdown table and pickup checklist.
  - **Rider Auth Modal**: Sign in, sign up, Google login simulation, and rider profile management.
  - **Floating WhatsApp Quick Button**: One-tap access to WhatsApp concierge from anywhere in the app.
  - **Animated Toast Notification Layer**: Real-time feedback for reservations, authentication, and actions.

---

## 🚀 Running the App

### 1. Start the Expo Dev Server
```bash
npm start
```
or
```bash
npx expo start
```

### 2. Run on Android Device / Emulator
```bash
npm run android
```
*(Or scan the terminal QR code with the **Expo Go** app on your Android device)*

### 3. Run on iOS Simulator / Device
```bash
npm run ios
```
*(Or scan the terminal QR code using the Camera app with **Expo Go** installed on your iPhone)*

### 4. Run on Web (Browser)
```bash
npm run web
```

---

## 📂 Project Architecture

```
├── App.jsx                     # Root application component with Providers and Modals
├── App.js                      # Entry point re-export
├── index.js                    # Expo registerRootComponent entry
├── app.json                    # Expo project configuration & metadata
├── metro.config.js             # Metro bundler configuration
├── package.json                # Project dependencies & scripts
├── assets/                     # App icons, splash screens, and motorbike imagery
│   └── images/                 # All motorcycle catalog photos
└── src/
    ├── assets/
    │   └── images.js           # Static image dictionary & resolver
    ├── components/
    │   ├── AuthModal.jsx       # Rider login, signup, and profile modal
    │   ├── BikeCard.jsx        # Reusable motorcycle card component
    │   ├── BookDropdownModal.jsx # Call, WhatsApp, Zalo & Reserve action sheet
    │   ├── CustomHeader.jsx    # Top app bar with brand logo & actions
    │   ├── EnquiryModal.jsx    # WhatsApp enquiry form modal
    │   ├── FloatingWhatsApp.jsx# Bottom floating WhatsApp button
    │   ├── QuoteModal.jsx      # Official printable quotation voucher
    │   └── Toast.jsx           # Animated toast notification layer
    ├── data/
    │   └── bikes.js            # Motorbike specs, categories, FAQs & reviews
    ├── navigation/
    │   └── RootNavigator.jsx   # React Navigation Bottom Tabs & Native Stack
    ├── screens/
    │   ├── AboutUsScreen.jsx   # Story, milestones, and core values
    │   ├── BikeDetailsScreen.jsx# Vehicle specs, gallery, and sticky action bar
    │   ├── BookingScreen.jsx   # 3-step reservation flow
    │   ├── ContactScreen.jsx   # Direct contact channels and enquiry form
    │   ├── HomeScreen.jsx      # Hero, featured fleet, why us, and reviews
    │   ├── HowItWorksScreen.jsx# 4-step rental guide and terms
    │   └── MotorbikesScreen.jsx# Catalog with search, filters, and sorting
    └── theme/
        └── colors.js           # Sleek dark neon cyan color tokens & shadows
```
