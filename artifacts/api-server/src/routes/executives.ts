import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, inArray, desc, sql } from "drizzle-orm";
import {
  db,
  usersTable,
  executivesTable,
  bookingsTable,
  bookingProductsTable,
  productsTable,
  categoriesTable,
  brandsTable,
  invoicesTable,
} from "@workspace/db";
import {
  ListExecutivesResponse,
  CreateExecutiveBody,
  CreateExecutiveResponse,
  ListMyVisitsQueryParams,
  ListMyVisitsResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { hashPassword } from "../lib/auth";
import { mapBooking, mapBookingProduct } from "../lib/mappers";

const router: IRouter = Router();

// ── Admin: List Executives ──────────────────────────────────────────────────
router.get(
  "/executives",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const rows = await db
      .select({ executive: executivesTable, user: usersTable })
      .from(executivesTable)
      .innerJoin(usersTable, eq(executivesTable.userId, usersTable.id));

    const activeCounts = await db
      .select({ executiveId: bookingsTable.executiveId })
      .from(bookingsTable)
      .where(
        inArray(bookingsTable.status, [
          "executive_assigned",
          "in_progress",
          "confirmed",
        ]),
      );
    const activeMap = new Map<number, number>();
    for (const row of activeCounts) {
      if (row.executiveId === null) continue;
      activeMap.set(row.executiveId, (activeMap.get(row.executiveId) ?? 0) + 1);
    }

    res.json(
      ListExecutivesResponse.parse(
        rows.map(({ executive, user }) => ({
          id: executive.id,
          userId: executive.userId,
          name: user.name,
          phone: user.phone,
          email: user.email,
          photoUrl: executive.photoUrl,
          rating: parseFloat(executive.rating),
          activeBookings: activeMap.get(executive.id) ?? 0,
          createdAt: executive.createdAt,
        })),
      ),
    );
  },
);

// ── Admin: Create Executive ─────────────────────────────────────────────────
router.post(
  "/executives",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const parsed = CreateExecutiveBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { name, email, phone, password, photoUrl } = parsed.data;

    const [existing] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email.toLowerCase()));
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists" });
      return;
    }

    const passwordHash = await hashPassword(password);
    const [user] = await db
      .insert(usersTable)
      .values({
        name,
        email: email.toLowerCase(),
        phone,
        passwordHash,
        role: "executive",
      })
      .returning();

    const [executive] = await db
      .insert(executivesTable)
      .values({ userId: user!.id, photoUrl })
      .returning();

    res.status(201).json(
      CreateExecutiveResponse.parse({
        id: executive!.id,
        userId: executive!.userId,
        name: user!.name,
        phone: user!.phone,
        email: user!.email,
        photoUrl: executive!.photoUrl,
        rating: parseFloat(executive!.rating),
        activeBookings: 0,
        createdAt: executive!.createdAt,
      }),
    );
  },
);

