import { Router, type IRouter, type Request, type Response } from "express";
import { eq, and } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { requireAuth } from "../middlewares/auth";
import { hashPassword } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/merchants",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const merchants = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.role, "merchant"));

      res.json(
        merchants.map((m) => ({
          id: m.id,
          name: m.name,
          phone: m.phone,
          email: m.email,
          createdAt: m.createdAt,
        })),
      );
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

router.post(
  "/merchants",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, phone, password } = req.body || {};
      const cleanName = String(name || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();
      const cleanPassword = String(password || '').trim();
      const cleanPhone = phone ? String(phone).trim() : null;

      if (!cleanName || !cleanEmail || !cleanPassword) {
        res.status(400).json({ error: "Missing required fields" });
        return;
      }

      const [existing] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.email, cleanEmail));

      if (existing) {
        res.status(400).json({ error: "An account with this email already exists" });
        return;
      }

      const passwordHash = await hashPassword(cleanPassword);
      const [user] = await db
        .insert(usersTable)
        .values({
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          passwordHash,
          role: "merchant",
        })
        .returning();

      res.status(201).json({
        id: user!.id,
        name: user!.name,
        phone: user!.phone,
        email: user!.email,
        createdAt: user!.createdAt,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

router.patch(
  "/merchants/:id",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { name, email, phone } = req.body;

      const [merchant] = await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.id, id), eq(usersTable.role, "merchant")));

      if (!merchant) {
        res.status(404).json({ error: "Merchant not found" });
        return;
      }

      await db
        .update(usersTable)
        .set({
          ...(name && { name }),
          ...(email && { email: email.toLowerCase() }),
          ...(phone && { phone }),
        })
        .where(eq(usersTable.id, id));

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

router.delete(
  "/merchants/:id",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);

      const [merchant] = await db
        .select()
        .from(usersTable)
        .where(and(eq(usersTable.id, id), eq(usersTable.role, "merchant")));

      if (!merchant) {
        res.status(404).json({ error: "Merchant not found" });
        return;
      }

      await db.delete(usersTable).where(eq(usersTable.id, id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  },
);

// ── Merchant: see bookings containing their products ──────────────────────
router.get(
  "/merchants/my-bookings",
  requireAuth("merchant"),
  async (req: Request & { auth?: any }, res: Response): Promise<void> => {
    try {
      const { db: database, bookingsTable, bookingProductsTable, productsTable, categoriesTable, brandsTable, customersTable, usersTable: ut } = await import("@workspace/db");
      const { eq, inArray, desc } = await import("drizzle-orm");

      const merchantId = req.auth!.userId;

      // Get all products belonging to this merchant
      const merchantProducts = await database
        .select({ id: productsTable.id, name: productsTable.name, images: productsTable.images, sellingPrice: productsTable.sellingPrice })
        .from(productsTable)
        .where(eq(productsTable.merchantId, merchantId));

      if (merchantProducts.length === 0) {
        res.json([]);
        return;
      }

      const productIds = merchantProducts.map(p => p.id);

      // Find booking_products that have those products
      const bookingProductRows = await database
        .select()
        .from(bookingProductsTable)
        .where(inArray(bookingProductsTable.productId, productIds));

      if (bookingProductRows.length === 0) {
        res.json([]);
        return;
      }

      const bookingIds = [...new Set(bookingProductRows.map(bp => bp.bookingId))];

      // Get those bookings
      const bookings = await database
        .select()
        .from(bookingsTable)
        .where(inArray(bookingsTable.id, bookingIds))
        .orderBy(desc(bookingsTable.createdAt));

      const productMap = new Map(merchantProducts.map(p => [p.id, p]));
      const bpMap = new Map<number, typeof bookingProductRows>();
      for (const bp of bookingProductRows) {
        if (!bpMap.has(bp.bookingId)) bpMap.set(bp.bookingId, []);
        bpMap.get(bp.bookingId)!.push(bp);
      }

      const result = bookings.map(b => ({
        id: b.id,
        bookingCode: b.bookingCode,
        status: b.status,
        name: b.name,
        phone: b.phone,
        email: b.email,
        addressText: b.addressText,
        preferredDate: b.preferredDate,
        preferredTime: b.preferredTime,
        createdAt: b.createdAt,
        // Only show THIS merchant's products from this booking
        myProducts: (bpMap.get(b.id) || [])
          .filter(bp => productIds.includes(bp.productId))
          .map(bp => ({
            id: bp.id,
            productId: bp.productId,
            status: bp.status,
            priceAtSale: bp.priceAtSale,
            product: productMap.get(bp.productId),
          })),
      }));

      res.json(result);
    } catch (err: any) {
      console.error("GET /merchants/my-bookings error:", err);
      res.status(500).json({ error: "Failed to fetch merchant bookings" });
    }
  }
);

export default router;
