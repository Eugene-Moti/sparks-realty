import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Marcellus } from "next/font/google";
import {
  ThemeProvider,
  themeInitScript,
} from "@/components/providers/theme-provider";
import { siteConfig, siteUrl } from "@/config/site";
import { cn } from "@/helpers/classname-helper";
import "./globals.css";

const marcellus = Marcellus({
  variable: "--font-marcellus",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const defaultTitle = `${siteConfig.name} — Homes for sale, rent & short stays in Nairobi`;

export const metadata: Metadata = {
  // All relative metadata URLs (OG images, canonicals) resolve against NEXT_PUBLIC_SITE_URL.
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  // No root canonical/og:url: children would inherit it and all point at "/".
  // Each page sets `alternates.canonical` itself.
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: defaultTitle,
    description: siteConfig.description,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name} — Nairobi real estate`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: siteConfig.description,
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F6F3EC" },
    { media: "(prefers-color-scheme: dark)", color: "#0B0B0C" },
  ],
  colorScheme: "dark light",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en-KE"
      // The theme class is applied by themeInitScript before hydration.
      suppressHydrationWarning
      className={cn(
        marcellus.variable,
        geistSans.variable,
        geistMono.variable,
        "h-full antialiased",
      )}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {/* Without JavaScript, scroll-reveal content must still be visible. */}
        <noscript>
          <style>{"[data-reveal],[data-reveal-line]{opacity:1!important;translate:none!important;transform:none!important}"}</style>
        </noscript>
      </head>
      <body className="flex min-h-full flex-col">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
