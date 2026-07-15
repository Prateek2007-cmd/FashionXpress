import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  usersTable,
  customersTable,
  addressesTable,
  measurementsTable,
} from "@workspace/db";
import {
  GetMyCustomerProfileResponse,
  UpdateMyCustomerProfileBody,
  UpdateMyCustomerProfileResponse,
  ListMyAddressesResponse,
  CreateMyAddressBody,
  CreateMyAddressResponse,
  UpdateMyAddressBody,
  UpdateMyAddressResponse,
  GetMyMeasurementsResponse,
  SetMyMeasurementsBody,
  SetMyMeasurementsResponse,
} from "@workspace/api-zod";
import { requireAuth, type AuthedRequest } from "../middlewares/auth";
import { toNullableNum } from "../lib/mappers";

const router: IRouter = Router();

async function getOrCreateCustomer(userId: number) {
  const [existing] = await db
    .select()
    .from(customersTable)
    .where(eq(customersTable.userId, userId));
  if (existing) return existing;
  const [created] = await db
    .insert(customersTable)
    .values({ userId })
    .returning();
  return created!;
}

router.get(
  "/customers/me",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.auth!.userId));

    res.json(
      GetMyCustomerProfileResponse.parse({
        id: customer.id,
        userId: customer.userId,
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? null,
        favoriteColors: customer.favoriteColors,
        favoriteBrands: customer.favoriteBrands,
        lifetimeSpend: parseFloat(customer.lifetimeSpend),
        createdAt: customer.createdAt,
      }),
    );
  },
);

router.patch(
  "/customers/me",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const parsed = UpdateMyCustomerProfileBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const { name, phone, favoriteColors, favoriteBrands } = parsed.data;

    if (name !== undefined || phone !== undefined) {
      await db
        .update(usersTable)
        .set({
          ...(name !== undefined ? { name } : {}),
          ...(phone !== undefined ? { phone } : {}),
        })
        .where(eq(usersTable.id, req.auth!.userId));
    }

    const [updatedCustomer] = await db
      .update(customersTable)
      .set({
        ...(favoriteColors !== undefined ? { favoriteColors } : {}),
        ...(favoriteBrands !== undefined ? { favoriteBrands } : {}),
      })
      .where(eq(customersTable.id, customer.id))
      .returning();

    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, req.auth!.userId));

    res.json(
      UpdateMyCustomerProfileResponse.parse({
        id: updatedCustomer!.id,
        userId: updatedCustomer!.userId,
        name: user?.name ?? "",
        email: user?.email ?? "",
        phone: user?.phone ?? null,
        favoriteColors: updatedCustomer!.favoriteColors,
        favoriteBrands: updatedCustomer!.favoriteBrands,
        lifetimeSpend: parseFloat(updatedCustomer!.lifetimeSpend),
        createdAt: updatedCustomer!.createdAt,
      }),
    );
  },
);

function mapAddress(a: typeof addressesTable.$inferSelect) {
  return {
    id: a.id,
    customerId: a.customerId,
    label: a.label,
    line1: a.line1,
    line2: a.line2,
    city: a.city,
    state: a.state,
    pincode: a.pincode,
    landmark: a.landmark,
    lat: toNullableNum(a.lat),
    lng: toNullableNum(a.lng),
    isDefault: a.isDefault === "true",
  };
}

router.get(
  "/customers/me/addresses",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const addresses = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.customerId, customer.id));
    res.json(ListMyAddressesResponse.parse(addresses.map(mapAddress)));
  },
);

router.post(
  "/customers/me/addresses",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const parsed = CreateMyAddressBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const { isDefault, lat, lng, ...rest } = parsed.data;
    const [address] = await db
      .insert(addressesTable)
      .values({
        ...rest,
        customerId: customer.id,
        isDefault: isDefault ? "true" : "false",
        lat: lat?.toString(),
        lng: lng?.toString(),
      })
      .returning();
    res.status(201).json(CreateMyAddressResponse.parse(mapAddress(address!)));
  },
);

