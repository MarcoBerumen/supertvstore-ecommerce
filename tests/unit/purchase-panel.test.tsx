import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// The purchase panel imports `addToCartAction` (a server action) and `sonner`'s
// toast. Neither is the system under test — we mock both to no-ops so the unit
// test focuses on the client-side state cascade.
vi.mock("@/app/product/actions", () => ({
  addToCartAction: vi.fn(async () => ({ ok: true, item: {} })),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

import { PurchasePanel } from "@/components/product/purchase-panel";
import { CartProvider } from "@/components/cart-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import type {
  ProductVariant,
  Warranty,
} from "@/lib/mariadb/queries/product";

// Factories — keep tests readable. Rebuild on every call so individual tests
// can mutate without leaking into the next.
function makeVariant(overrides: Partial<ProductVariant> = {}): ProductVariant {
  const statusId = overrides.statusId ?? 1;
  const gradeId = overrides.gradeId ?? 1;
  return {
    statusId,
    gradeId,
    statusName: overrides.statusName ?? "New",
    gradeName: overrides.gradeName ?? "A",
    price: overrides.price ?? 1000,
    stockQty: overrides.stockQty ?? 5,
    ...overrides,
    // Always derive `key` from the resolved status/grade so an explicit
    // `statusId` override doesn't desync key from id.
    key: `${statusId}:${gradeId}`,
  };
}

const NO_WARRANTY: Warranty = { id: null, name: "No warranty", days: 0, price: 0 };
const FREE_STD: Warranty = { id: 1, name: "Standard Warranty", days: 90, price: 0 };
const PAID_2YR: Warranty = { id: 11, name: "2 Year Carry-In", days: 730, price: 100 };

function renderPanel(props: {
  variants: ProductVariant[];
  warrantiesByVariantKey: Record<string, Warranty[]>;
  initialInCartByVariant?: Record<string, number>;
}) {
  return render(
    <TooltipProvider>
      <CartProvider initialCount={0}>
        <PurchasePanel
          productId={123}
          productName="Test Product"
          variants={props.variants}
          initialInCartByVariant={props.initialInCartByVariant ?? {}}
          warrantiesByVariantKey={props.warrantiesByVariantKey}
        />
      </CartProvider>
    </TooltipProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

// The price block and the total block both render dollar amounts. We grab
// the price by its larger-text class so tests that check "the price" don't
// double-match the total.
function priceText(): string {
  const node = document.querySelector(".text-3xl");
  return (node?.textContent ?? "").trim();
}

describe("<PurchasePanel> initial render", () => {
  it("selects the first available variant by default", () => {
    const v1 = makeVariant({ statusId: 1, gradeId: 1, price: 1000, statusName: "New" });
    const v2 = makeVariant({ statusId: 2, gradeId: 1, price: 700, statusName: "Open Box", gradeName: "X" });
    renderPanel({
      variants: [v1, v2],
      warrantiesByVariantKey: {
        [v1.key]: [NO_WARRANTY],
        [v2.key]: [NO_WARRANTY],
      },
    });
    expect(priceText()).toBe("$1,000");
  });

  it("falls through to the next variant when the first is fully reserved in cart", () => {
    const v1 = makeVariant({ statusId: 1, gradeId: 1, price: 1000, stockQty: 2 });
    const v2 = makeVariant({ statusId: 2, gradeId: 1, price: 700, statusName: "Open Box", gradeName: "X" });
    renderPanel({
      variants: [v1, v2],
      warrantiesByVariantKey: {
        [v1.key]: [NO_WARRANTY],
        [v2.key]: [NO_WARRANTY],
      },
      initialInCartByVariant: { [v1.key]: 2 },
    });
    expect(priceText()).toBe("$700");
  });
});

describe("<PurchasePanel> condition chips", () => {
  it("hides the chips fieldset when there's only a single variant", () => {
    const only = makeVariant({ statusId: 1, gradeId: 1, price: 1000 });
    renderPanel({
      variants: [only],
      warrantiesByVariantKey: { [only.key]: [NO_WARRANTY] },
    });
    expect(screen.queryByRole("radiogroup")).not.toBeInTheDocument();
  });

  it("updates the displayed price when a different chip is selected", async () => {
    const user = userEvent.setup();
    const v1 = makeVariant({ statusId: 1, gradeId: 1, price: 1000, statusName: "New" });
    const v2 = makeVariant({ statusId: 2, gradeId: 1, price: 700, statusName: "Open Box", gradeName: "X" });
    renderPanel({
      variants: [v1, v2],
      warrantiesByVariantKey: {
        [v1.key]: [NO_WARRANTY],
        [v2.key]: [NO_WARRANTY],
      },
    });
    expect(priceText()).toBe("$1,000");
    const openBoxChip = screen.getByRole("radio", { name: /Open Box/i });
    await user.click(openBoxChip);
    expect(priceText()).toBe("$700");
  });

  it("re-clamps quantity when the new variant has less remaining stock", async () => {
    const user = userEvent.setup();
    const v1 = makeVariant({ statusId: 1, gradeId: 1, price: 1000, stockQty: 10, statusName: "New" });
    const v2 = makeVariant({ statusId: 2, gradeId: 1, price: 700, stockQty: 1, statusName: "Open Box", gradeName: "X" });
    renderPanel({
      variants: [v1, v2],
      warrantiesByVariantKey: {
        [v1.key]: [NO_WARRANTY],
        [v2.key]: [NO_WARRANTY],
      },
    });
    const plus = screen.getByRole("button", { name: /Increase quantity/i });
    // The quantity value is inside the stepper's role="group" wrapper. We
    // scope the query to that group so we don't pick up the total's aria-live
    // node (which also lives inside an aria-live polite region).
    const qtyValue = () => {
      const group = document.querySelector('[role="group"]');
      return group?.querySelector("[aria-live='polite']")?.textContent;
    };

    await user.click(plus);
    await user.click(plus);
    expect(qtyValue()).toBe("3");

    const openBoxChip = screen.getByRole("radio", { name: /Open Box/i });
    await user.click(openBoxChip);
    expect(qtyValue()).toBe("1");
  });
});

describe("<PurchasePanel> quantity stepper", () => {
  it("disables `+` once quantity reaches stockQty - inCart", async () => {
    const user = userEvent.setup();
    const v = makeVariant({ statusId: 1, gradeId: 1, stockQty: 3 });
    renderPanel({
      variants: [v],
      warrantiesByVariantKey: { [v.key]: [NO_WARRANTY] },
    });
    const plus = screen.getByRole("button", { name: /Increase quantity/i });
    expect(plus).not.toBeDisabled();
    await user.click(plus);
    await user.click(plus);
    // Quantity is now 3, equal to stockQty → button disables.
    expect(plus).toBeDisabled();
    // Clicking again does nothing.
    await user.click(plus);
    expect(plus).toBeDisabled();
  });

  it("disables `−` at quantity 1", async () => {
    const user = userEvent.setup();
    const v = makeVariant({ statusId: 1, gradeId: 1, stockQty: 3 });
    renderPanel({
      variants: [v],
      warrantiesByVariantKey: { [v.key]: [NO_WARRANTY] },
    });
    const minus = screen.getByRole("button", { name: /Decrease quantity/i });
    expect(minus).toBeDisabled();
  });
});

describe("<PurchasePanel> warranty cascade", () => {
  it("adds warranty.price to the total when a paid warranty is selected", async () => {
    const user = userEvent.setup();
    const v = makeVariant({ statusId: 1, gradeId: 1, price: 1000, stockQty: 5 });
    renderPanel({
      variants: [v],
      warrantiesByVariantKey: { [v.key]: [NO_WARRANTY, FREE_STD, PAID_2YR] },
    });
    // The total node is the price-style aria-live element. Read it directly.
    const totalText = () =>
      document.querySelector(".text-2xl[aria-live='polite']")?.textContent?.trim();

    // Default is the first $0 warranty → total = price * 1 + 0 = $1,000.
    expect(totalText()).toBe("$1,000");

    // Pick the paid 2-year — total should become 1000 + 100 = $1,100.
    const paid = screen.getByLabelText(/2 Year Carry-In/i);
    await user.click(paid);
    expect(totalText()).toBe("$1,100");
  });

  it("hides the warranty section when only the synthetic 'No warranty' is eligible", () => {
    const v = makeVariant({ statusId: 1, gradeId: 1, price: 1000, stockQty: 5 });
    renderPanel({
      variants: [v],
      warrantiesByVariantKey: { [v.key]: [NO_WARRANTY] },
    });
    // No "Protection" legend should be visible.
    expect(screen.queryByText(/Protection/i)).not.toBeInTheDocument();
  });
});

describe("<PurchasePanel> stock states", () => {
  it("renders the 'Out of stock' CTA when every variant is unavailable", () => {
    const v1 = makeVariant({ statusId: 1, gradeId: 1, stockQty: 0 });
    const v2 = makeVariant({ statusId: 2, gradeId: 1, stockQty: 0, statusName: "Open Box", gradeName: "X" });
    renderPanel({
      variants: [v1, v2],
      warrantiesByVariantKey: {
        [v1.key]: [NO_WARRANTY],
        [v2.key]: [NO_WARRANTY],
      },
    });
    // The CTA region says "Out of stock" and the button is disabled.
    const cta = screen.getByRole("button", { name: /Out of stock/i });
    expect(cta).toBeDisabled();
    // Quantity stepper should be hidden.
    expect(screen.queryByLabelText(/Quantity/i)).not.toBeInTheDocument();
  });
});
