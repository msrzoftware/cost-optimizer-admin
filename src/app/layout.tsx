import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cost Optimizer Admin",
  description: "Admin dashboard for cost visibility and optimization workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="bg-background text-foreground min-h-full">{children}</body>
    </html>
  );
}
