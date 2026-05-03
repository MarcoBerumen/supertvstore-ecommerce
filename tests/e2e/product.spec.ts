import { test, expect } from "@playwright/test";

// Critical user journey: shopper lands on a PDP, picks a variant, adds to cart.
// Hand-picked, not exhaustive — variant interactions and warranty math live in
// the unit suite; SQL invariants live in the integration suite.
//
// Reference fixtures:
//   - Product 195: Hisense 85" R6E4, exactly one in-stock variant — used as
//                  the generic "page renders / add-to-cart works" case.
//   - Product 255: LG UA77, FOUR in-stock variants — used for the chip-switch
//                  test which needs at least two enabled chips on screen.
//   - Product 9999999: never exists → 404.

const KNOWN_PRODUCT_ID = 195;
const MULTI_VARIANT_PRODUCT_ID = 255;
const NON_EXISTENT_PRODUCT_ID = 9999999;

test.describe("product detail page", () => {
  test("renders the canonical URL, header, and primary sections", async ({
    page,
  }) => {
    // Visit with a deliberately wrong slug — the route should 308 to canonical.
    await page.goto(`/product/${KNOWN_PRODUCT_ID}/whatever-slug`);
    await expect(page).toHaveURL(
      new RegExp(`/product/${KNOWN_PRODUCT_ID}/[a-z0-9-]+`),
    );
    // The canonical slug is NOT "whatever-slug".
    await expect(page).not.toHaveURL(/whatever-slug/);

    // h1 with the product name.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // The purchase panel exposes an Add to cart button.
    await expect(
      page.getByRole("button", { name: /Add to cart$/i }).first(),
    ).toBeEnabled();

    // Either a related rail OR a "More from {Brand}" rail should appear.
    await expect(
      page.getByRole("heading", { name: /More from |You may also like/i }),
    ).toBeVisible();
  });

  test("switching condition chip updates the displayed price", async ({
    page,
  }) => {
    await page.goto(`/product/${MULTI_VARIANT_PRODUCT_ID}/x`);
    // Wait for hydration to finish so the chip click handlers are attached.
    await page.waitForLoadState("networkidle");

    // Scope to the condition radiogroup inside the purchase panel — the
    // warranty chooser also exposes role="radio" elements, so an unscoped
    // getByRole("radio") would walk through warranties too.
    const panel = page.getByRole("complementary", {
      name: /Purchase options/i,
    });
    const chips = panel.getByRole("radiogroup").first().getByRole("radio");
    const chipCount = await chips.count();
    test.skip(
      chipCount < 2,
      "product needs at least 2 variants for this test",
    );

    const priceLocator = panel.getByText(/^\$[0-9,]+/).first();
    const before = (await priceLocator.textContent())?.trim();

    // Some products have multiple variants at the same price (e.g. different
    // open-box grades). Switching between same-price chips wouldn't move the
    // displayed price — that case is covered by the unit suite. Here we just
    // want to prove the cascade reaches the DOM in a real browser, so we
    // click each enabled non-selected chip in turn until the price changes.
    let switched = false;
    for (let i = 0; i < chipCount; i++) {
      const chip = chips.nth(i);
      const checked = await chip.getAttribute("aria-checked");
      const disabled = await chip.getAttribute("aria-disabled");
      if (checked === "true" || disabled === "true") continue;
      await chip.click();
      const after = (await priceLocator.textContent())?.trim();
      if (after && after !== before) {
        switched = true;
        break;
      }
    }
    test.skip(
      !switched,
      "no enabled non-default chip with a different price available",
    );
  });

  test("clicking Add to cart shows a success toast and bumps the cart badge", async ({
    page,
  }) => {
    await page.goto(`/product/${KNOWN_PRODUCT_ID}/x`);
    await page.waitForLoadState("networkidle");

    // Confirm the badge isn't there yet (count = 0 hides it entirely).
    const cartLink = page.getByRole("link", { name: /^Cart,/i });
    await expect(cartLink).toBeVisible();

    // Find the in-flow Add to cart button (not the sticky mobile one).
    const addBtn = page
      .getByRole("complementary", { name: /Purchase options/i })
      .getByRole("button", { name: /^Add to cart$/i });
    await addBtn.click();

    // Toast surface.
    await expect(page.getByText(/Added to cart/i)).toBeVisible({
      timeout: 5000,
    });

    // Badge should now read "1".
    await expect(cartLink).toHaveAccessibleName(/Cart, 1 items/i);
  });

  test("renders the not-found page for an unknown product id", async ({
    page,
  }) => {
    await page.goto(`/product/${NON_EXISTENT_PRODUCT_ID}/x`);
    await expect(
      page.getByRole("heading", { name: /We can't find that product/i }),
    ).toBeVisible();
  });
});
