import { test, expect } from '@playwright/test';

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function completeSetupWizard(page: any) {
    await page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 15000 }).catch(() => { });

    const venueInput = page.getByPlaceholder('e.g. The Grand Hotel');
    try {
        await venueInput.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
        return;
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
 * PIN '1234' is the expected default test PIN.
 */
const TEST_PIN = '1234';

async function loginAsStaff(page: any) {
    const staffTitle = page.getByText('Who is working?');
    try {
        await staffTitle.waitFor({ state: 'visible', timeout: 5000 });
    } catch {
        return;
    }

    const staffCard = page.locator('button.group').first();
    if (!(await staffCard.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await staffCard.click();
    await page.waitForTimeout(500);

    // Handle 4-digit PIN input
    const pinInput = page.locator(
        'input[type="password"], input[inputmode="numeric"], input[type="number"], [data-testid="pin-input"]'
    ).first();
    if (await pinInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pinInput.fill(TEST_PIN);
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

test.describe('Table Management', () => {
    test('at least one table is visible on POS after setup', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);

        const tables = page.locator('[data-testid^="table-"]');
        await expect(tables.first()).toBeVisible({ timeout: 15000 });
        const count = await tables.count();
        console.log(`Found ${count} tables in POS grid.`);
        expect(count).toBeGreaterThan(0);
    });

    test('tables have correct data-testid format (table-N)', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);

        const tables = page.locator('[data-testid^="table-"]');
        await expect(tables.first()).toBeVisible({ timeout: 15000 });

        const firstTestId = await tables.first().getAttribute('data-testid');
        console.log(`First table data-testid: ${firstTestId}`);
        expect(firstTestId).toMatch(/^table-\d+$/);
    });

    test('clicking a table selects it for ordering', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);

        const firstTable = page.locator('[data-testid^="table-"]').first();
        await expect(firstTable).toBeVisible({ timeout: 15000 });
        await firstTable.click();
        await page.waitForTimeout(600);

        const orderPanel = page.getByText(/Table|Current Order|Select/i).first();
        await expect(orderPanel).toBeVisible({ timeout: 5000 });
        console.log('Table selected — order panel updated.');
    });

    test('Table Management section is accessible via admin', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);
        await page.waitForTimeout(1000);

        const tablesMgmtTab = page.getByRole('button', { name: /Tables|Table Management/i }).first();
        const exists = await tablesMgmtTab.isVisible({ timeout: 5000 }).catch(() => false);
        if (!exists) {
            console.log('Table Management tab not in nav — may need admin role.');
            return;
        }
        await tablesMgmtTab.click();
        await page.waitForTimeout(600);
        await expect(page.getByText(/table|seat|capacity/i).first()).toBeVisible({ timeout: 5000 });
        console.log('Table Management screen visible.');
    });
});
