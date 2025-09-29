const axios = require('axios');

const API_BASE = 'http://localhost:5001/api';

async function testCompleteFlow() {
  try {
    console.log('🚀 Testing complete ground booking flow...\n');

    // Step 1: Register a merchant
    console.log('1. Registering a merchant...');
    const merchantData = {
      name: 'Test Merchant',
      email: 'merchant@test.com',
      password: 'password123',
      phone: '9876543210',
      role: 'merchant'
    };

    const merchantResponse = await axios.post(`${API_BASE}/auth/register`, merchantData);
    console.log('✅ Merchant registered:', merchantResponse.data.user.email);

    // Step 2: Login as merchant
    console.log('\n2. Logging in as merchant...');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'merchant@test.com',
      password: 'password123'
    });
    const merchantToken = loginResponse.data.token;
    console.log('✅ Merchant logged in');

    // Step 3: Add a ground
    console.log('\n3. Adding a ground...');
    const groundData = {
      name: 'Test Cricket Ground',
      type: 'cricket',
      location: 'Test Location, City',
      description: 'A beautiful cricket ground with excellent facilities',
      facilities: ['parking', 'wifi', 'cafe', 'security'],
      pricing: {
        weekday: 800,
        weekend: 1000,
        continuous: 900,
        membership: 800
      }
    };

    const groundResponse = await axios.post(`${API_BASE}/merchants/grounds`, groundData, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    const groundId = groundResponse.data._id;
    console.log('✅ Ground added:', groundResponse.data.name);

    // Step 4: Register a user
    console.log('\n4. Registering a user...');
    const userData = {
      name: 'Test User',
      email: 'user@test.com',
      password: 'password123',
      phone: '9876543211',
      role: 'user'
    };

    const userRegisterResponse = await axios.post(`${API_BASE}/auth/register`, userData);
    console.log('✅ User registered:', userRegisterResponse.data.user.email);

    // Step 5: Login as user
    console.log('\n5. Logging in as user...');
    const userLoginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'user@test.com',
      password: 'password123'
    });
    const userToken = userLoginResponse.data.token;
    console.log('✅ User logged in');

    // Step 6: List grounds
    console.log('\n6. Listing available grounds...');
    const groundsResponse = await axios.get(`${API_BASE}/grounds`);
    console.log('✅ Found', groundsResponse.data.length, 'ground(s)');
    console.log('   Ground:', groundsResponse.data[0].name);

    // Step 7: Get ground details
    console.log('\n7. Getting ground details...');
    const groundDetailsResponse = await axios.get(`${API_BASE}/grounds/${groundId}`);
    console.log('✅ Ground details retrieved:', groundDetailsResponse.data.name);

    // Step 8: Check availability
    console.log('\n8. Checking availability...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    const availabilityResponse = await axios.get(`${API_BASE}/grounds/${groundId}/availability`, {
      params: {
        date: dateStr,
        startTime: '10:00',
        endTime: '11:00'
      }
    });
    console.log('✅ Availability checked:', availabilityResponse.data.isAvailable ? 'Available' : 'Not available');

    // Step 9: Get pricing estimate
    console.log('\n9. Getting pricing estimate...');
    const estimateResponse = await axios.post(`${API_BASE}/bookings/estimate`, {
      groundId: groundId,
      date: dateStr,
      duration: 2
    }, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Pricing estimate:', '₹' + estimateResponse.data.totalAmount);

    // Step 10: Create a booking
    console.log('\n10. Creating a booking...');
    const bookingData = {
      groundId: groundId,
      date: dateStr,
      startTime: '10:00',
      endTime: '12:00',
      duration: 2
    };

    const bookingResponse = await axios.post(`${API_BASE}/bookings`, bookingData, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ Booking created:', bookingResponse.data._id);

    // Step 11: Get user's bookings
    console.log('\n11. Getting user bookings...');
    const userBookingsResponse = await axios.get(`${API_BASE}/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${userToken}` }
    });
    console.log('✅ User has', userBookingsResponse.data.length, 'booking(s)');

    // Step 12: Get merchant's bookings
    console.log('\n12. Getting merchant bookings...');
    const merchantBookingsResponse = await axios.get(`${API_BASE}/merchants/bookings`, {
      headers: { Authorization: `Bearer ${merchantToken}` }
    });
    console.log('✅ Merchant has', merchantBookingsResponse.data.length, 'booking(s)');

    console.log('\n🎉 Complete flow test successful!');
    console.log('\nSummary:');
    console.log('- ✅ Merchant registration and login');
    console.log('- ✅ Ground creation');
    console.log('- ✅ User registration and login');
    console.log('- ✅ Ground listing and details');
    console.log('- ✅ Availability checking');
    console.log('- ✅ Pricing estimation');
    console.log('- ✅ Booking creation');
    console.log('- ✅ Booking management for both user and merchant');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testCompleteFlow();
