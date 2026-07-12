import type { Product, Category, Brand, Booking, BookingProduct, Executive } from "@workspace/db";

export function toNum(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === "number" ? value : parseFloat(value);
}

export function toNullableNum(
  value: string | number | null | undefined,
): number | null {
  if (value === null || value === undefined) return null;
  return typeof value === "number" ? value : parseFloat(value);
}

export function mapProduct(
  p: Product,
  category: Category | undefined,
  brand: Brand | undefined,
) {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    sku: p.sku,
    barcode: p.barcode,
    qrCode: p.qrCode,
    categoryId: p.categoryId,
    categoryName: category?.name ?? "Uncategorized",
    brandId: p.brandId,
    brandName: brand?.name ?? "Unbranded",
    color: p.color,
    sizes: p.sizes,
    fabric: p.fabric,
    occasion: p.occasion,
    mrp: toNum(p.mrp),
    sellingPrice: toNum(p.sellingPrice),
    purchaseCost: toNullableNum(p.purchaseCost),
    supplier: p.supplier,
    stock: p.stock,
    warehouse: p.warehouse,
    rack: p.rack,
    images: p.images,
    rating: toNum(p.rating),
    createdAt: p.createdAt,
  };
}

export function mapBookingProduct(
  bp: BookingProduct,
  product: Product,
  category: Category | undefined,
  brand: Brand | undefined,
) {
  return {
    id: bp.id,
    bookingId: bp.bookingId,
    productId: bp.productId,
    product: mapProduct(product, category, brand),
    status: bp.status,
    priceAtSale: toNullableNum(bp.priceAtSale),
    isRecommended: bp.isRecommended,
  };
}

export function mapBooking(
  b: Booking,
  products: ReturnType<typeof mapBookingProduct>[],
  executive: Executive | undefined,
  executiveName: string | null,
) {
  return {
    id: b.id,
    bookingCode: b.bookingCode,
    customerId: b.customerId,
    name: b.name,
    phone: b.phone,
    email: b.email,
    addressText: b.addressText,
    lat: toNullableNum(b.lat),
    lng: toNullableNum(b.lng),
    gender: b.gender,
    age: b.age,
    heightCm: toNullableNum(b.heightCm),
    weightKg: toNullableNum(b.weightKg),
    topSize: b.topSize,
    bottomSize: b.bottomSize,
    preferredFit: b.preferredFit,
    budget: toNullableNum(b.budget),
    occasion: b.occasion,
    preferredDate: b.preferredDate,
    preferredTime: b.preferredTime,
    preferredColors: b.preferredColors,
    preferredBrands: b.preferredBrands,
    notes: b.notes,
    status: b.status,
    executiveId: b.executiveId,
    executiveName,
    products,
    createdAt: b.createdAt,
  };
}
