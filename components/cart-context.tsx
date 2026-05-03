"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type ProductMap = Record<string, number>; // `${statusId}:${gradeId}` → qty

interface CartContextValue {
  count: number;
  bumpKey: number;
  bump(): void;
  setCount(n: number): void;
  setProductInCart(productId: number, byVariant: ProductMap): void;
  getProductInCart(productId: number): ProductMap;
  /** Optimistic increment. Returns a rollback fn. */
  optimisticAdd(opts: {
    productId: number;
    variantKey: string;
    quantity: number;
  }): () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  initialCount,
  children,
}: {
  initialCount: number;
  children: ReactNode;
}) {
  const [count, setCount] = useState(initialCount);
  const [bumpKey, setBumpKey] = useState(0);
  const productsRef = useRef<Map<number, ProductMap>>(new Map());
  // Force a re-render when product maps change by bumping a tick.
  const [, setTick] = useState(0);

  const bump = useCallback(() => setBumpKey((k) => k + 1), []);

  const setProductInCart = useCallback(
    (productId: number, byVariant: ProductMap) => {
      productsRef.current.set(productId, { ...byVariant });
      setTick((t) => t + 1);
    },
    [],
  );

  const getProductInCart = useCallback((productId: number) => {
    return productsRef.current.get(productId) ?? {};
  }, []);

  const optimisticAdd = useCallback(
    ({
      productId,
      variantKey,
      quantity,
    }: {
      productId: number;
      variantKey: string;
      quantity: number;
    }) => {
      const prevMap = productsRef.current.get(productId);
      const prevQty = prevMap?.[variantKey] ?? 0;
      const nextMap: ProductMap = { ...(prevMap ?? {}), [variantKey]: prevQty + quantity };
      productsRef.current.set(productId, nextMap);
      setCount((c) => c + quantity);
      setTick((t) => t + 1);

      return () => {
        const cur = productsRef.current.get(productId) ?? {};
        const restored: ProductMap = { ...cur };
        const after = (restored[variantKey] ?? 0) - quantity;
        if (after <= 0) delete restored[variantKey];
        else restored[variantKey] = after;
        productsRef.current.set(productId, restored);
        setCount((c) => Math.max(0, c - quantity));
        setTick((t) => t + 1);
      };
    },
    [],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      count,
      bumpKey,
      bump,
      setCount,
      setProductInCart,
      getProductInCart,
      optimisticAdd,
    }),
    [count, bumpKey, bump, setProductInCart, getProductInCart, optimisticAdd],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/**
 * Hydrates the in-cart map for a single product into the global CartContext on mount.
 * Lets server-rendered PDPs feed the client cache without extra round trips.
 */
export function CartHydrator({
  productId,
  byVariant,
}: {
  productId: number;
  byVariant: Record<string, number>;
}) {
  const { setProductInCart } = useCart();
  // Run-once on mount; product id never changes for a given page.
  useEffect(() => {
    setProductInCart(productId, byVariant);
  }, [productId, byVariant, setProductInCart]);
  return null;
}
