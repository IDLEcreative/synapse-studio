import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body className="antialiased dark">
        {children}
      </body>
    </html>
  );
}
