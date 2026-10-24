
const { initializeApp, applicationDefault } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp({
  credential: applicationDefault(),
  projectId: "hst-enterprises"
});

const db = getFirestore();

async function main() {
  const snapshot = await db.collection("products").get();

  const names = snapshot.docs
    .map(doc => doc.data().productName)
    .filter(name => typeof name === "string" && name.trim() !== "");

  console.log("\n=== HST ENTERPRISES PRODUCT NAMES ===\n");

  names.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });

  console.log(`\nTotal product documents: ${snapshot.size}`);
  console.log(`Products with names: ${names.length}`);
}

main().catch(error => {
  console.error("Firestore error:", error.message);
  process.exitCode = 1;
});
