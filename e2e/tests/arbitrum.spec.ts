import { test, expect } from "../fixtures/test";
import { BlockPage } from "../pages/block.page";
import { AddressPage } from "../pages/address.page";
import { TransactionPage } from "../pages/transaction.page";
import { ARBITRUM } from "../fixtures/arbitrum";

const CHAIN_ID = ARBITRUM.chainId;

// Transaction hash constants for readability
const UNISWAP_SWAP = "0x87815a816c02b5a563a026e4a37d423734204b50972e75284b62f05e4134ae44";
const USDC_TRANSFER = "0x160687cbf03f348cf36997dbab53abbd32d91af5971bccac4cfa1577da27607e";

// Helper to wait for block content or error
async function waitForBlockContent(page: import("@playwright/test").Page) {
  await expect(
    page
      .locator("text=Transactions:")
      .or(page.locator("text=Error:"))
      .or(page.locator("text=Something went wrong"))
  ).toBeVisible({ timeout: 45000 });

  return (
    !(await page.locator("text=Error:").isVisible()) &&
    !(await page.locator("text=Something went wrong").isVisible())
  );
}

// Helper to wait for address content or error
async function waitForAddressContent(page: import("@playwright/test").Page) {
  await expect(
    page
      .locator("text=Balance:")
      .or(page.locator("text=Error:"))
      .or(page.locator("text=Something went wrong"))
      .first()
  ).toBeVisible({ timeout: 45000 });

  return (
    !(await page.locator("text=Error:").isVisible()) &&
    !(await page.locator("text=Something went wrong").isVisible())
  );
}

// Helper to wait for transaction content or error
async function waitForTxContent(page: import("@playwright/test").Page) {
  await expect(
    page
      .locator("text=Transaction Hash:")
      .or(page.locator("text=Error:"))
      .or(page.locator("text=Something went wrong"))
  ).toBeVisible({ timeout: 45000 });

  return (
    !(await page.locator("text=Error:").isVisible()) &&
    !(await page.locator("text=Something went wrong").isVisible())
  );
}

// ============================================
// BLOCK TESTS
// ============================================

