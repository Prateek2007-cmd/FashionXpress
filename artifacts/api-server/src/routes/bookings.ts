import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, inArray, desc } from "drizzle-orm";
import {
  db,
  bookingsTable,
  bookingProductsTable,
  cartItemsTable,
  productsTable,
  categoriesTable,
  brandsTable,
  executivesTable,
  usersTable,
  customersTable,
  notificationsTable,
  invoicesTable,
} from "@workspace/db";
import {
  ListBookingsQueryParams,
  ListBookingsResponse,
  CreateBookingBody,
  CreateBookingResponse,
  ListMyBookingsResponse,
  GetBookingResponse,
  UpdateBookingStatusBody,
  UpdateBookingStatusResponse,
  RescheduleBookingBody,
  RescheduleBookingResponse,
  AssignExecutiveToBookingBody,
  AssignExecutiveToBookingResponse,
  AddBookingProductBody,
  AddBookingProductResponse,
  UpdateBookingProductStatusBody,
  UpdateBookingProductStatusResponse,
  GetBookingInvoiceResponse,
  GenerateBookingInvoiceBody,
  GenerateBookingInvoiceResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { mapBooking, mapBookingProduct, toNum } from "../lib/mappers";
import { generateBookingCode, generateInvoiceNumber } from "../lib/auth";
import { getOrCreateCustomer } from "./customers";

const router: IRouter = Router();

async function hydrateBookings(bookings: (typeof bookingsTable.$inferSelect)[]) {
  if (bookings.length === 0) return [];
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
  const executiveRows = await db
    .select({ executive: executivesTable, user: usersTable })
    .from(executivesTable)
    .innerJoin(usersTable, eq(executivesTable.userId, usersTable.id));

  const productMap = new Map(products.map((p) => [p.id, p]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const executiveMap = new Map(
    executiveRows.map(({ executive, user }) => [executive.id, { executive, name: user.name }]),
  );

  return bookings.map((b) => {
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
    const executiveEntry = b.executiveId ? executiveMap.get(b.executiveId) : undefined;
    return mapBooking(b, bps, executiveEntry?.executive, executiveEntry?.name ?? null);
  });
}

router.get(
  "/bookings",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const status = req.query.status as string | undefined;
      const where = status
        ? eq(
            bookingsTable.status,
            status as (typeof bookingsTable.status.enumValues)[number],
          )
        : undefined;
      const bookings = await db.select().from(bookingsTable).where(where).orderBy(desc(bookingsTable.createdAt));
      res.json(await hydrateBookings(bookings));
    } catch (err: any) {
      console.error("GET /bookings error:", err);
      res.status(500).json({ error: "Internal server error listing bookings" });
    }
  },
);

router.post(
  "/bookings",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const body = req.body || {};
      const name = body.name;
      const phone = body.phone;
      const email = body.email || "not-provided@fashion-xpress.com";
      const addressText = body.addressText;

      if (!name || !phone || !addressText) {
        res.status(400).json({ error: "Missing required booking fields: name, phone, addressText" });
        return;
      }

      const customer = await getOrCreateCustomer(req.auth!.userId);
      const cartItems = await db
        .select()
        .from(cartItemsTable)
        .where(eq(cartItemsTable.customerId, customer.id));

      const [booking] = await db
        .insert(bookingsTable)
        .values({
          bookingCode: generateBookingCode(),
          customerId: customer.id,
          name,
          phone,
          email,
          addressText,
          gender: body.gender || "not_specified",
          preferredDate: body.preferredDate || new Date().toISOString().split("T")[0],
          preferredTime: body.preferredTime || "As soon as possible",
          preferredFit: body.preferredFit || null,
          preferredColors: body.preferredColors || [],
          preferredBrands: body.preferredBrands || [],
          topSize: body.topSize || null,
          bottomSize: body.bottomSize || null,
          notes: body.notes || null,
          budget: body.budget?.toString() || null,
          lat: body.lat?.toString() || null,
          lng: body.lng?.toString() || null,
          heightCm: body.heightCm?.toString() || null,
          weightKg: body.weightKg?.toString() || null,
        })
        .returning();

      if (cartItems.length > 0) {
        await db.insert(bookingProductsTable).values(
          cartItems.map((item) => ({
            bookingId: booking!.id,
            productId: item.productId,
            isRecommended: false,
          })),
        );
        await db.delete(cartItemsTable).where(eq(cartItemsTable.customerId, customer.id));
      }

      await db.insert(notificationsTable).values({
        userId: req.auth!.userId,
        title: "Booking confirmed",
        message: `Your home visit ${booking!.bookingCode} has been received. We'll confirm your Fashion Executive shortly.`,
      });

      const [hydrated] = await hydrateBookings([booking!]);
      res.status(201).json(hydrated);
    } catch (err: any) {
      console.error("POST /bookings error:", err);
      res.status(500).json({ error: "Internal server error creating booking" });
    }
  },
);

