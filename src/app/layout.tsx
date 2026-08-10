import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TeMusc — Your Musical Operating System",
  description: "Analyze your Spotify listening habits, manage playlists with precision, and discover music you've been missing. TeMusc OS • LAB • DISCOVERY.",
  keywords: ["spotify", "music", "analytics", "playlists", "discovery", "TeMusc"],
  openGraph: {
    title: "TeMusc — Your Musical Operating System",
    description: "Analyze, manage, and discover your music like never before.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
