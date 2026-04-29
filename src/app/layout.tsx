import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { BRAND_NAME, SITE_URL } from "@/lib/brand";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const LOGO = process.env.NEXT_PUBLIC_BRAND_LOGO || "/brand/logo.jpg";
const DESCRIPTION = `Property-specific trash and recycling info, on demand. Powered by ${BRAND_NAME}.`;

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  title: {
    default: BRAND_NAME,
    template: `%s — ${BRAND_NAME}`,
  },
  description: DESCRIPTION,
  applicationName: BRAND_NAME,
  manifest: "/manifest.webmanifest",
  icons: {
    icon: LOGO,
    apple: LOGO,
  },
  openGraph: {
    title: BRAND_NAME,
    description: DESCRIPTION,
    siteName: BRAND_NAME,
    type: "website",
    images: [{ url: LOGO, alt: BRAND_NAME }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND_NAME,
    description: DESCRIPTION,
    images: [LOGO],
  },
  robots: {
    // The resident app is meant for QR-scan landings, not search-engine
    // discovery. Flip this to `true` if you want SEO indexing later.
    index: false,
    follow: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#39b54a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
