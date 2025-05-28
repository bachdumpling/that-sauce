import { createClient } from "@/utils/supabase/server";
import { NavClient } from "./nav-client";

export async function Nav() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get creator profile if it exists
  let creatorUsername = null;
  let profile = null;
  if (user) {
    const { data: creator } = await supabase
      .from("creators")
      .select("username")
      .eq("profile_id", user.id)
      .single();

    if (creator) {
      creatorUsername = creator.username;
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
  }

  // Pass server data to client component
  return (
    <NavClient
      initialUser={user}
      creatorUsername={creatorUsername}
      profile={profile}
    />
  );
}