// ── Executive: Get My Assigned Leads (All Active + Today's Leads) ───────────
router.get(
  "/executives/me/leads",
  requireAuth("executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const [executive] = await db
        .select()
        .from(executivesTable)
        .where(eq(executivesTable.userId, req.auth!.userId));

      if (!executive) {
        res.status(404).json({ error: "Executive profile not found" });
        return;
      }

      // Fetch bookings assigned to this executive
      const bookings = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.executiveId, executive.id))
        .orderBy(desc(bookingsTable.createdAt));

      if (bookings.length === 0) {
        res.json([]);
        return;
      }

      const bookingIds = bookings.map((b) => b.id);
      const bookingProducts = await db
        .select()
        .from(bookingProductsTable)
        .where(inArray(bookingProductsTable.bookingId, bookingIds));

      const products = await db.select().from(productsTable);
      const brands = await db.select().from(brandsTable);
      const categories = await db.select().from(categoriesTable);

      const productMap = new Map(products.map((p) => [p.id, p]));
      const brandMap = new Map(brands.map((b) => [b.id, b]));
      const categoryMap = new Map(categories.map((c) => [c.id, c]));

      const results = bookings.map((b) => {
        const bps = bookingProducts
          .filter((bp) => bp.bookingId === b.id)
          .map((bp) => {
            const product = productMap.get(bp.productId);
            const brand = product ? brandMap.get(product.brandId) : null;
            const category = product ? categoryMap.get(product.categoryId) : null;
            return {
              id: bp.id,
              bookingId: bp.bookingId,
              productId: bp.productId,
              status: bp.status,
              priceAtSale: bp.priceAtSale ? parseFloat(bp.priceAtSale) : (product ? parseFloat(product.sellingPrice) : 0),
              isRecommended: bp.isRecommended,
              product: product
                ? {
                    id: product.id,
                    name: product.name,
                    sku: product.sku,
                    sellingPrice: parseFloat(product.sellingPrice),
                    mrp: parseFloat(product.mrp),
                    images: product.images,
                    brandName: brand?.name || "The Fashion Xpress",
                    categoryName: category?.name || "Collection",
                  }
                : null,
            };
          });

        return {
          id: b.id,
          customerName: b.name,
          phone: b.phone,
          addressText: b.addressText,
          pincode: b.pincode,
          preferredDate: b.preferredDate,
          preferredTime: b.preferredTime,
          preferredFit: b.preferredFit,
          topSize: b.topSize,
          bottomSize: b.bottomSize,
          notes: b.notes,
          status: b.status,
          createdAt: b.createdAt,
          products: bps,
        };
      });

      res.json(results);
    } catch (err: any) {
      console.error("GET /executives/me/leads error:", err);
      res.status(500).json({ error: "Failed to fetch assigned leads" });
    }
  }
);

// ── Executive: Get Legacy Visits Route (Backwards Compatibility) ───────────
router.get(
  "/executives/me/visits",
  requireAuth("executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const parsed = ListMyVisitsQueryParams.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [executive] = await db
      .select()
      .from(executivesTable)
      .where(eq(executivesTable.userId, req.auth!.userId));
    if (!executive) {
      res.status(404).json({ error: "Executive profile not found" });
      return;
    }

    const conditions = [eq(bookingsTable.executiveId, executive.id)];
    if (parsed.data.date) {
      conditions.push(eq(bookingsTable.preferredDate, parsed.data.date));
    }

    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(and(...conditions));

    if (bookings.length === 0) {
      res.json([]);
      return;
    }

    const bookingProducts = await db
      .select()
      .from(bookingProductsTable)
      .where(
        inArray(
          bookingProductsTable.bookingId,
          bookings.map((b) => b.id),
        ),
      );
    const products = await db.select().from(productsTable);
    const categories = await db.select().from(categoriesTable);
    const brands = await db.select().from(brandsTable);
    const productMap = new Map(products.map((p) => [p.id, p]));
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const brandMap = new Map(brands.map((b) => [b.id, b]));

    res.json(
      ListMyVisitsResponse.parse(
        bookings.map((b) => {
          const bps = bookingProducts
            .filter((bp) => bp.bookingId === b.id)
            .map((bp) => {
              const product = productMap.get(bp.productId)!;
              return mapBookingProduct(
                bp,
                product,
                categoryMap.get(product.categoryId),
                brandMap.get(product.brandId),
              );
            });
          return mapBooking(b, bps, executive, null);
        }),
      ),
    );
  },
);

// ── Executive: One-Tap Visit Status Update ──────────────────────────────────
router.patch(
  "/executives/me/visits/:id/status",
  requireAuth("executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const { status } = req.body;

      const validStatuses = [
        "executive_assigned",
        "en_route",
        "arrived",
        "in_progress",
        "completed",
        "cancelled",
      ];

      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({ error: "Invalid status value" });
        return;
      }

      const [executive] = await db
        .select()
        .from(executivesTable)
        .where(eq(executivesTable.userId, req.auth!.userId));

      if (!executive) {
        res.status(404).json({ error: "Executive profile not found" });
        return;
      }

      const [updated] = await db
        .update(bookingsTable)
        .set({ status })
        .where(
          and(
            eq(bookingsTable.id, id),
            eq(bookingsTable.executiveId, executive.id)
          )
        )
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Booking not found or unauthorized" });
        return;
      }

      res.json({ success: true, booking: updated });
    } catch (err: any) {
      console.error("PATCH /executives/me/visits/:id/status error:", err);
      res.status(500).json({ error: "Failed to update visit status" });
    }
  }
);

