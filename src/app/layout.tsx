import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Synapse Studio | Advanced AI Video Editor",
  description:
    "A powerful AI-driven video editing platform for creators and professionals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased dark">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
