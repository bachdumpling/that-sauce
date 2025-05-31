import { SanityImageSource } from "@sanity/image-url/lib/types/types";

// Navigation Types
export interface NavigationContent {
  title: string;
  brand: {
    logoLight?: SanityImageSource & { alt: string };
    logoDark?: SanityImageSource & { alt: string };
    logoDefault?: SanityImageSource & { alt: string };
    logoWidth?: number;
    logoHeight?: number;
    brandName?: string;
    homeUrl?: string;
    showBrandName?: boolean;
    logoPosition?: string;
  };
  mainNavigation: NavigationLink[];
  authNavigation: {
    signInText: string;
    signInUrl: string;
    signUpText: string;
    signUpUrl: string;
    signOutText: string;
  };
  creatorNavigation: {
    portfolioText: string;
    myPortfolioText: string;
    editProfileText: string;
  };
  adminNavigation: NavigationLink[];
  userGreeting: {
    greetingPrefix: string;
    fallbackGreeting: string;
  };
}

export interface NavigationLink {
  label: string;
  path: string;
  isVisible: boolean;
  openInNewTab: boolean;
  order?: number;
}

// Footer Types
export interface FooterContent {
  title: string;
  brand: {
    logo?: SanityImageSource & { alt: string };
    logoWidth?: number;
    logoHeight?: number;
    brandName: string;
    tagline: string;
    showBrandName: boolean;
    showTagline: boolean;
  };
  navigationLinks: FooterLink[];
  socialMedia: {
    showSocialMedia: boolean;
    socialLinks: SocialLink[];
  };
  copyright: {
    showCopyright: boolean;
    copyrightText: string;
    year: number;
    companyName: string;
    autoUpdateYear: boolean;
  };
  newsletter: {
    showNewsletter: boolean;
    heading: string;
    description: string;
    placeholderText: string;
    buttonText: string;
  };
  layout: {
    backgroundColor: string;
    showBorder: boolean;
    alignment: string;
    maxWidth: string;
  };
}

export interface FooterLink {
  label: string;
  url: string;
  isVisible: boolean;
  openInNewTab: boolean;
  order?: number;
  isInternal: boolean;
}

export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
  isVisible: boolean;
}

// Combined Layout Content
export interface LayoutContent {
  navigation: NavigationContent;
  footer: FooterContent;
}
