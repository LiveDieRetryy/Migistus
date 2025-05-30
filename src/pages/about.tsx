import Head from "next/head";

export default function AboutPage() {
  return (
    <>
      <Head>
        <title>About - MIGISTUS</title>
      </Head>
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
        <h1 className="text-4xl font-bold text-yellow-400 mb-4">About MIGISTUS</h1>
        <p className="max-w-2xl text-lg text-zinc-300 text-center">
          MIGISTUS is a community-powered marketplace where collective buying unlocks exclusive pricing. Our mission is to empower shoppers to shape what comes next and save together.
        </p>
      </div>
    </>
  );
}
