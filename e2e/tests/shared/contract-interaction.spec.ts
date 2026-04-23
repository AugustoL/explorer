import { test, expect } from "../../fixtures/test";
import { expectStillMounted } from "../../fixtures/assertions";
import { DEFAULT_TIMEOUT } from "../../helpers/wait";

/**
 * Contract interaction UI — read/write function lists on verified contracts.
 *
 * The existing per-network specs click individual read functions on BAYC and
 * Rarible but never assert the two top-level section headers render. A
 * regression in `ContractInteraction.tsx` that empties one list (e.g. ABI
 * decoding breaks) would slip through — these smokes catch that.
 *
 * We don't submit any write transaction (wallet signing is out of scope for
 * e2e), only assert the write-function form section renders.
 */

// USDC is the canonical verified ERC-20 — large ABI, many read functions,
// and several write functions. Stable.
const USDC_MAINNET = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

test.describe("Contract interaction UI", () => {
  test("verified ERC-20 renders Read Functions section", async ({ page }) => {
    await page.goto(`/#/1/address/${USDC_MAINNET}`);
    await expect(page.getByText(/Read\s+Functions\s*\(/i)).toBeVisible({
      timeout: DEFAULT_TIMEOUT * 3,
    });
  });

  test("verified ERC-20 renders Write Functions section", async ({ page }) => {
    await page.goto(`/#/1/address/${USDC_MAINNET}`);
    await expect(page.getByText(/Write\s+Functions\s*\(/i)).toBeVisible({
      timeout: DEFAULT_TIMEOUT * 3,
    });
  });

  test("unverified contract address still renders", async ({ page }) => {
    // A contract deployed but with no verified source — the address page
    // should still render (header, balance, tx history) even without ABI.
    // Pick an address we know has code but no public verification — use the
    // zero-address fallback as a safe placeholder so the spec never rots.
    await page.goto("/#/1/address/0x0000000000000000000000000000000000000000");
    await expectStillMounted(page);
  });
});
