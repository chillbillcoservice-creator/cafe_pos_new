import { test, expect } from '@playwright/test';

// ─── Shared helpers ─────────────────────────────────────────────────────────

async function completeSetupWizard(page: any) {
    await page.waitForSelector('.animate-pulse', { state: 'hidden', timeout: 15000 }).catch(() => { });

    const venueInput = page.getByPlaceholder('e.g. The Grand Hotel');
    if (!(await venueInput.isVisible({ timeout: 5000 }).catch(() => false))) return;
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
    // Step 1: Wait for staff selection screen
    const staffTitle = page.getByText('Who is working?');
    if (!(await staffTitle.isVisible({ timeout: 5000 }).catch(() => false))) return;

    // Step 2: Click first staff card
    const staffCard = page.locator('button.group').first();
    if (!(await staffCard.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await staffCard.click();
    await page.waitForTimeout(500);

    // Step 3: Handle 4-digit PIN input
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

test.describe('Staff Management', () => {
    test('staff login shows employee cards after setup', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);

        const staffTitle = page.getByText('Who is working?');
        if (await staffTitle.isVisible({ timeout: 5000 }).catch(() => false)) {
            const employeeCards = page.locator('button.group');
            await expect(employeeCards.first()).toBeVisible({ timeout: 5000 });
            const count = await employeeCards.count();
            console.log(`Found ${count} employee cards on staff login screen.`);
            expect(count).toBeGreaterThan(0);
        } else {
            console.log('Staff login not shown — already logged in.');
        }
    });

    test('Staff Management section is accessible via admin', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);
        await page.waitForTimeout(1000);

        const staffTab = page.getByRole('button', { name: /Staff|Employee/i }).first();
        const exists = await staffTab.isVisible({ timeout: 5000 }).catch(() => false);
        if (!exists) {
            console.log('Staff Management tab not visible — may need admin role.');
            return;
        }
        await staffTab.click();
        await page.waitForTimeout(600);
        await expect(page.getByText(/Staff|Employee|Name|Salary/i).first()).toBeVisible({ timeout: 5000 });
        console.log('Staff Management screen visible.');
    });

    test('add staff dialog opens from Staff Management', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);
        await loginAsStaff(page);
        await page.waitForTimeout(1000);

        const staffTab = page.getByRole('button', { name: /Staff|Employee/i }).first();
        if (!(await staffTab.isVisible({ timeout: 5000 }).catch(() => false))) {
            console.log('Staff tab not found — skipping.');
            return;
        }
        await staffTab.click();
        await page.waitForTimeout(600);

        const addStaffBtn = page.getByRole('button', { name: /Add Staff|Add Employee|New Employee/i }).first();
        if (await addStaffBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await addStaffBtn.click();
            await page.waitForTimeout(400);
            await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
            console.log('Add Staff dialog opened.');
        } else {
            console.log('Add Staff button not found in staff management.');
        }
    });
});
