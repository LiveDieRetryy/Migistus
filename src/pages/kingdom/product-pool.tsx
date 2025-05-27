// pages/kingdom/product-pool.tsx
import Head from "next/head";
import ProductPoolEditor from "@/components/kingdom/ProductPoolEditor"; // adjust path if needed

export default function ProductPoolPage() {
  return (
    <>
      <Head>
        <title>The King's Domain — Product Pool</title>
      </Head>
      <ProductPoolEditor />
    </>
  );
}
