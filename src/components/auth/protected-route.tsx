"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading || !isAuthenticated) {
    return <AuthLoadingScreen label="Checking admin session..." />;
  }

  return children;
}

export function AuthLoadingScreen({ label }: { label: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white text-[#171717]">
      <div className="text-center">
        <div className="mx-auto size-8 animate-spin rounded-full border-2 border-[#E5E7EB] border-t-[#007AFF]" />
        <p className="mt-4 text-sm font-semibold text-[#86868B]">{label}</p>
      </div>
    </main>
  );
}
