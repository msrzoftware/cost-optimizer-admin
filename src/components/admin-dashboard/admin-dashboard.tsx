import {
  BookOpen,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Database,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";

import {
  automationLevels,
  benchmarkMetrics,
  domains,
  industries,
  navigationItems,
  processRows,
  processTiers,
  technologyRows,
} from "./dashboard-data";

const navIcons = {
  BookOpen,
  ClipboardCheck,
  LayoutDashboard,
  Search,
  Settings,
  Trash2,
  UserRound,
  Users,
};

const tierStyles: Record<string, { bg: string; text: string; dot: string }> = {
  "Must-Have": { bg: "bg-[#DFF8EE]", text: "text-[#10B981]", dot: "bg-[#10B981]" },
  "Good-to-Have": { bg: "bg-[#EAF3FF]", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  "Nice to Have": { bg: "bg-[#F0F0F0]", text: "text-[#86868B]", dot: "bg-[#86868B]" },
  "Future Enhancement": { bg: "bg-[#F1EAFE]", text: "text-[#8B5CF6]", dot: "bg-[#8B5CF6]" },
};

export function AdminDashboard() {
  return (
    <main id="dictionary" className="min-h-screen bg-white text-[#171717]">
      <div className="grid min-h-screen lg:grid-cols-[220px_minmax(0,1fr)]">
        <Sidebar />
        <section className="min-w-0 bg-white">
          <div className="px-4 py-8 sm:px-6 lg:ml-6 lg:mr-[18px] lg:max-w-none lg:px-0">
            <PageHeader />
            <section className="mt-7 grid gap-5 xl:grid-cols-2">
              <AutomationLevelsCard />
              <ProcessTiersCard />
            </section>
            <BenchmarkCard />
            <section className="mt-5 grid gap-5 xl:grid-cols-2">
              <DictionaryListCard title="Industries (7)" items={industries} />
              <DictionaryListCard title="Domains (8)" items={domains} />
            </section>
            <ProcessLibraryCard />
            <TechnologyStackCard />
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar() {
  return (
    <aside className="hidden border-r border-black/[0.08] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-black/[0.08] px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-black text-white">
          <ShieldCheck size={16} aria-hidden="true" />
        </div>
        <p className="text-[15px] font-bold leading-none">Admin Panel</p>
      </div>

      <nav className="space-y-1 px-3 py-4" aria-label="Primary navigation">
        {navigationItems.map((item) => {
          const Icon = navIcons[item.icon];
          const active = item.label === "Data Dictionary";

          return (
            <a
              key={item.label}
              href={item.href}
              className={`flex h-9 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
                active
                  ? "bg-[#007AFF] text-white"
                  : "text-[#555555] hover:bg-black/[0.04] hover:text-[#171717]"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-black/[0.08] p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-full bg-[#007AFF] text-xs font-bold text-white">
            TS
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">Tejas Shah</p>
            <p className="truncate text-xs text-[#86868B]">digital@zoftwarehub.co</p>
          </div>
          <span className="text-[#86868B]" aria-hidden="true">
            v
          </span>
        </div>
      </div>
    </aside>
  );
}

function PageHeader() {
  return (
    <header>
      <h1 className="text-[26px] font-bold leading-tight tracking-normal">Data Dictionary</h1>
      <p className="mt-2 text-sm font-semibold text-[#86868B]">
        Reference and management for every code, scale, and process used across assessments.
      </p>
    </header>
  );
}

function AutomationLevelsCard() {
  return (
    <Panel title="Automation Levels (1-5 Scale)" className="min-h-[309px]">
      <div className="mt-5 space-y-4">
        {automationLevels.map((level) => (
          <div key={level.level} className="grid grid-cols-[28px_minmax(0,1fr)] gap-4">
            <span
              className="flex size-6 items-center justify-center rounded-md text-xs font-bold text-white"
              style={{ backgroundColor: level.color }}
            >
              {level.level}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-bold leading-none">{level.label}</p>
              <p className="mt-1 text-xs font-semibold text-[#86868B]">{level.description}</p>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ProcessTiersCard() {
  return (
    <Panel title="Process Tiers" className="min-h-[309px]">
      <div className="mt-7 space-y-4">
        {processTiers.map((tier) => (
          <div key={tier.label} className="flex items-center justify-between gap-5 text-xs font-bold">
            <TierPill tier={tier.label} />
            <span className="text-right text-[#86868B]">{tier.slug}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function BenchmarkCard() {
  return (
    <Panel className="mt-5 min-h-[134px]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">GCC / MENA CX Benchmark</p>
        <button type="button" className="text-xs font-bold text-[#007AFF]">
          Edit in Settings -&gt;
        </button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        {benchmarkMetrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-2xl font-bold leading-none">{metric.value}</p>
            <p className="mt-2 text-xs font-semibold text-[#86868B]">{metric.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DictionaryListCard({ items, title }: { items: readonly string[]; title: string }) {
  return (
    <Panel className="min-h-[238px]" title={title} actionLabel="Add">
      <div className="mt-7 grid gap-x-12 gap-y-5 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={item} className="flex min-w-0 items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-[#86868B]">
              {index % 2 === 0 ? <Building2 size={13} aria-hidden="true" /> : <Database size={13} aria-hidden="true" />}
            </span>
            <span className="truncate text-sm font-bold text-[#555555]">{item}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function ProcessLibraryCard() {
  return (
    <Panel className="mt-5" title="Process Library (92 of 92)" actionLabel="Add Process">
      <FilterRow primaryPlaceholder="Search processes..." />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left text-sm">
          <tbody>
            {processRows.map((row) => (
              <tr key={row.code} className="group">
                <td className="w-10 border-t border-black/[0.05] py-3 pl-3 text-[#86868B]">
                  <ChevronRight size={14} aria-hidden="true" />
                </td>
                <td className="w-20 border-t border-black/[0.05] py-3 text-xs font-bold text-[#C1C7D0]">{row.code}</td>
                <td className="border-t border-black/[0.05] py-3 font-bold text-[#333333]">{row.name}</td>
                <td className="w-12 border-t border-black/[0.05] py-3 text-xs font-bold text-[#86868B]">{row.domain}</td>
                <td className="w-36 border-t border-black/[0.05] py-3">
                  <TierPill tier={row.tier} />
                </td>
                <td className="w-28 border-t border-black/[0.05] py-3 pr-4 text-right text-xs font-bold text-[#C1C7D0]">
                  All industries
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PaginationSummary label="Showing 1-20 of 92" pages={[1, 2, 3, 4, 5]} />
    </Panel>
  );
}

function TechnologyStackCard() {
  return (
    <Panel className="mt-5" title="Technology Stack Library (50 of 50)" actionLabel="Add Tool">
      <FilterRow primaryPlaceholder="Search tools or vendors..." compact />
      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {technologyRows.map((tool) => (
          <article key={tool.name} className="rounded-md border border-black/[0.08] bg-white px-4 py-3">
            <p className="text-sm font-bold">{tool.name}</p>
            <p className="mt-1 text-xs font-semibold text-[#86868B]">{tool.category}</p>
          </article>
        ))}
      </div>
      <PaginationSummary label="Showing 1-20 of 50" pages={[1, 2, 3]} />
    </Panel>
  );
}

function FilterRow({ compact = false, primaryPlaceholder }: { compact?: boolean; primaryPlaceholder: string }) {
  return (
    <div className="mt-7 flex flex-wrap gap-2">
      <label className="flex h-9 w-full items-center gap-2 rounded-md border border-black/[0.08] px-3 sm:w-[280px]">
        <Search size={14} className="text-[#A1A1AA]" aria-hidden="true" />
        <input
          aria-label={primaryPlaceholder.replace("...", "")}
          className="min-w-0 flex-1 text-xs font-semibold outline-none placeholder:text-[#A1A1AA]"
          placeholder={primaryPlaceholder}
          type="search"
        />
      </label>
      <div className="h-9 w-[180px] rounded-md border border-black/[0.08] bg-white" />
      {!compact ? <div className="h-9 w-[120px] rounded-md border border-black/[0.08] bg-white" /> : null}
    </div>
  );
}

function PaginationSummary({ label, pages }: { label: string; pages: readonly number[] }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#86868B]">
      <span>{label}</span>
      <div className="flex items-center gap-1">
        <button type="button" className="flex size-7 items-center justify-center rounded-md border border-black/[0.05] text-[#C1C7D0]" aria-label="Previous page">
          &lt;
        </button>
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${
              page === 1 ? "border-[#007AFF] bg-[#007AFF] text-white" : "border-black/[0.08] bg-white text-[#555555]"
            }`}
          >
            {page}
          </button>
        ))}
        <button type="button" className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555]" aria-label="Next page">
          &gt;
        </button>
      </div>
    </div>
  );
}

function TierPill({ tier }: { tier: string }) {
  const styles = tierStyles[tier] ?? tierStyles["Nice to Have"];

  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles.bg} ${styles.text}`}>
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {tier}
    </span>
  );
}

function Panel({
  actionLabel,
  children,
  className = "",
  title,
}: {
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section className={`min-w-0 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}>
      {title || actionLabel ? (
        <div className="flex items-center justify-between gap-4">
          {title ? <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">{title}</p> : <span />}
          {actionLabel ? (
            <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-[#007AFF]">
              <Plus size={12} aria-hidden="true" />
              {actionLabel}
            </button>
          ) : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}