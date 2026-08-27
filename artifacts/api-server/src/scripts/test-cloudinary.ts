import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "gnhpfb5c",
  api_key: "111945369796731",
  api_secret: "zLMLo9U0Yw5Hj2aJkUVD8MEG4KI",
});

async function test() {
  const result = await cloudinary.api.ping();
  console.log("✅ Cloudinary connected! Status:", result.status);
  console.log("   Cloud name: gnhpfb5c");

  // Also test creating the product folder
  await cloudinary.api.create_folder("fashion-xpress/products");
  await cloudinary.api.create_folder("fashion-xpress/categories");
  await cloudinary.api.create_folder("fashion-xpress/brands");
  await cloudinary.api.create_folder("fashion-xpress/videos");
  console.log("✅ Folders created: products, categories, brands, videos");
  process.exit(0);
}

test().catch(e => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
