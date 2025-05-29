import {
  searchAction,
  getSearchHistoryAction,
  saveSearchHistoryAction,
  getPopularSearchesAction,
  enhanceSearchPromptAction,
  deleteSearchHistoryEntryAction,
  clearSearchHistoryAction,
} from "@/actions/search-actions";
import {
  SearchQueryParams,
  SearchHistoryEntry,
  PopularSearch,
  SearchEnhancement,
  SearchResponse,
} from "@/types/search";

/**
 * Search for creators and projects
 */
export async function search(params: SearchQueryParams) {
  const { q, contentType = "all", limit = 10, page = 1, ...filters } = params;

  return await searchAction(q, {
    contentType,
    limit,
    page,
    ...filters,
  });
}

/**
 * Get user's search history
 */
export async function getSearchHistory(limit: number = 10, page: number = 1) {
  const result = await getSearchHistoryAction(limit, page);

  if (result.success && result.data) {
    return {
      success: true,
      history: result.data.entries,
      pagination: {
        page: result.data.page,
        limit: result.data.limit,
        total: result.data.total,
        hasMore: result.data.hasMore,
      },
    };
  }

  throw new Error(result.error || "Failed to fetch search history");
}

/**
 * Delete a search history entry
 */
export async function deleteSearchHistoryEntry(id: string) {
  const result = await deleteSearchHistoryEntryAction(id);

  if (result.success) {
    return result;
  }

  throw new Error(result.error || "Failed to delete search history entry");
}

/**
 * Clear all search history
 */
export async function clearSearchHistory() {
  const result = await clearSearchHistoryAction();

  if (result.success) {
    return result;
  }

  throw new Error(result.error || "Failed to clear search history");
}

/**
 * Get popular searches
 */
export async function getPopularSearches(): Promise<PopularSearch[]> {
  const result = await getPopularSearchesAction();

  if (result.success) {
    return result.data || [];
  }

  throw new Error(result.error || "Failed to fetch popular searches");
}

/**
 * Enhance search prompt with AI suggestions
 */
export async function enhanceSearchPrompt(
  query: string
): Promise<SearchEnhancement> {
  const result = await enhanceSearchPromptAction(query);

  if (result.success && result.data) {
    return result.data;
  }

  throw new Error(result.error || "Failed to enhance search prompt");
}

// Export types for convenience
export type {
  SearchQueryParams,
  SearchHistoryEntry,
  PopularSearch,
  SearchEnhancement,
  SearchResponse,
};