// Guest booking — no authentication required
router.post(
  "/bookings/guest",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body || {};
      const name = body.name;
      const phone = body.phone;
      const email = body.email || "not-provided@fashion-xpress.com";
      const addressText = body.addressText;

      if (!name || !phone || !addressText) {
        res.status(400).json({ error: "Missing required booking fields: name, phone, addressText" });
        return;
      }

      // Create a guest user account
      const guestEmail = `guest-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@guest.fashion-xpress.com`;
      const [guestUser] = await db
        .insert(usersTable)
        .values({
          email: guestEmail,
          passwordHash: "GUEST_NO_PASSWORD",
          name,
          phone,
          role: "customer",
        })
        .returning();

      const [customer] = await db
        .insert(customersTable)
        .values({ userId: guestUser!.id })
        .returning();

      const [booking] = await db
        .insert(bookingsTable)
        .values({
          bookingCode: generateBookingCode(),
          customerId: customer!.id,
          name,
          phone,
          email,
          addressText,
          gender: body.gender || "not_specified",
          preferredDate: body.preferredDate || new Date().toISOString().split("T")[0],
          preferredTime: body.preferredTime || "As soon as possible",
          preferredFit: body.preferredFit || null,
          preferredColors: body.preferredColors || [],
          preferredBrands: body.preferredBrands || [],
          topSize: body.topSize || null,
          bottomSize: body.bottomSize || null,
          notes: body.notes || null,
          budget: body.budget?.toString() || null,
          lat: body.lat?.toString() || null,
          lng: body.lng?.toString() || null,
          heightCm: body.heightCm?.toString() || null,
          weightKg: body.weightKg?.toString() || null,
        })
        .returning();

      // Link selected products to this guest booking if provided
      if (body.products && Array.isArray(body.products) && body.products.length > 0) {
        await db.insert(bookingProductsTable).values(
          body.products.map((item: any) => ({
            bookingId: booking!.id,
            productId: Number(item.productId),
            isRecommended: false,
          })),
        );
      }

      const [hydrated] = await hydrateBookings([booking!]);
      res.status(201).json(hydrated);
    } catch (err: any) {
      console.error("POST /bookings/guest error:", err);
      res.status(500).json({ error: "Internal server error creating guest booking" });
    }
  },
);

router.get(
  "/bookings/me",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const bookings = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.customerId, customer.id))
      .orderBy(desc(bookingsTable.createdAt));
    res.json(await hydrateBookings(bookings));
  },
);

async function getBookingOr404(id: number) {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, id));
  return booking;
}

/** Returns true if the executive making the request is assigned to this booking. */
async function executiveIsAssigned(userId: number, booking: typeof bookingsTable.$inferSelect) {
  const [executive] = await db
    .select()
    .from(executivesTable)
    .where(eq(executivesTable.userId, userId));
  return !!executive && booking.executiveId === executive.id;
}

router.get(
  "/bookings/:id",
  requireAuth(),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const booking = await getBookingOr404(id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    if (req.auth!.role === "customer") {
      const customer = await getOrCreateCustomer(req.auth!.userId);
      if (booking.customerId !== customer.id) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
    }

    const [hydrated] = await hydrateBookings([booking]);
    res.json(hydrated);
  },
);

