import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable } from "@workspace/db";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { getOrCreateCustomer } from "./customers";

const router: IRouter = Router();

function generateOrderNumber(): string {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${Date.now().toString().slice(-6)}${random}`;
}

router.post(
  "/orders",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    try {
      const customer = await getOrCreateCustomer(req.auth!.userId);
      const { productId, quantity, color, size, shippingAddress, specialRequirements } = req.body;

      const [product] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.id, productId));

      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const totalAmount = (parseFloat(product.sellingPrice) * quantity).toFixed(2);

      const [order] = await db
        .insert(ordersTable)
        .values({
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          totalAmount,
          shippingAddress,
          specialRequirements,
        })
        .returning();

      const [orderItem] = await db
        .insert(orderItemsTable)
        .values({
          orderId: order!.id,
          productId,
          quantity,
          priceAtSale: product.sellingPrice,
          color,
          size,
        })
        .returning();

      res.status(201).json({
        ...order,
        items: [{ ...orderItem, product }],
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.get(
  "/orders/me",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    try {
      const customer = await getOrCreateCustomer(req.auth!.userId);
      const orders = await db
        .select()
        .from(ordersTable)
        .where(eq(ordersTable.customerId, customer.id));

      const items = await db.select().from(orderItemsTable);
      const products = await db.select().from(productsTable);

      const result = orders.map((o) => {
        const orderItems = items
          .filter((i) => i.orderId === o.id)
          .map((i) => ({
            ...i,
            product: products.find((p) => p.id === i.productId),
          }));
        return { ...o, items: orderItems };
      });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.get(
  "/orders",
  requireAuth("admin"),
  async (req, res): Promise<void> => {
    try {
      const orders = await db.select().from(ordersTable);
      const items = await db.select().from(orderItemsTable);
      const products = await db.select().from(productsTable);

      const result = orders.map((o) => {
        const orderItems = items
          .filter((i) => i.orderId === o.id)
          .map((i) => ({
            ...i,
            product: products.find((p) => p.id === i.productId),
          }));
        return { ...o, items: orderItems };
      });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
