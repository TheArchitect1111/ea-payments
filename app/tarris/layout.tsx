import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TB3 | Tarris Bouie III",
  description:
    "The official public home of Tarris Bouie III: athlete, story, brand, NIL opportunities, community, film, and official merchandise.",
};

export default function TarrisLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
