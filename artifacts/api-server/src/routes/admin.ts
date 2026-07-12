import { Router, type IRouter } from "express";
import { and, eq, gte, sql } from "drizzle-orm";
import {
  db,
  bookingsTable,
  bookingProductsTable,
  customersTable,
  executivesTable,
  productsTable,
  invoicesTable,
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
  async (_req, res): Promise<void> => {
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
      .select({ total: sql<string>`coalesce(sum(${invoicesTable.total}),0)` })
      .from(invoicesTable);

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
  async (_req, res): Promise<void> => {
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

export default router;
