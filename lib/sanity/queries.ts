import { groq } from "next-sanity";

export const LANDING_PAGE_QUERY = groq`
  *[_type == "landingPage"][0] {
    _id,
    title,
    slug,
    hero {
      title,
      subtitle,
      backgroundVideo {
        asset-> {
          _id,
          url,
          mimeType,
          size
        }
      },
      backgroundImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions {
              width,
              height
            }
          }
        },
        alt
      },
      videoSettings {
        autoplay,
        loop,
        muted
      },
      textColor,
      overlay {
        enabled,
        color,
        customColor
      }
    },
    features[] {
      title,
      subtitle,
      video {
        asset-> {
          _id,
          url,
          mimeType,
          size
        }
      }
    },
    seo {
      metaTitle,
      metaDescription,
      ogImage {
        asset-> {
          url
        }
      }
    }
  }
`; 