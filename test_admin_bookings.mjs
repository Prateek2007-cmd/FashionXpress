const BASE = "http://localhost:5000/api";

async function run() {
  const loginRes = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@fashion-xpress.com", password: "password123" }), // using the default seed admin
  });
  
  if (!loginRes.ok) {
    console.log("Admin login failed", await loginRes.text());
    return;
  }
  
  const token = (await loginRes.json()).token;
  console.log("Logged in as admin");

  const listRes = await fetch(`${BASE}/bookings`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  
  console.log("List bookings status:", listRes.status);
  const text = await listRes.text();
  if (!listRes.ok) {
    console.log("Error:", text);
  } else {
    const data = JSON.parse(text);
    console.log(`Success! Found ${data.length} bookings.`);
    if (data.length > 0) {
      console.log("First booking:", JSON.stringify(data[0], null, 2));
    }
  }
}

run().catch(console.error);
