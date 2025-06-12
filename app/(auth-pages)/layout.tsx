import Image from "next/image";
import Link from "next/link";
import { client } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import { AuthPageClient } from "./components/auth-page-client";

interface AuthPageContent {
  heading: string;
  subheading?: string;
  image: {
    _type: "image";
    asset: {
      _ref: string;
    };
    alt: string;
  };
}

async function getAuthPageContent(): Promise<AuthPageContent | null> {
  try {
    const query = `*[_type == "authPage" && isActive == true][0]{
      heading,
      subheading,
      image{
        _type,
        asset,
        alt
      }
    }`;

    return await client.fetch(query);
  } catch (error) {
    console.error("Error fetching auth page content:", error);
    return null;
  }
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authContent = await getAuthPageContent();

  return (
    <div className="absolute inset-0 bg-background rounded-lg shadow-sm z-30">
      {/* Logo */}
      <Image
        src="/thatsaucelogoheader-black.svg"
        alt="That Sauce"
        width={300}
        height={300}
        className="absolute top-0 left-0 dark:invert"
        priority
      />

      {/* Return button */}
      <div className="absolute top-4 right-4 z-30">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-background/90 backdrop-blur-sm border-2 border-border text-foreground font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-200 rounded-lg"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Home
        </Link>
      </div>

      <div className="grid grid-cols-2 h-full">
        {/* Image/content area */}
        <div className="relative overflow-hidden bg-[color:var(--that-sauce-black)] m-6 rounded-[16px] shadow-lg">
          {authContent?.image ? (
            <div className="bg-that-sauce-white relative w-full h-full">
              <Image
                src={urlFor(authContent.image).url()}
                alt={authContent.image.alt}
                fill
                className="object-contain rounded-[16px]"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 text-[color:var(--that-sauce-white)]">
              <h1 className="text-4xl font-bold mb-4">Welcome to That Sauce</h1>
              <p className="text-lg text-muted-foreground">
                Find your creative sauce
              </p>
            </div>
          )}
        </div>

        {/* Fixed-width content area */}
        <div className="relative flex flex-col justify-center items-center p-8 overflow-y-auto">
          {/* <AuthPageClient /> */}
          <div className="w-full max-w-2xl">{children}</div>
        </div>
      </div>
    </div>
  );
}
