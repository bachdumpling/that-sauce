"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { generateEmbedding, SearchType } from "@/lib/search/embedding";
import {
  groupSearchResultsByCreator,
  validateSearchParams,
} from "@/lib/search/utils";
import {
  RawSearchResult,
  CreatorWithContent,
  SearchResponse,
} from "@/types/search";
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Search creators and projects using vector similarity
 */
export async function searchAction(
  query: string,
  filters?: Record<string, any>
) {
  console.log("🔍 SEARCH STARTED");
  console.log("Raw query:", query);
  console.log("Raw filters:", filters);

  try {
    const supabase = await createClient();

    // Get authenticated user (optional for search)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    console.log("👤 User authenticated:", !!user, user?.id || "anonymous");

    // Validate and clean search parameters
    const validatedParams = validateSearchParams({
      query,
      contentType: filters?.contentType || filters?.content_type,
      limit: filters?.limit,
      page: filters?.page,
    });

    console.log("✅ Validated params:", validatedParams);

    if (!validatedParams.query) {
      console.log("❌ No search query provided");
      return {
        success: false,
        error: "Search query is required",
        message: "Please provide a search query",
      };
    }

    // Generate embedding for the search query
    console.log("🧠 Generating embedding for query:", validatedParams.query);
    const queryEmbedding = await generateEmbedding(
      validatedParams.query,
      "creators"
    );

    console.log("🔢 Embedding generated:");
    console.log("- Has values:", !!queryEmbedding?.values);
    console.log("- Length:", queryEmbedding?.values?.length || 0);
    console.log("- Processed text:", queryEmbedding?.processed_text);
    console.log("- First 5 values:", queryEmbedding?.values?.slice(0, 5));

    if (!queryEmbedding?.values?.length) {
      console.log("❌ Failed to generate embedding");
      return {
        success: true,
        data: {
          results: [],
          page: validatedParams.page,
          limit: validatedParams.limit,
          total: 0,
          query: validatedParams.query,
          content_type: validatedParams.contentType,
        },
        message: "Search completed successfully",
      };
    }

    // Use the RPC function for vector search
    console.log("🔎 Calling search_creative_content RPC with:");
    console.log("- match_threshold: 0.1");
    console.log("- match_limit:", validatedParams.limit);
    console.log("- content_filter:", validatedParams.contentType);

    const { data: rawResults, error: searchError } = await supabase.rpc(
      "search_creative_content",
      {
        query_embedding: queryEmbedding.values,
        match_threshold: 0.1,
        match_limit: validatedParams.limit,
        content_filter: validatedParams.contentType,
      }
    );

    console.log("📊 RPC search results:");
    console.log("- Error:", searchError);
    console.log("- Raw results type:", typeof rawResults);
    console.log("- Raw results length:", rawResults?.length || 0);
    console.log("- Raw results:", rawResults);

    if (searchError) {
      console.error("❌ Search RPC error:", searchError);
      return {
        success: false,
        error: "Search failed",
        message: "An error occurred while searching",
      };
    }

    // Debug logging for raw results
    if (rawResults && rawResults.length > 0) {
      console.log("🔍 First raw result detailed structure:");
      console.log(JSON.stringify(rawResults[0], null, 2));

      console.log("🔍 All raw result keys from first result:");
      console.log(Object.keys(rawResults[0] || {}));
    } else {
      console.log("❌ No raw results returned from RPC");

      // Let's check if there's any data in the database at all
      console.log("🔍 Checking database for any data...");

      const { data: creatorCount } = await supabase
        .from("creators")
        .select("id", { count: "exact", head: true });

      const { data: projectCount } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true });

      const { data: imageCount } = await supabase
        .from("images")
        .select("id", { count: "exact", head: true });

      const { data: videoCount } = await supabase
        .from("videos")
        .select("id", { count: "exact", head: true });

      console.log("📊 Database counts:");
      console.log("- Creators:", creatorCount);
      console.log("- Projects:", projectCount);
      console.log("- Images:", imageCount);
      console.log("- Videos:", videoCount);

      // Check if we have any projects with embeddings
      const { data: embeddingCount } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .not("embedding", "is", null);

      console.log("- Projects with embeddings:", embeddingCount);

      // Check if the RPC function exists
      const { data: rpcExists } = await supabase.rpc(
        "search_creative_content",
        {
          query_embedding: Array(768).fill(0),
          match_threshold: 0.1,
          match_limit: 1,
          content_filter: "all",
        }
      );

      console.log(
        "🔧 RPC function test (with zero embedding):",
        rpcExists?.length || 0,
        "results"
      );
    }

    // Cast the raw results to the expected type
    const typedResults = rawResults as RawSearchResult[];

    // Get the total count from the first result
    const totalCount =
      typedResults && typedResults.length > 0
        ? Number(typedResults[0].total_count)
        : 0;

    console.log("📈 Total count from results:", totalCount);

    // Group results by creator using the proper function
    console.log("🏗️ Grouping results by creator...");
    const groupedResults = groupSearchResultsByCreator(typedResults || []);

    console.log("👥 Grouped results:");
    console.log("- Number of creators:", groupedResults.length);
    if (groupedResults.length > 0) {
      console.log("- First creator:", groupedResults[0].creator);
      console.log(
        "- First creator projects count:",
        groupedResults[0].projects.length
      );
      console.log("- First creator projects:", groupedResults[0].projects);
    }

    // Save search to history if user is authenticated
    if (user?.id) {
      console.log("💾 Saving search to history...");
      try {
        await saveSearchHistoryAction(
          validatedParams.query,
          validatedParams.contentType,
          totalCount,
          queryEmbedding.values
        );
        console.log("✅ Search history saved");
      } catch (historyError) {
        // Non-blocking error - continue with search results even if history save fails
        console.warn("⚠️ Failed to save search history:", historyError);
      }
    }

    const response: SearchResponse = {
      results: groupedResults,
      page: validatedParams.page,
      limit: validatedParams.limit,
      total: totalCount,
      query: validatedParams.query,
      content_type: validatedParams.contentType,
      processed_query: queryEmbedding.processed_text,
    };

    console.log("🎯 Final response:");
    console.log("- Results count:", response.results.length);
    console.log("- Total:", response.total);
    console.log("- Query:", response.query);
    console.log("- Processed query:", response.processed_query);
    console.log("🔍 SEARCH COMPLETED");

    return {
      success: true,
      data: response,
      message: "Search completed successfully",
    };
  } catch (error: any) {
    console.error("💥 Error in searchAction:", error);
    console.error("Error stack:", error.stack);
    return {
      success: false,
      error: error.message || "Search failed",
      message: "An unexpected error occurred while searching",
    };
  }
}

