"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Car,
  Home,
  LayoutGrid,
  ShoppingBag,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

import { AssessmentTrendChart } from "./assessment-trend-chart";
import {
  assessmentTrend,
  companySizeDistribution,
  dashboardStats,
  industryBreakdown,
  pipelineConversion,
  pipelineStatuses,
  selectedProcesses,
  stageWeights,
  type PipelineStatus,
  type RecentAssessment,
} from "./dashboard-data";
import { fetchDashboardData } from "@/api/dashboard.api";

const dashboardQueryKey = ["admin-dashboard"] as const;

const statToneStyles = {
  neutral: "text-[#171717]",
  blue: "text-[#007AFF]",
  green: "text-[#10B981]",
} as const;

const statusStyles = {
  gray: { icon: "bg-[#9CA3AF]", chip: "bg-[#F5F5F5] text-[#555555]", dot: "bg-[#9CA3AF]", bar: "bg-[#F5F5F5]" },
  blueLight: { icon: "bg-[#6E9FF8]", chip: "bg-[#EEF5FF] text-[#4D7FEA]", dot: "bg-[#6E9FF8]", bar: "bg-[#EEF5FF]" },
  blue: { icon: "bg-[#007AFF]", chip: "bg-[#EAF3FF] text-[#007AFF]", dot: "bg-[#007AFF]", bar: "bg-[#EAF3FF]" },
  green: { icon: "bg-[#10B981]", chip: "bg-[#ECFDF5] text-[#10B981]", dot: "bg-[#10B981]", bar: "bg-[#ECFDF5]" },
  red: { icon: "bg-[#EF4444]", chip: "bg-[#FEF2F2] text-[#EF4444]", dot: "bg-[#EF4444]", bar: "bg-[#FEF2F2]" },
} as const;

const recentAssessmentGridClassName =
  "xl:grid-cols-[minmax(240px,1.52fr)_132px_82px_132px_132px_172px_16px]";

const industryIconStyles: Record<string, { className: string; icon: LucideIcon }> = {
  Automotive: { className: "text-[#86868B]", icon: Car },
  Healthcare: { className: "text-[#86868B]", icon: Stethoscope },
  "Public Sector": { className: "text-[#86868B]", icon: Building2 },
  "Real Estate": { className: "text-[#86868B]", icon: Home },
  Retail: { className: "text-[#86868B]", icon: ShoppingBag },
};

export function AdminDashboard() {
  return (
    <AdminShell activeItem="Dashboard">
      <header>
        <h1 className="text-[26px] leading-tight font-bold tracking-normal">Business Dashboard</h1>
        <p className="mt-2 text-sm font-semibold text-[#86868B]">
          Overview of every assessment submitted through the Enterprise Cost Optimizer.
        </p>
      </header>

      <section className="mt-7 grid gap-5 xl:grid-cols-4" aria-label="Business dashboard summary">
        {dashboardStats.map((stat) => (
          <Panel key={stat.label} className="min-h-[118px] p-5">
            <p className="text-[10px] font-bold tracking-[0.14em] text-[#A1A1AA] uppercase">
              {stat.label}
            </p>
            <p className={`mt-4 text-[30px] leading-none font-bold ${statToneStyles[stat.tone]}`}>
              {stat.value}
            </p>
            <p className="mt-2 text-xs font-semibold text-[#86868B]">{stat.helper}</p>
          </Panel>
        ))}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-2" aria-label="Pipeline distribution">
        <PipelineStatusCard />
        <IndustryBreakdownCard />
      </section>

      <section
        className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.42fr)_minmax(360px,1fr)]"
        aria-label="Pipeline trend and value"
      >
        <AssessmentTrendCard />
        <WeightedPipelineCard />
      </section>

      <PipelineConversionCard />

      <section className="mt-5 grid gap-5 xl:grid-cols-2" aria-label="Portfolio signals">
        <CompanySizeCard />
        <SelectedProcessesCard />
      </section>

      <RecentAssessmentsList />
    </AdminShell>
  );
}

