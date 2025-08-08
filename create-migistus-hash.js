import bcrypt from "bcryptjs";

async function createMigistusHash() {
  try {
    const password = "migistus";
    const hash = await bcrypt.hash(password, 10);
    console.log(`Password: "${password}"`);
    console.log(`Hash: ${hash}`);
    
    // Verify the hash works
    const verified = await bcrypt.compare(password, hash);
    console.log(`Verification: ${verified ? "✅ Success" : "❌ Failed"}`);
  } catch (error) {
    console.log(`Error creating hash: ${error}`);
  }
}

createMigistusHash();

export {};
