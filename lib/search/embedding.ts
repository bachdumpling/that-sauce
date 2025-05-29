import {
  GoogleGenerativeAI,
  GenerateContentResult,
} from "@google/generative-ai";

export interface EmbeddingResponse {
  values: number[];
  processed_text: string;
}

export type SearchType = "creators" | "projects" | "images" | "media";

// Initialize Gemini AI - this will run on the server side
let genAI: GoogleGenerativeAI;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in environment variables");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

const searchPrompts = {
  creators: `Process this search query to enhance its relevance for searching creative professionals based on their style and expertise and their work.
  Rules:
  1. KEEP ALL ORIGINAL QUERY TERMS intact
  2. Add no extra terms
  3. Do not replace or remove any original terms
  4. Fix any misspellings but preserve intentional slang/creative terms
  5. Keep grammar natural, don't over-formalize
  6. Return the processed query with original terms plus any additions (max 1)
  7. Avoid adding generic terms like "projects, images, portfolio, website, photographers, artists, designers, etc" unless explicitly relevant.
  8. Avoid adding names of specific apps, platforms, tools, people, etc unless explicitly relevant.
  9. Avoid adding terms that are not relevant to the search query.
  Original query: `,

  projects: `Process this search query to enhance its relevance for searching creative projects.
  Rules:
  1. KEEP ALL ORIGINAL QUERY TERMS intact
  2. Only add up to 3 highly relevant terms if necessary
  3. Do not replace or remove any original terms
  4. Fix any misspellings but preserve intentional slang/creative terms
  5. Keep grammar natural, don't over-formalize
  6. Return the processed query with original terms plus any additions (max 3)
  
  Example:
  "retro gaming pixel art" → "retro gaming pixel art 8bit"
  "minimalist packaging n branding" → "minimalist packaging and branding clean"
  
  Original query: `,

  images: `Process this search query to enhance its relevance for searching images.
  Rules:
  1. KEEP ALL ORIGINAL QUERY TERMS intact
  2. Only add up to 2 highly relevant visual terms if necessary
  3. Do not replace or remove any original terms
  4. Fix any misspellings but preserve intentional slang/creative terms
  5. Keep grammar natural, don't over-formalize
  6. Return the processed query with original terms plus any additions (max 2)
  
  Original query: `,

  media: `Process this search query to enhance its relevance for searching creative media.
  Rules:
  1. KEEP ALL ORIGINAL QUERY TERMS intact
  2. Only add up to 2 highly relevant visual terms if necessary
  3. Do not replace or remove any original terms
  4. Fix any misspellings but preserve intentional slang/creative terms
  5. Keep grammar natural, don't over-formalize
  6. Return the processed query with original terms plus any additions (max 2)
  
  Original query: `,
};

/**
 * Process search query using Gemini to enhance search relevance
 */
async function processSearchQuery(
  query: string,
  type: SearchType = "creators"
): Promise<string> {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });
    const prompt = searchPrompts[type] + `"${query}"`;

    const result: GenerateContentResult = await model.generateContent(prompt);
    let processedQuery = result.response
      .text()
      .trim()
      .replace(/[^\w\s]/g, " ")
      .replace(/\s+/g, " ")
      // Remove common suffixes
      .replace(/\s+(portfolio|projects?|images?)\b/gi, "")
      .trim();

    // Ensure all original terms are present
    const originalTerms = query
      .toLowerCase()
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(Boolean);
    const processedTerms = processedQuery.toLowerCase().split(/\s+/);

    // Add any missing original terms
    originalTerms.forEach((term) => {
      if (!processedTerms.includes(term)) {
        processedQuery = `${processedQuery} ${term}`;
      }
    });

    return processedQuery;
  } catch (error) {
    console.warn(
      "Error processing search query, falling back to original:",
      error
    );
    // Fall back to original query if processing fails
    return query;
  }
}

/**
 * Generate embedding for search query using Gemini API
 */
export async function generateEmbedding(
  text: string,
  type: SearchType = "creators"
): Promise<EmbeddingResponse | null> {
  try {
    if (!text) return null;

    // Process the query before generating embedding
    const processedText = await processSearchQuery(text, type);
    const ai = getGenAI();
    const model = ai.getGenerativeModel({ model: "text-embedding-004" });

    // Use processed text instead of original
    const result = await model.embedContent(processedText);
    const embedding = await result.embedding;

    // Convert embedding to array and ensure all values are valid numbers
    const embeddingArray = Object.values(embedding.values || {}).map((val) =>
      typeof val === "number" && !isNaN(val) && isFinite(val) ? val : 0
    );

    // Ensure we have exactly 768 dimensions
    const values = Array.from({ length: 768 }, (_, i) =>
      i < embeddingArray.length ? embeddingArray[i] : 0
    );

    // Add processed text to the result for transparency
    return {
      values,
      processed_text: processedText,
    };
  } catch (error) {
    console.error("Error generating embedding:", error);
    return null;
  }
}
