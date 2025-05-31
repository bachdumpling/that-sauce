"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AdminCreatorCard } from "./admin-creator-card";
import { Search, Filter, Users, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Creator {
  id: string;
  username: string;
  location?: string;
  bio?: string;
  primary_role?: string[];
  status: string;
  created_at: string;
  avatar_url?: string;
  years_of_experience?: number;
}

interface CreatorImage {
  id: string;
  url: string;
  alt_text?: string;
}

interface AdminCreatorsClientProps {
  initialPage?: number;
  initialLimit?: number;
  initialStatus?: string;
  initialSearch?: string;
}

export function AdminCreatorsClient({
  initialPage = 1,
  initialLimit = 10,
  initialStatus = "all",
  initialSearch = "",
}: AdminCreatorsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters and pagination
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [status, setStatus] = useState(initialStatus);
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);

  // Update URL when filters change
  const updateURL = (newFilters: Record<string, string | number>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        params.set(key, value.toString());
      } else {
        params.delete(key);
      }
    });

    router.push(`/admin/creators?${params.toString()}`);
  };

  // Fetch creators
  const fetchCreators = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status !== "all" && { status }),
        ...(search && { search }),
      });

      const response = await fetch(`/api/admin/creators?${params}`);
      const data = await response.json();

      if (data.success) {
        setCreators(data.data.creators);
        setTotal(data.data.total);
        setTotalPages(Math.ceil(data.data.total / limit));
      } else {
        console.error("Failed to fetch creators:", data.error);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search submit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
    updateURL({ search: searchInput, page: 1, status, limit });
  };

  // Handle filter changes
  const handleStatusChange = (newStatus: string) => {
    setStatus(newStatus);
    setPage(1);
    updateURL({ status: newStatus, page: 1, search, limit });
  };

  const handleLimitChange = (newLimit: string) => {
    const limitNum = parseInt(newLimit);
    setLimit(limitNum);
    setPage(1);
    updateURL({ limit: limitNum, page: 1, search, status });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    updateURL({ page: newPage, search, status, limit });
  };

  // Handle creator updates
  const handleCreatorUpdate = () => {
    fetchCreators();
  };

  // Fetch data when filters change
  useEffect(() => {
    fetchCreators();
  }, [page, limit, status, search]);

  const statusCounts = {
    all: total,
    approved: creators.filter((c) => c.status === "approved").length,
    pending: creators.filter((c) => c.status === "pending").length,
    rejected: creators.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col space-y-4">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                type="text"
                placeholder="Search creators by username, location, or bio..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10"
              />
            </div>
          </form>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={limit.toString()} onValueChange={handleLimitChange}>
              <SelectTrigger className="w-full sm:w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Status Summary */}
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-sm">
            Total: {total}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Approved: {creators.filter((c) => c.status === "approved").length}
          </Badge>
          <Badge variant="secondary" className="text-sm">
            Pending: {creators.filter((c) => c.status === "pending").length}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Rejected: {creators.filter((c) => c.status === "rejected").length}
          </Badge>
        </div>
      </div>

      {/* Creators Grid */}
      {loading ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-muted-foreground">Loading creators...</span>
            </div>
          </CardContent>
        </Card>
      ) : creators.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No creators found</h3>
            <p className="text-muted-foreground text-center max-w-md">
              {search || status !== "all"
                ? "Try adjusting your search criteria or filters."
                : "No creators have been registered yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {creators.map((creator) => (
            <AdminCreatorCard
              key={creator.id}
              creator={creator}
              onUpdate={handleCreatorUpdate}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="flex flex-col sm:flex-row items-center justify-between py-4 space-y-4 sm:space-y-0">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, total)} of {total} creators
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1}
              >
                Previous
              </Button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={page === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0 hidden sm:flex"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {/* Mobile pagination indicator */}
                <div className="sm:hidden px-3 py-1 text-sm bg-muted rounded">
                  {page} / {totalPages}
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
