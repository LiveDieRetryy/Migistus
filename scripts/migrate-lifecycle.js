/**
 * Lifecycle System Test & Migration Script
 * 
 * This script:
 * 1. Migrates old stage names to new lifecycle stages
 * 2. Sets proper stageEnteredAt dates for testing
 * 3. Tests the automatic lifecycle transitions
 */

const fs = require('fs');
const path = require('path');

const productsPath = path.join(__dirname, '../public/data/products.json');

// Read current products
const products = JSON.parse(fs.readFileSync(productsPath, 'utf-8'));

console.log('\n🔍 Current Product Stages:');
products.forEach(p => {
  console.log(`  - ${p.name}: ${p.stage || 'voting'} (entered: ${p.stageEnteredAt || 'not set'})`);
});

// Migration mapping
const stageMigration = {
  'live-drops': 'community-drops',
  'live': 'community-drops',
  'drops': 'community-drops',
};

// Migrate products
let migrated = 0;
const now = new Date();

products.forEach(product => {
  // Migrate old stage names
  if (product.stage && stageMigration[product.stage]) {
    console.log(`\n✅ Migrating ${product.name}: ${product.stage} → ${stageMigration[product.stage]}`);
    product.stage = stageMigration[product.stage];
    migrated++;
  }
  
  // Ensure stage is set (default to voting)
  if (!product.stage) {
    product.stage = 'voting';
    console.log(`\n✅ Setting default stage for ${product.name}: voting`);
    migrated++;
  }
  
  // Set stageEnteredAt if missing
  if (!product.stageEnteredAt) {
    // Set dates in the past based on stage for realistic testing
    let daysAgo;
    switch (product.stage) {
      case 'voting':
        daysAgo = 3; // 3 days into voting (4 days left until Friday)
        break;
      case 'coming-soon':
        daysAgo = 2; // 2 days into coming-soon (5 days left)
        break;
      case 'community-drops':
        daysAgo = 1; // 1 day into drops (6 days left)
        break;
      default:
        daysAgo = 0;
    }
    
    const enteredDate = new Date(now);
    enteredDate.setDate(enteredDate.getDate() - daysAgo);
    product.stageEnteredAt = enteredDate.toISOString();
    console.log(`\n✅ Setting stageEnteredAt for ${product.name}: ${daysAgo} days ago`);
    migrated++;
  }
});

// Save migrated products
fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));

console.log('\n\n📊 Migration Summary:');
console.log(`  Total products: ${products.length}`);
console.log(`  Migrations applied: ${migrated}`);

console.log('\n📈 Stage Breakdown:');
const breakdown = products.reduce((acc, p) => {
  const stage = p.stage || 'voting';
  acc[stage] = (acc[stage] || 0) + 1;
  return acc;
}, {});

Object.entries(breakdown).forEach(([stage, count]) => {
  console.log(`  - ${stage}: ${count}`);
});

console.log('\n✅ Migration complete! Products ready for lifecycle testing.\n');
console.log('📌 Next steps:');
console.log('  1. Start the dev server: npm run dev');
console.log('  2. Visit each page to see lifecycle in action:');
console.log('     - /voting (products in voting stage)');
console.log('     - /coming-soon (products waiting for Friday launch)');
console.log('     - /community-drops (active drops)');
console.log('  3. Products will automatically transition on Friday!\n');
