import { test, expect } from "@playwright/test";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("renders login form fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("shows link to register page", async ({ page }) => {
    const registerLink = page.getByRole("link", { name: /create a new account/i });
    await expect(registerLink).toBeVisible();
    await expect(registerLink).toHaveAttribute("href", "/auth/register");
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("text=Invalid email")).toBeVisible({ timeout: 3_000 });
  });

  test("shows validation error for invalid email", async ({ page }) => {
    await page.getByLabel(/email/i).fill("not-an-email");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.locator("text=Invalid email")).toBeVisible({ timeout: 3_000 });
  });

  test("submits form with valid credentials", async ({ page }) => {
    await page.route("**/auth/v1/token*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh",
          user: { id: "user-1", email: "test@example.com" },
        }),
      })
    );

    await page.getByLabel(/email/i).fill("test@example.com");
    await page.getByLabel(/password/i).fill("Password123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.waitForURL("**/dashboard", { timeout: 10_000 });
  });

  test("displays error for invalid credentials", async ({ page }) => {
    await page.route("**/auth/v1/token*", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ error: "invalid_grant", error_description: "Invalid login credentials" }),
      })
    );

    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("WrongPass123!");
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page.locator("text=Invalid login credentials")).toBeVisible({ timeout: 5_000 });
  });

  test("navigates back to browse via back arrow", async ({ page }) => {
    await page.getByRole("link", { name: /back/i }).or(page.locator("a[href='/browse']").first()).click();
    await page.waitForURL("**/browse");
  });
});

test.describe("Register page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/register");
  });

  test("renders registration form fields", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /create your account/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /create account/i })).toBeVisible();
  });

  test("shows wallet connect button", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /connect freighter wallet/i })
    ).toBeVisible();
  });

  test("shows link to login page", async ({ page }) => {
    const loginLink = page.getByRole("link", { name: /sign in/i });
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toHaveAttribute("href", "/auth/login");
  });

  test("shows validation errors for empty submission", async ({ page }) => {
    await page.getByRole("button", { name: /create account/i }).click();
    const errors = page.locator(".text-red-600, .text-red-400");
    await expect(errors.first()).toBeVisible({ timeout: 3_000 });
  });

  test("submits registration with valid data", async ({ page }) => {
    await page.route("**/auth/v1/signup", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: "user-1",
          email: "newuser@example.com",
          user_metadata: { username: "newuser", wallet_address: "GABCDEF" },
        }),
      })
    );
    await page.route("**/rest/v1/profiles*", (route) =>
      route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({ id: "user-1", username: "newuser" }),
      })
    );

    await page.getByLabel(/username/i).fill("newuser");
    await page.getByLabel(/email/i).fill("newuser@example.com");
    await page.getByLabel(/password/i).fill("StrongPass123!");

    await page.getByRole("button", { name: /create account/i }).click();
  });
});

test.describe("Auth navigation", () => {
  test("login page links to register and back", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByRole("link", { name: /create a new account/i }).click();
    await page.waitForURL("**/auth/register");
    await page.getByRole("link", { name: /sign in/i }).click();
    await page.waitForURL("**/auth/login");
  });
});
