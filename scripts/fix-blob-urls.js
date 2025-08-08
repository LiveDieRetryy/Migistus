#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script to fix blob URLs in products.json and prevent image deletion issues
 */

const PRODUCTS_PATH = path.join(__dirname, '../public/data/products.json');
const PLACEHOLDER_IMAGES = {
  'electronics': '/images/electronics.png',
  'computer': '/images/Computer.png',
  'smarthome': '/images/smarthome.png',
  'automotive': '/images/automotive.png',
  'beauty': '/images/beauty.png',
  'home': '/images/home.png',
  'sports': '/images/sports&outdoors.png',
  'default': '/images/electronics.png'
};

function validateAndFixImages() {
  try {
    console.log('🔍 Checking products.json for blob URLs...');
    
    const productsData = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
    let products = productsData.products || productsData;
    let hasChanges = false;

    products.forEach((product, index) => {
      // Check main image
      if (product.image && product.image.startsWith('blob:')) {
        console.log(`❌ Found blob URL for ${product.name}: ${product.image}`);
        const category = product.category?.toLowerCase() || 'default';
        product.image = PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.default;
        console.log(`✅ Fixed to: ${product.image}`);
        hasChanges = true;
      }

      // Check images array
      if (product.images && Array.isArray(product.images)) {
        const originalImages = [...product.images];
        product.images = product.images.map(img => {
          if (img.startsWith('blob:')) {
            const category = product.category?.toLowerCase() || 'default';
            return PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.default;
          }
          return img;
        });
        
        if (JSON.stringify(originalImages) !== JSON.stringify(product.images)) {
          console.log(`✅ Fixed images array for ${product.name}`);
          hasChanges = true;
        }
      }

      // Ensure product has at least one image
      if (!product.image) {
        const category = product.category?.toLowerCase() || 'default';
        product.image = PLACEHOLDER_IMAGES[category] || PLACEHOLDER_IMAGES.default;
        console.log(`🔧 Added missing image for ${product.name}: ${product.image}`);
        hasChanges = true;
      }

      if (!product.images || product.images.length === 0) {
        product.images = [product.image];
        console.log(`🔧 Added missing images array for ${product.name}`);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      // Create backup
      const backupPath = PRODUCTS_PATH + `.backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      fs.copyFileSync(PRODUCTS_PATH, backupPath);
      console.log(`💾 Created backup: ${backupPath}`);

      // Save fixed data
      const dataToSave = productsData.products ? { products } : products;
      fs.writeFileSync(PRODUCTS_PATH, JSON.stringify(dataToSave, null, 2));
      console.log('✅ Successfully fixed all blob URLs in products.json');
    } else {
      console.log('✅ No blob URLs found - products.json is clean!');
    }

  } catch (error) {
    console.error('❌ Error fixing blob URLs:', error);
    process.exit(1);
  }
}

function checkImageFiles() {
  console.log('\n🖼️  Checking image file availability...');
  
  Object.entries(PLACEHOLDER_IMAGES).forEach(([category, imagePath]) => {
    const fullPath = path.join(__dirname, '../public', imagePath);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${imagePath} - Available`);
    } else {
      console.log(`❌ ${imagePath} - Missing`);
    }
  });
}

if (require.main === module) {
  console.log('🛠️  MIGISTUS Image Validator & Fixer\n');
  checkImageFiles();
  validateAndFixImages();
  console.log('\n🎉 Image validation complete!');
}

module.exports = { validateAndFixImages, checkImageFiles };
