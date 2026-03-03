import { test, expect } from '@playwright/test';

// ─── Helpers ────────────────────────────────────────────────────────────────

async function completeSetupWizard(page: any) {
    // Wait for skeleton to disappear
    await page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 15000 }).catch(() => { });

    const venueInput = page.getByPlaceholder('e.g. The Grand Hotel');
    if (!(await venueInput.isVisible())) return;

    await venueInput.fill('Test Cafe');
    const nextBtn = page.getByRole('button', { name: 'Next' });
    await nextBtn.click();
    await page.waitForTimeout(400);

    const ownerName = page.getByPlaceholder('Full Name').first();
    if (await ownerName.isVisible()) {
        await ownerName.fill('Test Owner');
        await nextBtn.click();
        await page.waitForTimeout(400);
    }

    if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(400);
    }

    const finishBtn = page.getByRole('button', { name: /Finish|Complete/i });
    if (await finishBtn.isVisible()) {
        await finishBtn.click();
        await page.waitForTimeout(1000);
    }
}

async function loginAsStaff(page: any) {
    const staffTitle = page.getByText('Who is working?');
    try {
        await staffTitle.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
        return;
    }
    const firstEmployee = page.locator('button.group').first();
    await expect(firstEmployee).toBeVisible({ timeout: 5000 });
    await firstEmployee.click();
    await page.waitForTimeout(800);
}

