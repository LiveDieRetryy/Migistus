#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Background service to clean up unused images and maintain image registry
 */

const PRODUCTS_PATH = path.join(__dirname, '../public/data/products.json');
const UPLOADS_DIR = path.join(__dirname, '../public/images/uploads');
const REGISTRY_PATH = path.join(__dirname, '../public/data/image-registry.json');

class ImageCleanupService {
  constructor() {
    this.productsData = [];
    this.imageRegistry = [];
    this.usedImages = new Set();
  }

  async init() {
    console.log('🧹 Starting Image Cleanup Service...');
    
    // Load products data
    if (fs.existsSync(PRODUCTS_PATH)) {
      const data = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
      this.productsData = data.products || data;
    }

    // Load image registry
    if (fs.existsSync(REGISTRY_PATH)) {
      this.imageRegistry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf8'));
    }

    console.log(`📊 Loaded ${this.productsData.length} products`);
    console.log(`📊 Loaded ${this.imageRegistry.length} registered images`);
  }

  findUsedImages() {
    this.usedImages.clear();
    
    this.productsData.forEach(product => {
      // Add main image
      if (product.image && !product.image.startsWith('blob:')) {
        this.usedImages.add(product.image);
      }
      
      // Add images array
      if (product.images && Array.isArray(product.images)) {
        product.images.forEach(img => {
          if (img && !img.startsWith('blob:')) {
            this.usedImages.add(img);
          }
        });
      }
    });

    console.log(`🔍 Found ${this.usedImages.size} images in use`);
  }

  async cleanupOrphanedFiles() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      console.log('📂 Uploads directory does not exist');
      return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    let cleanedCount = 0;
    let preservedCount = 0;

    console.log(`📂 Scanning ${files.length} files in uploads directory...`);

    for (const file of files) {
      const filePath = `/images/uploads/${file}`;
      const fullPath = path.join(UPLOADS_DIR, file);

      // Check if file is used by any product
      if (!this.usedImages.has(filePath)) {
        // Check if it's a recent file (keep files newer than 24 hours)
        const stats = fs.statSync(fullPath);
        const fileAge = Date.now() - stats.mtime.getTime();
        const isRecentFile = fileAge < 24 * 60 * 60 * 1000; // 24 hours

        if (!isRecentFile) {
          try {
            fs.unlinkSync(fullPath);
            console.log(`🗑️  Deleted orphaned file: ${file}`);
            cleanedCount++;
          } catch (error) {
            console.error(`❌ Error deleting ${file}:`, error.message);
          }
        } else {
          console.log(`⏰ Preserving recent file: ${file}`);
          preservedCount++;
        }
      }
    }

    console.log(`✅ Cleanup complete: ${cleanedCount} files deleted, ${preservedCount} recent files preserved`);
  }

  updateImageRegistry() {
    // Update registry with current usage
    this.imageRegistry.forEach(record => {
      const isUsed = this.usedImages.has(record.url);
      record.isActive = isUsed;
      
      if (isUsed) {
        // Find which products use this image
        record.usedBy = [];
        this.productsData.forEach(product => {
          if (product.image === record.url || 
              (product.images && product.images.includes(record.url))) {
            record.usedBy.push(product.id.toString());
          }
        });
      } else {
        record.usedBy = [];
      }
    });

    // Save updated registry
    const dir = path.dirname(REGISTRY_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(this.imageRegistry, null, 2));
    console.log('📝 Updated image registry');
  }

  generateReport() {
    const totalFiles = fs.existsSync(UPLOADS_DIR) ? fs.readdirSync(UPLOADS_DIR).length : 0;
    const usedImages = this.usedImages.size;
    const registeredImages = this.imageRegistry.length;
    const activeImages = this.imageRegistry.filter(r => r.isActive).length;
    
    const totalSize = this.imageRegistry.reduce((sum, r) => sum + (r.size || 0), 0);
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

    console.log('\n📊 IMAGE STORAGE REPORT');
    console.log('========================');
    console.log(`Total files in uploads: ${totalFiles}`);
    console.log(`Images used by products: ${usedImages}`);
    console.log(`Registered images: ${registeredImages}`);
    console.log(`Active images: ${activeImages}`);
    console.log(`Total storage used: ${sizeInMB} MB`);
    console.log('========================\n');
  }

  async run() {
    try {
      await this.init();
      this.findUsedImages();
      await this.cleanupOrphanedFiles();
      this.updateImageRegistry();
      this.generateReport();
      console.log('🎉 Image cleanup service completed successfully!');
    } catch (error) {
      console.error('❌ Error running cleanup service:', error);
      process.exit(1);
    }
  }
}

// Auto-run if called directly
if (require.main === module) {
  const service = new ImageCleanupService();
  service.run();
}

module.exports = ImageCleanupService;
