import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Head from "next/head";
import MainNavbar from "@/components/nav/MainNavbar";

export default function ProfileIndexPage() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated || !user) {
        router.push("/account");
      } else {
        const slug = user.username
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "");
        router.push(`/account/profile/${slug}`);
      }
    }
  }, [user, isAuthenticated, loading, router]);

  return (
    <>
      <Head>
        <title>My Profile - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center">
        <div className="text-yellow-400 text-xl">Redirecting to your profile...</div>
      </div>
    </>
  );
}
