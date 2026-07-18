import { Router, type IRouter, type Request, type Response } from "express";
import { eq, inArray, and } from "drizzle-orm";
import { db, ordersTable, orderItemsTable, productsTable, customersTable, usersTable, cartItemsTable } from "@workspace/db";
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
  async (req: AuthedRequest, res: Response): Promise<void> => {
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
  async (req: AuthedRequest, res: Response): Promise<void> => {
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
  async (req: Request, res: Response): Promise<void> => {
    try {
      const orders = await db
        .select({
          order: ordersTable,
          customer: customersTable,
          user: usersTable,
        })
        .from(ordersTable)
        .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
        .innerJoin(usersTable, eq(customersTable.userId, usersTable.id));

      const items = await db.select().from(orderItemsTable);
      const products = await db.select().from(productsTable);

      const result = orders.map(({ order, customer, user }) => {
        const orderItems = items
          .filter((i) => i.orderId === order.id)
          .map((i) => ({
            ...i,
            product: products.find((p) => p.id === i.productId),
          }));
        return {
          ...order,
          customer: {
            ...customer,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          items: orderItems,
        };
      });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.post(
  "/orders/checkout",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const customer = await getOrCreateCustomer(req.auth!.userId);
      const { shippingAddress, specialRequirements } = req.body;

      const cartItems = await db
        .select({
          item: cartItemsTable,
          product: productsTable,
        })
        .from(cartItemsTable)
        .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
        .where(eq(cartItemsTable.customerId, customer.id));

      if (cartItems.length === 0) {
        res.status(400).json({ error: "Cart is empty" });
        return;
      }

      const totalAmount = cartItems
        .reduce((sum, ci) => sum + parseFloat(ci.product.sellingPrice) * ci.item.quantity, 0)
        .toFixed(2);

      const [order] = await db
        .insert(ordersTable)
        .values({
          orderNumber: generateOrderNumber(),
          customerId: customer.id,
          totalAmount,
          shippingAddress: shippingAddress || "Store Pickup",
          specialRequirements: specialRequirements || "",
        })
        .returning();

      for (const ci of cartItems) {
        await db.insert(orderItemsTable).values({
          orderId: order!.id,
          productId: ci.item.productId,
          quantity: ci.item.quantity,
          priceAtSale: ci.product.sellingPrice,
          color: ci.product.color,
          size: ci.item.size,
        });
      }

      await db.delete(cartItemsTable).where(eq(cartItemsTable.customerId, customer.id));

      res.status(201).json(order);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.get(
  "/orders/merchant",
  requireAuth("merchant"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const merchantId = req.auth!.userId;

      const items = await db
        .select({
          orderItem: orderItemsTable,
          product: productsTable,
        })
        .from(orderItemsTable)
        .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
        .where(eq(productsTable.merchantId, merchantId));

      if (items.length === 0) {
        res.json([]);
        return;
      }

      const orderIds = Array.from(new Set(items.map(i => i.orderItem.orderId)));

      const orders = await db
        .select({
          order: ordersTable,
          customer: customersTable,
          user: usersTable,
        })
        .from(ordersTable)
        .innerJoin(customersTable, eq(ordersTable.customerId, customersTable.id))
        .innerJoin(usersTable, eq(customersTable.userId, usersTable.id))
        .where(inArray(ordersTable.id, orderIds));

      const result = orders.map(({ order, customer, user }) => {
        const orderItems = items
          .filter(i => i.orderItem.orderId === order.id)
          .map(i => ({
            ...i.orderItem,
            product: i.product,
          }));

        return {
          ...order,
          customer: {
            ...customer,
            name: user.name,
            email: user.email,
            phone: user.phone,
          },
          items: orderItems,
        };
      });

      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.patch(
  "/orders/:id/status",
  requireAuth("merchant", "admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const orderId = parseInt(req.params.id as string, 10);
      const { status } = req.body;

      const allowedStatuses = ["pending", "approved", "rejected", "confirmed", "processing", "shipped", "delivered", "cancelled"];
      if (!allowedStatuses.includes(status)) {
        res.status(400).json({ error: "Invalid status" });
        return;
      }

      if (req.auth!.role === "merchant") {
        const merchantId = req.auth!.userId;
        const merchantItems = await db
          .select()
          .from(orderItemsTable)
          .innerJoin(productsTable, eq(orderItemsTable.productId, productsTable.id))
          .where(and(
            eq(orderItemsTable.orderId, orderId),
            eq(productsTable.merchantId, merchantId)
          ));

        if (merchantItems.length === 0) {
          res.status(403).json({ error: "Unauthorized to update this order" });
          return;
        }
      }

      const [updatedOrder] = await db
        .update(ordersTable)
        .set({ status })
        .where(eq(ordersTable.id, orderId))
        .returning();

      if (!updatedOrder) {
        res.status(404).json({ error: "Order not found" });
        return;
      }

      res.json(updatedOrder);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

export default router;
