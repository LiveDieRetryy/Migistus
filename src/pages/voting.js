import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";
import VotingBoardComponent from "@/components/voting/VotingBoard";

export default function VotingPage() {
  return (
    <>
      <Head>
        <title>Product Voting - MIGISTUS</title>
        <meta name="description" content="Vote on upcoming products and help shape the future drops on MIGISTUS." />
      </Head>

      <MainNavbar />
      <VotingBoardComponent />
    </>
  );
}