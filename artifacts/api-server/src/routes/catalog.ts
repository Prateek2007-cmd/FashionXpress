import { Router, type IRouter, type Request, type Response } from "express";
import { and, asc, eq, gte, ilike, lte, sql } from "drizzle-orm";
import {
  db,
  categoriesTable,
  brandsTable,
  productsTable,
  reviewsTable,
  customersTable,
  usersTable,
  wishlistTable,
  cartItemsTable,
  orderItemsTable,
  bookingProductsTable,
} from "@workspace/db";
import {
  ListCategoriesResponse,
  ListBrandsResponse,
  ListProductsQueryParams,
  ListProductsResponse,
  CreateProductBody,
  CreateProductResponse,
  GetProductResponse,
  UpdateProductBody,
  UpdateProductResponse,
  ListProductReviewsResponse,
  CreateProductReviewBody,
  CreateProductReviewResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { mapProduct } from "../lib/mappers";
import { getOrCreateCustomer } from "./customers";

const router: IRouter = Router();

router.get("/categories", async (_req: Request, res: Response): Promise<void> => {
  const categories = await db.select().from(categoriesTable);
  res.json(ListCategoriesResponse.parse(categories));
});

router.post(
  "/categories",
  requireAuth("admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const [category] = await db
        .insert(categoriesTable)
        .values(req.body)
        .returning();
      res.status(201).json(category);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.delete(
  "/categories/:id",
  requireAuth("admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(
        Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
        10
      );
      await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
      res.status(204).send();
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.patch(
  "/categories/:id",
  requireAuth("admin"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const id = parseInt(
        Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
        10
      );
      const { name, slug, imageUrl } = req.body || {};
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (slug !== undefined) updates.slug = slug;
      if (imageUrl !== undefined) updates.imageUrl = imageUrl;

      const [updated] = await db
        .update(categoriesTable)
        .set(updates)
        .where(eq(categoriesTable.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ error: "Category not found" });
        return;
      }
      res.json(updated);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  }
);

router.get("/brands", async (_req: Request, res: Response): Promise<void> => {
  const brands = await db.select().from(brandsTable);
  res.json(ListBrandsResponse.parse(brands));
});

router.get("/products", async (req: Request, res: Response): Promise<void> => {
  const parsed = ListProductsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const {
    search,
    categoryId,
    brandId,
    color,
    size,
    occasion,
    fabric,
    minPrice,
    maxPrice,
    page,
    limit,
    merchantId,
  } = parsed.data;

  const conditions = [];
  if (search) conditions.push(ilike(productsTable.name, `%${search}%`));
  if (categoryId) conditions.push(eq(productsTable.categoryId, categoryId));
  if (brandId) conditions.push(eq(productsTable.brandId, brandId));
  if (color) conditions.push(ilike(productsTable.color, color));
  if (occasion) conditions.push(ilike(productsTable.occasion, occasion));
  if (fabric) conditions.push(ilike(productsTable.fabric, fabric));
  if (minPrice !== undefined)
    conditions.push(gte(productsTable.sellingPrice, minPrice.toString()));
  if (maxPrice !== undefined)
    conditions.push(lte(productsTable.sellingPrice, maxPrice.toString()));
  if (size)
    conditions.push(sql`${size} = ANY(${productsTable.sizes})`);
  if (merchantId)
    conditions.push(eq(productsTable.merchantId, merchantId));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(productsTable)
    .where(where);

  const rows = await db
    .select()
    .from(productsTable)
    .where(where)
    .orderBy(asc(productsTable.id))
    .limit(limit)
    .offset((page - 1) * limit);

  const categories = await db.select().from(categoriesTable);
  const brands = await db.select().from(brandsTable);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  res.json(
    ListProductsResponse.parse({
      items: rows.map((p) =>
        mapProduct(p, categoryMap.get(p.categoryId), brandMap.get(p.brandId)),
      ),
      total: count,
      page,
      limit,
    }),
  );
});

router.post(
  "/products",
  requireAuth("admin", "merchant"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    try {
      const body = req.body || {};
      if (!body.name || !body.sku) {
        res.status(400).json({ error: "Missing required fields: name, sku" });
        return;
      }

      let brandId = Number(body.brandId);
      if (body.brandName) {
        const trimmedBrandName = body.brandName.trim();
        const slug = trimmedBrandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        // Find existing brand by name case-insensitively
        const [existingBrand] = await db
          .select()
          .from(brandsTable)
          .where(ilike(brandsTable.name, trimmedBrandName));
        
        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          // Auto create brand
          const [newBrand] = await db
            .insert(brandsTable)
            .values({
              name: trimmedBrandName,
              slug: slug || `brand-${Date.now()}`,
            })
            .returning();
          brandId = newBrand!.id;
        }
      }

      const [existingSku] = await db
        .select()
        .from(productsTable)
        .where(eq(productsTable.sku, body.sku.trim()));

      if (existingSku) {
        res.status(400).json({ error: "Product SKU already exists. Please use a unique SKU." });
        return;
      }

      const [product] = await db
        .insert(productsTable)
        .values({
          name: body.name,
          description: body.description || '',
          sku: body.sku,
          barcode: body.barcode || null,
          qrCode: body.qrCode || null,
          categoryId: Number(body.categoryId),
          brandId: brandId,
          color: body.color || '',
          sizes: body.sizes || ['S', 'M', 'L'],
          fabric: body.fabric || '',
          occasion: body.occasion || '',
          mrp: (body.mrp || 0).toString(),
          sellingPrice: (body.sellingPrice || 0).toString(),
          purchaseCost: body.purchaseCost?.toString() || null,
          supplier: body.supplier || null,
          stock: Number(body.stock) || 0,
          warehouse: body.warehouse || null,
          rack: body.rack || null,
          images: body.images || [],
          merchantId: req.auth!.role === "merchant" ? req.auth!.userId : null,
        })
        .returning();

      const [category] = await db
        .select()
        .from(categoriesTable)
        .where(eq(categoriesTable.id, product!.categoryId));
      const [brand] = await db
        .select()
        .from(brandsTable)
        .where(eq(brandsTable.id, product!.brandId));

      res.status(201).json(mapProduct(product!, category, brand));
    } catch (err: any) {
      console.error("POST /products error:", err);
      res.status(500).json({ error: err.message || "Failed to create product" });
    }
  },
);

router.get("/products/:id", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(
    Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
    10,
  );
  const [product] = await db
    .select()
    .from(productsTable)
    .where(eq(productsTable.id, id));
  if (!product) {
    res.status(404).json({ error: "Product not found" });
    return;
  }
  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, product.categoryId));
  const [brand] = await db
    .select()
    .from(brandsTable)
    .where(eq(brandsTable.id, product.brandId));
  res.json(GetProductResponse.parse(mapProduct(product, category, brand)));
});

