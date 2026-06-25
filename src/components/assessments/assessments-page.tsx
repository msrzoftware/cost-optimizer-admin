"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownToLine,
  Building2,
  CalendarDays,
  Car,
  ClipboardPlus,
  Home,
  Landmark,
  LayoutGrid,
  Search,
  Shield,
  ShoppingBag,
  Stethoscope,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { fetchAdminAssessments, type AdminAssessmentRow } from "@/api/assessments.api";
import { AdminShell } from "@/components/admin-shell/admin-shell";

const assessmentsQueryKey = ["admin-assessments"] as const;
const pageSize = 10;
const emptyAssessments: AdminAssessmentRow[] = [];

type SortKey = "company" | "score" | "cost" | "savings";
type SortDirection = "asc" | "desc";

const statusStyles = {
  gray: {
    chip: "bg-[#F5F5F5] text-[#8E9AAB]",
    dot: "bg-[#C1C7D0]",
  },
  blueLight: {
    chip: "bg-[#EEF5FF] text-[#4D7FEA]",
    dot: "bg-[#6E9FF8]",
  },
  blue: {
    chip: "bg-[#EAF3FF] text-[#007AFF]",
    dot: "bg-[#007AFF]",
  },
  green: {
    chip: "bg-[#ECFDF5] text-[#10B981]",
    dot: "bg-[#10B981]",
  },
  red: {
    chip: "bg-[#FEF2F2] text-[#EF4444]",
    dot: "bg-[#EF4444]",
  },
} as const;

const industryIconStyles: Record<string, { icon: LucideIcon }> = {
  Automotive: { icon: Car },
  Banking: { icon: Landmark },
  Healthcare: { icon: Stethoscope },
  Insurance: { icon: Shield },
  "Public Sector": { icon: Building2 },
  "Real Estate": { icon: Home },
  Retail: { icon: ShoppingBag },
};

