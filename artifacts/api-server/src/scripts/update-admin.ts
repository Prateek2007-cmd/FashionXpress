import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { hashPassword } from "../lib/auth";

async function main() {
  // Store email in lowercase to match login route's toLowerCase() comparison
  const newEmail = "snehil@fashionxpress.com";
  const newPassword = "Snehil@21";

  const hashedPassword = await hashPassword(newPassword);

  // Find admin by ID=1 or by current email (try both cases)
  const [updated] = await db
    .update(usersTable)
    .set({
      email: newEmail,
      passwordHash: hashedPassword,
    })
    .where(eq(usersTable.id, 1))
    .returning({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role });

  if (!updated) {
    console.error("❌ Admin user not found.");
    process.exit(1);
  }

  console.log("✅ Admin credentials updated:");
  console.log("   Email (stored): ", updated.email);
  console.log("   Login with:     Snehil@fashionxpress.com  (case-insensitive)");
  console.log("   Password:       Snehil@21");
  process.exit(0);
}

main().catch(err => { console.error("❌ Error:", err.message); process.exit(1); });
