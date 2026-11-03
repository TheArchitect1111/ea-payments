import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TB3 Official | Tarris Bouie | Alabama Basketball - WEAR THE VISION",
  description: "Official TB3 merchandise collection. Explore 14 items and request availability. Online checkout will open after payment setup. Different On Purpose.",
  keywords: ["TB3", "Tarris Bouie", "Alabama Basketball", "NIL", "Official Merch", "WEAR THE VISION"],
  openGraph: {
    title: "TB3 Official - WEAR THE VISION",
    description: "Official TB3 merchandise collection. Explore the 14-piece lineup.",
    url: "https://tb3.online",
    siteName: "TB3 Official",
    images: [
      {
        url: "/tb3/merch/collage-sig-black.jpg",
        width: 1200,
        height: 630,
        alt: "TB3 Signature Collage Tee",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "TB3 Official - WEAR THE VISION",
    description: "Official TB3 merchandise collection. Explore the lineup.",
    images: ["/tb3/merch/collage-sig-black.jpg"],
  },
};

export default function TarrisLayout({ children }: { children: React.ReactNode }) {
  return children;
}
