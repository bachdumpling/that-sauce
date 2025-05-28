import { ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import { CreatorHeader } from "./components/creator-header";
import { TabsNav } from "./components/tabs-nav";
import { Creator } from "@/types";
import { getCreatorAction } from "@/actions/creator-actions";

// Props that will be passed to child components
interface CreatorPageProps {
  creator: Creator;
}

export default async function CreatorLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { username: string };
}) {
  // Await params before destructuring
  const resolvedParams = await Promise.resolve(params);
  const { username } = resolvedParams;

  // Fetch creator data with full details including isOwner
  let creator;
  try {
    const result = await getCreatorAction(username);

    // If no creator was found, just return the children
    // The page component will handle the notFound() call
    if (!result.success || !result.data) {
      return children;
    }

    creator = result.data;
  } catch (error) {
    console.error("Error fetching creator:", error);
    // Let the page component handle the notFound() call
    return children;
  }

  return (
    <>
      <div className="w-full mx-auto">
        <CreatorHeader creator={creator} username={username} />
        <TabsNav creator={creator} username={username} />
        {children}
      </div>
      <Toaster />
    </>
  );
}
