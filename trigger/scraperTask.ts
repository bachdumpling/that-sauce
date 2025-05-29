// src/trigger/scraperTask.ts
import { logger, task } from "@trigger.dev/sdk/v3";
import type {
  ScrapedMedia,
  ScraperResult,
  ScraperPayload,
} from "../types/media";

interface VideoInfo {
  platform: string | null;
  videoId: string | null;
}

/**
 * Base scraper class with common functionality
 */
class BaseScraper {
  protected url: string;
  protected browser: any = null;
  protected page: any = null;

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Initialize the browser and page
   */
  async initialize() {
    logger.debug("Launching headless browser");

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction && process.env.BROWSERBASE_API_KEY) {
      // Use Browserbase in production
      logger.info("Connecting to Browserbase in production");
      try {
        const puppeteerCore = await import("puppeteer-core");
        this.browser = await puppeteerCore.default.connect({
          browserWSEndpoint: `wss://connect.browserbase.com?apiKey=${process.env.BROWSERBASE_API_KEY}`,
        });
      } catch (error) {
        logger.error(`Error connecting to Browserbase: ${error}`);
        throw error;
      }
    } else {
      // Use local Puppeteer in development
      logger.info("Launching browser in development");
      try {
        const puppeteer = await import("puppeteer");
        this.browser = await puppeteer.default.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
          ],
        });
      } catch (error) {
        logger.error(`Error launching browser: ${error}`);
        throw error;
      }
    }

    this.page = await this.browser.newPage();
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );
  }

  /**
   * Navigate to the URL with fallback
   */
  async navigateTo() {
    logger.debug(`Navigating to ${this.url}`);
    try {
      await this.page.goto(this.url, {
        waitUntil: "networkidle2",
        timeout: 60000,
      });
    } catch (navigationError: any) {
      logger.warn(`Navigation error: ${navigationError.message}`);
      if (navigationError.name === "TimeoutError") {
        logger.debug("Retrying navigation with more lenient condition");
        await this.page.goto(this.url, {
          waitUntil: "domcontentloaded",
          timeout: 30000,
        });
      } else {
        throw navigationError;
      }
    }
  }

  /**
   * Auto-scroll to load lazy content
   */
  async autoScroll() {
    try {
      await this.page.evaluate(async () => {
        await new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const maxScrollAttempts = 100;
          let scrollAttempt = 0;

          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;
            scrollAttempt++;

            if (
              totalHeight >= scrollHeight ||
              scrollAttempt >= maxScrollAttempts
            ) {
              clearInterval(timer);
              resolve(undefined);
            }
          }, 100);
        });
      });

      await this.page.evaluate(
        () => new Promise((resolve) => setTimeout(resolve, 2000))
      );
    } catch (error) {
      logger.warn(`Error during page scrolling: ${error}`);
    }
  }

  /**
   * Extract video platform and ID from URL
   */
  extractVideoInfo(url: string): VideoInfo {
    if (!url) return { platform: null, videoId: null };

    url = url.trim();

    // Check for Vimeo
    const vimeoPatterns = [
      /vimeo\.com\/(\d+)/,
      /vimeo\.com\/channels\/[^\/]+\/(\d+)/,
      /vimeo\.com\/groups\/[^\/]+\/videos\/(\d+)/,
      /player\.vimeo\.com\/video\/(\d+)/,
    ];

    for (const pattern of vimeoPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform: "vimeo", videoId: match[1] };
      }
    }

    // Check for YouTube
    const youtubePatterns = [
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/embed\/([^?\/]+)/,
      /youtube\.com\/v\/([^?\/]+)/,
    ];

    for (const pattern of youtubePatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform: "youtube", videoId: match[1] };
      }
    }

    return { platform: null, videoId: null };
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }

  /**
   * Main scrape method to be overridden by platform-specific scrapers
   */
  async scrape(): Promise<ScraperResult> {
    throw new Error("Method 'scrape()' must be implemented by subclass");
  }
}

/**
 * Behance-specific scraper implementation
 */
class BehanceScraper extends BaseScraper {
  /**
   * Handle Behance-specific page elements
   */
  async handlePageSpecifics() {
    try {
      const cookieButton = await this.page.$(
        '[data-testid="PrivacyBanner-acceptAllButton"]'
      );
      if (cookieButton) {
        await cookieButton.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
      }
    } catch (e) {
      logger.debug("No cookie banner found or error handling it");
    }

    try {
      const closeModalButton = await this.page.$("button.js-close-modal");
      if (closeModalButton) {
        await closeModalButton.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
      }
    } catch (e) {
      logger.debug("No modal found or error handling it");
    }
  }

