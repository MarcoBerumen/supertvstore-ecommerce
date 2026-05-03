import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  expect,
} from "vitest";
import {
  ensureCartSession,
  addCartItem,
  getCartItems,
  getCartItemCount,
  getInCartQuantitiesForProduct,
} from "@/lib/supabase/cart";
// The shim is what makes these helpers callable from Node — see
// vitest.config.ts and tests/integration/__mocks__/next-headers.ts. We pull
// `__resetCookies` directly from the shim file (not from "next/headers")
// because the test-only helper isn't part of the real Next.js types.
import { __resetCookies } from "@/tests/integration/__mocks__/next-headers";
import {
  deleteAnonUser,
  isSupabaseAvailable,
} from "@/tests/setup/supabase-admin";

// All anonymous users created by this file get tracked here so we can wipe
// them in afterAll even if a test fails partway through.
const createdUserIds = new Set<string>();

let SUPABASE_OK = false;

beforeAll(async () => {
  SUPABASE_OK = await isSupabaseAvailable();
});

afterAll(async () => {
  // Clean up every anon user we created, regardless of which describe block
  // they came from. Best-effort — deleteAnonUser swallows individual failures.
  for (const id of createdUserIds) {
    await deleteAnonUser(id);
  }
});

// Each test starts with a clean cookie jar so it gets its own anon session.
// Tests are responsible for adding any user ids they create to `createdUserIds`
// so afterAll can wipe them.
beforeEach(() => {
  __resetCookies();
});

afterEach(() => {
  __resetCookies();
});

// Sentinel ids — these never get inserted into the catalog DB. The cart_items
// table has no FK to the catalog, so writes succeed even with synthetic ids.
const PRODUCT_ID = 999_001;
const STATUS_NEW = 1;
const GRADE_A = 1;
const GRADE_B = 2;
const WARRANTY_ID = 11;

describe("ensureCartSession", () => {
  it("creates an anon user on first call and returns its uuid", async () => {
    if (!SUPABASE_OK) return;
    const id = await ensureCartSession();
    expect(id).not.toBeNull();
    expect(id).toMatch(/^[0-9a-f-]{36}$/i);
    if (id) createdUserIds.add(id);
  });

  it("returns the same uuid on subsequent calls (idempotent)", async () => {
    if (!SUPABASE_OK) return;
    const a = await ensureCartSession();
    const b = await ensureCartSession();
    expect(a).not.toBeNull();
    expect(a).toBe(b);
    if (a) createdUserIds.add(a);
  });
});

describe("addCartItem", () => {
  it("inserts a new row with the requested quantity on first add", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    const item = await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: WARRANTY_ID,
      quantity: 1,
    });
    expect(item.productId).toBe(PRODUCT_ID);
    expect(item.statusId).toBe(STATUS_NEW);
    expect(item.gradeId).toBe(GRADE_A);
    expect(item.warrantyId).toBe(WARRANTY_ID);
    expect(item.quantity).toBe(1);
  });

  it("increments quantity instead of inserting on a duplicate (productId, statusId, gradeId, warrantyId)", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: WARRANTY_ID,
      quantity: 1,
    });
    const second = await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: WARRANTY_ID,
      quantity: 1,
    });
    expect(second.quantity).toBe(2);

    const items = await getCartItems();
    const matching = items.filter(
      (i) =>
        i.productId === PRODUCT_ID &&
        i.statusId === STATUS_NEW &&
        i.gradeId === GRADE_A &&
        i.warrantyId === WARRANTY_ID,
    );
    expect(matching).toHaveLength(1);
  });

  it("inserts a separate row when only the warrantyId differs", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: WARRANTY_ID,
      quantity: 1,
    });
    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });

    const items = await getCartItems();
    const matching = items.filter(
      (i) => i.productId === PRODUCT_ID && i.statusId === STATUS_NEW && i.gradeId === GRADE_A,
    );
    expect(matching).toHaveLength(2);
  });

  it("treats two warrantyId=null rows as the same key (NULLS NOT DISTINCT) and increments", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });
    const second = await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });
    expect(second.quantity).toBe(2);
  });
});

describe("getInCartQuantitiesForProduct", () => {
  it("returns an empty object when there's no session", async () => {
    if (!SUPABASE_OK) return;
    // No ensureCartSession — should NOT auto-create one.
    const map = await getInCartQuantitiesForProduct(PRODUCT_ID);
    expect(map).toEqual({});
  });

  it("returns an empty object for a product the user has nothing of", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    const map = await getInCartQuantitiesForProduct(PRODUCT_ID);
    expect(map).toEqual({});
  });

  it("returns one entry per (statusId, gradeId) variant", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 2,
    });
    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_B,
      warrantyId: null,
      quantity: 1,
    });

    const map = await getInCartQuantitiesForProduct(PRODUCT_ID);
    expect(map).toEqual({
      [`${STATUS_NEW}:${GRADE_A}`]: 2,
      [`${STATUS_NEW}:${GRADE_B}`]: 1,
    });
  });

  it("sums quantities across rows with the same (statusId, gradeId) but different warrantyId", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: WARRANTY_ID,
      quantity: 1,
    });
    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 3,
    });

    const map = await getInCartQuantitiesForProduct(PRODUCT_ID);
    expect(Object.keys(map)).toEqual([`${STATUS_NEW}:${GRADE_A}`]);
    expect(map[`${STATUS_NEW}:${GRADE_A}`]).toBe(4);
  });
});

describe("getCartItemCount", () => {
  it("returns 0 when there's no session (does NOT create one)", async () => {
    if (!SUPABASE_OK) return;
    const count = await getCartItemCount();
    expect(count).toBe(0);
    // Sanity-check it didn't sneak in a sign-in by checking we still have no
    // items + no session: another call should still be 0.
    const second = await getCartItemCount();
    expect(second).toBe(0);
  });

  it("sums quantities across all rows (not row count)", async () => {
    if (!SUPABASE_OK) return;
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 3,
    });
    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_B,
      warrantyId: null,
      quantity: 2,
    });

    const count = await getCartItemCount();
    expect(count).toBe(5);
  });
});

describe("RLS isolation between users", () => {
  it("a user cannot see another user's cart rows", async () => {
    if (!SUPABASE_OK) return;

    // User A
    __resetCookies();
    const userA = await ensureCartSession();
    expect(userA).not.toBeNull();
    if (userA) createdUserIds.add(userA);
    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });
    const aItems = await getCartItems();
    expect(aItems).toHaveLength(1);

    // Switch to User B (fresh cookie jar → fresh anon session).
    __resetCookies();
    const userB = await ensureCartSession();
    expect(userB).not.toBeNull();
    expect(userB).not.toBe(userA);
    if (userB) createdUserIds.add(userB);

    const bItemsBefore = await getCartItems();
    expect(
      bItemsBefore,
      "user B should not see user A's row",
    ).toHaveLength(0);

    await addCartItem({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_B,
      warrantyId: null,
      quantity: 4,
    });
    const bItemsAfter = await getCartItems();
    expect(bItemsAfter).toHaveLength(1);
    expect(bItemsAfter[0].quantity).toBe(4);
  });
});