/**
 * Search creators specifically (backwards compatibility)
 */
export async function searchCreatorsAction(
  query: string,
  filters?: Record<string, any>
) {
  // Use the main search function for backwards compatibility
  return searchAction(query, filters);
}

/**
 * Save search query to history
 */
export async function saveSearchHistoryAction(
  query: string,
  contentType: string = "all",
  resultsCount: number = 0,
  embedding?: number[]
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to save search history",
      };
    }

    // Check for recent duplicates to avoid saving the same search multiple times
    const { data: recentSearches, error: recentError } = await supabase
      .from("search_history")
      .select("id, query, content_type, created_at, results_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (recentError) {
      console.error("Error checking recent searches:", recentError);
      // Continue with saving if we can't check recent searches
    } else if (recentSearches) {
      // Check for duplicates within the last 2 minutes
      const isDuplicate = recentSearches.some((entry: any) => {
        const isSameQuery =
          entry.query === query && entry.content_type === contentType;
        if (!isSameQuery) return false;

        const timeDiff =
          new Date().getTime() - new Date(entry.created_at).getTime();

        // Very recent (under 5 seconds) - likely a page reload
        if (timeDiff < 5000) return true;

        // Recent (under 2 minutes) with same result count - likely duplicate
        if (timeDiff < 120000 && entry.results_count === resultsCount)
          return true;

        return false;
      });

      if (isDuplicate) {
        return {
          success: true,
          data: null,
          message: "Duplicate search not saved",
        };
      }
    }

    // Save the search
    const { data, error } = await supabase
      .from("search_history")
      .insert({
        user_id: user.id,
        query,
        content_type: contentType,
        results_count: resultsCount,
        embedding,
      })
      .select()
      .single();

    if (error) {
      console.error("Error saving search history:", error);
      return {
        success: false,
        error: "Failed to save search history",
        message: "Could not save search to history",
      };
    }

    return {
      success: true,
      data,
      message: "Search history saved successfully",
    };
  } catch (error: any) {
    console.error("Error in saveSearchHistoryAction:", error);
    return {
      success: false,
      error: error.message || "Failed to save search history",
      message: "An error occurred while saving search history",
    };
  }
}

/**
 * Delete a search history entry
 */
export async function deleteSearchHistoryEntryAction(entryId: string) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to delete search history",
      };
    }

    // Delete the entry (RLS will ensure user can only delete their own entries)
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("id", entryId)
      .eq("user_id", user.id);

    if (error) {
      console.error("Error deleting search history entry:", error);
      return {
        success: false,
        error: "Failed to delete search history entry",
        message: "Could not delete the search history entry",
      };
    }

    return {
      success: true,
      data: null,
      message: "Search history entry deleted successfully",
    };
  } catch (error: any) {
    console.error("Error in deleteSearchHistoryEntryAction:", error);
    return {
      success: false,
      error: error.message || "Failed to delete search history entry",
      message: "An error occurred while deleting search history entry",
    };
  }
}

/**
 * Clear all search history for the authenticated user
 */
