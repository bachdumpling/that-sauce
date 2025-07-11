import { ThemeProvider } from "next-themes";
import "./globals.css";
import "@/styles/nprogress-custom.css";
import { Analytics } from "@vercel/analytics/react";
import localFont from "next/font/local";
import { MobileNav } from "@/components/Nav/mobile-nav";
import { Nav } from "@/components/Nav/nav";
import { ProfileEditProvider } from "@/contexts/ProfileEditContext";
import { Footer } from "@/components/Footer/Footer";
import { Toaster } from "sonner";

const defaultUrl = process.env.NEXT_PUBLIC_CLIENT_URL
  ? `https://${process.env.NEXT_PUBLIC_CLIENT_URL}`
  : "https://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "that sauce",
  description: "creative talent search engine",
  openGraph: {
    title: "that sauce",
    description: "creative talent search engine",
    images: "/opengraph-image.png",
  },
  twitter: {
    title: "that sauce",
    description: "creative talent search engine",
    card: "summary_large_image",
    images: "/twitter-image.png",
  },
};

// Define Helvetica Neue as a local font
const helveticaNeue = localFont({
  src: [
    {
      path: "../public/fonts/HelveticaNeueLight.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueLightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../public/fonts/HelveticaNeueRoman.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueItalic.ttf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../public/fonts/HelveticaNeueMedium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueMediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../public/fonts/HelveticaNeueBold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../public/fonts/HelveticaNeueBoldItalic.otf",
      weight: "700",
      style: "italic",
    },
  ],
  variable: "--font-helvetica-neue",
  display: "swap",
});

const thatSauce = localFont({
  src: [
    {
      path: "../public/fonts/ThatSauceRegular.otf",
      weight: "400",
      style: "normal",
    },
  ],
  variable: "--font-that-sauce",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${helveticaNeue.variable} ${thatSauce.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-background text-foreground font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ProfileEditProvider>
            {/* Navigation */}
            <nav className="w-full flex justify-center h-20 px-4 py-2 z-50">
              <div className="hidden md:flex w-full">
                <Nav />
              </div>

              <div className="md:hidden w-full">
                <MobileNav />
              </div>
            </nav>
            {/* <ProgressBarProvider> */}
            <main className="w-full">{children}</main>
            <Footer />
            <Analytics />
            <Toaster />
            {/* </ProgressBarProvider> */}
          </ProfileEditProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