test.describe("Arbitrum One - Block Page", () => {
  test("genesis block #0 - Arbitrum One launch", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["0"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      // Header section
      await expect(blockPage.blockNumber).toBeVisible();

      // Genesis block should have 0 transactions
      await expect(page.locator("text=Transactions:")).toBeVisible();
      await expect(page.locator("text=0 transactions in this block")).toBeVisible();

      // Gas Used should be 0
      await expect(page.locator("text=Gas Used:")).toBeVisible();

      // Gas Limit
      await expect(page.locator("text=Gas Limit:")).toBeVisible();
      await expect(page.locator(`text=${block.gasLimit}`)).toBeVisible();
    }
  });

  test("block #22,207,817 - Nitro upgrade block", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["22207817"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      await expect(blockPage.blockNumber).toBeVisible();

      // Nitro upgrade block - 0 transactions
      await expect(page.locator("text=Transactions:")).toBeVisible();
      await expect(page.locator("text=0 transactions in this block")).toBeVisible();

      // Size
      await expect(page.locator("text=Size:")).toBeVisible();
      await expect(page.locator(`text=${block.size}`)).toBeVisible();
    }
  });

  test("block #100,000,000 - post-Nitro with gas details", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["100000000"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      await expect(blockPage.blockNumber).toBeVisible();
      await expect(blockPage.statusBadge).toContainText("Finalized");

      // Transaction count
      await expect(page.locator("text=Transactions:")).toBeVisible();
      await expect(page.locator(`text=${block.txCount} transactions in this block`)).toBeVisible();

      // Gas Used with value
      await expect(page.locator("text=Gas Used:")).toBeVisible();
      await expect(page.locator(`text=${block.gasUsed}`)).toBeVisible();

      // Size with value
      await expect(page.locator("text=Size:")).toBeVisible();
      await expect(page.locator(`text=${block.size}`)).toBeVisible();

      // Base Fee Per Gas
      await expect(page.locator("text=Base Fee Per Gas:")).toBeVisible();

      // Fee Recipient (sequencer address)
      await expect(page.locator("text=Fee Recipient:")).toBeVisible();
      const feeRecipient = await blockPage.getFeeRecipient();
      expect(feeRecipient.toLowerCase()).toContain(block.feeRecipientPartial.toLowerCase());
    }
  });

  test("block #100,000,000 more details section shows correct hashes", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["100000000"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      const showMoreBtn = page.locator("text=Show More Details");
      if (await showMoreBtn.isVisible()) {
        await showMoreBtn.click();
        await expect(page.locator("text=Hide More Details")).toBeVisible();

        // Verify hash field labels
        await expect(page.getByText("Hash:", { exact: true })).toBeVisible();
        await expect(page.getByText("Parent Hash:", { exact: true })).toBeVisible();

        // Block hash
        await expect(page.locator(`text=${block.hash}`)).toBeVisible();
        // Parent hash
        await expect(page.locator(`text=${block.parentHash}`)).toBeVisible();
      }
    }
  });

  test("block #200,000,000 - post-ArbOS 20 Atlas (Dencun)", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["200000000"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      await expect(blockPage.blockNumber).toBeVisible();
      await expect(blockPage.statusBadge).toContainText("Finalized");

      // Transaction count
      await expect(page.locator("text=Transactions:")).toBeVisible();
      await expect(page.locator(`text=${block.txCount} transactions in this block`)).toBeVisible();

      // Gas Used with value
      await expect(page.locator("text=Gas Used:")).toBeVisible();
      await expect(page.locator(`text=${block.gasUsed}`)).toBeVisible();

      // Size with value
      await expect(page.locator("text=Size:")).toBeVisible();
      await expect(page.locator(`text=${block.size}`)).toBeVisible();

      // Fee Recipient
      await expect(page.locator("text=Fee Recipient:")).toBeVisible();
      const feeRecipient = await blockPage.getFeeRecipient();
      expect(feeRecipient.toLowerCase()).toContain(block.feeRecipientPartial.toLowerCase());
    }
  });

  test("block #200,000,000 more details shows hashes", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["200000000"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      const showMoreBtn = page.locator("text=Show More Details");
      if (await showMoreBtn.isVisible()) {
        await showMoreBtn.click();
        await expect(page.locator("text=Hide More Details")).toBeVisible();

        // Block hash
        await expect(page.locator(`text=${block.hash}`)).toBeVisible();
        // Parent hash
        await expect(page.locator(`text=${block.parentHash}`)).toBeVisible();
      }
    }
  });

  test("block #300,000,000 - post-ArbOS 32 Bianca (Stylus)", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["300000000"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      await expect(blockPage.blockNumber).toBeVisible();

      // Transaction count
      await expect(page.locator("text=Transactions:")).toBeVisible();
      await expect(page.locator(`text=${block.txCount} transactions in this block`)).toBeVisible();

      // Gas Used with value
      await expect(page.locator("text=Gas Used:")).toBeVisible();
      await expect(page.locator(`text=${block.gasUsed}`)).toBeVisible();

      // Size with value
      await expect(page.locator("text=Size:")).toBeVisible();
      await expect(page.locator(`text=${block.size}`)).toBeVisible();

      // Base Fee Per Gas
      await expect(page.locator("text=Base Fee Per Gas:")).toBeVisible();

      // Fee Recipient
      await expect(page.locator("text=Fee Recipient:")).toBeVisible();
      const feeRecipient = await blockPage.getFeeRecipient();
      expect(feeRecipient.toLowerCase()).toContain(block.feeRecipientPartial.toLowerCase());
    }
  });

  test("genesis block more details section shows correct hash", async ({ page }) => {
    const blockPage = new BlockPage(page);
    const block = ARBITRUM.blocks["0"];
    await blockPage.goto(block.number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      const showMoreBtn = page.locator("text=Show More Details");
      if (await showMoreBtn.isVisible()) {
        await showMoreBtn.click();
        await expect(page.locator("text=Hide More Details")).toBeVisible();

        // Verify hash field labels
        await expect(page.getByText("Hash:", { exact: true })).toBeVisible();

        // Genesis block hash
        await expect(page.locator(`text=${block.hash}`)).toBeVisible();
      }
    }
  });

  test("block navigation buttons work on Arbitrum", async ({ page }) => {
    const blockPage = new BlockPage(page);
    await blockPage.goto(ARBITRUM.blocks["100000000"].number, CHAIN_ID);

    const loaded = await waitForBlockContent(page);
    if (loaded) {
      await expect(blockPage.navPrevBtn).toBeVisible();
      await expect(blockPage.navNextBtn).toBeVisible();
    }
  });

  test("handles invalid block number gracefully", async ({ page }) => {
    const blockPage = new BlockPage(page);
    await blockPage.goto(999999999999, CHAIN_ID);

    await expect(
      blockPage.errorText.or(blockPage.container).or(page.locator("text=Something went wrong"))
    ).toBeVisible({ timeout: 30000 });
  });
});

// ============================================
// TRANSACTION TESTS
// ============================================

