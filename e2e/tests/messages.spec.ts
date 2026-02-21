import { test, expect } from "@playwright/test";

const MOCK_CONVERSATION = {
  conversation: { id: "conv-1", title: "Rent Discussion", currentUserId: "user-1" },
  messages: [
    {
      id: "msg-1",
      content: "Hi, is the apartment still available?",
      senderId: "user-2",
      senderName: "Jane",
      createdAt: new Date().toISOString(),
      readAt: null,
    },
    {
      id: "msg-2",
      content: "Yes it is! Want to schedule a viewing?",
      senderId: "user-1",
      createdAt: new Date().toISOString(),
      readAt: new Date().toISOString(),
    },
  ],
  currentUserId: "user-1",
};

test.describe("Messaging page", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/conversations/conv-1/messages*", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(MOCK_CONVERSATION),
        });
      }
      if (route.request().method() === "POST") {
        const body = JSON.parse(route.request().postData() || "{}");
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: `msg-${Date.now()}`,
            content: body.content,
            senderId: "user-1",
            createdAt: new Date().toISOString(),
            readAt: null,
          }),
        });
      }
      return route.continue();
    });

    await page.route("**/api/messages/read", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
    );

    await page.goto("/message/conv-1");
  });

  test("renders conversation title", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Rent Discussion" })).toBeVisible();
  });

  test("displays existing messages", async ({ page }) => {
    await expect(page.getByText("Hi, is the apartment still available?")).toBeVisible();
    await expect(page.getByText("Yes it is! Want to schedule a viewing?")).toBeVisible();
  });

  test("shows sender name on incoming messages", async ({ page }) => {
    await expect(page.getByText("Jane")).toBeVisible();
  });

  test("shows read receipts on own messages", async ({ page }) => {
    await expect(page.getByText("Read")).toBeVisible();
  });

  test("message input and send button are present", async ({ page }) => {
    await expect(page.getByPlaceholder(/write a message/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send/i })).toBeVisible();
  });

  test("send button is disabled when input is empty", async ({ page }) => {
    const sendButton = page.getByRole("button", { name: /send/i });
    await expect(sendButton).toBeDisabled();
  });

  test("sends a message via form submission", async ({ page }) => {
    const input = page.getByPlaceholder(/write a message/i);
    await input.fill("When can I move in?");

    await page.getByRole("button", { name: /send/i }).click();

    await expect(page.getByText("When can I move in?")).toBeVisible();
    await expect(input).toHaveValue("");
  });

  test("sends a message with Enter key", async ({ page }) => {
    const input = page.getByPlaceholder(/write a message/i);
    await input.fill("Thanks for the info");
    await input.press("Enter");

    await expect(page.getByText("Thanks for the info")).toBeVisible();
  });

  test("shows optimistic message status while sending", async ({ page }) => {
    // Delay the API response to observe the sending state
    await page.route("**/api/conversations/conv-1/messages", async (route) => {
      if (route.request().method() === "POST") {
        await new Promise((r) => setTimeout(r, 1_000));
        const body = JSON.parse(route.request().postData() || "{}");
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: `msg-${Date.now()}`,
            content: body.content,
            senderId: "user-1",
            createdAt: new Date().toISOString(),
          }),
        });
      }
      return route.continue();
    });

    const input = page.getByPlaceholder(/write a message/i);
    await input.fill("Testing optimistic send");
    await page.getByRole("button", { name: /send/i }).click();

    await expect(page.getByText("Sending...")).toBeVisible({ timeout: 2_000 });
  });
});

test.describe("Messaging empty state", () => {
  test("shows empty state when no messages exist", async ({ page }) => {
    await page.route("**/api/conversations/empty-conv/messages*", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          conversation: { id: "empty-conv", title: "New Chat", currentUserId: "user-1" },
          messages: [],
          currentUserId: "user-1",
        }),
      })
    );

    await page.goto("/message/empty-conv");
    await expect(page.getByText("No messages yet")).toBeVisible();
  });
});

test.describe("Messaging error handling", () => {
  test("shows error when conversation fails to load", async ({ page }) => {
    await page.route("**/api/conversations/bad-conv/messages*", (route) =>
      route.fulfill({ status: 500, contentType: "application/json", body: "{}" })
    );

    await page.goto("/message/bad-conv");
    await expect(page.getByText(/unable to load|error|unknown/i)).toBeVisible({ timeout: 5_000 });
  });

  test("shows error when message fails to send", async ({ page }) => {
    await page.route("**/api/conversations/fail-conv/messages*", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            conversation: { id: "fail-conv", title: "Failing Chat", currentUserId: "user-1" },
            messages: [],
            currentUserId: "user-1",
          }),
        });
      }
      if (route.request().method() === "POST") {
        return route.fulfill({ status: 500, contentType: "application/json", body: "{}" });
      }
      return route.continue();
    });

    await page.route("**/api/messages/read", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: "{}" })
    );

    await page.goto("/message/fail-conv");
    await page.getByPlaceholder(/write a message/i).fill("This will fail");
    await page.getByRole("button", { name: /send/i }).click();

    await expect(page.getByText("Failed")).toBeVisible({ timeout: 5_000 });
  });
});
