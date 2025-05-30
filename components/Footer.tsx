import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* Main Footer Content */}
        <div className="flex flex-col items-center justify-center text-center space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center space-y-4">
            <div className="p-2 rounded-2xl bg-muted/50 transition-all hover:bg-muted">
              <Image
                src="/logo.png"
                alt="that sauce"
                width={80}
                height={80}
                className="w-20 h-20 transition-transform hover:scale-105"
              />
            </div>

            {/* Brand Name with Star */}
            <div className="flex items-center space-x-1 font-sauce">
              <span className="text-foreground text-lg tracking-wide uppercase">
                that
              </span>
              <span className="text-foreground text-lg tracking-wide uppercase">
                sauce
              </span>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground font-sans text-sm max-w-md leading-relaxed">
            creative talent search engine
          </p>

          {/* Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/search"
              className="text-foreground hover:text-[#e21313] font-sans font-medium uppercase tracking-wide transition-all duration-300 hover:scale-105 px-2 py-1 rounded-md hover:bg-muted/50"
            >
              Search
            </Link>
            <Link
              href="/about"
              className="text-foreground hover:text-[#e21313] font-sans font-medium uppercase tracking-wide transition-all duration-300 hover:scale-105 px-2 py-1 rounded-md hover:bg-muted/50"
            >
              About
            </Link>
            <Link
              href="/privacy"
              className="text-foreground hover:text-[#e21313] font-sans font-medium uppercase tracking-wide transition-all duration-300 hover:scale-105 px-2 py-1 rounded-md hover:bg-muted/50"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-foreground hover:text-[#e21313] font-sans font-medium uppercase tracking-wide transition-all duration-300 hover:scale-105 px-2 py-1 rounded-md hover:bg-muted/50"
            >
              Terms
            </Link>
          </nav>

          {/* Copyright */}
          <div className="pt-6 border-t border-border w-full max-w-md">
            <p className="text-muted-foreground font-sans text-xs">
              © 2025 that sauce. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
