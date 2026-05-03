import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  it,
  expect,
} from "vitest";
import { addToCartAction } from "@/app/product/actions";
import { ensureCartSession, getCartItems } from "@/lib/supabase/cart";
import { __resetCookies } from "@/tests/integration/__mocks__/next-headers";
import {
  deleteAnonUser,
  isSupabaseAvailable,
} from "@/tests/setup/supabase-admin";

// End-to-end of the server action: action → cart helpers → Supabase RPC.
// We exercise the action directly (no React render context required because it's
// an async function with `"use server"` — the directive is only meaningful to
// the bundler, not the runtime).

const PRODUCT_ID = 999_002;
const STATUS_NEW = 1;
const GRADE_A = 1;

const createdUserIds = new Set<string>();
let SUPABASE_OK = false;

beforeAll(async () => {
  SUPABASE_OK = await isSupabaseAvailable();
});

afterAll(async () => {
  for (const id of createdUserIds) {
    await deleteAnonUser(id);
  }
});

beforeEach(() => {
  __resetCookies();
});
afterEach(() => {
  __resetCookies();
});

describe("addToCartAction", () => {
  it("returns { ok: true, item } and persists the row on success", async () => {
    if (!SUPABASE_OK) return;
    const res = await addToCartAction({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });

    // Track the just-created anon user for cleanup BEFORE asserting so a
    // failure here doesn't leak it.
    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.item.productId).toBe(PRODUCT_ID);
      expect(res.item.quantity).toBe(1);
    }

    const items = await getCartItems();
    const matching = items.filter(
      (i) =>
        i.productId === PRODUCT_ID &&
        i.statusId === STATUS_NEW &&
        i.gradeId === GRADE_A,
    );
    expect(matching).toHaveLength(1);
  });

  it("two consecutive adds with the same input increment quantity to 2", async () => {
    if (!SUPABASE_OK) return;
    const first = await addToCartAction({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });
    const second = await addToCartAction({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });

    const userId = await ensureCartSession();
    if (userId) createdUserIds.add(userId);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.item.quantity).toBe(2);
  });

  it("returns { ok: false } for invalid input (quantity = 0) without throwing", async () => {
    // No Supabase needed for this branch — input validation rejects up front.
    const res = await addToCartAction({
      productId: PRODUCT_ID,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 0,
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(typeof res.error).toBe("string");
  });

  it("returns { ok: false } for non-finite numeric input without throwing", async () => {
    const res = await addToCartAction({
      productId: Number.NaN,
      statusId: STATUS_NEW,
      gradeId: GRADE_A,
      warrantyId: null,
      quantity: 1,
    });
    expect(res.ok).toBe(false);
  });
});
