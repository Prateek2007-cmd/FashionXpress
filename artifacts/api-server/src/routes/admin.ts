import { Router, type IRouter, type Request, type Response } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import {
  db,
  bookingsTable,
  bookingProductsTable,
  customersTable,
  executivesTable,
  productsTable,
  brandsTable,
  invoicesTable,
  usersTable,
} from "@workspace/db";
import {
  GetDashboardSummaryResponse,
  GetDashboardAnalyticsResponse,
} from "@workspace/api-zod";
import { requireAuth } from "../middlewares/auth";
import { toNum } from "../lib/mappers";

const router: IRouter = Router();

router.get(
  "/admin/dashboard/summary",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const today = new Date().toISOString().slice(0, 10);

    const [{ count: todaysBookings }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(eq(bookingsTable.preferredDate, today));

    const [{ count: upcomingVisits }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(
        and(
          gte(bookingsTable.preferredDate, today),
          sql`${bookingsTable.status} not in ('completed','cancelled','rejected')`,
        ),
      );

    const [{ total: totalRevenue }] = await db
      .select({ total: sql<string>`coalesce(sum(${bookingProductsTable.priceAtSale}),0)` })
      .from(bookingProductsTable)
      .where(eq(bookingProductsTable.status, "sold"));

    const [{ count: totalCustomers }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(customersTable);
    const [{ count: totalExecutives }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(executivesTable);
    const [{ count: totalProducts }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable);
    const [{ count: lowStockCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(productsTable)
      .where(sql`${productsTable.stock} <= 5`);

    const [{ count: totalBookings }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable);
    const [{ count: completedBookings }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(bookingsTable)
      .where(eq(bookingsTable.status, "completed"));

    const [{ count: invoiceCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoicesTable);

    res.json({
        todaysBookings,
        upcomingVisits,
        totalRevenue: toNum(totalRevenue),
        totalCustomers,
        totalExecutives,
        totalProducts,
        lowStockCount,
        conversionRate: totalBookings > 0 ? completedBookings / totalBookings : 0,
        averageBill: invoiceCount > 0 ? toNum(totalRevenue) / invoiceCount : 0,
      });
  },
);

router.get(
  "/admin/dashboard/analytics",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    const revenueByDayRows = await db
      .select({
        date: sql<string>`to_char(${invoicesTable.createdAt}, 'YYYY-MM-DD')`,
        revenue: sql<string>`sum(${invoicesTable.total})`,
        bookings: sql<number>`count(*)::int`,
      })
      .from(invoicesTable)
      .groupBy(sql`to_char(${invoicesTable.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`to_char(${invoicesTable.createdAt}, 'YYYY-MM-DD')`);

    const mostSelectedRows = await db
      .select({
        name: productsTable.name,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingProductsTable)
      .innerJoin(productsTable, eq(bookingProductsTable.productId, productsTable.id))
      .groupBy(productsTable.name)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const mostSoldRows = await db
      .select({
        name: productsTable.name,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingProductsTable)
      .innerJoin(productsTable, eq(bookingProductsTable.productId, productsTable.id))
      .where(eq(bookingProductsTable.status, "sold"))
      .groupBy(productsTable.name)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const popularColorsRows = await db
      .select({
        name: productsTable.color,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingProductsTable)
      .innerJoin(productsTable, eq(bookingProductsTable.productId, productsTable.id))
      .where(eq(bookingProductsTable.status, "sold"))
      .groupBy(productsTable.color)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const popularSizesRows = await db
      .select({
        name: sql<string>`unnest(${productsTable.sizes})`,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingProductsTable)
      .innerJoin(productsTable, eq(bookingProductsTable.productId, productsTable.id))
      .where(eq(bookingProductsTable.status, "sold"))
      .groupBy(sql`unnest(${productsTable.sizes})`)
      .orderBy(sql`count(*) desc`)
      .limit(10);

    const bookingsByStatusRows = await db
      .select({
        name: bookingsTable.status,
        count: sql<number>`count(*)::int`,
      })
      .from(bookingsTable)
      .groupBy(bookingsTable.status);

    res.json({
        revenueByDay: revenueByDayRows.map((r) => ({
          date: r.date,
          revenue: toNum(r.revenue),
          bookings: r.bookings,
        })),
        mostSelectedProducts: mostSelectedRows,
        mostSoldProducts: mostSoldRows,
        popularColors: popularColorsRows,
        popularSizes: popularSizesRows,
        bookingsByStatus: bookingsByStatusRows,
      });
  },
);

router.get(
  "/admin/dashboard/brand-revenue",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const rows = await db
        .select({
          brandName: brandsTable.name,
          quantitySold: sql<number>`count(*)::int`,
          revenue: sql<string>`coalesce(sum(${bookingProductsTable.priceAtSale}), 0)`,
        })
        .from(bookingProductsTable)
        .innerJoin(productsTable, eq(bookingProductsTable.productId, productsTable.id))
        .innerJoin(brandsTable, eq(productsTable.brandId, brandsTable.id))
        .where(eq(bookingProductsTable.status, "sold"))
        .groupBy(brandsTable.name)
        .orderBy(sql`sum(${bookingProductsTable.priceAtSale}) desc`);

      res.json(
        rows.map((r) => ({
          brandName: r.brandName,
          quantitySold: r.quantitySold,
          revenue: toNum(r.revenue),
        })),
      );
    } catch (err: any) {
      console.error("GET /admin/dashboard/brand-revenue error:", err);
      res.status(500).json({ error: "Failed to fetch brand revenue" });
    }
  },
);
// ── Executive Performance ──────────────────────────────────────────────────
router.get(
  "/admin/dashboard/executive-performance",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const rows = await db
        .select({
          name: usersTable.name,
          totalVisits: sql<number>`count(*)::int`,
          completedVisits: sql<number>`count(*) filter (where ${bookingsTable.status} = 'completed')::int`,
          rating: executivesTable.rating,
        })
        .from(executivesTable)
        .innerJoin(usersTable, eq(executivesTable.userId, usersTable.id))
        .leftJoin(bookingsTable, eq(bookingsTable.executiveId, executivesTable.id))
        .groupBy(usersTable.name, executivesTable.rating)
        .orderBy(sql`count(*) desc`)
        .limit(8);

      res.json(rows.map((r) => ({
        name: r.name,
        totalVisits: r.totalVisits,
        completedVisits: r.completedVisits,
        rating: parseFloat(r.rating as string),
      })));
    } catch (err: any) {
      console.error("GET /admin/dashboard/executive-performance error:", err);
      res.status(500).json({ error: "Failed to fetch executive performance" });
    }
  }
);

// ── Top Cities ───────────────────────────────────────────────────────────────
router.get(
  "/admin/dashboard/top-cities",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      // Extract first word/locality from addressText as city approximation
      const rows = await db
        .select({
          city: sql<string>`split_part(${bookingsTable.addressText}, ',', -1)`,
          count: sql<number>`count(*)::int`,
        })
        .from(bookingsTable)
        .groupBy(sql`split_part(${bookingsTable.addressText}, ',', -1)`)
        .orderBy(sql`count(*) desc`)
        .limit(6);

      res.json(rows.map((r) => ({
        city: (r.city || "").trim(),
        count: r.count,
      })));
    } catch (err: any) {
      console.error("GET /admin/dashboard/top-cities error:", err);
      res.status(500).json({ error: "Failed to fetch top cities" });
    }
  }
);

// ── Monthly Booking Goal ──────────────────────────────────────────────────────
router.get(
  "/admin/dashboard/monthly-goal",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const TARGET = 100; // Monthly target

      const [{ count: thisMonth }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookingsTable)
        .where(gte(bookingsTable.preferredDate, monthStart));

      const [{ count: completedMonth }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(bookingsTable)
        .where(
          and(
            gte(bookingsTable.preferredDate, monthStart),
            eq(bookingsTable.status, "completed")
          )
        );

      res.json({ target: TARGET, thisMonth, completedMonth });
    } catch (err: any) {
      console.error("GET /admin/dashboard/monthly-goal error:", err);
      res.status(500).json({ error: "Failed to fetch monthly goal" });
    }
  }
);

// ── Customer Retention ────────────────────────────────────────────────────────
router.get(
  "/admin/dashboard/customer-retention",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const repeatRows = await db
        .select({
          customerId: bookingsTable.customerId,
          bookingCount: sql<number>`count(*)::int`,
        })
        .from(bookingsTable)
        .groupBy(bookingsTable.customerId);

      const total = repeatRows.length;
      const repeat = repeatRows.filter((r) => r.bookingCount > 1).length;
      const newCustomers = total - repeat;

      res.json({
        total,
        repeat,
        newCustomers,
        repeatRate: total > 0 ? Math.round((repeat / total) * 100) : 0,
      });
    } catch (err: any) {
      console.error("GET /admin/dashboard/customer-retention error:", err);
      res.status(500).json({ error: "Failed to fetch retention data" });
    }
  }
);

// ── Recent Activity Feed ──────────────────────────────────────────────────────
router.get(
  "/admin/dashboard/recent-activity",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const recentBookings = await db
        .select({
          id: bookingsTable.id,
          name: bookingsTable.name,
          status: bookingsTable.status,
          createdAt: bookingsTable.createdAt,
          bookingCode: bookingsTable.bookingCode,
        })
        .from(bookingsTable)
        .orderBy(sql`${bookingsTable.createdAt} desc`)
        .limit(8);

      res.json(recentBookings.map((b) => ({
        type: "booking",
        id: b.id,
        name: b.name,
        status: b.status,
        code: b.bookingCode,
        createdAt: b.createdAt,
      })));
    } catch (err: any) {
      console.error("GET /admin/dashboard/recent-activity error:", err);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  }
);

// ── Brand Leaderboard + Commission ─────────────────────────────────────────

router.get(
  "/admin/brands",
  requireAuth("admin"),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const brands = await db.select().from(brandsTable);
      // Get revenue per brand
      const revenueRows = await db
        .select({
          brandId: productsTable.brandId,
          revenue: sql<number>`coalesce(sum(cast(${productsTable.sellingPrice} as numeric) * ${productsTable.stock}), 0)::float`,
          productCount: sql<number>`count(${productsTable.id})::int`,
        })
        .from(productsTable)
        .groupBy(productsTable.brandId);

      const revenueMap = new Map(revenueRows.map(r => [r.brandId, r]));

      const result = brands.map(b => ({
        id: b.id,
        name: b.name,
        slug: b.slug,
        logoUrl: b.logoUrl,
        commissionRate: parseFloat(b.commissionRate as string || "10"),
        revenue: revenueMap.get(b.id)?.revenue ?? 0,
        productCount: revenueMap.get(b.id)?.productCount ?? 0,
      }));

      // Sort by revenue descending
      result.sort((a, b) => b.revenue - a.revenue);
      res.json(result);
    } catch (err: any) {
      console.error("GET /admin/brands error:", err);
      res.status(500).json({ error: "Failed to fetch brands" });
    }
  }
);

router.patch(
  "/admin/brands/:id/commission",
  requireAuth("admin"),
  async (req: Request, res: Response): Promise<void> => {
    const id = Number(req.params.id);
    const { commissionRate } = req.body;

    if (!id || isNaN(id)) {
      res.status(400).json({ error: "Invalid brand ID" });
      return;
    }
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      res.status(400).json({ error: "Commission rate must be between 0 and 100" });
      return;
    }

    try {
      const [updated] = await db
        .update(brandsTable)
        .set({ commissionRate: rate.toFixed(2) })
        .where(eq(brandsTable.id, id))
        .returning({ id: brandsTable.id, name: brandsTable.name, commissionRate: brandsTable.commissionRate });

      if (!updated) {
        res.status(404).json({ error: "Brand not found" });
        return;
      }
      res.json({ success: true, brand: updated });
    } catch (err: any) {
      console.error("PATCH /admin/brands/:id/commission error:", err);
      res.status(500).json({ error: "Failed to update commission" });
    }
  }
);

export default router;
