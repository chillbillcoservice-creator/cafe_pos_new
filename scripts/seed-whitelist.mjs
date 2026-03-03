/**
 * Temporary admin script to seed the Firestore whitelist.
 * Uses firebase-admin with Application Default Credentials
 * (works when logged in with `firebase login`).
 *
 * Run: node scripts/seed-whitelist.mjs
 */
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Use application default credentials (picks up your firebase login token)
if (getApps().length === 0) {
    initializeApp({ projectId: "perfect14-08924393-e2204" });
}

const db = getFirestore();

const email = "panshulsharma93@gmail.com";

async function seedWhitelist() {
    await db.collection("whitelist").doc(email).set({
        email,
        active: true,
        plan: "owner",
        addedAt: new Date().toISOString(),
    });
    console.log(`✅ Added ${email} to whitelist`);
    process.exit(0);
}

seedWhitelist().catch((err) => {
    console.error("❌ Failed:", err.message);
    process.exit(1);
});
