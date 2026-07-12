import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  cartItemsTable,
  productsTable,
  categoriesTable,
  brandsTable,
} from "@workspace/db";
import {
  ListHomeVisitCartResponse,
  AddToHomeVisitCartBody,
  AddToHomeVisitCartResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { mapProduct } from "../lib/mappers";
import { getOrCreateCustomer } from "./customers";

const router: IRouter = Router();

router.get(
  "/home-visit-cart",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const rows = await db
      .select({ item: cartItemsTable, product: productsTable })
      .from(cartItemsTable)
      .innerJoin(productsTable, eq(cartItemsTable.productId, productsTable.id))
      .where(eq(cartItemsTable.customerId, customer.id));

    const categories = await db.select().from(categoriesTable);
    const brands = await db.select().from(brandsTable);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const brandMap = new Map(brands.map((b) => [b.id, b]));

    res.json(
      ListHomeVisitCartResponse.parse(
        rows.map(({ item, product }) => ({
          id: item.id,
          productId: item.productId,
          product: mapProduct(
            product,
            categoryMap.get(product.categoryId),
            brandMap.get(product.brandId),
          ),
          quantity: item.quantity,
          // @ts-ignore
          size: (item as any).size,
          createdAt: item.createdAt,
        })),
      ),
    );
  },
);

router.post(
  "/home-visit-cart",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    const body = (req.body && req.body.data) ? req.body.data : (req.body || {});
    
    if (!body.productId) {
      res.status(400).json({ error: "Missing productId" });
      return;
    }

    const parsedData = {
      productId: Number(body.productId),
      quantity: body.quantity !== undefined ? Number(body.quantity) : 1,
      size: body.size !== undefined ? String(body.size) : ""
    };
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const [product] = await db
      .select()
      .from(productsTable)
      .where(eq(productsTable.id, parsedData.productId));
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [existing] = await db
      .select()
      .from(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.customerId, customer.id),
          eq(cartItemsTable.productId, parsedData.productId),
          // @ts-ignore: added in schema, ignore until zod is fully regenerated
          eq(cartItemsTable.size, parsedData.size),
        ),
      );

    let item;
    if (existing) {
      [item] = await db
        .update(cartItemsTable)
        .set({ quantity: existing.quantity + (parsedData.quantity ?? 1) })
        .where(eq(cartItemsTable.id, existing.id))
        .returning();
    } else {
      [item] = await db
        .insert(cartItemsTable)
        .values({
          customerId: customer.id,
          productId: parsedData.productId,
          quantity: parsedData.quantity ?? 1,
          // @ts-ignore
          size: parsedData.size,
        })
        .returning();
    }

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, product.categoryId));
    const [brand] = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, product.brandId));

    res.status(201).json(
      AddToHomeVisitCartResponse.parse({
        id: item!.id,
        productId: item!.productId,
        product: mapProduct(product, category, brand),
        quantity: item!.quantity,
        // @ts-ignore
        size: (item as any)!.size,
        createdAt: item!.createdAt,
      }),
    );
  },
);

router.delete(
  "/home-visit-cart",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    const customer = await getOrCreateCustomer(req.auth!.userId);
    await db.delete(cartItemsTable).where(eq(cartItemsTable.customerId, customer.id));
    res.sendStatus(204);
  },
);

router.delete(
  "/home-visit-cart/:productId",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res): Promise<void> => {
    const productId = parseInt(
      Array.isArray(req.params.productId)
        ? req.params.productId[0]!
        : req.params.productId!,
      10,
    );
    const customer = await getOrCreateCustomer(req.auth!.userId);
    await db
      .delete(cartItemsTable)
      .where(
        and(
          eq(cartItemsTable.customerId, customer.id),
          eq(cartItemsTable.productId, productId),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
