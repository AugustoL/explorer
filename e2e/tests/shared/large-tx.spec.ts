import { test, expect } from "../../fixtures/test";
import { DEFAULT_TIMEOUT } from "../../helpers/wait";

/**
 * Event logs rendering — stresses `EventLogsTab`.
 *
 * The research review flagged that nothing in the suite asserts event-log
 * rows actually render. A regression that breaks decode (silent throw in
 * the log row component, missing ABI, etc.) would slip through because the
 * per-network specs only open tx pages and check header fields, not the
 * nested detail tabs.
 *
 * We don't stress-test 100+ logs here — pagination / virtualization specs
 * deferred to phase 6. This commits the baseline: at least one event-log
 * row appears for a known tx that emits events.
 */

// Canonical USDC approval from `e2e/fixtures/mainnet.ts` — ERC-20 Approval
// event is guaranteed to emit one log row.
const USDC_APPROVAL_TX =
  "0xc55e2b90168af6972193c1f86fa4d7d7b31a29c156665d15b9cd48618b5177ef";

test.describe("Transaction event log rendering", () => {
  test("tx with ERC-20 Approval emits at least one log row", async ({ page }) => {
    await page.goto(`/#/1/tx/${USDC_APPROVAL_TX}`);
    // EventLogsTab renders each log as `.tx-log` (per
    // `src/components/pages/evm/tx/analyser/EventLogsTab.tsx`).
    const firstLog = page.locator(".tx-log").first();
    await expect(firstLog).toBeVisible({ timeout: DEFAULT_TIMEOUT * 4 });
  });
});
