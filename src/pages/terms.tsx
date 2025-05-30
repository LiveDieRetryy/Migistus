import Head from "next/head";

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Service - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">Terms of Service</h1>
        <div className="max-w-2xl text-zinc-300 text-left space-y-4">
          <p>
            By using MIGISTUS, you agree to our terms and conditions. Please review this page for the latest updates on our policies regarding user conduct, purchases, and platform use.
          </p>
          <p>
            This is a placeholder for the full Terms of Service. Please contact us for more details.
          </p>
        </div>
      </div>
    </>
  );
}
