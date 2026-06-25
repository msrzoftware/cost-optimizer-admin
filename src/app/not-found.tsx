import Link from "next/link";
import { ArrowLeft, LayoutDashboard, SearchX, ShieldAlert } from "lucide-react";

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

      <section className="flex min-h-screen flex-1 items-center justify-center px-5 py-10">
        <div className="w-full max-w-[520px] rounded-md border border-black/[0.08] bg-white p-6 text-center shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex size-12 items-center justify-center rounded-md bg-[#F5F5F5] text-[#555555]">
            <SearchX size={24} aria-hidden="true" />
          </div>

          <p className="mt-5 text-[11px] font-bold tracking-[0.14em] text-[#86868B] uppercase">
            404 not found
          </p>
          <h1 className="mt-2 text-[26px] leading-tight font-bold tracking-normal">
            The admin page could not be found.
          </h1>
          <p className="mx-auto mt-3 max-w-[420px] text-sm leading-6 font-semibold text-[#86868B]">
            The link may be incorrect, moved, or no longer available.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-2">
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
      </section>
    </main>
  );
}

function BackButton() {
  return (
    <Link
      href="/"
      className="inline-flex h-9 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF]"
    >
      <ArrowLeft size={13} aria-hidden="true" />
      Go Back
    </Link>
  );
}