router.patch(
  "/bookings/:id/status",
  requireAuth("admin", "executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const body = req.body || {};
    const status = body.status;
    if (!status) {
      res.status(400).json({ error: "Missing status field" });
      return;
    }
    const existing = await getBookingOr404(id);
    if (!existing) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    if (req.auth!.role === "executive" && !(await executiveIsAssigned(req.auth!.userId, existing))) {
      res.status(403).json({ error: "You are not assigned to this booking" });
      return;
    }

    const [booking] = await db
      .update(bookingsTable)
      .set({ status: status as any })
      .where(eq(bookingsTable.id, id))
      .returning();

    // If booking is completed, automatically mark all 'reserved' products as 'sold'
    if (status === "completed" && booking) {
      const items = await db
        .select({
          bpId: bookingProductsTable.id,
          sellingPrice: productsTable.sellingPrice,
        })
        .from(bookingProductsTable)
        .innerJoin(productsTable, eq(bookingProductsTable.productId, productsTable.id))
        .where(
          and(
            eq(bookingProductsTable.bookingId, id),
            eq(bookingProductsTable.status, "reserved")
          )
        );

      for (const item of items) {
        await db
          .update(bookingProductsTable)
          .set({
            status: "sold",
            priceAtSale: item.sellingPrice,
          })
          .where(eq(bookingProductsTable.id, item.bpId));
      }
    }

    // Trigger email and notification if status is confirmed
    if (status === "confirmed" && booking) {
      const [customer] = await db
        .select()
        .from(customersTable)
        .where(eq(customersTable.id, booking.customerId));

      if (customer) {
        await db.insert(notificationsTable).values({
          userId: customer.userId,
          title: "Booking Approved",
          message: `Great news! Your booking ${booking.bookingCode} has been approved.`,
        });
      }

      // Simulate sending an email
      console.log(`\n======================================================`);
      console.log(`[EMAIL SENT]`);
      console.log(`To: ${booking.email}`);
      console.log(`Subject: Your Fashion Xpress Booking is Approved!`);
      console.log(`Body: Hello ${booking.name},\n\nYour home visit booking (${booking.bookingCode}) has been successfully approved by our admin. We will assign a Fashion Executive to you shortly.\n\nThank you for choosing Fashion Xpress!`);
      console.log(`======================================================\n`);
    }

    const [hydrated] = await hydrateBookings([booking!]);
    res.json(hydrated);
  },
);

router.patch(
  "/bookings/:id/reschedule",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const parsed = RescheduleBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [booking] = await db
      .update(bookingsTable)
      .set({
        preferredDate: parsed.data.preferredDate,
        preferredTime: parsed.data.preferredTime,
        status: "rescheduled",
      })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    const [hydrated] = await hydrateBookings([booking]);
    res.json(RescheduleBookingResponse.parse(hydrated));
  },
);

router.patch(
  "/bookings/:id/assign-executive",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const parsed = AssignExecutiveToBookingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const [booking] = await db
      .update(bookingsTable)
      .set({ executiveId: parsed.data.executiveId, status: "executive_assigned" })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    const [executive] = await db
      .select()
      .from(executivesTable)
      .where(eq(executivesTable.id, parsed.data.executiveId));
    if (executive) {
      await db.insert(notificationsTable).values({
        userId: executive.userId,
        title: "New visit assigned",
        message: `You've been assigned to booking ${booking.bookingCode}.`,
      });
    }

    const [hydrated] = await hydrateBookings([booking]);
    res.json(AssignExecutiveToBookingResponse.parse(hydrated));
  },
);

router.post(
  "/bookings/:id/products",
  requireAuth("admin", "executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const parsed = AddBookingProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const booking = await getBookingOr404(id);
    if (booking && req.auth!.role === "executive" && !(await executiveIsAssigned(req.auth!.userId, booking))) {
      res.status(403).json({ error: "You are not assigned to this booking" });
      return;
    }
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, parsed.data.productId));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [bp] = await db
      .insert(bookingProductsTable)
      .values({
        bookingId: id,
        productId: parsed.data.productId,
        isRecommended: parsed.data.isRecommended ?? true,
      })
      .returning();

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, product.categoryId));
    const [brand] = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, product.brandId));

    res
      .status(201)
      .json(AddBookingProductResponse.parse(mapBookingProduct(bp!, product, category, brand)));
  },
);