export function AssessmentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [industryFilter, setIndustryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [minimumScoreFilter, setMinimumScoreFilter] = useState("");
  const [fromDateFilter, setFromDateFilter] = useState("");
  const [toDateFilter, setToDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("company");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const { data, error, isLoading } = useQuery({
    queryKey: assessmentsQueryKey,
    queryFn: fetchAdminAssessments,
  });

  const assessments = data?.assessments ?? emptyAssessments;
  const totalAssessments = data?.totalAssessments ?? assessments.length;
  const errorMessage = error ? getErrorMessage(error) : "";
  const industryOptions = useMemo(() => getUniqueOptions(assessments, "industry"), [assessments]);
  const statusOptions = useMemo(() => getUniqueOptions(assessments, "status"), [assessments]);

  const filteredAssessments = useMemo(() => {
    const normalizedQuery = normalizeSearch(searchQuery);
    const minimumScore = Number(minimumScoreFilter);
    const hasMinimumScore = Number.isFinite(minimumScore) && minimumScoreFilter.trim() !== "";
    const fromTime = getDateStartTime(fromDateFilter);
    const toTime = getDateEndTime(toDateFilter);

    return assessments
      .filter((assessment) => {
        const searchableText = normalizeSearch(
          `${assessment.company} ${assessment.contact} ${assessment.industry} ${assessment.status}`,
        );
        const updatedTime = getAssessmentUpdatedTime(assessment);

        if (normalizedQuery && !searchableText.includes(normalizedQuery)) {
          return false;
        }

        if (industryFilter !== "all" && assessment.industry !== industryFilter) {
          return false;
        }

        if (statusFilter !== "all" && assessment.status !== statusFilter) {
          return false;
        }

        if (hasMinimumScore && parseMetricNumber(assessment.score) < minimumScore) {
          return false;
        }

        if (fromTime !== null && (updatedTime === null || updatedTime < fromTime)) {
          return false;
        }

        if (toTime !== null && (updatedTime === null || updatedTime > toTime)) {
          return false;
        }

        return true;
      })
      .sort((first, second) =>
        compareAssessments(first, second, sortKey, sortDirection),
      );
  }, [
    assessments,
    fromDateFilter,
    industryFilter,
    minimumScoreFilter,
    searchQuery,
    sortDirection,
    sortKey,
    statusFilter,
    toDateFilter,
  ]);

  const pageCount = Math.max(1, Math.ceil(filteredAssessments.length / pageSize));
  const activePage = Math.min(page, pageCount);
  const firstRowIndex = filteredAssessments.length ? (activePage - 1) * pageSize + 1 : 0;
  const lastRowIndex = Math.min(activePage * pageSize, filteredAssessments.length);
  const pagedAssessments = filteredAssessments.slice(
    (activePage - 1) * pageSize,
    activePage * pageSize,
  );

  function handleSort(nextSortKey: SortKey) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection("asc");
  }

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <AdminShell activeItem="Assessments">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] leading-tight font-bold tracking-normal">Assessments</h1>
          <p className="mt-2 text-sm font-semibold text-[#86868B]">
            {isLoading
              ? "Loading submissions..."
              : `${Math.min(assessments.length, totalAssessments)} of ${totalAssessments} total submissions`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportAssessmentsCsv(filteredAssessments)}
            disabled={!filteredAssessments.length}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:border-[#007AFF]/30 hover:text-[#007AFF] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDownToLine size={13} aria-hidden="true" />
            Export CSV
          </button>
          <button
            type="button"
            disabled
            title="New assessments are created from the customer assessment flow."
            className="inline-flex h-9 cursor-not-allowed items-center gap-2 rounded-md bg-[#007AFF] px-4 text-xs font-bold text-white opacity-80"
          >
            <ClipboardPlus size={13} aria-hidden="true" />
            Add Assessment
          </button>
        </div>
      </header>

      <section className="mt-8 flex min-h-[520px] flex-col" aria-label="Assessments table">
        <div className="mb-[10px] flex flex-wrap items-center gap-2">
          <SearchInput
            value={searchQuery}
            onChange={(value) => updateFilter(setSearchQuery, value)}
          />
          <FilterSelect
            ariaLabel="Filter by industry"
            value={industryFilter}
            onChange={(value) => updateFilter(setIndustryFilter, value)}
          >
            <option value="all">All industries</option>
            {industryOptions.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            ariaLabel="Filter by status"
            value={statusFilter}
            onChange={(value) => updateFilter(setStatusFilter, value)}
          >
            <option value="all">All statuses</option>
            {statusOptions.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </FilterSelect>
          <input
            aria-label="Minimum DI score"
            value={minimumScoreFilter}
            onChange={(event) =>
              updateFilter(setMinimumScoreFilter, event.target.value)
            }
            className="h-8 w-full rounded-md border border-black/[0.08] bg-white px-3 text-[11px] font-semibold text-[#555555] outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF] sm:w-[112px]"
            inputMode="numeric"
            placeholder="DI min %"
          />
          <DateInput
            ariaLabel="Updated from date"
            value={fromDateFilter}
            onChange={(value) => updateFilter(setFromDateFilter, value)}
          />
          <span className="px-1 text-xs font-bold text-[#A1A1AA]">to</span>
          <DateInput
            ariaLabel="Updated to date"
            value={toDateFilter}
            onChange={(value) => updateFilter(setToDateFilter, value)}
          />
        </div>

        <div className="flex h-[calc(100vh-190px)] min-h-[460px] flex-col overflow-hidden rounded-md border border-black/[0.08] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
          <div className="flex-1 overflow-auto">
            <table className="w-full min-w-[1170px] table-fixed border-collapse">
              <colgroup>
                <col className="w-[334px]" />
                <col className="w-[157px]" />
                <col className="w-[129px]" />
                <col className="w-[143px]" />
                <col className="w-[143px]" />
                <col className="w-[217px]" />
                <col className="w-[47px]" />
              </colgroup>
              <thead className="sticky top-0 z-10">
                <tr className="h-9 border-b border-black/[0.08] bg-[#FAFAFA] text-left">
                  <SortableHeader
                    active={sortKey === "company"}
                    direction={sortDirection}
                    label="Company"
                    onSort={() => handleSort("company")}
                  />
                  <TableHeader label="Industry" />
                  <SortableHeader
                    active={sortKey === "score"}
                    direction={sortDirection}
                    label="DI Score"
                    onSort={() => handleSort("score")}
                  />
                  <SortableHeader
                    active={sortKey === "cost"}
                    direction={sortDirection}
                    label="Total Cost"
                    onSort={() => handleSort("cost")}
                  />
                  <SortableHeader
                    active={sortKey === "savings"}
                    direction={sortDirection}
                    label="Savings"
                    onSort={() => handleSort("savings")}
                  />
                  <TableHeader label="Status" />
                  <th className="w-12 px-4" aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {isLoading ? <AssessmentRowsSkeleton /> : null}

                {!isLoading && pagedAssessments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="h-32 px-5 text-center text-sm font-semibold text-[#86868B]"
                    >
                      {errorMessage || "No assessments found."}
                    </td>
                  </tr>
                ) : null}

                {!isLoading
                  ? pagedAssessments.map((assessment) => (
                      <AssessmentRow key={assessment.id} assessment={assessment} />
                    ))
                  : null}
              </tbody>
            </table>
          </div>

          <div className="flex min-h-[44px] shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/[0.08] px-5 py-2 text-[11px] font-semibold text-[#86868B]">
            <span>
              {filteredAssessments.length
                ? `Showing ${firstRowIndex}-${lastRowIndex} of ${filteredAssessments.length}`
                : "Showing 0 of 0"}
              {totalAssessments > filteredAssessments.length
                ? ` (${totalAssessments} total submissions)`
                : ""}
            </span>
            <PaginationControls
              page={activePage}
              pageCount={pageCount}
              onPageChange={setPage}
            />
          </div>
        </div>
      </section>
    </AdminShell>
  );
}

