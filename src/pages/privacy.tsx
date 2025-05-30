import Head from "next/head";

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">Privacy Policy</h1>
        <div className="max-w-2xl text-zinc-300 text-left space-y-4">
          <p>
            Your privacy is important to us. MIGISTUS collects only the data necessary to provide our services and never sells your information to third parties.
          </p>
          <p>
            This is a placeholder for the full Privacy Policy. Please contact us for more details.
          </p>
        </div>
      </div>
    </>
  );
}
