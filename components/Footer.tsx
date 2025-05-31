import Image from "next/image";
import Link from "next/link";
import { getActiveFooter } from "@/sanity/lib/queries";
import { urlFor } from "@/sanity/lib/image";
import { FooterContent } from "@/types/sanity";

export async function Footer() {
  // Fetch footer content from Sanity
  let footerContent: FooterContent | null = null;
  try {
    footerContent = await getActiveFooter();
  } catch (error) {
    console.error("Error fetching footer content:", error);
    // Component will use fallback values if footerContent is null
  }

  // Get content with fallbacks
  const getContent = () => {
    if (!footerContent) {
      // Fallback to existing hardcoded values
      return {
        brand: {
          logo: null,
          logoWidth: 80,
          logoHeight: 80,
          brandName: "that sauce",
          tagline: "creative talent search engine",
          showBrandName: true,
          showTagline: true,
        },
        navigationLinks: [
          {
            label: "Search",
            url: "/search",
            isVisible: true,
            isInternal: true,
            openInNewTab: false,
          },
          {
            label: "About",
            url: "/about",
            isVisible: true,
            isInternal: true,
            openInNewTab: false,
          },
          {
            label: "Privacy",
            url: "/privacy",
            isVisible: true,
            isInternal: true,
            openInNewTab: false,
          },
          {
            label: "Terms",
            url: "/terms",
            isVisible: true,
            isInternal: true,
            openInNewTab: false,
          },
        ],
        socialMedia: {
          showSocialMedia: false,
          socialLinks: [],
        },
        copyright: {
          showCopyright: true,
          copyrightText: "© 2025 that sauce. All rights reserved.",
          year: 2025,
          companyName: "that sauce",
          autoUpdateYear: true,
        },
        newsletter: {
          showNewsletter: false,
          heading: "",
          description: "",
          placeholderText: "",
          buttonText: "",
        },
        layout: {
          backgroundColor: "background",
          showBorder: true,
          alignment: "center",
          maxWidth: "max-w-6xl",
        },
      };
    }

    return {
      brand: footerContent.brand,
      navigationLinks:
        footerContent.navigationLinks?.filter((link) => link.isVisible) || [],
      socialMedia: footerContent.socialMedia,
      copyright: footerContent.copyright,
      newsletter: footerContent.newsletter,
      layout: footerContent.layout,
    };
  };

  const content = getContent();

  // Get copyright text
  const getCopyrightText = () => {
    if (content.copyright.autoUpdateYear) {
      const currentYear = new Date().getFullYear();
      return `© ${currentYear} ${content.copyright.companyName}. All rights reserved.`;
    }
    return content.copyright.copyrightText;
  };

  // Get logo URL
  const getLogoUrl = () => {
    if (content.brand.logo) {
      return urlFor(content.brand.logo)
        .width(content.brand.logoWidth || 80)
        .height(content.brand.logoHeight || 80)
        .url();
    }
    return "/logo.png"; // Fallback to existing logo
  };

  const alignmentClass =
    content.layout.alignment === "center"
      ? "items-center justify-center text-center"
      : content.layout.alignment === "left"
        ? "items-start justify-start text-left"
        : "items-end justify-end text-right";

  const backgroundClass =
    content.layout.backgroundColor === "muted"
      ? "bg-muted"
      : content.layout.backgroundColor === "card"
        ? "bg-card"
        : content.layout.backgroundColor === "accent"
          ? "bg-accent"
          : "bg-background";

  return (
    <footer
      className={`w-full ${content.layout.showBorder ? "border-t border-border" : ""} ${backgroundClass}`}
    >
      <div className={`${content.layout.maxWidth} mx-auto px-8 py-16`}>
        {/* Main Footer Content */}
        <div className={`flex flex-col ${alignmentClass} space-y-8`}>
          {/* Brand Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-2 rounded-2xl bg-muted/50 transition-all hover:bg-muted">
              <Image
                src={getLogoUrl()}
                alt={content.brand.logo?.alt || content.brand.brandName}
                width={content.brand.logoWidth || 80}
                height={content.brand.logoHeight || 80}
                className={`w-${Math.floor((content.brand.logoWidth || 80) / 4)} h-${Math.floor((content.brand.logoHeight || 80) / 4)} transition-transform hover:scale-105`}
              />
            </div>

            {/* Brand Name */}
            {content.brand.showBrandName && content.brand.brandName && (
              <div className="flex items-center space-x-1 font-sauce">
                {content.brand.brandName.split(" ").map((word, index) => (
                  <span
                    key={index}
                    className="text-foreground text-lg tracking-wide uppercase"
                  >
                    {word}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tagline */}
          {content.brand.showTagline && content.brand.tagline && (
            <p className="text-muted-foreground font-sans text-sm max-w-md leading-relaxed">
              {content.brand.tagline}
            </p>
          )}

          {/* Newsletter Section */}
          {content.newsletter.showNewsletter && (
            <div className="w-full max-w-md space-y-4">
              <h3 className="text-lg font-semibold">
                {content.newsletter.heading}
              </h3>
              <p className="text-sm text-muted-foreground">
                {content.newsletter.description}
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder={content.newsletter.placeholderText}
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-background"
                />
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
                  {content.newsletter.buttonText}
                </button>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          {content.navigationLinks.length > 0 && (
            <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
              {content.navigationLinks.map((link) => (
                <Link
                  key={link.url}
                  href={link.url}
                  target={link.openInNewTab ? "_blank" : undefined}
                  rel={link.openInNewTab ? "noopener noreferrer" : undefined}
                  className="text-foreground hover:text-[#e21313] font-sans font-medium uppercase tracking-wide transition-all duration-300 hover:scale-105 px-2 py-1 rounded-md hover:bg-muted/50"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          {/* Social Media Links */}
          {content.socialMedia.showSocialMedia &&
            content.socialMedia.socialLinks.length > 0 && (
              <div className="flex gap-4 justify-center">
                {content.socialMedia.socialLinks
                  .filter((link) => link.isVisible)
                  .map((link, index) => (
                    <Link
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label || link.platform}
                    </Link>
                  ))}
              </div>
            )}

          {/* Copyright */}
          {content.copyright.showCopyright && (
            <div className="pt-6 border-t border-border w-full max-w-md">
              <p className="text-muted-foreground font-sans text-xs">
                {getCopyrightText()}
              </p>
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