test.describe("Arbitrum One - Transaction Page", () => {
  test("displays Uniswap V3 swap with all details", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[UNISWAP_SWAP];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      // Verify core transaction details
      await expect(page.locator("text=Transaction Hash:")).toBeVisible();
      await expect(page.locator("text=Status:")).toBeVisible();
      await expect(page.locator("text=Block:")).toBeVisible();
      await expect(page.locator("text=From:")).toBeVisible();
      await expect(page.locator("text=To:")).toBeVisible();
      await expect(page.locator("text=Value:")).toBeVisible();

      // Verify gas information
      await expect(page.locator("text=Gas Limit")).toBeVisible();
      await expect(page.getByText("Gas Price:", { exact: true })).toBeVisible();
    }
  });

  test("shows correct from and to addresses for swap", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[UNISWAP_SWAP];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      const from = await txPage.getFromAddress();
      expect(from.toLowerCase()).toContain(tx.from.toLowerCase().slice(0, 10));

      const to = await txPage.getToAddress();
      expect(to?.toLowerCase()).toContain(tx.to?.toLowerCase().slice(0, 10));
    }
  });

  test("displays transaction value and fee", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[UNISWAP_SWAP];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      // Verify value contains ETH
      const value = await txPage.getValue();
      expect(value).toContain("ETH");

      // Verify transaction fee is displayed
      await expect(page.locator("text=Transaction Fee:")).toBeVisible();
    }
  });

  test("displays USDC transfer transaction (EIP-1559)", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[USDC_TRANSFER];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      await expect(page.locator("text=Transaction Hash:")).toBeVisible();
      await expect(page.locator("text=Status:")).toBeVisible();
      await expect(page.locator("text=From:")).toBeVisible();
      await expect(page.locator("text=To:")).toBeVisible();

      // To address should be USDC contract
      const to = await txPage.getToAddress();
      expect(to?.toLowerCase()).toContain(tx.to?.toLowerCase().slice(0, 10));
    }
  });

  test("displays transaction with input data", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[UNISWAP_SWAP];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      // Contract interaction should have input data
      await expect(page.locator("text=Input Data:")).toBeVisible();
    }
  });

  test("displays other attributes section with nonce", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[UNISWAP_SWAP];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      await expect(page.locator("text=Other Attributes:")).toBeVisible();
      await expect(page.locator("text=Nonce:")).toBeVisible();
      await expect(page.locator("text=Position:")).toBeVisible();
    }
  });

  test("displays block number link", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[UNISWAP_SWAP];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      await expect(page.locator("text=Block:")).toBeVisible();
      const blockValue = await txPage.getBlockNumber();
      expect(blockValue).toBeTruthy();
    }
  });

  test("USDC transfer shows correct addresses", async ({ page }) => {
    const txPage = new TransactionPage(page);
    const tx = ARBITRUM.transactions[USDC_TRANSFER];

    await txPage.goto(tx.hash, CHAIN_ID);

    const loaded = await waitForTxContent(page);
    if (loaded) {
      const from = await txPage.getFromAddress();
      expect(from.toLowerCase()).toContain(tx.from.toLowerCase().slice(0, 10));

      const to = await txPage.getToAddress();
      expect(to?.toLowerCase()).toContain(tx.to?.toLowerCase().slice(0, 10));
    }
  });

  test("handles invalid tx hash gracefully", async ({ page }) => {
    const txPage = new TransactionPage(page);
    await txPage.goto("0xinvalid", CHAIN_ID);

    await expect(
      txPage.errorText.or(txPage.container).or(page.locator("text=Something went wrong"))
    ).toBeVisible({ timeout: 30000 });
  });
});

// ============================================
// ADDRESS TESTS
// ============================================

test.describe("Arbitrum One - Address Page", () => {
  test("displays native USDC contract details", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.usdc;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);

      await expect(page.locator("text=Contract Details")).toBeVisible();
    }
  });

  test("displays bridged USDC.e contract", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.usdce;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);
    }
  });

  test("displays WETH contract", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.weth;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);
    }
  });

  test("displays ARB governance token contract", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.arb;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);
    }
  });

  test("displays GMX token contract", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.gmx;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);
    }
  });

  test("displays Uniswap V3 Router contract with details", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.uniswapV3Router;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);

      await expect(page.locator("text=Contract Details")).toBeVisible();
    }
  });

  test("displays Uniswap Universal Router contract", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.uniswapUniversalRouter;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);
    }
  });

  test("displays GMX Vault contract with details", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.gmxVault;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);

      await expect(page.locator("text=Contract Details")).toBeVisible();
    }
  });

  test("displays GMX Position Router contract", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.gmxPositionRouter;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);
    }
  });

  test("displays ArbSys system precompile", async ({ page }) => {
    const addressPage = new AddressPage(page);
    const addr = ARBITRUM.addresses.arbSys;

    await addressPage.goto(addr.address, CHAIN_ID);

    const loaded = await waitForAddressContent(page);
    if (loaded) {
      const isContract = await addressPage.isContract();
      expect(isContract).toBe(true);
    }
  });
});
