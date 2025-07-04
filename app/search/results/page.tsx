import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchResultsFullScreenClient } from "../components/search-results-fullscreen-client";

export default async function SearchResultsPage({
  searchParams,
}: {
  searchParams: {
    q?: string;
    role?: string;
    content_type?: string;
    subjects?: string;
    styles?: string;
    max_budget?: string;
    limit?: string;
    page?: string;
    has_docs?: string;
    docs_count?: string;
    creator_index?: string;
  };
}) {
  // Ensure searchParams is properly awaited
  const params = await Promise.resolve(searchParams);
  const query = params.q || "";
  const role = params.role || "";
  const contentType =
    params.content_type === "videos"
      ? "videos"
      : params.content_type === "images"
        ? "images"
        : "all";
  const subjects = params.subjects ? params.subjects.split(",") : [];
  const styles = params.styles ? params.styles.split(",") : [];
  const maxBudget = params.max_budget
    ? parseInt(params.max_budget, 10)
    : undefined;
  const limit = params.limit ? parseInt(params.limit, 10) : 50;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const hasDocuments = params.has_docs === "true";
  const documentsCount = params.docs_count
    ? parseInt(params.docs_count, 10)
    : 0;
  const creatorIndex = params.creator_index
    ? parseInt(params.creator_index, 10)
    : 0;

  if (!query || !role) {
    // Redirect back to search page if no query or role
    return {
      redirect: {
        destination: "/search",
        permanent: false,
      },
    };
  }

  return (
    <div className="min-h-screen">
      <Suspense
        fallback={
          <div className="h-screen w-full">
            <Skeleton variant="creator" className="h-full w-full" />
          </div>
        }
      >
        <SearchResultsFullScreenClient
          query={query}
          role={role}
          contentType={contentType as "all" | "videos" | "images"}
          subjects={subjects}
          styles={styles}
          maxBudget={maxBudget}
          initialLimit={limit}
          initialPage={page}
          hasDocuments={hasDocuments}
          documentsCount={documentsCount}
          initialCreatorIndex={creatorIndex}
        />
      </Suspense>
    </div>
  );
}
