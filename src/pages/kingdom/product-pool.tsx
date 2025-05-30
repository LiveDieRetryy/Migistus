// pages/kingdom/product-pool.tsx
import Head from "next/head";
import DashboardLayout from "@/components/DashboardLayout";
import ProductPoolEditor from "@/components/kingdom/ProductPoolEditor"; // adjust path if needed

export default function ProductPoolPage() {
  return (
    <DashboardLayout>
      <Head>
        <title>The King's Domain — Product Pool</title>
      </Head>
      <ProductPoolEditor />
    </DashboardLayout>
  );
}
