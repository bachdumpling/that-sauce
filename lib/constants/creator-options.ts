/**
 * Available roles for creators
 */
export const CREATOR_ROLES = [
  "Director",
  "Photographer",
  "Cinematographer",
  "Motion Designer",
  "Graphic Designer",
  "Illustrator",
  "Art Director",
  "Creative Director",
  "3D Artist",
  "UI/UX Designer",
  "Web Designer",
  "Fashion Designer",
  "Product Designer",
  "VFX Artist",
  "Video Editor",
  "Sound Designer",
  "Animator",
  "Production Designer",
  "Set Designer",
  "Stylist",
  "Makeup Artist",
  "Storyboard Artist",
];

/**
 * US Locations (major cities with states)
 */
export const US_LOCATIONS = [
  "New York, NY",
  // "Atlanta, GA",
  // "Austin, TX",
  // "Boston, MA",
  // "Chicago, IL",
  // "Dallas, TX",
  // "Denver, CO",
  // "Houston, TX",
  // "Las Vegas, NV",
  // "Los Angeles, CA",
  // "Miami, FL",
  // "Minneapolis, MN",
  // "Nashville, TN",
  // "New Orleans, LA",
  // "Orlando, FL",
  // "Philadelphia, PA",
  // "Phoenix, AZ",
  // "Portland, OR",
  // "Salt Lake City, UT",
  // "San Diego, CA",
  // "San Francisco, CA",
  // "Seattle, WA",
  // "Washington, DC",
];

/**
 * Popular social platforms for creators
 */
export const SOCIAL_PLATFORMS = [
  {
    id: "instagram",
    name: "Instagram",
    placeholder: "https://instagram.com/username",
    baseUrl: "https://instagram.com/",
    pattern: /instagram\.com\/([^/?]+)/i,
  },
  {
    id: "behance",
    name: "Behance",
    placeholder: "https://behance.net/username",
    baseUrl: "https://behance.net/",
    pattern: /behance\.net\/([^/?]+)/i,
  },
  {
    id: "dribbble",
    name: "Dribbble",
    placeholder: "https://dribbble.com/username",
    baseUrl: "https://dribbble.com/",
    pattern: /dribbble\.com\/([^/?]+)/i,
  },
  {
    id: "vimeo",
    name: "Vimeo",
    placeholder: "https://vimeo.com/username",
    baseUrl: "https://vimeo.com/",
    pattern: /vimeo\.com\/([^/?]+)/i,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    placeholder: "https://linkedin.com/in/username",
    baseUrl: "https://linkedin.com/in/",
    pattern: /linkedin\.com\/(?:in|company)\/([^/?]+)/i,
  },
  {
    id: "website",
    name: "Personal Website",
    placeholder: "https://yourwebsite.com",
    baseUrl: "",
  },
  {
    id: "youtube",
    name: "YouTube",
    placeholder: "https://youtube.com/username",
    baseUrl: "https://youtube.com/",
    pattern: /youtube\.com\/(?:channel\/|c\/|@|user\/)?([^/?]+)/i,
  },
  {
    id: "github",
    name: "GitHub",
    placeholder: "https://github.com/username",
    baseUrl: "https://github.com/",
    pattern: /github\.com\/([^/?]+)/i,
  },
];
