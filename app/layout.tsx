import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kooraa Squad Board",
  description: "Build balanced football lineups, track match events, and keep squads saved locally.",
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
