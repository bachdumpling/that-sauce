"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { search } from "@/lib/api/search";
import { SearchResponse } from "@/types/search";
import { CreatorResultCard } from "@/components/shared/creator-result-card";
import { createClient } from "@/utils/supabase/client";

interface SearchResultsData {
  success: boolean;
  data: SearchResponse;
}

interface SearchResultsFullScreenClientProps {
  query: string;
  role: string;
  contentType: "all" | "videos" | "images";
  subjects: string[];
  styles: string[];
  maxBudget?: number;
  initialLimit: number;
  initialPage: number;
  hasDocuments?: boolean;
  documentsCount?: number;
  initialCreatorIndex: number;
}

export function SearchResultsFullScreenClient({
  query,
  role,
  contentType,
  subjects,
  styles,
  maxBudget,
  initialLimit,
  initialPage,
  hasDocuments,
  documentsCount,
  initialCreatorIndex,
}: SearchResultsFullScreenClientProps) {
  const router = useRouter();
  const [results, setResults] = useState<SearchResultsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [currentCreatorIndex, setCurrentCreatorIndex] = useState(initialCreatorIndex);
  const [user, setUser] = useState<any>(null);

  // Get user for CreatorResultCard
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    getUser();
  }, []);

  // Initial search when component mounts
  useEffect(() => {
    performSearch();
  }, []);

  const performSearch = async () => {
    setIsLoading(true);
    try {
      const data = await search({
        q: query,
        contentType,
        limit,
        page,
        role,
        subjects,
        styles,
        maxBudget,
        hasDocuments,
        documentCount: documentsCount,
      });

      if (
        data &&
        data.success !== false &&
        data.data &&
        Array.isArray(data.data.results)
      ) {
        setResults(data);
      } else {
        setResults({
          success: true,
          data: {
            results: [],
            page: page,
            limit: limit,
            total: 0,
            query: query,
            content_type: contentType,
          },
        });
      }
    } catch (err) {
      console.error("Search error:", err);
      setResults({
        success: true,
        data: {
          results: [],
          page: page,
          limit: limit,
          total: 0,
          query: query,
          content_type: contentType,
        },
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSearch = () => {
    const params = new URLSearchParams();
    params.set("q", query);
    params.set("role", role);

    if (contentType !== "all") {
      params.set("content_type", contentType);
    }

    if (subjects && subjects.length > 0) {
      params.set("subjects", subjects.join(","));
    }

    if (styles.length > 0) {
      params.set("styles", styles.join(","));
    }

    if (maxBudget !== undefined) {
      params.set("max_budget", maxBudget.toString());
    }

    if (hasDocuments) {
      params.set("has_docs", "true");
      if (documentsCount) {
        params.set("docs_count", documentsCount.toString());
      }
    }

    router.push(`/search?${params.toString()}`);
  };

  const updateURL = (newCreatorIndex: number) => {
    const params = new URLSearchParams(window.location.search);
    params.set("creator_index", newCreatorIndex.toString());
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.push(newUrl, { scroll: false });
  };

  const handlePreviousCreator = () => {
    if (results && currentCreatorIndex > 0) {
      const newIndex = currentCreatorIndex - 1;
      setCurrentCreatorIndex(newIndex);
      updateURL(newIndex);
    }
  };

  const handleNextCreator = () => {
    if (results && currentCreatorIndex < results.data.results.length - 1) {
      const newIndex = currentCreatorIndex + 1;
      setCurrentCreatorIndex(newIndex);
      updateURL(newIndex);
    }
  };

  if (isLoading && !results) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Skeleton variant="creator" className="h-full w-full" />
      </div>
    );
  }

  if (!results || results.data.results.length === 0) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center space-y-6">
          <h3 className="text-2xl font-bold">No results found</h3>
          <p className="text-gray-500">
            Try adjusting your search criteria or explore different terms.
          </p>
          <Button onClick={handleBackToSearch}>Back to Search</Button>
        </div>
      </div>
    );
  }

  const currentCreator = results.data.results[currentCreatorIndex];
  const totalCreators = results.data.results.length;

  return (
    <div className="h-screen w-full relative overflow-hidden">
      {/* Fixed Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between p-4">
          <Button variant="ghost" onClick={handleBackToSearch}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Search
          </Button>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {currentCreatorIndex + 1} of {totalCreators}
            </span>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousCreator}
                disabled={currentCreatorIndex === 0}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextCreator}
                disabled={currentCreatorIndex === totalCreators - 1}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Creator Content - Full Screen */}
      <div className="pt-20 h-full overflow-auto">
        <div className="h-full">
          {currentCreator && (
            <CreatorResultCard
              key={currentCreator.creator.id}
              creator={currentCreator}
              role={role}
              user={user}
              creatorIndex={currentCreatorIndex}
            />
          )}
        </div>
      </div>

      {/* Navigation Arrows - Side of screen */}
      {currentCreatorIndex > 0 && (
        <button
          onClick={handlePreviousCreator}
          className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}

      {currentCreatorIndex < totalCreators - 1 && (
        <button
          onClick={handleNextCreator}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 z-40 p-3 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-all duration-200"
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}

      {/* Progress indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40">
        <div className="flex space-x-2">
          {Array.from({ length: Math.min(totalCreators, 10) }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentCreatorIndex % 10
                  ? "bg-black"
                  : "bg-gray-300"
              }`}
            />
          ))}
          {totalCreators > 10 && (
            <span className="text-xs text-gray-500 ml-2">
              ...{totalCreators - 10} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
} 