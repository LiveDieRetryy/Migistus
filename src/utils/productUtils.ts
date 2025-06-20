// Function to generate URL-friendly slug from product name
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .trim();
}

// Function to get product URL
export function getProductUrl(product: { name: string; slug?: string }): string {
  const slug = product.slug || generateSlug(product.name);
  return `/products/${slug}`;
}
