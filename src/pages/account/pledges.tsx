import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";

export default function MyCurrentPledgesPage() {
  return (
    <>
      <Head>
        <title>My Current Pledges - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-2xl bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">My Current Pledges</h1>
          <div className="text-gray-400 text-center">Your active pledges will appear here.</div>
          <div className="mt-8 text-center">
            <Link href="/account" className="text-yellow-400 underline">Back to Account Overview</Link>
          </div>
        </div>
      </div>
    </>
  );
}
