import bcrypt from "bcryptjs";

async function createTestHashes() {
  const passwords = {
    "admin123": "For admin accounts",
    "password123": "For regular accounts", 
    "test123": "For testing"
  };
  
  console.log("Creating password hashes:");
  
  for (const [password, description] of Object.entries(passwords)) {
    try {
      const hash = await bcrypt.hash(password, 10);
      console.log(`\nPassword: "${password}" (${description})`);
      console.log(`Hash: ${hash}`);
      
      // Verify the hash works
      const verified = await bcrypt.compare(password, hash);
      console.log(`Verification: ${verified ? "✅ Success" : "❌ Failed"}`);
    } catch (error) {
      console.log(`Error creating hash for "${password}": ${error}`);
    }
  }
}

createTestHashes();

export {};
