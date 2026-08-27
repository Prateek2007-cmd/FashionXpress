/**
 * reset-for-launch.ts
 * 
 * Clears ALL test data for a clean production launch:
 *   - All products
 *   - All bookings + booking products
 *   - All orders + order items
 *   - All customers (except admin)
 *   - All wishlists + cart items
 *   - All reviews
 *   - All notifications
 *   - All partner requests
 *   - Sample executives & merchants (optional)
 * 
 * KEEPS:
 *   - Admin account (admin@fashionxpress.in)
 *   - Categories and brands (so you can add real products)
 */

import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

async function resetForLaunch() {
  console.log("🚀 Starting pre-launch database reset...\n");

  // 1. Clear all bookings-related data
  console.log("🗑️  Clearing bookings...");
  await db.execute(sql`DELETE FROM booking_products`);
  await db.execute(sql`DELETE FROM bookings`);

  // 2. Clear all order-related data
  console.log("🗑️  Clearing orders...");
  await db.execute(sql`DELETE FROM order_items`);
  await db.execute(sql`DELETE FROM orders`);

  // 3. Clear wishlists and cart
  console.log("🗑️  Clearing wishlists and cart...");
  await db.execute(sql`DELETE FROM wishlist`);
  await db.execute(sql`DELETE FROM cart_items`);

  // 4. Clear reviews
  console.log("🗑️  Clearing reviews...");
  await db.execute(sql`DELETE FROM reviews`).catch(() => {
    console.log("   (reviews table not found, skipping)");
  });

  // 5. Clear notifications
  console.log("🗑️  Clearing notifications...");
  await db.execute(sql`DELETE FROM notifications`).catch(() => {
    console.log("   (notifications table not found, skipping)");
  });

  // 6. Clear partner/merchant requests
  console.log("🗑️  Clearing partner requests...");
  await db.execute(sql`DELETE FROM partner_requests`).catch(() => {
    console.log("   (partner_requests table not found, skipping)");
  });

  // 7. Clear all PRODUCTS
  console.log("🗑️  Clearing all products...");
  await db.execute(sql`DELETE FROM products`);

  // 8. Clear test customers (non-admin users)
  console.log("🗑️  Clearing test customers and users...");
  await db.execute(sql`DELETE FROM customers WHERE user_id IN (
    SELECT id FROM users WHERE role = 'customer'
  )`);
  await db.execute(sql`DELETE FROM users WHERE role = 'customer'`);

  // 9. Clear test executives (you can re-add real ones from admin panel)
  console.log("🗑️  Clearing test executives...");
  await db.execute(sql`DELETE FROM executives WHERE user_id IN (
    SELECT id FROM users WHERE role = 'executive'
  )`);
  await db.execute(sql`DELETE FROM users WHERE role = 'executive'`);

  // 10. Clear test merchants (you can re-add real ones from admin panel)
  console.log("🗑️  Clearing test merchants...");
  await db.execute(sql`DELETE FROM users WHERE role = 'merchant'`);

  // 11. Clear INVOICES
  console.log("🗑️  Clearing invoices...");
  await db.execute(sql`DELETE FROM invoices`).catch(() => {
    console.log("   (invoices table not found, skipping)");
  });

  // 12. Clear ADDRESSES
  console.log("🗑️  Clearing addresses...");
  await db.execute(sql`DELETE FROM addresses`).catch(() => {
    console.log("   (addresses table not found, skipping)");
  });

  console.log("\n✅ Reset complete! Here's what was kept:");
  console.log("   ✓ Admin account: admin@fashionxpress.in");
  console.log("   ✓ All categories (add products to them from admin)");
  console.log("   ✓ All brands\n");

  console.log("📋 Next steps:");
  console.log("   1. Log in to admin panel: /admin");
  console.log("   2. Go to Products → Add your real product catalog");
  console.log("   3. Go to Merchants → Add your real merchant/partner accounts");
  console.log("   4. Go to Executives → Add your real fashion executives\n");

  process.exit(0);
}

resetForLaunch().catch((err) => {
  console.error("❌ Reset failed:", err);
  process.exit(1);
});
