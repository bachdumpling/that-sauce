import { Suspense } from "react";
import { AdminCreatorsClient } from "./admin-creators-client";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchParams {
  page?: string;
  limit?: string;
  status?: string;
  search?: string;
}

export default async function AdminCreatorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const limit = parseInt(params.limit || "10");
  const status = params.status || "all";
  const search = params.search || "";

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Creator Management</h1>
        <p className="mt-2 text-muted-foreground">
          Manage creator profiles, approve or reject applications, and monitor
          platform activity.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        }
      >
        <AdminCreatorsClient
          initialPage={page}
          initialLimit={limit}
          initialStatus={status}
          initialSearch={search}
        />
      </Suspense>
    </div>
  );
}
