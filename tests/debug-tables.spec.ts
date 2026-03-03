import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const LOG_FILE = 'debug_log.txt';

function log(msg: string) {
    fs.appendFileSync(LOG_FILE, msg + '\n');
    console.log(msg); // Keep console log too
}

test('DEBUG: Inspector for POS Dashboard', async ({ page }) => {
    // Clear log file
    fs.writeFileSync(LOG_FILE, '');

    page.on('console', msg => log(`BROWSER LOG: ${msg.text()}`));
    page.on('pageerror', err => log(`BROWSER ERROR: ${err}`));

    // 1. Go to root
    await page.goto('/');

    // 2. Wait for data to load (wait for skeleton to disappear)
    const skeleton = page.locator('.animate-pulse').first();
    if (await skeleton.isVisible()) {
        log('Skeleton loader detected. Waiting for it to disappear...');
        try {
            await expect(skeleton).not.toBeVisible({ timeout: 15000 });
            log('Skeleton disappeared.');
        } catch (e) {
            log('Skeleton still visible after timeout.');
        }
    } else {
        log('No skeleton detected.');
    }

    await page.waitForTimeout(1000);

    // 3. Handle setup wizard if present
    const venueInput = page.getByPlaceholder('e.g. The Grand Hotel');
    if (await venueInput.isVisible()) {
        log('Setup Wizard detected. Completing it...');
        await venueInput.fill('Debug Cafe');
        await page.getByRole('button', { name: 'Next' }).click();
        await page.waitForTimeout(500);
        const owner = page.getByPlaceholder('Full Name').first();
        if (await owner.isVisible()) await owner.fill('Debug Owner');
        await page.getByRole('button', { name: 'Next' }).click(); // Owner step
        await page.waitForTimeout(500);
        if (await page.getByRole('button', { name: 'Next' }).isVisible()) {
            await page.getByRole('button', { name: 'Next' }).click(); // Staff step
            await page.waitForTimeout(500);
        }
        const finish = page.getByRole('button', { name: /Finish|Complete/i });
        if (await finish.isVisible()) await finish.click();
        await page.waitForTimeout(2000);
    } else {
        log('No Setup Wizard detected.');
    }

    // 4. Handle Staff Login if present
    const staffTitle = page.getByText('Who is working?');
    if (await staffTitle.isVisible()) {
        log('Staff Login detected. Logging in...');
        await page.locator('button.group').first().click();
        await page.waitForTimeout(1000);
    } else {
        log('No Staff Login detected (already logged in?).');
    }

    // 5. Inspect the page
    log('--- Page Inspection ---');
    const bodyVisible = await page.locator('body').isVisible();
    log(`Body visible: ${bodyVisible}`);

    // Inspect <html> and <body> attributes (e.g. hidden?)
    const bodyAttrs = await page.evaluate(() => document.body.outerHTML.split('>')[0] + '>');
    log(`Body tag: ${bodyAttrs}`);

    // Count tables
    const tables = page.locator('[data-testid^="table-"]');
    const tableCount = await tables.count();
    log(`Found ${tableCount} elements with [data-testid^="table-"]`);

    if (tableCount > 0) {
        const firstId = await tables.first().getAttribute('data-testid');
        log(`First table data-testid: ${firstId}`);
    } else {
        // If no tables, dump some HTML to see what IS there
        log('No tables found. Dumping main content HTML...');
        const mainContent = await page.evaluate(() => document.body.innerHTML);
        log(mainContent.slice(0, 1000));
    }

    const emptyState = await page.getByText(/No tables|Add a table/i).isVisible();
    log(`Empty state message visible: ${emptyState}`);
});