function PipelineStatusCard() {
  const { data, error, isLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const statuses = data?.pipelineByStatus
    ? mergePipelineStatuses(data.pipelineByStatus)
    : pipelineStatuses;
  const errorMessage = error ? getErrorMessage(error) : "";
  const maxStatusCount = Math.max(1, ...statuses.map((status) => status.count));

  return (
    <Panel title="Pipeline by Status" className="min-h-[365px]">
      <div className="mt-5 space-y-2">
        {statuses.map((status) => {
          const styles = statusStyles[status.tone];
          const fillWidth = status.count > 0 ? `${(status.count / maxStatusCount) * 100}%` : "0%";

          return (
            <div
              key={status.key || status.label}
              className="relative h-9 overflow-hidden rounded-md border border-black/[0.04] bg-white"
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-md ${styles.bar}`}
                style={{ width: fillWidth }}
              />
              <div className="relative flex h-full items-center gap-3 px-3">
                <span className={`flex size-6 items-center justify-center rounded-md ${styles.icon}`}>
                  <span className="size-1.5 rounded-full bg-white" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#555555]">
                  {status.label}
                </span>
                <span
                  className={`text-xs font-bold ${status.tone === "green" ? "text-[#10B981]" : status.tone === "red" ? "text-[#EF4444]" : "text-[#007AFF]"}`}
                >
                  {status.count}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {isLoading ? (
        <p className="mt-4 text-xs font-semibold text-[#86868B]">Loading real pipeline counts...</p>
      ) : null}
      {!isLoading && errorMessage ? (
        <p className="mt-4 text-xs font-semibold text-[#EF4444]">{errorMessage}</p>
      ) : null}
    </Panel>
  );
}

function IndustryBreakdownCard() {
  const maxCount = Math.max(...industryBreakdown.map((industry) => industry.count));

  return (
    <Panel title="By Industry" className="min-h-[365px]">
      <div className="mt-5 space-y-2">
        {industryBreakdown.map((industry) => (
          <div
            key={industry.label}
            className="relative h-9 overflow-hidden rounded-md border border-black/[0.04] bg-white"
          >
            <div
              className="absolute inset-y-0 left-0 rounded-md bg-[#EAF3FF]"
              style={{ width: `${(industry.count / maxCount) * 100}%` }}
            />
            <div className="relative flex h-full items-center gap-3 px-3">
              <span className="flex size-6 items-center justify-center rounded-md bg-[#007AFF] text-white">
                <Building2 size={13} aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-bold text-[#555555]">
                {industry.label}
              </span>
              <span className="text-xs font-bold text-[#007AFF]">{industry.count}</span>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function AssessmentTrendCard() {
  return (
    <Panel title="New Assessments - Last 6 Months" className="min-h-[270px]">
      <AssessmentTrendChart data={assessmentTrend} />
    </Panel>
  );
}

function WeightedPipelineCard() {
  return (
    <Panel title="Weighted Pipeline Value" className="min-h-[264px]">
      <p className="mt-10 text-[32px] leading-none font-bold">$1.4M</p>
      <p className="mt-2 text-xs font-semibold text-[#86868B]">
        Open deals x stage-probability - a more realistic forecast than raw pipeline cost.
      </p>
      <div className="mt-6 space-y-3">
        {stageWeights.map((stage) => (
          <div
            key={stage.label}
            className="flex items-center justify-between gap-4 text-xs font-bold"
          >
            <span className="text-[#86868B]">{stage.label}</span>
            <span className="text-[#171717]">{stage.weight}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function PipelineConversionCard() {
  return (
    <Panel title="Pipeline Conversion (of Active + Won Deals)" className="mt-5 min-h-[250px]">
      <div className="mt-7 space-y-4">
        {pipelineConversion.map((item) => (
          <div
            key={item.label}
            className="grid grid-cols-[140px_minmax(0,1fr)_62px] items-center gap-4 text-xs font-bold"
          >
            <span className="truncate text-[#86868B]">{item.label}</span>
            <div className="relative h-5 overflow-hidden rounded-full bg-[#F0F0F0]">
              <div
                className="flex h-full items-center justify-end rounded-full bg-[#007AFF] pr-2 text-[10px] font-bold text-white"
                style={{ width: `${item.percent}%` }}
              >
                {item.percent}%
              </div>
            </div>
            <span className="text-right text-[#A1A1AA]">{item.deals}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CompanySizeCard() {
  const maxValue = 8;

  return (
    <Panel title="By Company Size" className="min-h-[310px]">
      <div className="mt-7 grid grid-cols-[112px_minmax(0,1fr)] gap-x-5">
        <div className="space-y-4 pt-1">
          {companySizeDistribution.map((item) => (
            <p
              key={item.label}
              className="text-right text-[11px] leading-3 font-semibold whitespace-pre-line text-[#86868B]"
            >
              {item.label}
            </p>
          ))}
        </div>
        <div className="relative min-h-[190px] border-l border-black/[0.05] pl-0">
          <ChartGrid columns={4} />
          <div className="relative z-10 space-y-[21px] pt-2">
            {companySizeDistribution.map((item) => (
              <div
                key={item.label}
                className="h-3 rounded-r-full bg-[#007AFF]"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 text-center text-[11px] font-semibold text-[#C1C7D0]">
            {[0, 2, 4, 6, 8].map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SelectedProcessesCard() {
  const maxValue = 12;

  return (
    <Panel
      title="Most-Selected Processes (Signal for Product Priorities)"
      className="min-h-[310px]"
    >
      <div className="mt-7 grid grid-cols-[150px_minmax(0,1fr)] gap-x-5">
        <div className="space-y-[9px] pt-1">
          {selectedProcesses.map((process) => (
            <p
              key={process.label}
              className="text-right text-[11px] leading-3 font-semibold whitespace-pre-line text-[#86868B]"
            >
              {process.label}
            </p>
          ))}
        </div>
        <div className="relative min-h-[190px] border-l border-black/[0.05]">
          <ChartGrid columns={4} />
          <div className="relative z-10 space-y-[16px] pt-1">
            {selectedProcesses.map((process) => (
              <div
                key={process.label}
                className="h-3 rounded-r-full bg-[#10B981]"
                style={{ width: `${(process.value / maxValue) * 100}%` }}
              />
            ))}
          </div>
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 text-center text-[11px] font-semibold text-[#C1C7D0]">
            {[0, 3, 6, 9, 12].map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function RecentAssessmentsList() {
  const { data, error, isLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const assessments = getRecentlyUpdatedUsers(data?.recentAssessments ?? []);
  const errorMessage = error ? getErrorMessage(error) : "";

  return (
    <section className="mt-7">
      <div className="mb-[18px] flex items-center justify-between gap-4">
        <p className="text-[10px] leading-none font-bold tracking-[0.12em] text-[#86868B] uppercase">
          Recently Updated
        </p>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs leading-none font-bold text-[#007AFF]"
        >
          View all
          <ArrowRight size={12} aria-hidden="true" />
        </button>
      </div>

      <div
        className={`hidden ${recentAssessmentGridClassName} gap-4 px-5 pb-2 text-[9px] leading-none font-bold tracking-[0.1em] text-[#A1A1AA] uppercase xl:grid`}
      >
        <span>Company</span>
        <span>Industry</span>
        <span>DI Score</span>
        <span>Total Cost</span>
        <span>Savings</span>
        <span>Status</span>
        <span />
      </div>

      <div className="space-y-2">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <article
                key={index}
                className={`grid min-h-[60px] gap-4 rounded-md border border-black/[0.08] bg-white px-5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${recentAssessmentGridClassName} xl:items-center`}
              >
                {Array.from({ length: 6 }).map((__, itemIndex) => (
                  <span
                    key={itemIndex}
                    className="h-4 animate-pulse rounded-full bg-black/[0.06]"
                  />
                ))}
              </article>
            ))
          : null}

        {!isLoading && assessments.length === 0 ? (
          <div className="rounded-md border border-black/[0.08] bg-white px-5 py-5 text-sm font-semibold text-[#86868B] shadow-[0_1px_3px_rgba(15,23,42,0.05)]">
            {errorMessage || "No recently updated assessments yet."}
          </div>
        ) : null}

        {!isLoading && assessments.map((assessment) => {
          const statusTone = getStatusTone(assessment.status, assessment.statusKey);

          return (
            <article
              key={assessment.id}
              className={`grid min-h-[60px] gap-4 rounded-md border border-black/[0.08] bg-white px-5 py-3 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${recentAssessmentGridClassName} xl:items-center`}
            >
              <div>
                <p className="truncate text-sm leading-[1.2] font-bold text-[#171717]">{assessment.company}</p>
                <p className="mt-1 truncate text-xs leading-[1.2] font-semibold text-[#86868B]">{assessment.contact}</p>
              </div>
              <div className="flex min-w-0 items-center gap-2 text-xs font-semibold text-[#555555]">
                <IndustryIcon industry={assessment.industry} />
                <span className="min-w-0 truncate">{assessment.industry}</span>
              </div>
              <p
                className={`text-xs font-bold ${assessment.score === "--" ? "text-[#C1C7D0]" : "text-[#007AFF]"}`}
              >
                {assessment.score}
              </p>
              <p className="text-xs font-bold text-[#555555]">{assessment.cost}</p>
              <p
                className={`text-xs font-bold ${assessment.savings === "--" ? "text-[#10B981]" : "text-[#10B981]"}`}
              >
                {assessment.savings}
              </p>
              <StatusPill label={assessment.status} tone={statusTone} />
              <button
                type="button"
                className="hidden text-[#C1C7D0] xl:block"
                aria-label={`Open ${assessment.company}`}
              >
                <ArrowRight size={14} aria-hidden="true" />
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function IndustryIcon({ industry }: { industry: string }) {
  const iconConfig = industryIconStyles[industry];
  const Icon = iconConfig?.icon || LayoutGrid;

  return (
    <Icon
      size={12}
      className={iconConfig?.className || "text-[#86868B]"}
      aria-hidden="true"
    />
  );
}

function ChartGrid({ columns }: { columns: number }) {
  return (
    <div
      className="pointer-events-none absolute inset-0 grid"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: columns }).map((_, index) => (
        <span key={index} className="border-r border-dashed border-black/[0.06]" />
      ))}
    </div>
  );
}

function StatusPill({ label, tone }: { label: string; tone: keyof typeof statusStyles }) {
  const styles = statusStyles[tone];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold ${styles.chip}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {label}
    </span>
  );
}

function getStatusTone(status: string, statusKey = ""): keyof typeof statusStyles {
  const normalizedStatusKey = normalizeStatusKey(statusKey);

  if (normalizedStatusKey === "closed-won") {
    return "green";
  }

  if (normalizedStatusKey === "closed-lost") {
    return "red";
  }

  if (status === "Due Diligence" || status === "Results Ready") {
    return "blueLight";
  }

  if (status === "Processes In Progress") {
    return "gray";
  }

  return status === "Draft" ? "gray" : "blue";
}

function mergePipelineStatuses(fetchedStatuses: PipelineStatus[]) {
  const fetchedStatusByKey = new Map<string, PipelineStatus>();

  fetchedStatuses.forEach((status) => {
    if (status.key) {
      fetchedStatusByKey.set(normalizeStatusKey(status.key), status);
      return;
    }

    fetchedStatusByKey.set(normalizeStatusLabel(status.label), status);
  });

  return pipelineStatuses.map((status) => {
    const fetchedStatus =
      fetchedStatusByKey.get(normalizeStatusKey(status.key || "")) ||
      fetchedStatusByKey.get(normalizeStatusLabel(status.label));

    return {
      ...status,
      count: Number(fetchedStatus?.count) || 0,
      tone: fetchedStatus?.tone || status.tone,
    };
  });
}

function normalizeStatusKey(value: string) {
  return value.trim().toLowerCase().replace(/_+/g, "-").replace(/\s+/g, "-");
}

function normalizeStatusLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getRecentlyUpdatedUsers(assessments: RecentAssessment[]) {
  const latestAssessmentByUser = new Map<
    string,
    { assessment: RecentAssessment; index: number; time: number }
  >();

  assessments.forEach((assessment, index) => {
    const userKey = getRecentAssessmentUserKey(assessment);
    const time = getRecentAssessmentTime(assessment);
    const currentAssessment = latestAssessmentByUser.get(userKey);

    if (
      !currentAssessment ||
      time > currentAssessment.time ||
      (time === currentAssessment.time && index < currentAssessment.index)
    ) {
      latestAssessmentByUser.set(userKey, { assessment, index, time });
    }
  });

  return Array.from(latestAssessmentByUser.values())
    .sort((first, second) => {
      if (first.time !== second.time) {
        return second.time - first.time;
      }

      return first.index - second.index;
    })
    .map((item) => item.assessment);
}

function getRecentAssessmentUserKey(assessment: RecentAssessment) {
  return normalizeRecentAssessmentValue(
    getContactEmail(assessment.contact) || `${assessment.company}-${assessment.contact}`,
  );
}

function getRecentAssessmentTime(assessment: RecentAssessment) {
  const time = new Date(assessment.updatedAt || assessment.createdAt || "").getTime();

  return Number.isFinite(time) ? time : 0;
}

function getContactEmail(value: string) {
  return value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || "";
}

function normalizeRecentAssessmentValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load dashboard pipeline status";
}

function Panel({
  children,
  className = "",
  title,
}: {
  children: React.ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}
    >
      {title ? (
        <p className="text-[11px] font-bold tracking-[0.12em] text-[#86868B] uppercase">{title}</p>
      ) : null}
      {children}
    </section>
  );
}
