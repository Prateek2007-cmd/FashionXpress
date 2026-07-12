import {
  db,
  usersTable,
  customersTable,
  categoriesTable,
  brandsTable,
  productsTable,
  executivesTable,
} from "@workspace/db";
import { hashPassword } from "../lib/auth";
import { eq } from "drizzle-orm";

async function upsertUser(
  email: string,
  name: string,
  role: "customer" | "admin" | "executive",
  password: string,
  phone: string,
) {
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) return existing;
  const [user] = await db
    .insert(usersTable)
    .values({ email, name, role, phone, passwordHash: await hashPassword(password) })
    .returning();
  return user!;
}

async function main() {
  console.log("Seeding Fashion Xpress...");

  const admin = await upsertUser(
    "admin@fashionxpress.in",
    "Ananya Rao",
    "admin",
    "admin123",
    "+91 98765 43210",
  );

  const execUser1 = await upsertUser(
    "priya@fashionxpress.in",
    "Priya Sharma",
    "executive",
    "exec123",
    "+91 98765 11111",
  );
  const execUser2 = await upsertUser(
    "arjun@fashionxpress.in",
    "Arjun Mehta",
    "executive",
    "exec123",
    "+91 98765 22222",
  );

  for (const u of [execUser1, execUser2]) {
    const [existing] = await db
      .select()
      .from(executivesTable)
      .where(eq(executivesTable.userId, u.id));
    if (!existing) {
      await db.insert(executivesTable).values({ userId: u.id, rating: "4.9" });
    }
  }

  const customerUser = await upsertUser(
    "customer@example.com",
    "Rhea Kapoor",
    "customer",
    "customer123",
    "+91 98765 33333",
  );
  const [existingCustomer] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.userId, customerUser.id));
  if (!existingCustomer) {
    await db.insert(customersTable).values({
      userId: customerUser.id,
      favoriteColors: ["Navy", "Gold"],
      favoriteBrands: [],
    });
  }

  const categoryDefs = [
    { name: "Men's Ethnic Wear", slug: "mens-ethnic" },
    { name: "Women's Ethnic Wear", slug: "womens-ethnic" },
    { name: "Formal Wear", slug: "formal" },
    { name: "Evening & Party Wear", slug: "evening-party" },
    { name: "Wedding Collection", slug: "wedding" },
  ];
  const categories: Record<string, number> = {};
  for (const c of categoryDefs) {
    const [existing] = await db
      .select()
      .from(categoriesTable)
      .where(eq(categoriesTable.slug, c.slug));
    const row =
      existing ??
      (
        await db
          .insert(categoriesTable)
          .values({ ...c, imageUrl: null })
          .returning()
      )[0];
    categories[c.slug] = row!.id;
  }

  const brandDefs = [
    { name: "Maison Rare", slug: "maison-rare" },
    { name: "Le Noir Studio", slug: "le-noir-studio" },
    { name: "Vantage & Co.", slug: "vantage-co" },
    { name: "Amaya Couture", slug: "amaya-couture" },
  ];
  const brands: Record<string, number> = {};
  for (const b of brandDefs) {
    const [existing] = await db.select().from(brandsTable).where(eq(brandsTable.slug, b.slug));
    const row =
      existing ??
      (
        await db
          .insert(brandsTable)
          .values({ ...b, logoUrl: null })
          .returning()
      )[0];
    brands[b.slug] = row!.id;
  }

  const productDefs = [
    {
      name: "Navy Silk Embroidered Kurta",
      sku: "FX-KUR-001",
      categorySlug: "mens-ethnic",
      brandSlug: "maison-rare",
      color: "Navy",
      sizes: ["S", "M", "L", "XL"],
      fabric: "Silk",
      occasion: "Festive",
      mrp: 8999,
      sellingPrice: 6499,
      stock: 14,
      image: "product_kurta_navy.jpg",
      description: "A refined navy silk kurta with hand-finished gold embroidery along the placket, tailored for festive evenings.",
    },
    {
      name: "Heritage Gold & Maroon Silk Saree",
      sku: "FX-SAR-001",
      categorySlug: "womens-ethnic",
      brandSlug: "amaya-couture",
      color: "Maroon",
      sizes: ["Free Size"],
      fabric: "Silk",
      occasion: "Wedding",
      mrp: 24999,
      sellingPrice: 18999,
      stock: 6,
      image: "product_saree_gold.jpg",
      description: "A handwoven silk saree in maroon and gold with a intricately bordered pallu, perfect for weddings.",
    },
    {
      name: "Charcoal Tailored Blazer Suit",
      sku: "FX-SUI-001",
      categorySlug: "formal",
      brandSlug: "vantage-co",
      color: "Charcoal",
      sizes: ["38", "40", "42", "44"],
      fabric: "Wool Blend",
      occasion: "Business",
      mrp: 15999,
      sellingPrice: 11999,
      stock: 9,
      image: "product_suit_charcoal.jpg",
      description: "A sharply tailored charcoal suit in a breathable wool blend, cut for a modern silhouette.",
    },
    {
      name: "Emerald Flowing Evening Dress",
      sku: "FX-DRE-001",
      categorySlug: "evening-party",
      brandSlug: "le-noir-studio",
      color: "Emerald",
      sizes: ["XS", "S", "M", "L"],
      fabric: "Georgette",
      occasion: "Party",
      mrp: 12999,
      sellingPrice: 9499,
      stock: 11,
      image: "product_dress_emerald.jpg",
      description: "A floor-length emerald georgette dress with a fluid drape and delicate back detailing.",
    },
    {
      name: "Classic White Linen Formal Shirt",
      sku: "FX-SHI-001",
      categorySlug: "formal",
      brandSlug: "vantage-co",
      color: "White",
      sizes: ["S", "M", "L", "XL", "XXL"],
      fabric: "Linen",
      occasion: "Business",
      mrp: 3999,
      sellingPrice: 2999,
      stock: 22,
      image: "product_shirt_white.jpg",
      description: "A breathable pure linen shirt with a clean spread collar, essential for warm-weather formalwear.",
    },
    {
      name: "Blush Bridal Lehenga with Gold Zari",
      sku: "FX-LEH-001",
      categorySlug: "wedding",
      brandSlug: "amaya-couture",
      color: "Blush Pink",
      sizes: ["S", "M", "L"],
      fabric: "Net & Silk",
      occasion: "Wedding",
      mrp: 42999,
      sellingPrice: 34999,
      stock: 4,
      image: "product_lehenga_pink.jpg",
      description: "A hand-embellished blush lehenga with gold zari work, designed for the modern bride.",
    },
    {
      name: "Tan Suede Jacket",
      sku: "FX-JAC-001",
      categorySlug: "formal",
      brandSlug: "maison-rare",
      color: "Tan",
      sizes: ["M", "L", "XL"],
      fabric: "Suede",
      occasion: "Casual",
      mrp: 13999,
      sellingPrice: 10499,
      stock: 8,
      image: "product_jacket_tan.jpg",
      description: "A supple tan suede jacket with a relaxed cut, layered easily over shirts or knitwear.",
    },
    {
      name: "Black Velvet Evening Gown",
      sku: "FX-GOW-001",
      categorySlug: "evening-party",
      brandSlug: "le-noir-studio",
      color: "Black",
      sizes: ["XS", "S", "M", "L"],
      fabric: "Velvet",
      occasion: "Party",
      mrp: 18999,
      sellingPrice: 14499,
      stock: 5,
      image: "product_gown_black.jpg",
      description: "A sculpted black velvet gown with a fitted bodice and dramatic floor-length skirt.",
    },
    {
      name: "Ivory Cotton Kurta with Gold Trim",
      sku: "FX-KUR-002",
      categorySlug: "mens-ethnic",
      brandSlug: "maison-rare",
      color: "Ivory",
      sizes: ["S", "M", "L", "XL"],
      fabric: "Cotton",
      occasion: "Festive",
      mrp: 5999,
      sellingPrice: 4299,
      stock: 17,
      image: "product_kurta_white.jpg",
      description: "A crisp ivory cotton kurta finished with subtle gold trim detailing at the collar and cuffs.",
    },
    {
      name: "Royal Blue Chiffon Saree",
      sku: "FX-SAR-002",
      categorySlug: "womens-ethnic",
      brandSlug: "amaya-couture",
      color: "Royal Blue",
      sizes: ["Free Size"],
      fabric: "Chiffon",
      occasion: "Festive",
      mrp: 9999,
      sellingPrice: 7499,
      stock: 12,
      image: "product_saree_blue.jpg",
      description: "A lightweight royal blue chiffon saree with a silver zari border, easy to drape and wear.",
    },
    {
      name: "Deep Red Cocktail Dress",
      sku: "FX-DRE-002",
      categorySlug: "evening-party",
      brandSlug: "le-noir-studio",
      color: "Red",
      sizes: ["XS", "S", "M", "L"],
      fabric: "Crepe",
      occasion: "Party",
      mrp: 8999,
      sellingPrice: 6999,
      stock: 10,
      image: "product_dress_red.jpg",
      description: "A knee-length deep red crepe dress with a fitted waist, made for evenings out.",
    },
    {
      name: "Ivory & Gold Wedding Sherwani",
      sku: "FX-SHE-001",
      categorySlug: "wedding",
      brandSlug: "maison-rare",
      color: "Ivory",
      sizes: ["S", "M", "L", "XL"],
      fabric: "Silk Blend",
      occasion: "Wedding",
      mrp: 28999,
      sellingPrice: 22999,
      stock: 3,
      image: "product_sherwani_gold.jpg",
      description: "An heirloom-inspired ivory and gold sherwani, hand-embroidered for the groom's big day.",
    },
  ];

  for (const p of productDefs) {
    const [existing] = await db.select().from(productsTable).where(eq(productsTable.sku, p.sku));
    if (existing) continue;
    await db.insert(productsTable).values({
      name: p.name,
      description: p.description,
      sku: p.sku,
      categoryId: categories[p.categorySlug]!,
      brandId: brands[p.brandSlug]!,
      color: p.color,
      sizes: p.sizes,
      fabric: p.fabric,
      occasion: p.occasion,
      mrp: p.mrp.toString(),
      sellingPrice: p.sellingPrice.toString(),
      purchaseCost: Math.round(p.sellingPrice * 0.6).toString(),
      supplier: "In-house Atelier",
      stock: p.stock,
      warehouse: "Mumbai Central",
      rack: `R-${Math.ceil(Math.random() * 20)}`,
      images: [`/products/${p.image}`],
      rating: (4 + Math.random()).toFixed(2),
    });
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@fashionxpress.in / admin123");
  console.log("Executive login: priya@fashionxpress.in / exec123");
  console.log("Customer login: customer@example.com / customer123");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