router.patch(
  "/bookings/:id/products/:productId/status",
  requireAuth("admin", "executive"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const bookingId = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const productId = parseInt(
      Array.isArray(req.params.productId)
        ? req.params.productId[0]!
        : req.params.productId!,
      10,
    );
    const parsed = UpdateBookingProductStatusBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const booking = await getBookingOr404(bookingId);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    if (req.auth!.role === "executive") {
      const [executive] = await db
        .select()
        .from(executivesTable)
        .where(eq(executivesTable.userId, req.auth!.userId));
      if (!executive || booking.executiveId !== executive.id) {
        res.status(403).json({ error: "You are not assigned to this booking" });
        return;
      }
    }

    const [existing] = await db
      .select()
      .from(bookingProductsTable)
      .where(
        and(
          eq(bookingProductsTable.bookingId, bookingId),
          eq(bookingProductsTable.productId, productId),
        ),
      );
    if (!existing) {
      res.status(404).json({ error: "Booking product not found" });
      return;
    }

    if (existing.status === "sold" && parsed.data.status === "sold") {
      res.status(409).json({ error: "This item has already been marked sold" });
      return;
    }

    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, existing.productId));

    const id = existing.id;
    const [bp] = await db
      .update(bookingProductsTable)
      .set({
        status: parsed.data.status,
        priceAtSale:
          parsed.data.status === "sold"
            ? (parsed.data.priceAtSale ?? product?.sellingPrice)?.toString()
            : existing.priceAtSale,
      })
      .where(eq(bookingProductsTable.id, id))
      .returning();

    if (parsed.data.status === "sold" && existing.status !== "sold" && product) {
      await db
        .update(productsTable)
        .set({ stock: Math.max(0, product.stock - 1) })
        .where(eq(productsTable.id, product.id));

      const [booking] = await db
        .select()
        .from(bookingsTable)
        .where(eq(bookingsTable.id, existing.bookingId));
      if (booking) {
        await db
          .update(customersTable)
          .set({
            lifetimeSpend: (
              toNum(
                (
                  await db
                    .select()
                    .from(customersTable)
                    .where(eq(customersTable.id, booking.customerId))
                )[0]?.lifetimeSpend,
              ) + toNum(bp!.priceAtSale)
            ).toString(),
          })
          .where(eq(customersTable.id, booking.customerId));
      }
    }

    const [category] = product
      ? await db.select().from(categoriesTable).where(eq(categoriesTable.id, product.categoryId))
      : [undefined];
    const [brand] = product
      ? await db.select().from(brandsTable).where(eq(brandsTable.id, product.brandId))
      : [undefined];

    res.json(
      UpdateBookingProductStatusResponse.parse(
        mapBookingProduct(bp!, product!, category, brand),
      ),
    );
  },
);

router.get(
  "/bookings/:id/invoice",
  requireAuth(),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const booking = await getBookingOr404(id);
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    if (req.auth!.role === "customer") {
      const customer = await getOrCreateCustomer(req.auth!.userId);
      if (booking.customerId !== customer.id) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
    } else if (req.auth!.role === "executive" && !(await executiveIsAssigned(req.auth!.userId, booking))) {
      res.status(403).json({ error: "You are not assigned to this booking" });
      return;
    }

    const [invoice] = await db
      .select()
      .from(invoicesTable)
      .where(eq(invoicesTable.bookingId, id));
    if (!invoice) {
      res.status(404).json({ error: "Invoice not yet generated for this booking" });
      return;
    }
    res.json(
      GetBookingInvoiceResponse.parse({
        id: invoice.id,
        bookingId: invoice.bookingId,
        invoiceNumber: invoice.invoiceNumber,
        subtotal: toNum(invoice.subtotal),
        tax: toNum(invoice.tax),
        total: toNum(invoice.total),
        paymentMethod: invoice.paymentMethod,
        paymentStatus: invoice.paymentStatus,
        createdAt: invoice.createdAt,
      }),
    );
  },
);

router.post(
  "/bookings/:id/invoice",
  requireAuth("admin", "executive"),
  async (req: Request, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const parsed = GenerateBookingInvoiceBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const soldProducts = await db
      .select()
      .from(bookingProductsTable)
      .where(and(eq(bookingProductsTable.bookingId, id), eq(bookingProductsTable.status, "sold")));

    const subtotal = soldProducts.reduce((sum, bp) => sum + toNum(bp.priceAtSale), 0);
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    const [invoice] = await db
      .insert(invoicesTable)
      .values({
        bookingId: id,
        invoiceNumber: generateInvoiceNumber(),
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        paymentMethod: parsed.data.paymentMethod,
        paymentStatus: "paid",
      })
      .onConflictDoUpdate({
        target: invoicesTable.bookingId,
        set: {
          subtotal: subtotal.toString(),
          tax: tax.toString(),
          total: total.toString(),
          paymentMethod: parsed.data.paymentMethod,
          paymentStatus: "paid",
        },
      })
      .returning();

    await db
      .update(bookingsTable)
      .set({ status: "completed" })
      .where(eq(bookingsTable.id, id));

    res.status(201).json(
      GenerateBookingInvoiceResponse.parse({
        id: invoice!.id,
        bookingId: invoice!.bookingId,
        invoiceNumber: invoice!.invoiceNumber,
        subtotal: toNum(invoice!.subtotal),
        tax: toNum(invoice!.tax),
        total: toNum(invoice!.total),
        paymentMethod: invoice!.paymentMethod,
        paymentStatus: invoice!.paymentStatus,
        createdAt: invoice!.createdAt,
      }),
    );
  },
);

export default router;
