import Head from "next/head";
import { useRouter } from "next/router";
import ProductPage from "@/components/drops/ProductPage";

export default function DropPage() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <>
      <Head>
        <title>MIGISTUS Drop</title>
        <meta name="description" content="Join the drop and save with the community." />
      </Head>
      {id && <ProductPage productId={id} />}
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