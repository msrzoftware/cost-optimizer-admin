"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  LayoutDashboard,
  RefreshCcw,
  ShieldAlert,
} from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Cost Optimizer Admin route error", error);
  }, [error]);

  return (
    <main className="flex min-h-screen bg-white text-[#171717]">
      <section className="hidden w-[220px] shrink-0 border-r border-black/[0.08] bg-white lg:block">
        <div className="flex h-14 items-center gap-2 border-b border-black/[0.08] px-5">
          <div className="flex size-7 items-center justify-center rounded-md bg-black text-white">
            <ShieldAlert size={16} aria-hidden="true" />
          </div>
          <p className="text-[15px] leading-none font-bold">Admin Panel</p>
        </div>
      </section>

      <section className="flex min-h-screen flex-1 items-center justify-center bg-[#FAFAFA] px-5 py-10">
        <div className="w-full max-w-[560px] overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-center gap-3 border-b border-black/[0.06] bg-[#FCFCFD] px-5 py-4">
            <div className="flex size-9 items-center justify-center rounded-md bg-[#FFF7ED] text-[#F97316]">
              <AlertTriangle size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] leading-4 font-bold tracking-[0.12em] text-[#86868B] uppercase">
                Admin portal alert
              </p>
              <p className="truncate text-sm leading-5 font-bold text-[#171717]">
                Page load interruption
              </p>
            </div>
          </div>

          <div className="px-5 py-6">
            <h1 className="text-[26px] leading-tight font-bold tracking-normal text-[#171717]">
              This admin page could not be loaded.
            </h1>
            <p className="mt-3 text-sm leading-6 font-semibold text-[#68686D]">
              The page did not finish loading. Retry the page, go back, or open the dashboard to
              continue working.
            </p>

            <div className="mt-5 rounded-md border border-black/[0.06] bg-[#FAFAFA] px-3 py-3">
              <p className="text-xs leading-5 font-semibold text-[#555555]">
                No admin changes were submitted from this failed page view.
              </p>
              {error.digest ? (
                <p className="mt-2 break-all text-[11px] font-bold text-[#86868B]">
                  Reference: {error.digest}
                </p>
              ) : null}
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={reset}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#007AFF] px-4 text-xs font-bold text-white transition hover:bg-[#006BE0]"
              >
                <RefreshCcw size={13} aria-hidden="true" />
                Retry Page
              </button>
              <button
                type="button"
                onClick={() => window.history.back()}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF]"
              >
                <ArrowLeft size={13} aria-hidden="true" />
                Go Back
              </button>
              <Link
                href="/"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF]"
              >
                <LayoutDashboard size={13} aria-hidden="true" />
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
