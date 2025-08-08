// Real-time update system for products
import { EventEmitter } from 'events';

interface ProductUpdateEvent {
  type: 'create' | 'update' | 'delete' | 'status_change';
  productId: string;
  data?: any;
  timestamp: number;
}

class ProductUpdateManager extends EventEmitter {
  private static instance: ProductUpdateManager;
  private updateQueue: ProductUpdateEvent[] = [];
  private isProcessing = false;

  static getInstance(): ProductUpdateManager {
    if (!ProductUpdateManager.instance) {
      ProductUpdateManager.instance = new ProductUpdateManager();
    }
    return ProductUpdateManager.instance;
  }

  constructor() {
    super();
    this.setupBroadcastChannel();
    this.setupStorageListener();
  }

  // Setup cross-tab communication
  private setupBroadcastChannel() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      const channel = new BroadcastChannel('migistus-products');
      channel.addEventListener('message', (event) => {
        if (event.data.type === 'product-update') {
          this.handleProductUpdate(event.data.payload);
        }
      });
    }
  }

  // Setup storage event listener for older browsers
  private setupStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'migistus-product-update') {
          const updateData = JSON.parse(event.newValue || '{}');
          this.handleProductUpdate(updateData);
        }
      });
    }
  }

  // Notify all instances about product updates
  notifyProductUpdate(event: ProductUpdateEvent) {
    // Add to queue
    this.updateQueue.push(event);
    
    // Process queue
    this.processUpdateQueue();

    // Broadcast to other tabs/windows
    this.broadcastUpdate(event);

    // Emit local event
    this.emit('productUpdate', event);
  }

  private broadcastUpdate(event: ProductUpdateEvent) {
    if (typeof window !== 'undefined') {
      // Use BroadcastChannel if available
      if ('BroadcastChannel' in window) {
        const channel = new BroadcastChannel('migistus-products');
        channel.postMessage({
          type: 'product-update',
          payload: event
        });
      }

      // Also use localStorage as fallback
      localStorage.setItem('migistus-product-update', JSON.stringify(event));
      localStorage.removeItem('migistus-product-update');
    }
  }

  private handleProductUpdate(event: ProductUpdateEvent) {
    this.emit('productUpdate', event);
  }

  private async processUpdateQueue() {
    if (this.isProcessing || this.updateQueue.length === 0) return;

    this.isProcessing = true;
    
    while (this.updateQueue.length > 0) {
      const event = this.updateQueue.shift()!;
      
      // Debounce rapid updates for the same product
      const recentSimilarUpdate = this.updateQueue.findIndex(
        update => update.productId === event.productId && update.type === event.type
      );
      
      if (recentSimilarUpdate !== -1) {
        // Remove the older update and keep processing the newer one
        this.updateQueue.splice(recentSimilarUpdate, 1);
      }

      // Small delay to batch updates
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    this.isProcessing = false;
  }

  // Subscribe to product updates
  onProductUpdate(callback: (event: ProductUpdateEvent) => void): () => void {
    this.on('productUpdate', callback);
    
    return () => {
      this.off('productUpdate', callback);
    };
  }

  // Clear all listeners (cleanup)
  cleanup() {
    this.removeAllListeners();
  }
}

export const productUpdateManager = ProductUpdateManager.getInstance();

// Helper functions
export const notifyProductCreated = (productId: string, data?: any) => {
  productUpdateManager.notifyProductUpdate({
    type: 'create',
    productId,
    data,
    timestamp: Date.now()
  });
};

export const notifyProductUpdated = (productId: string, data?: any) => {
  productUpdateManager.notifyProductUpdate({
    type: 'update',
    productId,
    data,
    timestamp: Date.now()
  });
};

export const notifyProductDeleted = (productId: string) => {
  productUpdateManager.notifyProductUpdate({
    type: 'delete',
    productId,
    timestamp: Date.now()
  });
};

export const notifyProductStatusChanged = (productId: string, data?: any) => {
  productUpdateManager.notifyProductUpdate({
    type: 'status_change',
    productId,
    data,
    timestamp: Date.now()
  });
};
