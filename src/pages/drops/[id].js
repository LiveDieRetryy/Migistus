import Head from "next/head";
import { useRouter } from "next/router";
import ProductPageComponent from "@/components/drops/ProductPage";

export default function DropPage() {
  const router = useRouter();
  const { id } = router.query;

  // Mock product data - replace with actual data fetching
  const getProductData = (productId) => {
    const products = {
      "warehouse-15-led-headlamp": {
        name: "Warehouse-15 LED Headlamp",
        images: ["/images/headlamp.png", "/images/headlamp-2.png", "/images/headlamp-3.png"],
        rating: 4.8,
        reviews: 1247,
        originalPrice: 45.99,
        moq: 150,
        description: "Professional-grade LED headlamp with ultra-bright output, waterproof design, and long-lasting battery life. Perfect for outdoor adventures, work, and emergency situations.",
        category: "Electronics"
      },
      "wifi-smart-bulb": {
        name: "Wi-Fi Smart Bulb",
        images: ["/images/bulb.png", "/images/bulb-2.png", "/images/bulb-3.png"],
        rating: 4.6,
        reviews: 892,
        originalPrice: 29.99,
        moq: 100,
        description: "Smart Wi-Fi enabled LED bulb with millions of colors, voice control compatibility, and energy-efficient design.",
        category: "Home & Garden"
      },
      "laptop-stand": {
        name: "Multifunctional Laptop Stand",
        images: ["/images/laptop-stand.png", "/images/laptop-stand-2.png"],
        rating: 4.7,
        reviews: 634,
        originalPrice: 79.99,
        moq: 75,
        description: "Ergonomic laptop stand with adjustable height and angle, built-in cooling fan, and premium aluminum construction.",
        category: "Electronics"
      }
    };

    return products[productId] || products["warehouse-15-led-headlamp"];
  };

  const productData = getProductData(id);

  return (
    <>
      <Head>
        <title>{productData.name} - MIGISTUS Drop</title>
        <meta name="description" content={`Join the drop for ${productData.name}. Save through collective buying power on MIGISTUS.`} />
        <meta property="og:title" content={`${productData.name} - MIGISTUS`} />
        <meta property="og:description" content={productData.description} />
        <meta property="og:image" content={productData.images[0]} />
      </Head>
      
      <ProductPageComponent productId={id} productData={productData} />
    </>
  );
}

// Optional: Generate static paths for better SEO
export async function getStaticPaths() {
  // In production, fetch this from your database
  const paths = [
    { params: { id: 'warehouse-15-led-headlamp' } },
    { params: { id: 'wifi-smart-bulb' } },
    { params: { id: 'laptop-stand' } },
  ];

  return {
    paths,
    fallback: 'blocking' // Enable ISR for new products
  };
}

export async function getStaticProps({ params }) {
  const { id } = params;
  
  // In production, fetch from your database
  // const product = await fetchProduct(id);
  
  return {
    props: {
      productId: id,
    },
    revalidate: 60, // Revalidate every minute for live data
  };
}