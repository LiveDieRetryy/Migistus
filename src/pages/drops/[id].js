import Head from "next/head";
import ProductPage from "@/components/drops/ProductPage";

export default function DropPage({ id }) {
  if (!id) return null;
  return (
    <>
      <Head>
        <title>MIGISTUS Drop</title>
        <meta name="description" content="Join the drop and save with the community." />
      </Head>
      <ProductPage productId={id} /> {/* id is actually the slug */}
    </>
  );
}

export async function getServerSideProps({ params }) {
  return {
    props: {
      id: params.id // this is the slug
    }
  };
}