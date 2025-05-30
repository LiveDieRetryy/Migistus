import Head from "next/head";

export default function ContactPage() {
  return (
    <>
      <Head>
        <title>Contact - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">Contact Us</h1>
        <div className="max-w-2xl text-zinc-300 text-center space-y-4">
          <p>
            Have questions, feedback, or need support? Reach out to the MIGISTUS team!
          </p>
          <p>
            Email: <a href="mailto:support@migistus.com" className="text-yellow-400 underline">support@migistus.com</a>
          </p>
          <p>
            We aim to respond within 1-2 business days.
          </p>
        </div>
      </div>
    </>
  );
}
