import Head from "next/head";

export default function SuppliersPage() {
  return (
    <>
      <Head>
        <title>Suppliers - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">For Suppliers</h1>
        <p className="max-w-2xl text-lg text-zinc-300 text-center mb-4">
          Are you a manufacturer, distributor, or brand interested in launching your products on MIGISTUS?
        </p>
        <p className="max-w-2xl text-zinc-400 text-center mb-8">
          We partner with suppliers who value transparency, quality, and community-driven commerce. Reach out to our team to discuss opportunities for product drops, bulk sales, and collaborative launches.
        </p>
        <div className="bg-zinc-900/70 rounded-xl border border-yellow-400/10 shadow-lg p-8 max-w-lg w-full text-center">
          <h2 className="text-yellow-400 text-2xl font-semibold mb-2">Get in Touch</h2>
          <p className="text-zinc-300 mb-4">
            Email: <a href="mailto:suppliers@migistus.com" className="text-yellow-400 underline">suppliers@migistus.com</a>
          </p>
          <p className="text-zinc-400 text-sm">
            Please include your company name, product details, and any relevant links. We look forward to working with you!
          </p>
        </div>
      </div>
    </>
  );
}