export async function clearSearchHistoryAction() {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to clear search history",
      };
    }

    // Delete all search history for the user
    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("Error clearing search history:", error);
      return {
        success: false,
        error: "Failed to clear search history",
        message: "Could not clear search history",
      };
    }

    return {
      success: true,
      data: null,
      message: "Search history cleared successfully",
    };
  } catch (error: any) {
    console.error("Error in clearSearchHistoryAction:", error);
    return {
      success: false,
      error: error.message || "Failed to clear search history",
      message: "An error occurred while clearing search history",
    };
  }
}

/**
 * Get popular searches
 */
export async function getPopularSearchesAction() {
  try {
    const supabase = await createClient();

    // Use the RPC function for popular searches
    const { data, error } = await supabase.rpc("get_popular_searches", {
      results_limit: 5,
    });

    if (error) {
      console.error("Error getting popular searches:", error);
      return {
        success: false,
        error: "Failed to retrieve popular searches",
        message: "Could not load popular searches",
      };
    }

    return {
      success: true,
      data: data || [],
      message: "Popular searches retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getPopularSearchesAction:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve popular searches",
      message: "An error occurred while retrieving popular searches",
    };
  }
}

/**
 * Get user's search history
 */
export async function getSearchHistoryAction(
  limit: number = 10,
  page: number = 1
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return {
        success: false,
        error: "Authentication required",
        message: "You must be logged in to view search history",
      };
    }

    const offset = (page - 1) * limit;

    // Get search history with pagination
    const { data, error } = await supabase
      .from("search_history")
      .select("id, query, content_type, created_at, results_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error getting search history:", error);
      return {
        success: false,
        error: "Failed to retrieve search history",
        message: "Could not load search history",
      };
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from("search_history")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      console.warn("Error getting search history count:", countError);
    }

    return {
      success: true,
      data: {
        entries: data || [],
        total: count || 0,
        page,
        limit,
        hasMore: (count || 0) > offset + limit,
      },
      message: "Search history retrieved successfully",
    };
  } catch (error: any) {
    console.error("Error in getSearchHistoryAction:", error);
    return {
      success: false,
      error: error.message || "Failed to retrieve search history",
      message: "An error occurred while retrieving search history",
    };
  }
}

/**
 * Enhance search prompt using AI to provide better search suggestions
 */
export async function enhanceSearchPromptAction(query: string) {
  try {
    if (!query) {
      return {
        success: false,
        error: "Search query is required",
        message: "Please provide a search query to enhance",
      };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        error: "AI service not configured",
        message: "Search enhancement is currently unavailable",
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Format the prompt for Gemini
    const promptTemplate = `
You are an expert creative industry search assistant. Help improve this initial search query to find the perfect creators. 

Initial query: "${query}"

Step 1: Identify what's missing from this query that would help find better matches. Consider:
- Specific style details (e.g., "minimalist" vs just "design")
- Technical specifications (e.g., "natural lighting portrait photography" vs just "photography")
- Industry verticals (e.g., "luxury fashion" vs just "fashion")
- Tone/mood (e.g., "bold, vibrant branding" vs just "branding")
- Visual elements (e.g., "flat illustration with geometric shapes" vs just "illustration")
- Do not suggest a creative role like: photographer, illustrator, etc... because the user already select the role they want to find beforehand

Step 2: Generate 3 thoughtful questions that would help the user refine their search.

Step 3: Suggest very brief phrases or short terms as answers to the previous questions.

Format your response as a JSON object with the following structure:
  [
    {
      "question": "First question to help refine search",
      "options": ["option1", "option2", "option3"]
    },
    {
      "question": "Second question to help refine search",
      "options": ["option1", "option2", "option3"]
    },
    {
      "question": "Third question to help refine search",
      "options": ["option1", "option2", "option3"]
    }
  ]

Only return valid JSON without any additional text.
`;

    // Call Gemini API to process the prompt
    const result = await model.generateContent(promptTemplate);
    const geminiResponse = result.response.text();

    // Parse the response
    let parsedResponse;
    try {
      // Clean the response string to remove any markdown formatting or additional text
      const cleanResponse = geminiResponse
        .replace(/```json\s*|\s*```/g, "")
        .trim();

      // Check if response starts with [ and ends with ] to ensure it's an array
      const validJsonString =
        cleanResponse.startsWith("[") && cleanResponse.endsWith("]")
          ? cleanResponse
          : geminiResponse;

      parsedResponse = JSON.parse(validJsonString);

      // Validate the structure of the parsed response
      if (!Array.isArray(parsedResponse)) {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse Gemini response as JSON:", parseError);
      console.error("Received response:", geminiResponse);
      return {
        success: false,
        error: "Failed to process search enhancement",
        message: "Could not generate search suggestions at this time",
      };
    }

    // Return the enhancement suggestions
    return {
      success: true,
      data: {
        original_query: query,
        enhancement: parsedResponse,
      },
      message: "Search enhancement generated successfully",
    };
  } catch (error: any) {
    console.error("Error in enhanceSearchPromptAction:", error);
    return {
      success: false,
      error: error.message || "Failed to enhance search prompt",
      message: "An error occurred while generating search suggestions",
    };
  }
}