// ── Executive: Doorstep Checkout & Payment Collection (Zero Manual Work) ───
router.post(
  "/executives/me/visits/:id/checkout",
  requireAuth("executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const bookingId = Number(req.params.id);
      const { items, paymentMethod } = req.body || {};
      // items: Array<{ id: number (bookingProductId), status: 'sold' | 'returned', priceAtSale: number }>
      // paymentMethod: 'upi' | 'cash' | 'card'

      if (!items || !Array.isArray(items)) {
        res.status(400).json({ error: "Items array is required" });
        return;
      }

      const [executive] = await db
        .select()
        .from(executivesTable)
        .where(eq(executivesTable.userId, req.auth!.userId));

      if (!executive) {
        res.status(404).json({ error: "Executive profile not found" });
        return;
      }

      const [booking] = await db
        .select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.id, bookingId),
            eq(bookingsTable.executiveId, executive.id)
          )
        );

      if (!booking) {
        res.status(404).json({ error: "Booking not found or not assigned to you" });
        return;
      }

      let subtotal = 0;

      // 1. Update each booking product status and price
      for (const item of items) {
        const bpStatus = item.status === "sold" ? "sold" : "returned";
        const salePrice = item.status === "sold" ? Number(item.priceAtSale || 0) : 0;

        await db
          .update(bookingProductsTable)
          .set({
            status: bpStatus,
            priceAtSale: salePrice.toFixed(2),
          })
          .where(
            and(
              eq(bookingProductsTable.id, Number(item.id)),
              eq(bookingProductsTable.bookingId, bookingId)
            )
          );

        if (item.status === "sold") {
          subtotal += salePrice;
        }
      }

      const tax = 0; // Inclusive
      const total = subtotal + tax;
      const invoiceNumber = `INV-TFX-${bookingId}-${Date.now().toString().slice(-4)}`;
      const pMethod = paymentMethod || "cash";

      // 2. Insert or update invoice
      const [existingInv] = await db
        .select()
        .from(invoicesTable)
        .where(eq(invoicesTable.bookingId, bookingId));

      if (existingInv) {
        await db
          .update(invoicesTable)
          .set({
            subtotal: subtotal.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2),
            paymentMethod: pMethod,
            paymentStatus: "paid",
          })
          .where(eq(invoicesTable.id, existingInv.id));
      } else {
        await db.insert(invoicesTable).values({
          bookingId,
          invoiceNumber,
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: pMethod,
          paymentStatus: "paid",
        });
      }

      // 3. Mark booking completed
      await db
        .update(bookingsTable)
        .set({ status: "completed" })
        .where(eq(bookingsTable.id, bookingId));

      res.json({
        success: true,
        invoiceNumber,
        subtotal,
        total,
        paymentMethod: pMethod,
        paymentStatus: "paid",
        bookingStatus: "completed",
        message: "Visit checkout & payment processed successfully.",
      });
    } catch (err: any) {
      console.error("POST /executives/me/visits/:id/checkout error:", err);
      res.status(500).json({ error: "Failed to process visit checkout" });
    }
  }
);

