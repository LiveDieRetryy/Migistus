import MainNavbar from "@/components/nav/MainNavbar";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { activityTracker } from "@/utils/activityTracker";

export default function EditSocialProfilePage() {
  const router = useRouter();
  const { slug } = router.query;
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!slug) return;

    // Track profile page access
    activityTracker.trackPageView(`/account/profile/${slug}`);

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
            ? profile.username
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "-")
                .replace(/-+/g, "-")
                .replace(/^-|-$/g, "")
            : "";
          if (usernameSlug === slug) {
            setProfile(profile);

            // Track profile view with specific user details
            activityTracker.trackProfileView(profile.id, profile.username);
            activityTracker.trackAdminAction("profile_page_accessed", {
              viewedUserId: profile.id,
              viewedUsername: profile.username,
              profileSlug: slug,
            });

            break;
          }
        } catch {}
      }
    }
  }, [slug]);

  return (
    <>
      <Head>
        <title>Edit Social Profile</title>
      </Head>
      <MainNavbar />
      <div>
        <h1>Edit Social Profile</h1>
        {profile ? (
          <form>
            {/* Form fields for editing profile */}
            <div>
              <label>Username</label>
              <input
                type="text"
                value={profile.username}
                onChange={(e) =>
                  setProfile({ ...profile, username: e.target.value })
                }
              />
            </div>
            <div>
              <label>Bio</label>
              <textarea
                value={profile.bio}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              />
            </div>
            <button type="submit">Save Changes</button>
          </form>
        ) : (
          <p>Loading profile...</p>
        )}
      </div>
    </>
  );
}