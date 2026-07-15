import { Router, type IRouter } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  db,
  usersTable,
  executivesTable,
  bookingsTable,
  bookingProductsTable,
  productsTable,
  categoriesTable,
  brandsTable,
  customersTable,
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

router.get(
  "/executives",
  requireAuth("admin"),
  async (_req, res): Promise<void> => {
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

router.post(
  "/executives",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
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

router.get(
  "/executives/me/visits",
  requireAuth("executive"),
  async (req: AuthedRequest, res): Promise<void> => {
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

router.patch(
  "/executives/:id",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const { name, email, phone, photoUrl } = req.body;

    // find the executive to get the userId
    const [executive] = await db
      .select()
      .from(executivesTable)
      .where(eq(executivesTable.id, id));

    if (!executive) {
      res.status(404).json({ error: "Executive not found" });
      return;
    }

    // update the user fields
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

    // update photo url
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
  async (req, res): Promise<void> => {
    const id = Number(req.params.id);

    const [executive] = await db
      .select()
      .from(executivesTable)
      .where(eq(executivesTable.id, id));

    if (!executive) {
      res.status(404).json({ error: "Executive not found" });
      return;
    }

    // delete executive record first (FK constraint)
    await db.delete(executivesTable).where(eq(executivesTable.id, id));
    // delete the user account
    await db.delete(usersTable).where(eq(usersTable.id, executive.userId));

    res.json({ success: true });
  },
);

export default router;
