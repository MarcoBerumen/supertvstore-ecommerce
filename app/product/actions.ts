"use server";

import { addCartItem, ensureCartSession, type CartItem } from "@/lib/supabase/cart";

export type AddToCartResult =
  | { ok: true; item: CartItem }
  | { ok: false; error: string };

export async function addToCartAction(input: {
  productId: number;
  statusId: number;
  gradeId: number;
  warrantyId: number | null;
  quantity: number;
}): Promise<AddToCartResult> {
  if (
    !Number.isFinite(input.productId) ||
    !Number.isFinite(input.statusId) ||
    !Number.isFinite(input.gradeId) ||
    !Number.isFinite(input.quantity) ||
    input.quantity <= 0
  ) {
    return { ok: false, error: "Invalid input" };
  }

  try {
    const userId = await ensureCartSession();
    if (!userId) {
      return { ok: false, error: "Could not start a cart session" };
    }

    const item = await addCartItem({
      productId: input.productId,
      statusId: input.statusId,
      gradeId: input.gradeId,
      warrantyId: input.warrantyId,
      quantity: input.quantity,
    });

    return { ok: true, item };
  } catch (err) {
    console.error("[addToCartAction] failed", err);
    return { ok: false, error: "Cart write failed" };
  }
}
