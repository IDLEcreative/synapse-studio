import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./globals.css";

// Initialize the Inter font with optimization settings
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Synapse Studio | Advanced AI Video Editor",
  description:
    "A powerful AI-driven video editing platform for creators and professionals.",
  metadataBase: new URL("http://localhost:3000"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.className}>
      <body className="antialiased dark">{children}</body>
    </html>
  );
}
