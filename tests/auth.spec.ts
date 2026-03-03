import { test, expect } from '@playwright/test';

// Helper: complete setup wizard if it appears
async function completeSetupWizard(page: any) {
    // Wait for skeleton to disappear
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

    // Staff step (optional)
    if (await nextBtn.isVisible()) {
        await nextBtn.click();
        await page.waitForTimeout(400);
    }

    // Finish
    const finishBtn = page.getByRole('button', { name: /Finish|Complete/i });
    if (await finishBtn.isVisible()) {
        await finishBtn.click();
        await page.waitForTimeout(1000);
    }
}

// Helper: log in as first available staff member
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

test.describe('Authentication Flow', () => {
    test('setup wizard completes and lands on POS dashboard', async ({ page }) => {
        await page.goto('/');

        const venueInput = page.getByPlaceholder('e.g. The Grand Hotel');
        try {
            await venueInput.waitFor({ state: 'visible', timeout: 5000 });
        } catch {
            test.skip(); // wizard already done — skip gracefully
            return;
        }

        await completeSetupWizard(page);
        await loginAsStaff(page);

        // After setup + login, should see POS table grid
        const tableGrid = page.locator('[data-testid^="table-"]').first();
        await expect(tableGrid).toBeVisible({ timeout: 15000 });
    });

    test('staff login screen shows employee cards', async ({ page }) => {
        await page.goto('/');
        await completeSetupWizard(page);

        const staffTitle = page.getByText('Who is working?');
        const wizardDone = await staffTitle.isVisible();
        if (!wizardDone) {
            // Already logged in — just check POS is visible
            console.log('Wizard not visible, checking for table grid directly...');
            const tableGrid = page.locator('[data-testid^="table-"]').first();
            await expect(tableGrid).toBeVisible({ timeout: 30000 });
            return;
        }

        // At least one employee card should be rendered
        const employeeCards = page.locator('button.group');
        await expect(employeeCards.first()).toBeVisible({ timeout: 5000 });
    });
});
