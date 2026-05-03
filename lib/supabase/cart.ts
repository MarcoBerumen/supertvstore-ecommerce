import "server-only";

import { createClient } from "./server";

export type CartItem = {
  id: string;
  productId: number;
  statusId: number;
  gradeId: number;
  warrantyId: number | null;
  quantity: number;
  addedAt: string;
  updatedAt: string;
};

type CartItemRow = {
  id: string;
  user_id: string;
  product_id: number;
  status_id: number;
  grade_id: number;
  warranty_id: number | null;
  quantity: number;
  added_at: string;
  updated_at: string;
};

function toCartItem(row: CartItemRow): CartItem {
  return {
    id: row.id,
    productId: row.product_id,
    statusId: row.status_id,
    gradeId: row.grade_id,
    warrantyId: row.warranty_id,
    quantity: row.quantity,
    addedAt: row.added_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Ensures the visitor has a Supabase session (anonymous or registered).
 * If no session exists, performs anonymous sign-in. Idempotent.
 * Returns the resolved user_id, or null if the auth call itself fails
 * (in which case callers should treat the cart as unavailable).
 */
export async function ensureCartSession(): Promise<string | null> {
  const supabase = await createClient();

  const { data: existing } = await supabase.auth.getUser();
  if (existing.user) {
    return existing.user.id;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    return null;
  }
  return data.user.id;
}

/**
 * Add (or merge into existing) a cart item for the current user.
 * If a row with the same (productId, statusId, gradeId, warrantyId)
 * already exists, increments quantity by `quantity` instead of inserting.
 * Returns the resulting row.
 */
export async function addCartItem(input: {
  productId: number;
  statusId: number;
  gradeId: number;
  warrantyId: number | null;
  quantity: number;
}): Promise<CartItem> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("add_cart_item", {
    p_product_id: input.productId,
    p_status_id: input.statusId,
    p_grade_id: input.gradeId,
    p_warranty_id: input.warrantyId,
    p_quantity: input.quantity,
  });

  if (error) throw error;
  if (!data) throw new Error("add_cart_item returned no row");

  return toCartItem(data as CartItemRow);
}

/** All cart items for the current user, ordered by added_at desc. */
export async function getCartItems(): Promise<CartItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .select("*")
    .order("added_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toCartItem(row as CartItemRow));
}

/**
 * Total quantity across all cart items for the current user (for the nav badge).
 * Returns 0 if no session yet (does NOT call ensureCartSession — caller decides
 * whether they want to force session creation just to render a badge).
 */
export async function getCartItemCount(): Promise<number> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 0;

  const { data, error } = await supabase
    .from("cart_items")
    .select("quantity");

  if (error) throw error;

  return (data ?? []).reduce(
    (sum, row) => sum + ((row as { quantity: number }).quantity ?? 0),
    0,
  );
}

/**
 * Map of "in-cart quantity by variant key" for a single product.
 * Variant key format: `${statusId}:${gradeId}` (warranty intentionally not in the
 * key — the PDP needs to enforce stock-vs-cart limits by status×grade only).
 * Returns {} if no session yet.
 */
export async function getInCartQuantitiesForProduct(
  productId: number,
): Promise<Record<string, number>> {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return {};

  const { data, error } = await supabase
    .from("cart_items")
    .select("status_id, grade_id, quantity")
    .eq("product_id", productId);

  if (error) throw error;

  const result: Record<string, number> = {};
  for (const row of data ?? []) {
    const r = row as Pick<CartItemRow, "status_id" | "grade_id" | "quantity">;
    const key = `${r.status_id}:${r.grade_id}`;
    result[key] = (result[key] ?? 0) + r.quantity;
  }
  return result;
}

/** Update quantity for an existing item. Throws if quantity <= 0 (caller should call removeCartItem). */
export async function updateCartItemQuantity(
  itemId: string,
  quantity: number,
): Promise<CartItem> {
  if (quantity <= 0) {
    throw new Error(
      "updateCartItemQuantity requires quantity > 0; call removeCartItem instead",
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", itemId)
    .select("*")
    .single();

  if (error) throw error;
  return toCartItem(data as CartItemRow);
}

/** Remove a cart item by id. */
export async function removeCartItem(itemId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cart_items")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}
