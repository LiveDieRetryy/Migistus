/**
 * Reset All Products to Voting Stage
 * Sets all products to voting stage with proper dates for testing
 */

const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '../public/data/products.json');

// Read current products
let products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

console.log('\n🔄 Resetting all products to voting stage...\n');

const now = new Date();
const threeDaysAgo = new Date(now);
threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // 3 days into voting

let updated = 0;

products = products.map(product => {
  console.log(`✅ Resetting: ${product.name}`);
  console.log(`   Old stage: ${product.stage || 'none'}`);
  
  // Reset to voting stage
  product.stage = 'voting';
  product.stageEnteredAt = threeDaysAgo.toISOString();
  
  // Remove old lifecycle fields if they exist
  delete product.promotedAt;
  delete product.completedAt;
  
  console.log(`   New stage: voting (entered 3 days ago)\n`);
  updated++;
  
  return product;
});

// Save updated products
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

console.log('📊 Reset Summary:');
console.log(`  Total products updated: ${updated}`);
console.log(`  All products now in: voting stage`);
console.log(`  Entry date: 3 days ago (${threeDaysAgo.toISOString()})`);

console.log('\n✅ All products reset to voting stage!');
console.log('\n📌 What happens next:');
console.log('  - All products appear on /voting page');
console.log('  - They have 4 days remaining until Friday');
console.log('  - On Friday, top voted products will move to coming-soon');
console.log('  - Then after 7 days, they move to community-drops\n');