// ── Executive: Daily Cash & Returns Reconciliation ─────────────────────────
router.get(
  "/executives/me/reconciliation",
  requireAuth("executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const [executive] = await db
        .select()
        .from(executivesTable)
        .where(eq(executivesTable.userId, req.auth!.userId));

      if (!executive) {
        res.status(404).json({ error: "Executive profile not found" });
        return;
      }

      // Get all bookings assigned to this executive
      const bookings = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.executiveId, executive.id));

      const bookingIds = bookings.map((b) => b.id);

      if (bookingIds.length === 0) {
        res.json({
          todayCash: 0,
          todayUpi: 0,
          todayCard: 0,
          todayTotal: 0,
          totalCompletedVisits: 0,
          returnedProducts: [],
          soldProducts: [],
        });
        return;
      }

      // Fetch paid invoices
      const invoices = await db
        .select()
        .from(invoicesTable)
        .where(inArray(invoicesTable.bookingId, bookingIds));

      let todayCash = 0;
      let todayUpi = 0;
      let todayCard = 0;
      let todayTotal = 0;

      for (const inv of invoices) {
        const amt = parseFloat(inv.total as string || "0");
        todayTotal += amt;
        if (inv.paymentMethod === "cash") todayCash += amt;
        else if (inv.paymentMethod === "upi") todayUpi += amt;
        else if (inv.paymentMethod === "card") todayCard += amt;
      }

      // Fetch all booking products with return / sold status
      const bookingProducts = await db
        .select()
        .from(bookingProductsTable)
        .where(inArray(bookingProductsTable.bookingId, bookingIds));

      const products = await db.select().from(productsTable);
      const brands = await db.select().from(brandsTable);
      const productMap = new Map(products.map((p) => [p.id, p]));
      const brandMap = new Map(brands.map((b) => [b.id, b]));
      const bookingMap = new Map(bookings.map((b) => [b.id, b]));

      const returnedProducts: any[] = [];
      const soldProducts: any[] = [];

      for (const bp of bookingProducts) {
        const prod = productMap.get(bp.productId);
        const brand = prod ? brandMap.get(prod.brandId) : null;
        const b = bookingMap.get(bp.bookingId);

        const itemData = {
          id: bp.id,
          bookingId: bp.bookingId,
          customerName: b?.name || "Customer",
          customerPhone: b?.phone || "",
          productName: prod?.name || "Garment",
          sku: prod?.sku || "",
          image: prod?.images?.[0] || null,
          price: bp.priceAtSale ? parseFloat(bp.priceAtSale) : (prod ? parseFloat(prod.sellingPrice) : 0),
          brandName: brand?.name || "Devi Fashion",
          status: bp.status,
        };

        if (bp.status === "returned") {
          returnedProducts.push(itemData);
        } else if (bp.status === "sold") {
          soldProducts.push(itemData);
        }
      }

      res.json({
        todayCash,
        todayUpi,
        todayCard,
        todayTotal,
        totalCompletedVisits: bookings.filter((b) => b.status === "completed").length,
        returnedProducts,
        soldProducts,
      });
    } catch (err: any) {
      console.error("GET /executives/me/reconciliation error:", err);
      res.status(500).json({ error: "Failed to fetch reconciliation data" });
    }
  }
);

// ── Admin: Update / Delete Executive ────────────────────────────────────────
router.patch(
  "/executives/:id",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const { name, email, phone, photoUrl } = req.body;

    const [executive] = await db
      .select()
      .from(executivesTable)
      .where(eq(executivesTable.id, id));

    if (!executive) {
      res.status(404).json({ error: "Executive not found" });
      return;
    }

    if (name || email || phone) {
      await db
        .update(usersTable)
        .set({
          ...(name && { name }),
          ...(email && { email: email.toLowerCase() }),
          ...(phone && { phone }),
        })
        .where(eq(usersTable.id, executive.userId));
    }

    if (photoUrl !== undefined) {
      await db
        .update(executivesTable)
        .set({ photoUrl })
        .where(eq(executivesTable.id, id));
    }

    res.json({ success: true });
  },
);

router.delete(
  "/executives/:id",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);

    const [executive] = await db
      .select()
      .from(executivesTable)
      .where(eq(executivesTable.id, id));

    if (!executive) {
      res.status(404).json({ error: "Executive not found" });
      return;
    }

    await db.delete(executivesTable).where(eq(executivesTable.id, id));
    await db.delete(usersTable).where(eq(usersTable.id, executive.userId));

    res.json({ success: true });
  },
);

export default router;
