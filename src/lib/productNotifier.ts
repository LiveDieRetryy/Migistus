// Simple global event system for real-time product updates
class ProductUpdateNotifier {
  private listeners: Set<() => void> = new Set();

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify(): void {
    this.listeners.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in product update listener:', error);
      }
    });
  }
}

export const productUpdateNotifier = new ProductUpdateNotifier();

// Helper function to trigger product updates across the app
export const notifyProductUpdate = () => {
  productUpdateNotifier.notify();
  
  // Also trigger a custom event for components that prefer DOM events
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('migistus-product-update'));
  }
};
