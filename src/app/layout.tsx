import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth/auth-provider";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
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
    <html lang="en" className="h-full antialiased" data-scroll-behavior="smooth">
      <body className="bg-background text-foreground min-h-full">
        <ReactQueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