function AssessmentRow({ assessment }: { assessment: AdminAssessmentRow }) {
  const statusTone = getStatusTone(assessment.status, assessment.statusKey);

  return (
    <tr className="h-[58px] border-b border-black/[0.05] transition hover:bg-[#FAFAFA] last:border-b-0">
      <td className="py-3 pr-6 pl-[60px]">
        <p className="max-w-[280px] truncate text-[12px] leading-[1.2] font-bold text-[#171717]">
          {assessment.company}
        </p>
        <p className="mt-1 max-w-[280px] truncate text-[10px] leading-[1.2] font-semibold text-[#8E9AAB]">
          {assessment.contact}
        </p>
      </td>
      <td className="px-0 py-3">
        <div className="flex max-w-[160px] items-center gap-2 text-[11px] font-semibold text-[#555555]">
          <IndustryIcon industry={assessment.industry} />
          <span className="truncate">{assessment.industry}</span>
        </div>
      </td>
      <td className="px-0 py-3 text-[11px] font-bold text-[#007AFF]">
        <MetricValue value={assessment.score} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-[11px] font-bold text-[#171717]">
        <MetricValue value={assessment.cost} mutedValue="--" />
      </td>
      <td className="px-0 py-3 text-[11px] font-bold text-[#10B981]">
        <MetricValue value={assessment.savings} mutedValue="--" />
      </td>
      <td className="px-0 py-3">
        <StatusPill label={assessment.status} tone={statusTone} />
      </td>
      <td className="px-4 py-3 text-right">
        <button
          type="button"
          disabled
          title="Delete/archive requires a backend admin endpoint."
          className="inline-flex size-7 cursor-not-allowed items-center justify-center rounded-md text-[#8E9AAB] opacity-70"
          aria-label={`Delete ${assessment.company}`}
        >
          <Trash2 size={13} aria-hidden="true" />
        </button>
      </td>
    </tr>
  );
}

function AssessmentRowsSkeleton() {
  return (
    <>
      {Array.from({ length: 10 }).map((_, index) => (
        <tr key={index} className="h-[58px] border-b border-black/[0.05]">
          {Array.from({ length: 7 }).map((__, itemIndex) => (
            <td key={itemIndex} className="px-6 py-3">
              <div className="h-4 animate-pulse rounded-full bg-black/[0.06]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function SearchInput({
  onChange,
  value,
}: {
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex h-8 w-full items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 sm:w-[300px]">
      <Search size={13} className="text-[#A1A1AA]" aria-hidden="true" />
      <input
        aria-label="Search company, contact, or region"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 text-[11px] font-semibold text-[#555555] outline-none placeholder:text-[#A1A1AA]"
        placeholder="Search company, contact, region..."
        type="search"
      />
    </label>
  );
}

function FilterSelect({
  ariaLabel,
  children,
  onChange,
  value,
}: {
  ariaLabel: string;
  children: React.ReactNode;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-8 w-full rounded-md border border-black/[0.08] bg-white px-3 text-[11px] font-semibold text-[#555555] outline-none focus:border-[#007AFF] sm:w-[148px]"
    >
      {children}
    </select>
  );
}

function DateInput({
  ariaLabel,
  onChange,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="flex h-8 w-full items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 sm:w-[126px]">
      <CalendarDays size={12} className="text-[#A1A1AA]" aria-hidden="true" />
      <input
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 text-xs font-semibold text-[#555555] outline-none"
        type="date"
      />
    </label>
  );
}

function SortableHeader({
  active,
  direction,
  label,
  onSort,
}: {
  active: boolean;
  direction: SortDirection;
  label: string;
  onSort: () => void;
}) {
  const headerPadding = label === "Company" ? "py-0 pr-0 pl-[60px]" : "px-0 py-0";

  return (
    <th className={headerPadding}>
      <button
        type="button"
        onClick={onSort}
        className="inline-flex items-center gap-[7px] text-[10px] leading-none font-bold tracking-[0.08em] text-[#86868B] uppercase"
      >
        {label}
        <SortGlyph reversed={active && direction === "desc"} />
      </button>
    </th>
  );
}

function TableHeader({ label }: { label: string }) {
  return (
    <th className="px-0 py-0 text-[10px] leading-none font-bold tracking-[0.08em] text-[#86868B] uppercase">
      {label}
    </th>
  );
}

function SortGlyph({ reversed }: { reversed: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={`size-[9px] shrink-0 transition-transform ${reversed ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 9 9"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8.25 6L6.75 7.5L5.25 6" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
      <path d="M6.75 7.5V1.5" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
      <path d="M1.5 3L3 1.5L4.5 3" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
      <path d="M3 1.5V7.5" stroke="#86868B" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.75" />
    </svg>
  );
}

function MetricValue({ mutedValue, value }: { mutedValue: string; value: string }) {
  if (!value || value === mutedValue) {
    return <span className="text-[#A1A1AA]">{mutedValue}</span>;
  }

  return <span>{value}</span>;
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: keyof typeof statusStyles;
}) {
  const styles = statusStyles[tone];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[5px] text-[10px] leading-none font-bold ${styles.chip}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

function IndustryIcon({ industry }: { industry: string }) {
  const Icon = industryIconStyles[industry]?.icon || LayoutGrid;

  return <Icon size={12} className="shrink-0 text-[#86868B]" aria-hidden="true" />;
}

function PaginationControls({
  onPageChange,
  page,
  pageCount,
}: {
  onPageChange: (page: number) => void;
  page: number;
  pageCount: number;
}) {
  const pages = getVisiblePages(page, pageCount);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
        aria-label="Previous page"
      >
        &lt;
      </button>
      {pages.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onPageChange(item)}
          className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${
            item === page
              ? "border-[#007AFF] bg-[#007AFF] text-white"
              : "border-black/[0.08] bg-white text-[#555555]"
          }`}
        >
          {item}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(Math.min(pageCount, page + 1))}
        disabled={page >= pageCount}
        className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
        aria-label="Next page"
      >
        &gt;
      </button>
    </div>
  );
}

function getVisiblePages(page: number, pageCount: number) {
  const start = Math.max(1, Math.min(page - 2, pageCount - 4));
  const end = Math.min(pageCount, start + 4);

  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getStatusTone(status: string, statusKey = ""): keyof typeof statusStyles {
  const normalizedStatusKey = normalizeStatusKey(statusKey);

  if (normalizedStatusKey === "closed-won") {
    return "green";
  }

  if (normalizedStatusKey === "closed-lost") {
    return "red";
  }

  if (normalizedStatusKey === "expert-booked") {
    return "blue";
  }

  if (normalizedStatusKey === "due-diligence" || normalizedStatusKey === "results-ready") {
    return "blueLight";
  }

  const normalizedStatus = normalizeStatusKey(status);

  if (normalizedStatus === "due-diligence" || normalizedStatus === "results-ready") {
    return "blueLight";
  }

  if (normalizedStatus === "expert-booked") {
    return "blue";
  }

  return "gray";
}

function compareAssessments(
  first: AdminAssessmentRow,
  second: AdminAssessmentRow,
  sortKey: SortKey,
  direction: SortDirection,
) {
  const directionMultiplier = direction === "asc" ? 1 : -1;

  if (sortKey === "company") {
    return first.company.localeCompare(second.company) * directionMultiplier;
  }

  return (
    (parseMetricNumber(first[sortKey]) - parseMetricNumber(second[sortKey])) *
    directionMultiplier
  );
}

function getUniqueOptions(rows: AdminAssessmentRow[], key: "industry" | "status") {
  return Array.from(
    new Set(rows.map((row) => row[key]).filter((value) => value && value !== "--")),
  ).sort((first, second) => first.localeCompare(second));
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeStatusKey(value: string) {
  return value.trim().toLowerCase().replace(/_+/g, "-").replace(/\s+/g, "-");
}

function parseMetricNumber(value: string) {
  const normalizedValue = String(value || "").trim().toLowerCase();
  const numericValue = Number(normalizedValue.replace(/[^0-9.]/g, ""));

  if (!Number.isFinite(numericValue)) {
    return -1;
  }

  if (normalizedValue.includes("m")) {
    return numericValue * 1_000_000;
  }

  if (normalizedValue.includes("k")) {
    return numericValue * 1_000;
  }

  return numericValue;
}

function getDateStartTime(value: string) {
  if (!value) {
    return null;
  }

  const time = new Date(`${value}T00:00:00`).getTime();

  return Number.isFinite(time) ? time : null;
}

function getDateEndTime(value: string) {
  if (!value) {
    return null;
  }

  const time = new Date(`${value}T23:59:59`).getTime();

  return Number.isFinite(time) ? time : null;
}

function getAssessmentUpdatedTime(assessment: AdminAssessmentRow) {
  const time = new Date(assessment.updatedAt || "").getTime();

  return Number.isFinite(time) ? time : null;
}

function exportAssessmentsCsv(rows: AdminAssessmentRow[]) {
  const headers = ["Company", "Contact", "Industry", "DI Score", "Total Cost", "Savings", "Status"];
  const csvRows = rows.map((row) => [
    row.company,
    row.contact,
    row.industry,
    row.score,
    row.cost,
    row.savings,
    row.status,
  ]);
  const csv = [headers, ...csvRows]
    .map((row) => row.map(escapeCsvCell).join(","))
    .join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `cos-assessments-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string) {
  const normalizedValue = String(value ?? "");

  if (/[",\n\r]/.test(normalizedValue)) {
    return `"${normalizedValue.replace(/"/g, '""')}"`;
  }

  return normalizedValue;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load assessments";
}
