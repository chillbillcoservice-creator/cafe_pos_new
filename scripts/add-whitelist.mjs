// Adds an email to the Firestore 'whitelist' collection using Firebase REST API
const PROJECT_ID = "perfect14-08924393-e2204";
const API_KEY = "AIzaSyDCxAhGJiEUL4VK7Mr5zwCXWIIuh0FcjXA";
const EMAIL = "panshulsharma93@gmail.com";

const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/whitelist/${EMAIL}?key=${API_KEY}`;

const body = {
    fields: {
        email: { stringValue: EMAIL },
        active: { booleanValue: true },
        plan: { stringValue: "owner" },
        addedAt: { timestampValue: new Date().toISOString() },
    }
};

fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
})
    .then(r => r.json())
    .then(data => {
        if (data.name) {
            console.log("✅ Successfully added to whitelist:", data.name);
        } else {
            console.error("❌ Failed:", JSON.stringify(data, null, 2));
        }
    })
    .catch(err => console.error("❌ Error:", err.message));
