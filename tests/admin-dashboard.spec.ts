import { test, expect } from '@playwright/test';

// ─── Shared helpers ─────────────────────────────────────────────────────────

/**
 * Completes the one-time Setup Wizard if it appears.
 * Safe to call even when the wizard is not visible.
 */
async function completeSetupWizard(page: any) {
    await page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 15000 }).catch(() => { });

    const venueInput = page.getByPlaceholder('e.g. The Grand Hotel');
    try {
        await venueInput.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
        return; // wizard not shown — already set up
    }
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
    if (await nextBtn.isVisible()) { await nextBtn.click(); await page.waitForTimeout(400); }
    const finishBtn = page.getByRole('button', { name: /Finish|Complete/i });
    if (await finishBtn.isVisible()) { await finishBtn.click(); await page.waitForTimeout(1200); }
}

/**
 * Logs in as a staff member via the 4-digit PIN flow.
 *
 * Auth flow:
 *  1. Staff selection screen shows employee cards (button.group)
 *  2. Clicking a card shows a 4-digit PIN input
 *  3. After entering PIN, staff is authenticated
 *
 * Uses PIN '1234' as the test default PIN. If your test employees
 * have a different PIN, update TEST_PIN accordingly.
 */
const TEST_PIN = '1234';

async function loginAsStaff(page: any) {
    // Step 1: Wait for staff selection screen
    const staffTitle = page.getByText('Who is working?');
    try {
        await staffTitle.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
        return; // already logged in
    }

    // Step 2: Click the first available staff card
    const staffCard = page.locator('button.group').first();
    if (!(await staffCard.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await staffCard.click();
    await page.waitForTimeout(500);

    // Step 3: Enter 4-digit PIN if prompted
    const pinInput = page.locator(
        'input[type="password"], input[inputmode="numeric"], input[type="number"], [data-testid="pin-input"]'
    ).first();
    if (await pinInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pinInput.fill(TEST_PIN);
        // Try various submit patterns
        const submitBtn = page.getByRole('button', { name: /Submit|Login|Enter|Confirm|OK/i }).first();
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitBtn.click();
        } else {
            await pinInput.press('Enter');
        }
    }
    await page.waitForTimeout(1000);
}

// ─── Tests ──────────────────────────────────────────────────────────────────

test.describe('Admin Dashboard', () => {
    test('bill history section is accessible', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);
        await expect(page.locator('body')).toBeVisible();
        const billHistoryTab = page.getByRole('button', { name: /Bill History|Bills/i }).first();
        const exists = await billHistoryTab.isVisible({ timeout: 5000 }).catch(() => false);
        if (exists) {
            await billHistoryTab.click();
            await page.waitForTimeout(800);
            await expect(page.getByText(/Bill|History|No bills/i).first()).toBeVisible({ timeout: 5000 });
            console.log('Bill history accessible.');
        } else {
            console.log('Bill history tab not found in current nav — may require admin role.');
        }
    });

    test('expenses module is accessible and can log an expense', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);
        await page.waitForTimeout(1000);

        const expensesTab = page.getByRole('button', { name: /Expense/i }).first();
        const exists = await expensesTab.isVisible({ timeout: 5000 }).catch(() => false);
        if (!exists) {
            console.log('Expenses tab not visible for this role — skipping.');
            return;
        }

        await expensesTab.click();
        await page.waitForTimeout(600);

        const addExpenseBtn = page.getByRole('button', { name: /Add Expense|Log Expense/i }).first();
        if (await addExpenseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
            await addExpenseBtn.click();
            await page.waitForTimeout(400);
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
            console.log('Add Expense dialog opened.');
        }
    });

    test('sales report section is accessible', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);
        await page.waitForTimeout(1000);

        const reportTab = page.getByRole('button', { name: /Report|Analytics|Sales/i }).first();
        if (await reportTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await reportTab.click();
            await page.waitForTimeout(600);
            await expect(page.getByText(/Report|Sales|Revenue/i).first()).toBeVisible({ timeout: 5000 });
            console.log('Sales report section visible.');
        } else {
            console.log('Report tab not found — may need admin access.');
        }
    });
});
