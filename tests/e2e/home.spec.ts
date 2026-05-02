import { test, expect } from "@playwright/test";

test.describe("home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the expected metadata title", async ({ page }) => {
    await expect(page).toHaveTitle(/Super TV Store/);
  });

  test("renders all eight major sections", async ({ page }) => {
    // 1. Header / primary nav.
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("navigation", { name: /primary/i })).toBeVisible();

    // 2. Hero headline.
    await expect(
      page.getByRole("heading", { level: 1, name: /Houston/i }),
    ).toBeVisible();

    // 3. Shop by category.
    await expect(
      page.getByRole("heading", { name: /Shop by category/i }),
    ).toBeVisible();

    // 4. Top brands.
    await expect(
      page.getByRole("heading", { name: /Top brands/i }),
    ).toBeVisible();

    // 5. New arrivals rail.
    await expect(
      page.getByRole("heading", { name: /New arrivals/i }),
    ).toBeVisible();

    // 6. Featured TVs rail.
    await expect(
      page.getByRole("heading", { name: /Featured TVs/i }),
    ).toBeVisible();

    // 7. Shop by price.
    await expect(
      page.getByRole("heading", { name: /Shop by price/i }),
    ).toBeVisible();

    // 8. Footer.
    await expect(page.getByRole("contentinfo")).toBeVisible();
  });

  test("category tiles are real anchors that update the URL hash", async ({
    page,
  }) => {
    const grid = page
      .getByRole("region", { name: /shop by category/i })
      .or(
        page
          .getByRole("heading", { name: /Shop by category/i })
          .locator(".."),
      );
    // Grab the first link inside the grid section.
    const firstTile = page
      .locator("section")
      .filter({
        has: page.getByRole("heading", { name: /Shop by category/i }),
      })
      .getByRole("link")
      .first();

    await expect(firstTile).toBeVisible();
    const href = await firstTile.getAttribute("href");
    expect(href).toMatch(/^#category-/);

    await firstTile.click();
    await expect(page).toHaveURL(/#category-/);

    // Reference `grid` so eslint doesn't complain about the helper above.
    expect(await grid.count()).toBeGreaterThan(0);
  });

  test("horizontal rail responds to End key", async ({ page }) => {
    // Wait for hydration — without this the client-side onKeyDown handler
    // hasn't been attached yet and the keypress is a no-op.
    await page.waitForLoadState("networkidle");

    const rail = page.getByRole("region", { name: /New arrivals.*scrollable/i });
    await expect(rail).toBeVisible();

    const overflows = await rail.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 1,
    );
    test.skip(!overflows, "rail content does not overflow at this viewport");

    // Sanity-check that the scrollLeft starts at 0.
    const startingLeft = await rail.evaluate((el) => el.scrollLeft);
    expect(startingLeft).toBe(0);

    await rail.focus();
    await page.keyboard.press("End");

    // scroll-behavior is smooth and snap can shift the final resting position
    // slightly off the literal right edge, so we assert "scrolled far to the
    // right" rather than "parked exactly at scrollWidth - clientWidth".
    await expect
      .poll(
        async () =>
          rail.evaluate((el) => el.scrollLeft > el.clientWidth),
        { timeout: 5_000 },
      )
      .toBe(true);
  });
});
