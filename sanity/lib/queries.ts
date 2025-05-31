import { client } from "./client";

// Navigation queries
export async function getActiveNavigation() {
  return client.fetch(`
    *[_type == "navigation" && isActive == true][0] {
      title,
      brand {
        logoLight,
        logoDark,
        logoDefault,
        logoWidth,
        logoHeight,
        brandName,
        homeUrl,
        showBrandName,
        logoPosition
      },
      mainNavigation[] {
        label,
        path,
        isVisible,
        openInNewTab,
        order
      } | order(order asc),
      authNavigation {
        signInText,
        signInUrl,
        signUpText,
        signUpUrl,
        signOutText
      },
      creatorNavigation {
        portfolioText,
        myPortfolioText,
        editProfileText
      },
      adminNavigation[] {
        label,
        path,
        isVisible,
        order
      } | order(order asc),
      userGreeting {
        greetingPrefix,
        fallbackGreeting
      }
    }
  `);
}

export async function getNavigationBySlug(slug: string) {
  return client.fetch(
    `
    *[_type == "navigation" && slug.current == $slug][0]
  `,
    { slug }
  );
}

// Footer queries
export async function getActiveFooter() {
  return client.fetch(`
    *[_type == "footer" && isActive == true][0] {
      title,
      brand {
        logo,
        logoWidth,
        logoHeight,
        brandName,
        tagline,
        showBrandName,
        showTagline
      },
      navigationLinks[] {
        label,
        url,
        isVisible,
        openInNewTab,
        order,
        isInternal
      } | order(order asc),
      socialMedia {
        showSocialMedia,
        socialLinks[] {
          platform,
          url,
          label,
          isVisible
        }
      },
      copyright {
        showCopyright,
        copyrightText,
        year,
        companyName,
        autoUpdateYear
      },
      newsletter {
        showNewsletter,
        heading,
        description,
        placeholderText,
        buttonText
      },
      layout {
        backgroundColor,
        showBorder,
        alignment,
        maxWidth
      }
    }
  `);
}

export async function getFooterBySlug(slug: string) {
  return client.fetch(
    `
    *[_type == "footer" && slug.current == $slug][0]
  `,
    { slug }
  );
}

// Combined layout query for both navigation and footer
export async function getLayoutContent() {
  return client.fetch(`
    {
      "navigation": *[_type == "navigation" && isActive == true][0] {
        title,
        brand {
          logoLight,
          logoDark,
          logoDefault,
          logoWidth,
          logoHeight,
          brandName,
          homeUrl,
          showBrandName,
          logoPosition
        },
        mainNavigation[] {
          label,
          path,
          isVisible,
          openInNewTab,
          order
        } | order(order asc),
        authNavigation {
          signInText,
          signInUrl,
          signUpText,
          signUpUrl,
          signOutText
        },
        creatorNavigation {
          portfolioText,
          myPortfolioText,
          editProfileText
        },
        adminNavigation[] {
          label,
          path,
          isVisible,
          order
        } | order(order asc),
        userGreeting {
          greetingPrefix,
          fallbackGreeting
        }
      },
      "footer": *[_type == "footer" && isActive == true][0] {
        title,
        brand {
          logo,
          logoWidth,
          logoHeight,
          brandName,
          tagline,
          showBrandName,
          showTagline
        },
        navigationLinks[] {
          label,
          url,
          isVisible,
          openInNewTab,
          order,
          isInternal
        } | order(order asc),
        socialMedia {
          showSocialMedia,
          socialLinks[] {
            platform,
            url,
            label,
            isVisible
          }
        },
        copyright {
          showCopyright,
          copyrightText,
          year,
          companyName,
          autoUpdateYear
        },
        newsletter {
          showNewsletter,
          heading,
          description,
          placeholderText,
          buttonText
        },
        layout {
          backgroundColor,
          showBorder,
          alignment,
          maxWidth
        }
      }
    }
  `);
}
