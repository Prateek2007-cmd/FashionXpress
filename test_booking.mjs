// Test script to debug the booking flow end-to-end

const BASE = "http://localhost:5000/api";

async function run() {
  // Step 1: Register a test user (or login if already exists)
  console.log("=== Step 1: Login/Register ===");
  
  let token;
  
  // Try login first
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "booktest@test.com", password: "test1234" }),
  });
  
  if (loginRes.ok) {
    const loginData = await loginRes.json();
    token = loginData.token;
    console.log("Logged in successfully, token:", token?.substring(0, 20) + "...");
  } else {
    console.log("Login failed, trying register...");
    const regRes = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Book Test", email: "booktest@test.com", password: "test1234", phone: "9876543210" }),
    });
    console.log("Register status:", regRes.status);
    const regText = await regRes.text();
    console.log("Register response:", regText);
    if (regRes.ok) {
      token = JSON.parse(regText).token;
    } else {
      console.log("FAILED to register. Exiting.");
      return;
    }
  }

  // Step 2: Create a booking
  console.log("\n=== Step 2: Create Booking ===");
  const bookingPayload = {
    name: "Test Booking User",
    phone: "9876543210",
    email: "booktest@test.com",
    addressText: "123 Test Street, Mumbai, Maharashtra 400001",
    preferredDate: new Date().toISOString().split("T")[0],
    preferredTime: "As soon as possible",
    gender: "not_specified",
    preferredFit: "",
    preferredBrands: [],
    preferredColors: [],
    topSize: "",
    bottomSize: "",
    notes: "",
  };
  
  console.log("Sending payload:", JSON.stringify(bookingPayload, null, 2));
  
  const bookingRes = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify(bookingPayload),
  });
  
  console.log("Booking status:", bookingRes.status);
  const bookingText = await bookingRes.text();
  console.log("Booking response:", bookingText);

  // Step 3: List all bookings as admin (this might fail if user is not admin)
  console.log("\n=== Step 3: List bookings ===");
  const listRes = await fetch(`${BASE}/bookings`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  console.log("List bookings status:", listRes.status);
  const listText = await listRes.text();
  console.log("List bookings response:", listText.substring(0, 500));
}

run().catch(console.error);
