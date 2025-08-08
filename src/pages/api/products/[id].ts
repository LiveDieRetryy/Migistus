import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Product ID is required' });
  }

  try {
    const productsPath = path.join(process.cwd(), 'public', 'data', 'products.json');
    
    if (!fs.existsSync(productsPath)) {
      return res.status(404).json({ error: 'Products data not found' });
    }

    const fileContent = fs.readFileSync(productsPath, 'utf-8');
    let productsData;
    
    try {
      productsData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(500).json({ error: 'Invalid products data format' });
    }

    // Handle both array and object with products array formats
    let products: any[] = [];
    if (Array.isArray(productsData)) {
      products = productsData;
    } else if (productsData.products && Array.isArray(productsData.products)) {
      products = productsData.products;
    } else {
      return res.status(500).json({ error: 'Invalid products data structure' });
    }

    if (req.method === 'GET') {
      // Find the product by ID or slug
      const product = products.find(p => 
        p.id === id || 
        p.id === parseInt(id, 10) || 
        p.slug === id
      );

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Ensure consistent data structure
      const normalizedProduct = {
      ...product,
      // Backward compatibility mappings
      imageUrl: product.image || product.imageUrl,
      pledgeCount: product.pledges || product.pledgeCount || 0,
      totalPledged: product.currentAmount || product.totalPledged || 0,
      votes: product.votes || 0,
      pledges: product.pledges || product.pledgeCount || 0,
      featured: product.featured || false,
      stage: product.stage || product.status,
      // Ensure thumbnail config exists
      thumbnailConfig: product.thumbnailConfig || {
        layout: 'standard',
        showPrice: true,
        showVotes: true,
        showPledges: true,
        showCategory: true,
        showStatus: true,
        showProgress: true,
        backgroundColor: '#ffffff',
        textColor: '#1f2937',
        borderRadius: 8,
        shadow: 'md',
        hoverEffect: 'scale',
        badgeStyle: 'corner',
        imageStyle: 'cover',
        titleFont: 'sans',
        titleSize: 'base',
        titleWeight: 'semibold',
        descriptionLines: 2,
        spacing: 'normal',
        alignment: 'left'
      }
    };

    // Add cache headers for real-time updates
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.status(200).json(normalizedProduct);

  } else if (req.method === 'PUT') {
    // Update product
    const updatedProduct = req.body;
    
    // Find and update the product
    const productIndex = products.findIndex(p => p.id === id || p.id === parseInt(id, 10));
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Ensure data consistency
    updatedProduct.pledges = typeof updatedProduct.pledges === "number" ? updatedProduct.pledges : 0;
    updatedProduct.pricingTiers = Array.isArray(updatedProduct.pricingTiers) ? updatedProduct.pricingTiers : [];
    
    // Update the product
    products[productIndex] = { ...products[productIndex], ...updatedProduct };
    
    // Write back to file
    if (Array.isArray(productsData)) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    } else {
      fs.writeFileSync(productsPath, JSON.stringify({ ...productsData, products }, null, 2));
    }
    
    console.log(`Product ${id} updated successfully`);
    res.status(200).json({ success: true, product: products[productIndex] });

  } else if (req.method === 'DELETE') {
    // Delete product
    const productIndex = products.findIndex(p => p.id === id || p.id === parseInt(id, 10));
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Remove the product
    products.splice(productIndex, 1);
    
    // Write back to file
    if (Array.isArray(productsData)) {
      fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
    } else {
      fs.writeFileSync(productsPath, JSON.stringify({ ...productsData, products }, null, 2));
    }
    
    console.log(`Product ${id} deleted successfully`);
    res.status(200).json({ success: true });

  } else {
    res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
