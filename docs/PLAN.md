# 🎼 Orchestration PLAN.md
## Cafe POS — Final 20% Completion Plan

**Generated:** 2026-03-01  
**Agents:** database-architect, security-auditor, test-engineer, devops-engineer, backend-specialist  
**Mode:** Full Stack (Parallel Phase 2 after approval)

---

## 🗺️ Current State Audit

| Area | Status | Finding |
|---|---|---|
| **Auth** | ⚠️ | `owner-auth-screen.tsx` uses Google OAuth (owner). Staff uses PIN login. Tests still use old avatar click pattern. |
| **Firestore Schema** | ⚠️ | 7 collections defined — NOT scoped under `/venues/{venueId}` (per the rules intent). `customerOrders` readable without auth. |
| **Firestore Rules** | ❌ | MVP rules allow ANY authenticated user to read/write ALL data — the venue-scoping logic is a comment, not enforced. |
| **Playwright Tests** | ❌ | 10/15 TestSprite tests failing. `loginAsStaff()` clicks `button.group` (old avatar) — PIN flow not covered. |
| **Deployment** | ⚠️ | `apphosting.yaml` configured. `firebase.json` looks correct. Lint check timed out — needs investigation. |

---

## 🏗️ Agent Work Breakdown

### GROUP 1 — Foundation (database-architect + security-auditor)

#### 🗄️ `database-architect` Tasks
**Goal:** Audit Firestore schema for scaling gaps and fix collection structure.

1. **Schema Analysis**: Review `docs/backend.json` — all 7 collections (`menu`, `tables`, `orders`, `customerOrders`, `order_items`, `kitchen_orders`, `sales_reports`) are top-level. This is NOT aligned with the `firestore.rules` which scope data under `/venues/{venueId}`.
2. **Fix**: Recommend and document the correct path structure:
   - `CURRENT`: `/orders/{orderId}` 
   - `CORRECT for multi-venue`: `/venues/{venueId}/orders/{orderId}`
   - **Verdict**: For a single-venue MVP, current structure is acceptable BUT note risks.
3. **Indexing Check**: Identify queries that will need Firestore composite indexes:
   - Orders by `tableId` + `orderDate`
   - Kitchen orders by `status`
   - Sales reports by `reportDate`
4. **Update** `docs/backend.json` with scaling notes and index recommendations.

#### 🔒 `security-auditor` Tasks
**Goal:** Harden Firestore rules and audit auth model.

1. **Rules Critical Issue**: The catch-all rule `match /{document=**} { allow read, write: if isAuthenticated(); }` means ANY signed-in user can read/write the root collection — this bypasses the venue-scoped rule.
2. **Fix `firestore.rules`**:
   - Remove the catch-all root rule
   - Scope ALL collections under `/venues/{venueId}/...`
   - Allow `customerOrders` public READ (for QR ordering) but authenticated WRITE
3. **Auth Model Audit**: Confirm anonymous auth is enabled in Firebase console (the app calls `signInAnonymously` implicitly).
4. **Env Secrets**: Verify no secrets leaked in `apphosting.yaml` or `.env*` files.

---

### GROUP 2 — Core (backend-specialist + test-engineer)

#### ⚙️ `backend-specialist` Tasks
**Goal:** Fix Firestore collection paths in service files to match schema.

1. **Audit all `collection()` calls** in `src/` to confirm they match `docs/backend.json` paths.
2. **Real-time listeners**: Confirm `onSnapshot` listeners use `orderBy` + proper limits to avoid unbounded reads.
3. **CustomerOrders route**: Confirm `/order` page can write to `customerOrders` without auth (for QR self-serve).

#### 🧪 `test-engineer` Tasks
**Goal:** Fix all failing Playwright tests.

**Root Cause:** The `loginAsStaff()` helper in all spec files does:
```typescript
await page.locator('button.group').first().click(); // OLD - clicks avatar card
```
But the new flow shows a **4-digit PIN input** after selecting a staff member. The tests skip the PIN entry entirely.

**Files to fix:**
- `tests/staff-management.spec.ts` — `loginAsStaff()` helper
- `tests/table-management.spec.ts` — `loginAsStaff()` helper  
- `tests/admin-dashboard.spec.ts` — `loginAsStaff()` helper

**Fix:** Update `loginAsStaff()` to:
1. Click staff member card
2. Wait for PIN input to appear
3. Enter the test employee's PIN (needs to be known — default or seeded)
4. Submit

**New helper:**
```typescript
async function loginAsStaff(page: any) {
    // Step 1: Look for staff selection screen
    const staffCard = page.locator('button.group').first();
    if (!(await staffCard.isVisible({ timeout: 5000 }).catch(() => false))) return;
    await staffCard.click();
    await page.waitForTimeout(500);
    
    // Step 2: Enter 4-digit PIN if prompted
    const pinInput = page.locator('input[type="password"], input[inputmode="numeric"]').first();
    if (await pinInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await pinInput.fill('1234'); // default test PIN
        const submitBtn = page.getByRole('button', { name: /Submit|Login|Enter|Confirm/i });
        if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
            await submitBtn.click();
        }
    }
    await page.waitForTimeout(1000);
}
```

---

### GROUP 3 — Polish (devops-engineer)

#### 🚀 `devops-engineer` Tasks
**Goal:** Ensure deployment is production-ready.

1. **Fix lint timeout**: Run `npm run lint` directly and capture the specific error causing the 5min timeout in `checklist.py`.
2. **TypeScript build**: Run `npm run typecheck` to check for TS errors before deploying.
3. **`apphosting.yaml` review**: Verify environment variable names match what Next.js expects (`NEXT_PUBLIC_*` for client-exposed vars).
4. **`firebase.json` review**: Confirm `hosting`, `firestore`, and `functions` config is correct for App Hosting.
5. **Build test**: Run `npm run build` and confirm it completes without errors.

---

## ✅ Verification Plan

| Check | Command | Agent |
|---|---|---|
| Playwright E2E tests | `npx playwright test` | test-engineer |
| TypeScript typecheck | `npm run typecheck` | devops-engineer |
| Security scan | `python .agent/skills/vulnerability-scanner/scripts/security_scan.py .` | security-auditor |
| Lint | `npm run lint` | devops-engineer |
| Build | `npm run build` | devops-engineer |

---

## 📋 Deliverables

- [ ] Updated `firestore.rules` with hardened security
- [ ] Updated `docs/backend.json` with index recommendations  
- [ ] Fixed `loginAsStaff()` in all 3 spec files
- [ ] Confirmed `npm run build` passes
- [ ] Confirmed `npm run typecheck` passes
- [ ] Playwright test pass rate improved from 5/15 to 12+/15

---

## ⚡ Parallel Execution Order

```
Phase 2 START (parallel):
├── database-architect → Audit + document schema scaling
├── security-auditor   → Fix firestore.rules
├── test-engineer      → Fix loginAsStaff() in 3 spec files
└── devops-engineer    → Fix lint, run typecheck + build

All complete → Run verification → Synthesize report
```