  /**
   * Extract Behance-specific project images
   */
  async extractBehanceImages() {
    try {
      return await this.page.evaluate(() => {
        const moduleElements = Array.from(
          document.querySelectorAll('[aria-label^="Project Module"]')
        );
        const images: any[] = [];

        moduleElements.forEach((module) => {
          const imgElements = module.querySelectorAll("img");

          imgElements.forEach((img: any) => {
            const srcset = img.srcset;
            let bestSrc = img.src;

            if (srcset) {
              const srcSetParts = srcset.split(",");
              if (srcSetParts.length > 0) {
                const lastSrcSet = srcSetParts[srcSetParts.length - 1]
                  .trim()
                  .split(" ")[0];
                if (lastSrcSet) bestSrc = lastSrcSet;
              }
            }

            const dataSrc =
              img.getAttribute("data-src") ||
              img.getAttribute("data-original") ||
              img.getAttribute("data-lazy-src") ||
              img.getAttribute("data-hi-res-src") ||
              img.getAttribute("data-image") ||
              img.getAttribute("data-full-src");

            if (dataSrc && dataSrc.includes("http")) {
              bestSrc = dataSrc;
            }

            if (bestSrc && bestSrc.startsWith("http")) {
              images.push({
                url: bestSrc,
                alt: img.alt || undefined,
                width: img.naturalWidth || img.width || undefined,
                height: img.naturalHeight || img.height || undefined,
                module: module.getAttribute("aria-label") || undefined,
              });
            }
          });
        });

        return images;
      });
    } catch (error) {
      logger.warn(`Error extracting Behance images: ${error}`);
      return [];
    }
  }

  /**
   * Extract videos from Behance project
   */
  async extractBehanceVideos() {
    try {
      return await this.page.evaluate(() => {
        const videos: any[] = [];

        // Look for iframes
        const iframes = Array.from(document.querySelectorAll("iframe"));
        iframes.forEach((iframe: any) => {
          const src = iframe.getAttribute("src");
          if (
            src &&
            (src.includes("vimeo.com") ||
              src.includes("youtube.com") ||
              src.includes("youtu.be"))
          ) {
            videos.push({ url: src });
          }
        });

        // Look for video elements
        const videoElements = Array.from(document.querySelectorAll("video"));
        videoElements.forEach((video: any) => {
          const src = video.getAttribute("src");
          if (src) {
            videos.push({ url: src });
          }

          const dataAttrs = [
            "data-src",
            "data-video-src",
            "data-video-url",
            "data-url",
            "data-mp4",
          ];
          for (const attr of dataAttrs) {
            const dataSrc = video.getAttribute(attr);
            if (dataSrc && dataSrc.trim() !== "") {
              videos.push({ url: dataSrc });
              break;
            }
          }

          const sources = video.querySelectorAll("source");
          sources.forEach((source: any) => {
            const sourceUrl = source.getAttribute("src");
            if (sourceUrl) {
              videos.push({ url: sourceUrl });
            }
          });
        });

        return videos;
      });
    } catch (error) {
      logger.warn(`Error extracting Behance videos: ${error}`);
      return [];
    }
  }

  async scrape(): Promise<ScraperResult> {
    try {
      await this.initialize();
      await this.navigateTo();
      await this.handlePageSpecifics();

      logger.debug("Scrolling to load lazy content");
      await this.autoScroll();

      const behanceImages = await this.extractBehanceImages();
      const behanceVideoElements = await this.extractBehanceVideos();

      // Process videos
      const behanceVideos = [];
      for (const videoElement of behanceVideoElements) {
        const { platform, videoId } = this.extractVideoInfo(videoElement.url);
        if (platform && videoId) {
          behanceVideos.push({
            url: videoElement.url,
            platform,
            videoId,
          });
        }
      }

      // Remove duplicate videos
      const uniqueVideos: any[] = [];
      const videoKeys = new Set();
      behanceVideos.forEach((video) => {
        const key = `${video.platform}_${video.videoId}`;
        if (!videoKeys.has(key)) {
          videoKeys.add(key);
          uniqueVideos.push(video);
        }
      });

      // Filter out duplicate images
      const uniqueImageUrls = new Set();
      const filteredImages = behanceImages.filter((image: any) => {
        if (!image.url || !image.url.startsWith("http")) return false;
        if (uniqueImageUrls.has(image.url)) return false;
        uniqueImageUrls.add(image.url);
        return true;
      });

      // Format for output
      const formattedImages = filteredImages.map(
        (image: any, index: number) => ({
          url: image.url,
          alt_text: image.alt || "",
          type: "image" as const,
          order: index,
        })
      );

      const formattedVideos = uniqueVideos.map((video, index) => ({
        url: video.url,
        type: "video" as const,
        [`${video.platform}_id`]: video.videoId,
        order: formattedImages.length + index,
      }));

      const allMedia = [...formattedImages, ...formattedVideos];

      logger.info(
        `Scraped ${formattedImages.length} images and ${formattedVideos.length} videos from ${this.url}`
      );

      return {
        source_url: this.url,
        media: allMedia,
        total: allMedia.length,
      };
    } finally {
      await this.close();
    }
  }
}

