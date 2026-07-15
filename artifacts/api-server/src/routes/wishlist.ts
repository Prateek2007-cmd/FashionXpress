import { Router, type IRouter, type Response } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  wishlistTable,
  productsTable,
  categoriesTable,
  brandsTable,
} from "@workspace/db";
import {
  ListWishlistResponse,
  AddToWishlistBody,
  AddToWishlistResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { mapProduct } from "../lib/mappers";
import { getOrCreateCustomer } from "./customers";

const router: IRouter = Router();

router.get(
  "/wishlist",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const rows = await db
      .select({ item: wishlistTable, product: productsTable })
      .from(wishlistTable)
      .innerJoin(productsTable, eq(wishlistTable.productId, productsTable.id))
      .where(eq(wishlistTable.customerId, customer.id));

    const categories = await db.select().from(categoriesTable);
    const brands = await db.select().from(brandsTable);
    const categoryMap = new Map(categories.map((c) => [c.id, c]));
    const brandMap = new Map(brands.map((b) => [b.id, b]));

    res.json(
        rows.map(({ item, product }) => ({
          id: item.id,
          productId: item.productId,
          product: mapProduct(
            product,
            categoryMap.get(product.categoryId),
            brandMap.get(product.brandId),
          ),
          createdAt: item.createdAt,
        })),
    );
  },
);

router.post(
  "/wishlist",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const body = (req.body && req.body.data) ? req.body.data : (req.body || {});
    
    if (!body.productId) {
      res.status(400).json({ error: "Missing productId" });
      return;
    }

    const parsedData = {
      productId: Number(body.productId)
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
      .from(wishlistTable)
      .where(
        and(
          eq(wishlistTable.customerId, customer.id),
          eq(wishlistTable.productId, parsedData.productId),
        ),
      );

    const item =
      existing ??
      (
        await db
          .insert(wishlistTable)
          .values({ customerId: customer.id, productId: parsedData.productId })
          .returning()
      )[0];

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, product.categoryId));
    const [brand] = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, product.brandId));

    res.status(201).json({
        id: item!.id,
        productId: item!.productId,
        product: mapProduct(product, category, brand),
        createdAt: item!.createdAt,
      });
  },
);

router.delete(
  "/wishlist/:productId",
  requireAuth("customer", "admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const productId = parseInt(
      Array.isArray(req.params.productId)
        ? req.params.productId[0]!
        : req.params.productId!,
      10,
    );
    const customer = await getOrCreateCustomer(req.auth!.userId);
    await db
      .delete(wishlistTable)
      .where(
        and(
          eq(wishlistTable.customerId, customer.id),
          eq(wishlistTable.productId, productId),
        ),
      );
    res.sendStatus(204);
  },
);

export default router;
