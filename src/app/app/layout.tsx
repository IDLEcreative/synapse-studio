import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Synapse Studio | Video Editor",
  description: "Advanced AI-powered video editing platform",
};

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