/**
 * Dribbble-specific scraper implementation
 */
class DribbbleScraper extends BaseScraper {
  /**
   * Handle Dribbble-specific page elements
   */
  async handlePageSpecifics() {
    try {
      const cookieButton = await this.page.$(
        "button#onetrust-accept-btn-handler"
      );
      if (cookieButton) {
        await cookieButton.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 1000))
        );
      }
    } catch (e) {
      logger.debug("No cookie banner found or error handling it");
    }

    try {
      const closeModalButtons = await this.page.$$("button.close-button");
      for (const button of closeModalButtons) {
        await button.click();
        await this.page.evaluate(
          () => new Promise((resolve) => setTimeout(resolve, 500))
        );
      }
    } catch (e) {
      logger.debug("No modal found or error handling it");
    }
  }

  /**
   * Extract Dribbble-specific images
   */
  async extractDribbbleImages() {
    try {
      return await this.page.evaluate(() => {
        const images: any[] = [];

        // Look for shot media containers
        const shots = document.querySelectorAll(".shot-media-container");
        shots.forEach((shot) => {
          const mediaImage = shot.querySelector(".media-shot");
          if (mediaImage) {
            const srcset = (mediaImage as any).getAttribute("srcset");
            const src = (mediaImage as any).getAttribute("src");
            const dataSrc = (mediaImage as any).getAttribute("data-src");

            let bestUrl = src;

            if (srcset) {
              const srcSetParts = srcset.split(",");
              if (srcSetParts.length > 0) {
                const lastSrcSet = srcSetParts[srcSetParts.length - 1]
                  .trim()
                  .split(" ")[0];
                if (lastSrcSet) bestUrl = lastSrcSet;
              }
            }

            if (dataSrc && dataSrc.includes("http")) {
              bestUrl = dataSrc;
            }

            if (bestUrl && bestUrl.startsWith("http")) {
              images.push({
                url: bestUrl,
                alt: (mediaImage as any).alt || undefined,
                width:
                  (mediaImage as any).naturalWidth ||
                  (mediaImage as any).width ||
                  undefined,
                height:
                  (mediaImage as any).naturalHeight ||
                  (mediaImage as any).height ||
                  undefined,
              });
            }
          }
        });

        // Look for block media elements
        const blockMediaElements = document.querySelectorAll(".block-media");
        blockMediaElements.forEach((element) => {
          const img = element.querySelector("img");
          if (img) {
            const srcset = img.getAttribute("srcset");
            const src = img.getAttribute("src");
            const dataSrc = img.getAttribute("data-src");

            let bestUrl = src;

            if (srcset) {
              const srcSetParts = srcset.split(",");
              if (srcSetParts.length > 0) {
                const lastSrcSet = srcSetParts[srcSetParts.length - 1]
                  .trim()
                  .split(" ")[0];
                if (lastSrcSet) bestUrl = lastSrcSet;
              }
            }

            if (dataSrc && dataSrc.includes("http")) {
              bestUrl = dataSrc;
            }

            if (bestUrl && bestUrl.startsWith("http")) {
              images.push({
                url: bestUrl,
                alt: img.alt || undefined,
                width: img.naturalWidth || img.width || undefined,
                height: img.naturalHeight || img.height || undefined,
                source: "block-media",
              });
            }
          }
        });

        return images;
      });
    } catch (error) {
      logger.warn(`Error extracting Dribbble images: ${error}`);
      return [];
    }
  }

  /**
   * Extract videos from Dribbble
   */
  async extractDribbbleVideos() {
    try {
      return await this.page.evaluate(() => {
        const videos: any[] = [];

        // Look for videos in block media
        const blockMediaElements = document.querySelectorAll(".block-media");
        blockMediaElements.forEach((element) => {
          const videoElement = element.querySelector("video");
          if (videoElement) {
            const src = videoElement.getAttribute("src");
            if (src) {
              videos.push({ url: src, source: "block-media-video" });
            }

            const dataAttrs = [
              "data-src",
              "data-video-src",
              "data-video-url",
              "data-url",
              "data-mp4",
            ];
            for (const attr of dataAttrs) {
              const dataSrc = videoElement.getAttribute(attr);
              if (dataSrc && dataSrc.trim() !== "") {
                videos.push({
                  url: dataSrc,
                  source: `block-media-video-${attr}`,
                });
                break;
              }
            }

            const sources = videoElement.querySelectorAll("source");
            sources.forEach((source: any) => {
              const srcUrl = source.getAttribute("src");
              if (srcUrl) {
                videos.push({ url: srcUrl, source: "block-media-source" });
              }
            });
          }

          const iframe = element.querySelector("iframe");
          if (iframe) {
            const src = iframe.getAttribute("src");
            if (
              src &&
              (src.includes("vimeo.com") ||
                src.includes("youtube.com") ||
                src.includes("youtu.be"))
            ) {
              videos.push({ url: src, source: "block-media-iframe" });
            }
          }
        });

        // Look for general iframes
        const iframes = Array.from(document.querySelectorAll("iframe"));
        iframes.forEach((iframe: any) => {
          const src = iframe.getAttribute("src");
          if (
            src &&
            (src.includes("vimeo.com") ||
              src.includes("youtube.com") ||
              src.includes("youtu.be"))
          ) {
            videos.push({ url: src, source: "iframe" });
          }
        });

        return videos;
      });
    } catch (error) {
      logger.warn(`Error extracting Dribbble videos: ${error}`);
      return [];
    }
  }

  async scrape(): Promise<ScraperResult> {
    try {
      await this.initialize();
      await this.navigateTo();
      await this.handlePageSpecifics();

      logger.debug("Scrolling to load lazy content");
      await this.autoScroll();

      const dribbbleImages = await this.extractDribbbleImages();
      const dribbbleVideoElements = await this.extractDribbbleVideos();

      // Process videos
      const dribbbleVideos = [];
      for (const videoElement of dribbbleVideoElements) {
        const { platform, videoId } = this.extractVideoInfo(videoElement.url);
        if (platform && videoId) {
          dribbbleVideos.push({
            url: videoElement.url,
            platform,
            videoId,
            source: videoElement.source,
          });
        }
      }

      // Remove duplicate videos
      const uniqueVideos: any[] = [];
      const videoKeys = new Set();
      dribbbleVideos.forEach((video) => {
        const key = `${video.platform}_${video.videoId}`;
        if (!videoKeys.has(key)) {
          videoKeys.add(key);
          uniqueVideos.push(video);
        }
      });

      // Filter out duplicate images
      const uniqueImageUrls = new Set();
      const filteredImages = dribbbleImages.filter((image: any) => {
        if (!image.url || !image.url.startsWith("http")) return false;
        if (uniqueImageUrls.has(image.url)) return false;
        uniqueImageUrls.add(image.url);
        return true;
      });

      // Format for output
      const formattedImages = filteredImages.map(
        (image: any, index: number) => ({
          url: image.url,
          alt_text: image.alt || "",
          type: "image" as const,
          order: index,
        })
      );

      const formattedVideos = uniqueVideos.map((video, index) => ({
        url: video.url,
        type: "video" as const,
        [`${video.platform}_id`]: video.videoId,
        order: formattedImages.length + index,
      }));

      const allMedia = [...formattedImages, ...formattedVideos];

      logger.info(
        `Scraped ${formattedImages.length} images and ${formattedVideos.length} videos from ${this.url}`
      );

      return {
        source_url: this.url,
        media: allMedia,
        total: allMedia.length,
      };
    } finally {
      await this.close();
    }
  }
}

/**
 * Factory function to create the appropriate scraper based on URL
 */
function createScraper(url: string): BaseScraper {
  if (url.includes("behance.net")) {
    return new BehanceScraper(url);
  } else if (url.includes("dribbble.com")) {
    return new DribbbleScraper(url);
  } else {
    // For unknown sites, use Behance scraper as fallback
    return new BehanceScraper(url);
  }
}

export const scraperTask = task({
  id: "website-scraper",
  maxDuration: 120, // 2 minutes

  run: async (payload: ScraperPayload, { ctx }) => {
    logger.info("Starting website scraper task", { payload, ctx });

    try {
      // Create the appropriate scraper based on URL
      const scraper = createScraper(payload.url);

      // Perform the scrape operation
      const result = await scraper.scrape();

      logger.info(
        `Successfully scraped ${result.total} items from ${payload.url}`
      );

      return {
        success: true,
        data: result,
        url: payload.url,
        total: result.total,
      };
    } catch (error) {
      logger.error("Error in scraper task", {
        error: error instanceof Error ? error.message : String(error),
        url: payload.url,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        url: payload.url,
      };
    }
  },
});