router.patch(
  "/products/:id",
  requireAuth("admin", "merchant"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );

    if (req.auth!.role === "merchant") {
      const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));
      if (!existing) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      if (existing.merchantId && existing.merchantId !== req.auth!.userId) {
        res.status(403).json({ error: "Forbidden: You do not own this product" });
        return;
      }
    }

    const parsed = UpdateProductBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { mrp, sellingPrice, purchaseCost, ...rest } = parsed.data;
    const [product] = await db
      .update(productsTable)
      .set({
        ...rest,
        ...(mrp !== undefined ? { mrp: mrp.toString() } : {}),
        ...(sellingPrice !== undefined
          ? { sellingPrice: sellingPrice.toString() }
          : {}),
        ...(purchaseCost !== undefined
          ? { purchaseCost: purchaseCost.toString() }
          : {}),
      })
      .where(eq(productsTable.id, id))
      .returning();

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const [category] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.id, product.categoryId));
    const [brand] = await db
      .select()
      .from(brandsTable)
      .where(eq(brandsTable.id, product.brandId));

    res.json(UpdateProductResponse.parse(mapProduct(product, category, brand)));
  },
);

router.delete(
  "/products/:id",
  requireAuth("admin", "merchant"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );

    if (req.auth!.role === "merchant") {
      const [existing] = await db.select().from(productsTable).where(eq(productsTable.id, id));
      if (!existing) {
        res.status(404).json({ error: "Product not found" });
        return;
      }
      if (existing.merchantId && existing.merchantId !== req.auth!.userId) {
        res.status(403).json({ error: "Forbidden: You do not own this product" });
        return;
      }
    }
    // Clean up dependent foreign key records first to prevent FK constraint violations
    await db.delete(wishlistTable).where(eq(wishlistTable.productId, id)).catch(() => {});
    await db.delete(cartItemsTable).where(eq(cartItemsTable.productId, id)).catch(() => {});
    await db.delete(reviewsTable).where(eq(reviewsTable.productId, id)).catch(() => {});
    await db.delete(bookingProductsTable).where(eq(bookingProductsTable.productId, id)).catch(() => {});
    await db.delete(orderItemsTable).where(eq(orderItemsTable.productId, id)).catch(() => {});

    const [product] = await db
      .delete(productsTable)
      .where(eq(productsTable.id, id))
      .returning();
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }
    res.sendStatus(204);
  },
);

router.get("/products/:id/reviews", async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(
    Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
    10,
  );
  const rows = await db
    .select({
      review: reviewsTable,
      customerName: usersTable.name,
    })
    .from(reviewsTable)
    .innerJoin(customersTable, eq(reviewsTable.customerId, customersTable.id))
    .innerJoin(usersTable, eq(customersTable.userId, usersTable.id))
    .where(eq(reviewsTable.productId, id));

  res.json(
    ListProductReviewsResponse.parse(
      rows.map(({ review, customerName }) => ({
        id: review.id,
        productId: review.productId,
        customerId: review.customerId,
        customerName,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
      })),
    ),
  );
});

router.post(
  "/products/:id/reviews",
  requireAuth("customer"),
  async (req: AuthedRequest, res: Response): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const parsed = CreateProductReviewBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const [review] = await db
      .insert(reviewsTable)
      .values({ ...parsed.data, productId: id, customerId: customer.id })
      .returning();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.auth!.userId));

    res.status(201).json(
      CreateProductReviewResponse.parse({
        id: review!.id,
        productId: review!.productId,
        customerId: review!.customerId,
        customerName: user?.name ?? "Customer",
        rating: review!.rating,
        comment: review!.comment,
        createdAt: review!.createdAt,
      }),
    );
  },
);

export default router;
