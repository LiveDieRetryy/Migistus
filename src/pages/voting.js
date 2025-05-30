import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import VotingBoard from "@/components/voting/VotingBoard";

export default function VotingPage() {
  return (
    <>
      <Head>
        <title>Vote for Drops - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-zinc-950 text-white px-2 sm:px-8 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-4xl font-bold text-yellow-400 mb-6 text-center">
            Vote for Upcoming Drops
          </h1>
          <p className="text-gray-400 text-base sm:text-lg mb-10 text-center">
            Cast your vote to help decide which products launch next. Guild and
            MIGISTUS members get extra voting power!
          </p>
          {/* Voting Board */}
          <div className="bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-4 sm:p-8 mb-8">
            <VotingBoard />
          </div>
          {/* Example: Voting cards grid (if you have a list of products to vote on) */}
          {/* 
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-zinc-900 border border-yellow-500/20 rounded-lg p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-2">{product.name}</h2>
                <p className="text-gray-400 text-sm sm:text-base">{product.description}</p>
                <button className="mt-4 w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 rounded transition text-base">
                  Vote
                </button>
              </div>
            ))}
          </div>
          */}
        </div>
      </div>
    </>
  );
}