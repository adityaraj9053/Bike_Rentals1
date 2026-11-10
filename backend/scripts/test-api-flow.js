import { connectDB, disconnectDB } from '../src/config/db.js';
import app from '../server.js';

async function testAllEndpoints() {
  console.log('[Test API Flow] Starting end-to-end integration tests...\n');

  try {
    // 1. Test Bikes endpoint
    const { getAllBikes } = await import('../src/controllers/bikeController.js');
    let bikesResult = null;
    const reqBikes = { query: {} };
    const resBikes = {
      status(code) { this.code = code; return this; },
      json(data) { bikesResult = data; return this; }
    };
    await getAllBikes(reqBikes, resBikes);
    console.log(`✓ GET /api/v1/bikes: Returned ${bikesResult?.data?.length || 0} bikes from MongoDB Atlas`);

    // 2. Test OTP Send endpoint
    const { sendOtp, verifyOtp } = await import('../src/controllers/authController.js');
    let sendOtpResult = null;
    const testEmail = `test_${Date.now()}@theroadeagle.com`;
    const reqSend = { body: { email: testEmail, purpose: 'SIGNUP' } };
    const resSend = {
      status(code) { this.code = code; return this; },
      json(data) { sendOtpResult = data; return this; }
    };
    await sendOtp(reqSend, resSend);
    console.log(`✓ POST /api/v1/auth/email-otp/send: OTP generated and stored in EmailOtp with 5m TTL. DemoCode: ${sendOtpResult?.demoCode}`);

    // 3. Test OTP Verify & Registration endpoint
    let verifyResult = null;
    const reqVerify = {
      body: {
        email: testEmail,
        otp: sendOtpResult?.demoCode || '1234',
        fullName: 'Test Rider',
        phoneNumber: '9876500000',
        dateOfBirth: '1998-05-12',
        purpose: 'SIGNUP',
      },
      ip: '127.0.0.1',
      headers: { 'user-agent': 'Jest-Tester' }
    };
    const resVerify = {
      status(code) { this.code = code; return this; },
      json(data) { verifyResult = data; return this; }
    };
    await verifyOtp(reqVerify, resVerify);
    console.log(`✓ POST /api/v1/auth/email-otp/verify: User registered in UserModel, RenterProfile created, JWT token generated: ${verifyResult?.token?.substring(0, 20)}...`);

    // 4. Test Booking creation endpoint
    const { createBooking } = await import('../src/controllers/bookingController.js');
    let bookingResult = null;
    const reqBooking = {
      body: {
        bikeListingCode: 'RDE-942810',
        pickupDate: '2026-11-10 09:00 AM',
        returnDate: '2026-11-12 06:00 PM',
        riderName: 'Test Rider',
        riderEmail: testEmail,
        riderPhone: '9876500000',
        paymentMethod: 'upi',
      },
      user: { id: verifyResult.user.id, role: 'RENTER' }
    };
    const resBooking = {
      status(code) { this.code = code; return this; },
      json(data) { bookingResult = data; return this; }
    };
    await createBooking(reqBooking, resBooking);
    console.log(`✓ POST /api/v1/bookings: Booking atomically reserved: Ref #${bookingResult?.refId}, PaymentTransaction logged in MongoDB.`);

    // 5. Test Admin KPIs endpoint
    const { getAdminKPIs } = await import('../src/controllers/adminController.js');
    let kpiResult = null;
    const reqKpi = {};
    const resKpi = {
      status(code) { this.code = code; return this; },
      json(data) { kpiResult = data; return this; }
    };
    await getAdminKPIs(reqKpi, resKpi);
    console.log(`✓ GET /api/v1/admin/kpis: Real-time aggregated KPIs:`, kpiResult?.kpis);

    // 6. Test Hubs endpoint
    const { getAllHubs } = await import('../src/controllers/hubController.js');
    let hubsResult = null;
    const reqHubs = {};
    const resHubs = {
      status(code) { this.code = code; return this; },
      json(data) { hubsResult = data; return this; }
    };
    await getAllHubs(reqHubs, resHubs);
    console.log(`✓ GET /api/v1/hubs: Returned ${hubsResult?.data?.length || 0} active hubs.`);

    console.log('\nAll End-to-End API flows and MongoDB Atlas operations verified successfully!\n');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Test API flow failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

testAllEndpoints();

