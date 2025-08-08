import fs from 'fs';
import path from 'path';

export interface ImageRecord {
  id: string;
  filename: string;
  originalName: string;
  url: string;
  size: number;
  uploadedAt: string;
  usedBy: string[]; // Array of product IDs or contexts using this image
  isActive: boolean;
}

const IMAGE_REGISTRY_PATH = path.join(process.cwd(), 'public', 'data', 'image-registry.json');

class ImageRegistry {
  private static instance: ImageRegistry;
  private registry: ImageRecord[] = [];

  private constructor() {
    this.loadRegistry();
  }

  public static getInstance(): ImageRegistry {
    if (!ImageRegistry.instance) {
      ImageRegistry.instance = new ImageRegistry();
    }
    return ImageRegistry.instance;
  }

  private loadRegistry(): void {
    try {
      if (fs.existsSync(IMAGE_REGISTRY_PATH)) {
        const data = fs.readFileSync(IMAGE_REGISTRY_PATH, 'utf8');
        this.registry = JSON.parse(data);
      } else {
        this.registry = [];
        this.saveRegistry();
      }
    } catch (error) {
      console.error('Error loading image registry:', error);
      this.registry = [];
    }
  }

  private saveRegistry(): void {
    try {
      const dir = path.dirname(IMAGE_REGISTRY_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(IMAGE_REGISTRY_PATH, JSON.stringify(this.registry, null, 2));
    } catch (error) {
      console.error('Error saving image registry:', error);
    }
  }

  public registerImage(
    filename: string,
    originalName: string,
    url: string,
    size: number,
    usedBy: string = 'unknown'
  ): string {
    const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const record: ImageRecord = {
      id,
      filename,
      originalName,
      url,
      size,
      uploadedAt: new Date().toISOString(),
      usedBy: [usedBy],
      isActive: true
    };

    this.registry.push(record);
    this.saveRegistry();
    
    console.log(`📸 Registered image: ${filename} (ID: ${id})`);
    return id;
  }

  public linkImageToProduct(imageUrl: string, productId: string): void {
    const record = this.registry.find(r => r.url === imageUrl);
    if (record && !record.usedBy.includes(productId)) {
      record.usedBy.push(productId);
      this.saveRegistry();
      console.log(`🔗 Linked image ${record.filename} to product ${productId}`);
    }
  }

  public unlinkImageFromProduct(imageUrl: string, productId: string): void {
    const record = this.registry.find(r => r.url === imageUrl);
    if (record) {
      record.usedBy = record.usedBy.filter(id => id !== productId);
      if (record.usedBy.length === 0) {
        record.isActive = false;
      }
      this.saveRegistry();
      console.log(`🔗 Unlinked image ${record.filename} from product ${productId}`);
    }
  }

  public getUnusedImages(): ImageRecord[] {
    return this.registry.filter(r => r.usedBy.length === 0 || !r.isActive);
  }

  public cleanupUnusedImages(): number {
    const unusedImages = this.getUnusedImages();
    let cleanedCount = 0;

    unusedImages.forEach(record => {
      try {
        const fullPath = path.join(process.cwd(), 'public', record.url);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`🗑️ Deleted unused image: ${record.filename}`);
          cleanedCount++;
        }
      } catch (error) {
        console.error(`Error deleting image ${record.filename}:`, error);
      }
    });

    // Remove deleted images from registry
    this.registry = this.registry.filter(r => !unusedImages.includes(r));
    this.saveRegistry();

    return cleanedCount;
  }

  public getImageStats(): {
    total: number;
    active: number;
    unused: number;
    totalSize: number;
  } {
    const total = this.registry.length;
    const active = this.registry.filter(r => r.isActive && r.usedBy.length > 0).length;
    const unused = this.registry.filter(r => !r.isActive || r.usedBy.length === 0).length;
    const totalSize = this.registry.reduce((sum, r) => sum + r.size, 0);

    return { total, active, unused, totalSize };
  }
}

export default ImageRegistry;