router.patch(
  "/customers/me/addresses/:id",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const parsed = UpdateMyAddressBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const [existing] = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.id, id));
    if (!existing || existing.customerId !== customer.id) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    const { isDefault, lat, lng, ...rest } = parsed.data;
    const [address] = await db
      .update(addressesTable)
      .set({
        ...rest,
        ...(isDefault !== undefined ? { isDefault: isDefault ? "true" : "false" } : {}),
        ...(lat !== undefined ? { lat: lat?.toString() ?? null } : {}),
        ...(lng !== undefined ? { lng: lng?.toString() ?? null } : {}),
      })
      .where(eq(addressesTable.id, id))
      .returning();

    res.json(UpdateMyAddressResponse.parse(mapAddress(address!)));
  },
);

router.delete(
  "/customers/me/addresses/:id",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const id = parseInt(
      Array.isArray(req.params.id) ? req.params.id[0]! : req.params.id!,
      10,
    );
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const [existing] = await db
      .select()
      .from(addressesTable)
      .where(eq(addressesTable.id, id));

    if (!existing || existing.customerId !== customer.id) {
      res.status(404).json({ error: "Address not found" });
      return;
    }

    await db.delete(addressesTable).where(eq(addressesTable.id, id));
    res.sendStatus(204);
  },
);

function mapMeasurement(m: typeof measurementsTable.$inferSelect) {
  return {
    id: m.id,
    customerId: m.customerId,
    gender: m.gender,
    age: m.age,
    heightCm: toNullableNum(m.heightCm),
    weightKg: toNullableNum(m.weightKg),
    topSize: m.topSize,
    bottomSize: m.bottomSize,
    preferredFit: m.preferredFit,
  };
}

router.get(
  "/customers/me/measurements",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const [measurement] = await db
      .select()
      .from(measurementsTable)
      .where(eq(measurementsTable.customerId, customer.id));

    if (!measurement) {
      res.status(404).json({ error: "Measurements not set yet" });
      return;
    }
    res.json(GetMyMeasurementsResponse.parse(mapMeasurement(measurement)));
  },
);

router.put(
  "/customers/me/measurements",
  requireAuth(),
  async (req: AuthedRequest, res): Promise<void> => {
    const parsed = SetMyMeasurementsBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const customer = await getOrCreateCustomer(req.auth!.userId);
    const [existing] = await db
      .select()
      .from(measurementsTable)
      .where(eq(measurementsTable.customerId, customer.id));

    const { heightCm, weightKg, ...restMeasurement } = parsed.data;
    const measurementValues = {
      ...restMeasurement,
      heightCm: heightCm?.toString(),
      weightKg: weightKg?.toString(),
    };

    let measurement: typeof measurementsTable.$inferSelect | undefined;
    if (existing) {
      [measurement] = await db
        .update(measurementsTable)
        .set(measurementValues)
        .where(eq(measurementsTable.id, existing.id))
        .returning();
    } else {
      [measurement] = await db
        .insert(measurementsTable)
        .values({ ...measurementValues, customerId: customer.id })
        .returning();
    }

    res.json(SetMyMeasurementsResponse.parse(mapMeasurement(measurement!)));
  },
);

export default router;
export { getOrCreateCustomer };

// ── Admin: list all customers ───────────────────────────────────────────────
import { requireAuth as _requireAuth } from "../middlewares/auth";

router.get(
  "/admin/customers",
  _requireAuth("admin"),
  async (_req, res): Promise<void> => {
    const rows = await db
      .select({
        customer: customersTable,
        user: usersTable,
      })
      .from(customersTable)
      .innerJoin(usersTable, eq(customersTable.userId, usersTable.id));

    res.json(
      rows.map(({ customer, user }) => ({
        id: customer.id,
        userId: customer.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        lifetimeSpend: parseFloat(customer.lifetimeSpend),
        createdAt: customer.createdAt,
      })),
    );
  },
);
