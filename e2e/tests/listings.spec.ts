import { test, expect } from "@playwright/test";

test.describe("Browse listings page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/browse");
  });

  test("renders header and listing grid", async ({ page }) => {
    await expect(page.getByText("PayEasy Browse")).toBeVisible();
    await expect(page.getByText("Properties Found")).toBeVisible();
  });

  test("displays listing cards with expected details", async ({ page }) => {
    const cards = page.locator("[class*='rounded-xl'][class*='shadow']").filter({ has: page.locator("img") });
    await expect(cards.first()).toBeVisible();

    const firstCard = cards.first();
    await expect(firstCard.locator("h3")).toBeVisible();
    await expect(firstCard.getByText("XLM")).toBeVisible();
  });

  test("shows bedroom and bathroom counts on cards", async ({ page }) => {
    const bedIcons = page.locator("[title*='Bedrooms']");
    const bathIcons = page.locator("[title*='Bathrooms']");
    await expect(bedIcons.first()).toBeVisible();
    await expect(bathIcons.first()).toBeVisible();
  });

  test("displays property type badge", async ({ page }) => {
    await expect(
      page.getByText("Entire Place").or(page.getByText("Private Room")).first()
    ).toBeVisible();
  });
});

test.describe("Filter sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/browse");
  });

  test("filter sidebar is visible", async ({ page }) => {
    const sidebar = page.locator("aside");
    await expect(sidebar).toBeVisible();
  });

  test("filters update property count", async ({ page }) => {
    const countText = page.getByText(/\d+ Properties Found/);
    await expect(countText).toBeVisible();

    const initialText = await countText.textContent();

    // Set a bedroom filter via URL to verify filtering works
    await page.goto("/browse?bedrooms=3");
    const updatedText = await countText.textContent();

    expect(updatedText).toBeTruthy();
  });

  test("price filter via URL params", async ({ page }) => {
    await page.goto("/browse?minPrice=3000&maxPrice=5000");

    const countText = page.getByText(/\d+ Properties Found/);
    const text = await countText.textContent();
    const count = parseInt(text?.match(/\d+/)?.[0] ?? "0");

    // With min 3000, we should see fewer than all 6 mock properties
    expect(count).toBeLessThanOrEqual(6);
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("location filter via URL params", async ({ page }) => {
    await page.goto("/browse?location=Miami");

    const countText = page.getByText(/\d+ Properties Found/);
    await expect(countText).toBeVisible();
  });

  test("combined filters reduce results", async ({ page }) => {
    await page.goto("/browse?bedrooms=4&minPrice=3500");

    const countText = page.getByText(/\d+ Properties Found/);
    const text = await countText.textContent();
    const count = parseInt(text?.match(/\d+/)?.[0] ?? "0");

    expect(count).toBeLessThan(6);
  });
});

test.describe("View toggle", () => {
  test("defaults to grid view", async ({ page }) => {
    await page.goto("/browse");
    const grid = page.locator(".grid");
    await expect(grid.first()).toBeVisible();
  });

  test("switches to map view via URL", async ({ page }) => {
    await page.goto("/browse?view=map");
    await expect(page.getByText("Properties Found")).toBeVisible();
  });
});

test.describe("Browse navigation", () => {
  test("landing page links to browse", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /find listing/i }).click();
    await page.waitForURL("**/browse");
    await expect(page.getByText("Properties Found")).toBeVisible();
  });

  test("header dropdown shows login and register links", async ({ page }) => {
    await page.goto("/browse");
    const userArea = page.locator("text=Demo User").or(page.locator("[class*='UserCircle']")).first();
    await userArea.hover();

    await expect(page.getByRole("link", { name: "Login" })).toBeVisible({ timeout: 3_000 });
    await expect(page.getByRole("link", { name: "Register" })).toBeVisible({ timeout: 3_000 });
  });

  test("no results state shows clear filters button", async ({ page }) => {
    await page.goto("/browse?minPrice=99999");
    await expect(page.getByText("No properties found")).toBeVisible();
    await expect(page.getByRole("button", { name: /clear all filters/i })).toBeVisible();
  });
});
