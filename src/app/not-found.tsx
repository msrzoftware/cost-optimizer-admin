"use client";

import Link from "next/link";
import {
  ArrowLeft,
  Compass,
  HelpCircle,
  LayoutDashboard,
  SearchX,
  ShieldAlert,
} from "lucide-react";

export default function NotFoundPage() {
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
        <div className="w-full max-w-[720px] overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="border-b border-black/[0.06] bg-[#FCFCFD] px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-md bg-[#F5F5F7] text-[#555555]">
                  <SearchX size={20} aria-hidden="true" />
                </div>
                <div>
                  <p className="text-[11px] leading-4 font-bold tracking-[0.12em] text-[#86868B] uppercase">
                    Admin portal notice
                  </p>
                  <p className="text-sm leading-5 font-bold text-[#171717]">
                    Page unavailable
                  </p>
                </div>
              </div>
              <span className="inline-flex h-7 items-center rounded-full border border-black/[0.08] bg-white px-3 text-[11px] font-bold text-[#555555]">
                404 Not Found
              </span>
            </div>
          </div>

          <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_220px]">
            <div>
              <h1 className="text-[28px] leading-tight font-bold tracking-normal text-[#171717]">
                This admin page could not be found.
              </h1>
              <p className="mt-3 max-w-[520px] text-sm leading-6 font-semibold text-[#68686D]">
                The page address may be incorrect, moved, or no longer available in this
                workspace. Use the actions below to return to a valid portal area.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#555555]">
                    <Compass size={14} aria-hidden="true" />
                    Navigation status
                  </div>
                  <p className="mt-1 text-xs leading-5 font-semibold text-[#86868B]">
                    The requested route is not registered in the admin portal.
                  </p>
                </div>
                <div className="rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#555555]">
                    <HelpCircle size={14} aria-hidden="true" />
                    Recommended action
                  </div>
                  <p className="mt-1 text-xs leading-5 font-semibold text-[#86868B]">
                    Go back to the previous screen or open the dashboard to continue.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                <BackButton />
                <Link
                  href="/"
                  className="inline-flex h-9 items-center gap-2 rounded-md bg-[#007AFF] px-4 text-xs font-bold text-white transition hover:bg-[#006BE0]"
                >
                  <LayoutDashboard size={13} aria-hidden="true" />
                  Dashboard
                </Link>
              </div>
            </div>

            <aside className="rounded-md border border-[#D7E9FF] bg-[#F4FAFF] p-4">
              <div className="flex size-9 items-center justify-center rounded-md bg-white text-[#007AFF] shadow-[0_1px_2px_rgba(15,23,42,0.06)]">
                <ShieldAlert size={18} aria-hidden="true" />
              </div>
              <p className="mt-4 text-xs font-bold tracking-[0.08em] text-[#007AFF] uppercase">
                Portal guidance
              </p>
              <p className="mt-2 text-xs leading-5 font-semibold text-[#555555]">
                No admin data was changed. If this link came from a saved bookmark, update it after
                returning to the active page.
              </p>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

function BackButton() {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex h-9 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF]"
    >
      <ArrowLeft size={13} aria-hidden="true" />
      Go Back
    </button>
  );
}
