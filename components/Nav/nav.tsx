import { createClient } from "@/utils/supabase/server";
import { getActiveNavigation } from "@/sanity/lib/queries";
import { NavClient } from "./nav-client";

export async function Nav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get creator profile if it exists
  let creatorUsername = null;
  let profile = null;
  let creatorAvatar = null;

  if (user) {
    const { data: creator } = await supabase
      .from("creators")
      .select("username, avatar_url")
      .eq("profile_id", user.id)
      .single();

    if (creator) {
      creatorUsername = creator.username;
      creatorAvatar = creator.avatar_url;
    }

    // Get user profile information
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userProfile) {
      profile = userProfile;
    } else {
      profile = {
        first_name: user.user_metadata.name || "",
        last_name: "",
        avatar_url: user.user_metadata.avatar_url || "",
      };
    }

    // Prioritize creator avatar over profile avatar
    if (creatorAvatar) {
      profile = {
        ...profile,
        avatar_url: creatorAvatar,
      };
    }
  }

  // Fetch navigation content from Sanity
  let navigationContent = null;
  try {
    navigationContent = await getActiveNavigation();
  } catch (error) {
    console.error("Error fetching navigation content:", error);
    // Component will use fallback values if navigationContent is null
  }

  // Pass server data to client component
  return (
    <NavClient
      initialUser={user}
      creatorUsername={creatorUsername}
      profile={profile}
      navigationContent={navigationContent}
    />
  );
}