async function navigateToPOS(page: any) {
    await page.goto('/');
    await completeSetupWizard(page);
    await loginAsStaff(page);
    // Wait for table grid to be ready
    await expect(page.locator('[data-testid^="table-"]').first()).toBeVisible({ timeout: 15000 });
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('POS Order Flow', () => {
    test('should allow selecting a table', async ({ page }) => {
        await navigateToPOS(page);

        // Select the first available table
        const firstTable = page.locator('[data-testid^="table-"]').first();
        await expect(firstTable).toBeVisible({ timeout: 10000 });
        await firstTable.click();

        console.log('Table selected successfully.');
    });

    test('should add a menu item and update cart total', async ({ page }) => {
        await navigateToPOS(page);

        // Select table 1 (or first available table)
        const table1 = page.locator('[data-testid="table-1"]');
        const hasTable1 = await table1.isVisible({ timeout: 5000 }).catch(() => false);
        const targetTable = hasTable1 ? table1 : page.locator('[data-testid^="table-"]').first();
        await expect(targetTable).toBeVisible({ timeout: 10000 });
        await targetTable.click();

        console.log('Table selected. Looking for menu items...');

        // Add first available menu item
        const firstMenuItem = page.locator('[data-testid^="menu-item-"] >> visible=true').first();
        await expect(firstMenuItem).toBeVisible({ timeout: 10000 });
        await firstMenuItem.click();

        console.log('Menu item clicked.');

        // Handle Add Item Dialog if it appears (Easy Mode is off by default)
        const addToOrderBtn = page.getByRole('button', { name: 'Add to Order' });
        if (await addToOrderBtn.isVisible({ timeout: 5000 })) {
            await addToOrderBtn.click();
            console.log('Confirmed Add to Order dialog.');
        }

        // Verify cart total appears
        const cartTotal = page.locator('[data-testid="cart-total"]');
        await expect(cartTotal).toBeVisible({ timeout: 5000 });

        console.log('Cart total is visible.');
    });

    test('full order flow: select table → add item → process payment (cash)', async ({ page }) => {
        await navigateToPOS(page);

        // 1. Select table
        const table1 = page.locator('[data-testid="table-1"]');
        const hasTable1 = await table1.isVisible({ timeout: 5000 }).catch(() => false);
        const targetTable = hasTable1 ? table1 : page.locator('[data-testid^="table-"]').first();
        await expect(targetTable).toBeVisible({ timeout: 10000 });
        await targetTable.click();

        // 2. Add menu item
        const firstMenuItem = page.locator('[data-testid^="menu-item-"] >> visible=true').first();
        await expect(firstMenuItem).toBeVisible({ timeout: 10000 });
        const itemName = await firstMenuItem.textContent();
        console.log(`Clicking Add button for menu item: ${itemName}`);

        // In non-easy mode (default), we must click the "Add" button inside the card
        const addButton = firstMenuItem.getByRole('button', { name: 'Add' });
        if (await addButton.isVisible()) {
            await addButton.click();
        } else {
            console.log('Add button not found inside card, falling back to clicking the card itself.');
            await firstMenuItem.click();
        }

        // Handle Add Item Dialog if it appears
        // Force wait for dialog or cart update
        const addToOrderBtn = page.locator('button:has-text("Add to Order")');
        const dialogVisible = await addToOrderBtn.isVisible({ timeout: 5000 }).catch(() => false);

        if (dialogVisible) {
            console.log('Add to Order dialog appeared. Clicking confirm...');
            await addToOrderBtn.click();
        } else {
            console.log('Add to Order dialog DID NOT appear within 5s. Checking if item was added directly...');
        }

        // 3. Verify cart total > 0
        const cartTotal = page.locator('[data-testid="cart-total"]');
        await expect(cartTotal).toBeVisible({ timeout: 5000 });
        const totalText = await cartTotal.textContent();
        console.log('Cart total visible:', totalText);

        const match = totalText?.match(/[\d]+(?:\.\d+)?/);
        const amount = match ? parseFloat(match[0]) : 0;
        if (amount === 0) {
            console.error('CRITICAL: Item was not added to cart. Total is 0.00');
            // Fail the test explicitly here with a useful message
            throw new Error(`Item "${itemName}" was not added to cart. Total remains 0.00. Dialog visible: ${dialogVisible}`);
        }

        // 4. Click Process Payment
        const payBtn = page.locator('[data-testid="pay-button"]');
        await expect(payBtn).toBeVisible({ timeout: 5000 });
        await expect(payBtn).toBeEnabled(); // This should pass now if amount > 0
        await payBtn.click();

        // 5. Payment dialog should appear
        const paymentDialog = page.locator('[data-testid="payment-dialog"]');
        await expect(paymentDialog).toBeVisible({ timeout: 8000 });
        console.log('Payment dialog visible.');

        // Wait for React to finish its focus effect
        await page.waitForTimeout(300);

        // 6. Enter cash amount
        const cashValue = String(Math.ceil(amount + 10));
        console.log(`Calculating amount: ${amount}, filling cash: ${cashValue}`);
        const cashInput = page.locator('#cash-received');
        await cashInput.fill(cashValue);

        // 7. Confirm cash payment
        const confirmCashBtn = page.locator('[data-testid="confirm-cash-payment"]');
        await expect(confirmCashBtn).toBeVisible({ timeout: 5000 });
        await expect(confirmCashBtn).toBeEnabled({ timeout: 5000 });
        await confirmCashBtn.click();

        // 8. Success: payment dialog closes
        await expect(paymentDialog).not.toBeVisible({ timeout: 10000 });
        console.log('Payment successful — dialog closed.');
    });

    test('full order flow: online payment', async ({ page }) => {
        await navigateToPOS(page);

        // Select table
        const targetTable = page.locator('[data-testid^="table-"]').first();
        await expect(targetTable).toBeVisible({ timeout: 10000 });
        await targetTable.click();

        // Add menu item
        const firstMenuItem = page.locator('[data-testid^="menu-item-"] >> visible=true').first();
        await expect(firstMenuItem).toBeVisible({ timeout: 10000 });
        const addButton = firstMenuItem.getByRole('button', { name: 'Add' });
        if (await addButton.isVisible()) {
            await addButton.click();
        } else {
            await firstMenuItem.click();
        }

        // Handle Add Item Dialog if it appears
        const addToOrderBtn = page.locator('button:has-text("Add to Order")');
        if (await addToOrderBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await addToOrderBtn.click();
        }

        // Verify cart total visible
        await expect(page.locator('[data-testid="cart-total"]')).toBeVisible({ timeout: 5000 });

        // Click Process Payment
        const payBtn = page.locator('[data-testid="pay-button"]');
        await expect(payBtn).toBeVisible();
        await payBtn.click();

        // Payment dialog
        await expect(page.locator('[data-testid="payment-dialog"]')).toBeVisible({ timeout: 8000 });

        // Confirm online payment
        const confirmOnlineBtn = page.locator('[data-testid="confirm-online-payment"]');
        await expect(confirmOnlineBtn).toBeVisible();
        await confirmOnlineBtn.click();

        // Dialog closes on success
        await expect(page.locator('[data-testid="payment-dialog"]')).not.toBeVisible({ timeout: 10000 });
        console.log('Online payment flow completed.');
    });
});
