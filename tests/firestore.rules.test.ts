import { readFileSync } from 'fs';
import { initializeTestEnvironment, RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { setDoc, getDoc, doc } from 'firebase/firestore';

async function runTests() {
    let testEnv: RulesTestEnvironment | null = null;
    try {
        testEnv = await initializeTestEnvironment({
            projectId: "perfect14-08924393-e2204-test",
            firestore: {
                rules: readFileSync('firestore.rules', 'utf8'),
                host: '127.0.0.1',
                port: 8080
            },
        });

        await testEnv.clearFirestore();

        console.log("Running Firestore Rules Tests...");
        let passed = 0;
        let failed = 0;

        async function runTest(name: string, fn: () => Promise<void>) {
            try {
                await fn();
                console.log(`✅ ${name}`);
                passed++;
            } catch (e: any) {
                console.error(`❌ ${name}`);
                console.error(e.message);
                failed++;
            }
        }

        const unauthedDb = testEnv.unauthenticatedContext().firestore();
        const authedDb = testEnv.authenticatedContext('venue1', {
            firebase: { sign_in_provider: 'google.com' }
        }).firestore();

        await runTest('Unauthenticated user cannot read legacy collections', async () => {
            await assertFails(getDoc(doc(unauthedDb, 'menu/category1')));
        });

        await runTest('Unauthenticated user cannot write legacy collections', async () => {
            await assertFails(setDoc(doc(unauthedDb, 'tables/table1'), { status: 'Available' }));
        });

        await runTest('Authenticated user can read and write legacy collections', async () => {
            await assertSucceeds(setDoc(doc(authedDb, 'menu/category1'), { name: 'Drinks', items: [] }));
            await assertSucceeds(getDoc(doc(authedDb, 'menu/category1')));
        });

        await runTest('Unauthenticated user can create customerOrders with valid data', async () => {
            const validOrder = {
                tableId: 'table1',
                status: 'pending',
                createdAt: '2026-03-02T10:00:00Z',
                items: []
            };
            await assertSucceeds(setDoc(doc(unauthedDb, 'customerOrders/order1'), validOrder));
        });

        await runTest('Unauthenticated user cannot create customerOrders with invalid data (wrong status)', async () => {
            const invalidOrder = { tableId: 't1', status: 'handled', createdAt: 'date', items: [] };
            await assertFails(setDoc(doc(unauthedDb, 'customerOrders/order2'), invalidOrder));
        });

        await runTest('Unauthenticated user cannot create customerOrders with missing fields', async () => {
            const invalidOrder = { status: 'pending', createdAt: 'date', items: [] }; // missing tableId
            await assertFails(setDoc(doc(unauthedDb, 'customerOrders/order3'), invalidOrder));
        });

        await runTest('Unauthenticated user cannot read customerOrders', async () => {
            await assertFails(getDoc(doc(unauthedDb, 'customerOrders/order1')));
        });

        await runTest('Authenticated user can read/write venue-scoped data', async () => {
            await assertSucceeds(setDoc(doc(authedDb, 'venues/venue1/employees/emp1'), { name: 'Bob' }));
            await assertSucceeds(getDoc(doc(authedDb, 'venues/venue1/employees/emp1')));
        });

        await runTest('Unauthenticated user cannot read/write venue-scoped data', async () => {
            await assertFails(setDoc(doc(unauthedDb, 'venues/venue1/employees/emp2'), { name: 'Alice' }));
            await assertFails(getDoc(doc(unauthedDb, 'venues/venue1/employees/emp1')));
        });

        console.log(`\nResults: ${passed} passed, ${failed} failed.`);
        if (failed > 0) process.exit(1);

    } catch (e) {
        console.error("Test setup failed", e);
        process.exit(1);
    } finally {
        if (testEnv) {
            await testEnv.cleanup();
        }
    }
}

runTests();
