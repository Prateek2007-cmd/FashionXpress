// End-to-end test: Register -> Create Booking -> Admin Login -> List Bookings -> Approve
const BASE = "http://localhost:5000/api";

async function run() {
  // 1. Register a new customer
  console.log("=== Step 1: Register new customer ===");
  const email = `test${Date.now()}@test.com`;
  const regRes = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Test Customer", email, password: "test1234", phone: "9876543210" }),
  });
  
  if (!regRes.ok) {
    console.log("Register failed:", await regRes.text());
    return;
  }
  const { token: customerToken } = await regRes.json();
  console.log("✅ Registered as:", email);

  // 2. Create a booking (same as what BookVisitPage does)
  console.log("\n=== Step 2: Create Booking ===");
  const bookingRes = await fetch(`${BASE}/bookings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${customerToken}`,
    },
    body: JSON.stringify({
      name: "Test Customer",
      phone: "9876543210",
      addressText: "123 Test Street, Hyderabad, Telangana 500001",
      email: "not-provided@fashion-xpress.com",
      preferredDate: "2026-07-12",
      preferredTime: "As soon as possible",
      gender: "not_specified",
      preferredFit: "",
      preferredBrands: [],
      preferredColors: [],
      topSize: "",
      bottomSize: "",
      notes: ""
    }),
  });

  console.log("Booking status:", bookingRes.status);
  const bookingData = await bookingRes.json();
  console.log("✅ Booking created:", bookingData.bookingCode);

  // 3. Login as admin
  console.log("\n=== Step 3: Login as Admin ===");
  const adminLogin = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@fashionxpress.in", password: "admin123" }),
  });

  if (!adminLogin.ok) {
    console.log("❌ Admin login failed:", await adminLogin.text());
    return;
  }
  const { token: adminToken } = await adminLogin.json();
  console.log("✅ Logged in as admin");

  // 4. List bookings as admin
  console.log("\n=== Step 4: List Bookings ===");
  const listRes = await fetch(`${BASE}/bookings`, {
    headers: { "Authorization": `Bearer ${adminToken}` },
  });
  
  const bookings = await listRes.json();
  console.log(`✅ Found ${bookings.length} total bookings`);
  console.log("Latest booking:", bookings[0]?.bookingCode, "- Status:", bookings[0]?.status);

  // 5. Approve the booking
  console.log("\n=== Step 5: Approve Booking ===");
  const approveRes = await fetch(`${BASE}/bookings/${bookingData.id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: "confirmed" }),
  });
  
  console.log("Approve status:", approveRes.status);
  const approved = await approveRes.json();
  console.log("✅ Booking approved:", approved.bookingCode, "-> Status:", approved.status);

  console.log("\n============================");
  console.log("🎉 FULL FLOW WORKS!");
  console.log("============================");
}

run().catch(console.error);
