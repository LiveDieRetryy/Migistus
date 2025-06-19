import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function EditSocialProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;
    // Find user profile by slug
    if (typeof window !== "undefined") {
      // Search all user profiles for matching slug
      const allKeys = Object.keys(localStorage).filter(
        (key) => key.startsWith("user_") && key.endsWith("_profile")
      );
      for (const key of allKeys) {
        try {
          const profile = JSON.parse(localStorage.getItem(key) || "{}");
          const usernameSlug = profile.username
            ? profile.username.toLowerCase().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
            : "";
          if (usernameSlug === slug) {
            setProfile(profile);
            break;
          }
        } catch {}
      }
    }
  }, [slug]);

  return (
    <>
      <Head>
        <title>Edit Social Profile - MIGISTUS</title>
      </Head>
      <MainNavbar />
      <div className="min-h-screen bg-black text-white flex flex-col items-center py-12 px-4">
        <div className="w-full max-w-2xl bg-zinc-900 border border-yellow-500/20 rounded-2xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-yellow-400 mb-6 text-center">Edit Social Profile</h1>
          {profile ? (
            <div className="text-gray-400 text-center">Profile editing coming soon for <span className="text-yellow-400">{profile.username}</span>.</div>
          ) : (
            <div className="text-gray-400 text-center">Profile editing coming soon.</div>
          )}
          <div className="mt-8 text-center">
            <Link href="/account" className="text-yellow-400 underline">Back to Account Overview</Link>
          </div>
        </div>
      </div>
    </>
  );
}
