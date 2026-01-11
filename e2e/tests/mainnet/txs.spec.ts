import { test, expect } from "../../fixtures/test";
import { TxsPage } from "../../pages/txs.page";
import { DEFAULT_TIMEOUT } from "../../helpers/wait";

test.describe("Transactions Page", () => {
  test("displays transactions list with header and RPCIndicator badge always visible", async ({
    page,
  }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    // Wait for loader to disappear
    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify header structure
    await expect(txsPage.blocksHeader).toBeVisible();
    await expect(txsPage.blocksHeaderMain).toBeVisible();
    await expect(txsPage.blockLabel).toBeVisible();
    await expect(txsPage.blockLabel).toHaveText("Latest Transactions");

    // Verify header info is present
    await expect(txsPage.blocksHeaderInfo).toBeVisible();
    const infoText = await txsPage.getInfoText();
    expect(infoText).toMatch(/Showing \d+ transactions from the last \d+ blocks/);

    // CRITICAL: Verify RPC Indicator badge is ALWAYS visible
    await expect(txsPage.rpcIndicator).toBeVisible();
    await expect(txsPage.rpcBadge).toBeVisible();

    // Verify RPC badge shows strategy
    const badgeText = await txsPage.getRPCBadgeText();
    expect(badgeText).toMatch(/Fallback|Parallel/);

    // Verify table is present with transactions
    await expect(txsPage.tableWrapper).toBeVisible();
    await expect(txsPage.txTable).toBeVisible();

    const txCount = await txsPage.getTransactionCount();
    expect(txCount).toBeGreaterThan(0);

    // Verify pagination is present
    await expect(txsPage.paginationContainer.first()).toBeVisible();
    await expect(txsPage.latestBtn.first()).toBeVisible();
    await expect(txsPage.newerBtn.first()).toBeVisible();
    await expect(txsPage.olderBtn.first()).toBeVisible();
  });

  test("RPCIndicator badge is visible in parallel mode", async ({ page }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // RPC Indicator should always be present
    await expect(txsPage.rpcIndicator).toBeVisible();
    await expect(txsPage.rpcBadge).toBeVisible();

    // Badge should be clickable
    const badgeText = await txsPage.getRPCBadgeText();
    expect(badgeText.length).toBeGreaterThan(0);
  });

  test("transactions header displays in single line layout", async ({ page }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify header main container has flex layout elements
    await expect(txsPage.blocksHeaderMain).toBeVisible();
    await expect(txsPage.blockLabel).toBeVisible();

    // Verify divider is present
    const divider = page.locator(".block-header-divider");
    await expect(divider).toBeVisible();
    await expect(divider).toHaveText("•");

    // Verify info is inline with label
    await expect(txsPage.blocksHeaderInfo).toBeVisible();

    // RPC indicator should be on the same line (or wrapped on mobile)
    await expect(txsPage.rpcIndicator).toBeVisible();
  });

  test("displays correct transaction information in table", async ({ page }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify table headers
    const table = txsPage.txTable;
    await expect(table.locator("th", { hasText: "Tx Hash" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Block" })).toBeVisible();
    await expect(table.locator("th", { hasText: "From" })).toBeVisible();
    await expect(table.locator("th", { hasText: "To" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Value" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Gas Price" })).toBeVisible();
    await expect(table.locator("th", { hasText: "Gas" })).toBeVisible();

    // Verify at least one row exists
    const firstRow = table.locator("tbody tr").first();
    await expect(firstRow).toBeVisible();

    // Verify row contains data
    await expect(firstRow.locator("td").first()).toBeVisible();
  });

  test("pagination buttons work correctly", async ({ page }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // On latest page, Latest and Newer should be disabled
    await expect(txsPage.latestBtn.first()).toBeDisabled();
    await expect(txsPage.newerBtn.first()).toBeDisabled();

    // Older should be enabled
    await expect(txsPage.olderBtn.first()).toBeEnabled();

    // Click Older button
    await txsPage.olderBtn.first().click();

    // Wait for new transactions to load
    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Now Newer should be enabled
    await expect(txsPage.newerBtn.first()).toBeEnabled();

    // RPC indicator should still be visible after navigation
    await expect(txsPage.rpcIndicator).toBeVisible();
    await expect(txsPage.rpcBadge).toBeVisible();
  });

  test("RPCIndicator persists when navigating between pages", async ({ page }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify RPC indicator is present on first page
    await expect(txsPage.rpcIndicator).toBeVisible();
    const initialBadgeText = await txsPage.getRPCBadgeText();

    // Navigate to older transactions
    await txsPage.olderBtn.first().click();
    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify RPC indicator is still present
    await expect(txsPage.rpcIndicator).toBeVisible();
    const newBadgeText = await txsPage.getRPCBadgeText();

    // Badge text should be consistent
    expect(newBadgeText).toBe(initialBadgeText);

    // Navigate back to latest
    await txsPage.latestBtn.first().click();
    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify RPC indicator is still present
    await expect(txsPage.rpcIndicator).toBeVisible();
    await expect(txsPage.rpcBadge).toBeVisible();
  });

  test("handles loading state correctly", async ({ page }) => {
    const txsPage = new TxsPage(page);

    // Start navigation
    const navigation = txsPage.goto("1");

    // Loader should be visible initially
    await expect(txsPage.loader).toBeVisible({ timeout: 5000 });

    // Wait for navigation to complete
    await navigation;

    // Loader should eventually disappear
    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Content should be visible
    await expect(txsPage.blocksHeader).toBeVisible();
    await expect(txsPage.rpcIndicator).toBeVisible();
    await expect(txsPage.txTable).toBeVisible();
  });

  test("displays correct block range when using fromBlock parameter", async ({ page }) => {
    const txsPage = new TxsPage(page);
    const fromBlock = 1000000;
    await txsPage.gotoWithFromBlock(fromBlock, "1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify header shows block range instead of "last N blocks"
    const infoText = await txsPage.getInfoText();
    expect(infoText).toMatch(/Showing \d+ transactions from blocks/);
    expect(infoText).not.toMatch(/last \d+ blocks/);

    // RPC indicator should still be visible
    await expect(txsPage.rpcIndicator).toBeVisible();
    await expect(txsPage.rpcBadge).toBeVisible();
  });

  test("RPC indicator has proper styling and layout", async ({ page }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify RPC indicator is part of header
    const indicator = txsPage.rpcIndicator;
    await expect(indicator).toBeVisible();

    // Verify badge is visible and has text
    await expect(txsPage.rpcBadge).toBeVisible();
    const badgeText = await txsPage.getRPCBadgeText();
    expect(badgeText.length).toBeGreaterThan(0);

    // Verify header has proper structure
    const header = txsPage.blocksHeader;
    await expect(header).toBeVisible();

    // Check that header uses flexbox layout (elements are side by side)
    const headerBox = await header.boundingBox();
    const indicatorBox = await indicator.boundingBox();

    expect(headerBox).not.toBeNull();
    expect(indicatorBox).not.toBeNull();

    // Indicator should be within header bounds
    if (headerBox && indicatorBox) {
      expect(indicatorBox.x + indicatorBox.width).toBeLessThanOrEqual(
        headerBox.x + headerBox.width + 1,
      ); // +1 for rounding
    }
  });

  test("uses block-display-card structure with consistent margins", async ({ page }) => {
    const txsPage = new TxsPage(page);
    await txsPage.goto("1");

    await expect(txsPage.loader).toBeHidden({ timeout: DEFAULT_TIMEOUT * 3 });

    // Verify container structure
    await expect(txsPage.container).toBeVisible();

    // Check for block-display-card class
    const blockDisplayCard = page.locator(".block-display-card");
    await expect(blockDisplayCard).toBeVisible();

    // Verify blocks-header is inside block-display-card
    const headerInCard = blockDisplayCard.locator(".blocks-header");
    await expect(headerInCard).toBeVisible();
  });
});
