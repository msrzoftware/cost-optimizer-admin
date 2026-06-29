"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Building2,
  Car,
  Clock,
  Home,
  LayoutGrid,
  Shield,
  ShoppingBag,
  Stethoscope,
  type LucideIcon,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

import { AssessmentTrendChart } from "./assessment-trend-chart";
import {
  pipelineStatuses,
  stageWeights,
  type DashboardAssessmentProcess,
  type DashboardCount,
  type DashboardSummary,
  type DashboardTrendPoint,
  type DashboardValue,
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

type DashboardStat = {
  helper: string;
  label: string;
  tone: keyof typeof statToneStyles;
  value: string;
};

const statusStyles = {
  gray: { icon: "bg-[#9CA3AF]", chip: "bg-[#F5F5F5] text-[#555555]", dot: "bg-[#9CA3AF]", bar: "bg-[#F5F5F5]" },
  blueLight: { icon: "bg-[#6E9FF8]", chip: "bg-[#EEF5FF] text-[#4D7FEA]", dot: "bg-[#6E9FF8]", bar: "bg-[#EEF5FF]" },
  blue: { icon: "bg-[#007AFF]", chip: "bg-[#EAF3FF] text-[#007AFF]", dot: "bg-[#007AFF]", bar: "bg-[#EAF3FF]" },
  green: { icon: "bg-[#10B981]", chip: "bg-[#ECFDF5] text-[#10B981]", dot: "bg-[#10B981]", bar: "bg-[#ECFDF5]" },
  red: { icon: "bg-[#EF4444]", chip: "bg-[#FEF2F2] text-[#EF4444]", dot: "bg-[#EF4444]", bar: "bg-[#FEF2F2]" },
} as const;

const recentAssessmentGridClassName =
  "xl:grid-cols-[minmax(220px,1.35fr)_126px_72px_118px_110px_220px_172px_16px]";

const industryIconStyles: Record<string, { className: string; icon: LucideIcon; size?: number }> = {
  automotive: { className: "text-[#86868B]", icon: Car },
  banking: { className: "text-[#86868B]", icon: Building2 },
  healthcare: { className: "text-[#86868B]", icon: Stethoscope },
  insurance: { className: "text-[#86868B]", icon: Shield, size: 13 },
  "public sector": { className: "text-[#86868B]", icon: Building2 },
  "real estate": { className: "text-[#86868B]", icon: Home },
  retail: { className: "text-[#86868B]", icon: ShoppingBag },
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
        <DashboardStatsCards />
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

function DashboardStatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const assessments = data?.recentAssessments ?? [];
  const statuses = data?.pipelineByStatus
    ? mergePipelineStatuses(data.pipelineByStatus)
    : pipelineStatuses;
  const stats = createDashboardStats({
    assessments,
    statuses,
    summary: data?.summary,
    totalAssessments: data?.totalAssessments ?? assessments.length,
  });

  return (
    <>
      {stats.map((stat) => (
        <Panel key={stat.label} className="min-h-[118px] p-5">
          <p className="text-[10px] font-bold tracking-[0.14em] text-[#A1A1AA] uppercase">
            {stat.label}
          </p>
          <p className={`mt-4 text-[30px] leading-none font-bold ${statToneStyles[stat.tone]}`}>
            {isLoading ? "--" : stat.value}
          </p>
          <p className="mt-2 text-xs font-semibold text-[#86868B]">
            {isLoading ? "Loading real dashboard data..." : stat.helper}
          </p>
        </Panel>
      ))}
    </>
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
  const { data, error, isLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const industries = normalizeDashboardCounts(data?.industryBreakdown) ?? createIndustryBreakdown(data?.recentAssessments ?? []);
  const maxCount = Math.max(1, ...industries.map((industry) => industry.count));
  const errorMessage = error ? getErrorMessage(error) : "";

  return (
    <Panel title="By Industry" className="min-h-[365px]">
      <div className="mt-5 space-y-2">
        {isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-9 animate-pulse rounded-md border border-black/[0.04] bg-black/[0.04]"
              />
            ))
          : null}
        {!isLoading && industries.length === 0 ? (
          <p className="rounded-md border border-black/[0.04] bg-white px-3 py-3 text-xs font-semibold text-[#86868B]">
            {errorMessage || "No industry data available yet."}
          </p>
        ) : null}
        {!isLoading &&
          industries.map((industry) => (
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
  const { data } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const trend = normalizeDashboardTrend(data?.assessmentTrend) ?? createAssessmentTrend(data?.recentAssessments ?? []);

  return (
    <Panel title="New Assessments - Last 6 Months" className="min-h-[270px]">
      <AssessmentTrendChart data={trend} />
    </Panel>
  );
}

function WeightedPipelineCard() {
  const { data, isLoading } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const assessments = data?.recentAssessments ?? [];
  const statuses = data?.pipelineByStatus
    ? mergePipelineStatuses(data.pipelineByStatus)
    : pipelineStatuses;
  const weightedPipelineValue = calculateWeightedPipelineValue(statuses, assessments, data?.summary, data?.totalAssessments);

  return (
    <Panel title="Weighted Pipeline Value" className="min-h-[264px]">
      <p className="mt-10 text-[32px] leading-none font-bold">
        {isLoading ? "--" : formatCompactAed(weightedPipelineValue)}
      </p>
      <p className="mt-2 text-xs font-semibold text-[#86868B]">
        Open deals x stage-probability using live pipeline counts and average assessment cost.
      </p>
      <div className="mt-6 space-y-3">
        {stageWeights.map((stage) => {
          const statusCount = getPipelineStatusCount(statuses, stage.label);

          return (
            <div
              key={stage.label}
              className="flex items-center justify-between gap-4 text-xs font-bold"
            >
              <span className="text-[#86868B]">{stage.label}</span>
              <span className="text-[#171717]">
                {stage.weight} - {statusCount} deals
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

function PipelineConversionCard() {
  const { data } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const statuses = data?.pipelineByStatus
    ? mergePipelineStatuses(data.pipelineByStatus)
    : pipelineStatuses;
  const conversion = createPipelineConversion(statuses);

  return (
    <Panel title="Pipeline Conversion (of Active + Won Deals)" className="mt-5 min-h-[250px]">
      <div className="mt-7 space-y-4">
        {conversion.map((item) => (
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
  const { data } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const distribution =
    normalizeDashboardValues(data?.companySizeDistribution)?.map((item) => ({
      ...item,
      label: item.label.includes("employees") ? item.label : `${item.label}\nemployees`,
    })) ?? createCompanySizeDistribution(data?.recentAssessments ?? []);
  const maxValue = getChartAxisMax(distribution.map((item) => item.value));
  const ticks = createChartTicks(maxValue);

  return (
    <Panel title="By Company Size" className="min-h-[310px]">
      <div className="mt-7 grid grid-cols-[112px_minmax(0,1fr)] gap-x-5">
        <div className="space-y-4 pt-1">
          {distribution.map((item) => (
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
            {distribution.map((item) => (
              <div
                key={item.label}
                className="h-3 rounded-r-full bg-[#007AFF]"
                style={{ width: `${(item.value / maxValue) * 100}%` }}
              />
            ))}
          </div>
          {distribution.length === 0 ? (
            <p className="relative z-10 pt-2 pl-4 text-xs font-semibold text-[#86868B]">
              No company size data available yet.
            </p>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 text-center text-[11px] font-semibold text-[#C1C7D0]">
            {ticks.map((tick) => (
              <span key={tick}>{tick}</span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function SelectedProcessesCard() {
  const { data } = useQuery({
    queryKey: dashboardQueryKey,
    queryFn: fetchDashboardData,
  });
  const processes =
    normalizeDashboardValues(data?.selectedProcesses)?.map((item) => ({
      ...item,
      label: wrapChartLabel(item.label, 18),
    })) ??
    createSelectedProcesses(data?.recentAssessments ?? []);
  const maxValue = getChartAxisMax(processes.map((process) => process.value));
  const ticks = createChartTicks(maxValue);

  return (
    <Panel
      title="Most-Selected Processes (Signal for Product Priorities)"
      className="min-h-[310px]"
    >
      <div className="mt-7 grid grid-cols-[150px_minmax(0,1fr)] gap-x-5">
        <div className="space-y-[9px] pt-1">
          {processes.map((process) => (
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
            {processes.map((process) => (
              <div
                key={process.label}
                className="h-3 rounded-r-full bg-[#10B981]"
                style={{ width: `${(process.value / maxValue) * 100}%` }}
              />
            ))}
          </div>
          {processes.length === 0 ? (
            <p className="relative z-10 pt-2 pl-4 text-xs font-semibold text-[#86868B]">
              No selected process data available yet.
            </p>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 grid grid-cols-5 text-center text-[11px] font-semibold text-[#C1C7D0]">
            {ticks.map((tick) => (
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
  const assessments = getRecentlyUpdatedAssessments(data?.recentAssessments ?? []);
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
        <span>Last Updated</span>
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
                {Array.from({ length: 7 }).map((__, itemIndex) => (
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
          const lastUpdated = formatRecentAssessmentUpdatedAt(assessment);
          const owner = normalizeDashboardLabel(assessment.owner);

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
              <div className="flex min-w-0 items-start gap-2 text-xs font-semibold text-[#555555]">
                <Clock
                  size={14}
                  className="mt-0.5 shrink-0 text-[#007AFF]"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate text-xs leading-[1.2] font-bold text-[#555555]">
                    {lastUpdated}
                  </p>
                  {owner ? (
                    <p className="mt-1 truncate text-xs leading-[1.2] font-semibold text-[#86868B]">
                      by {owner}
                    </p>
                  ) : null}
                </div>
              </div>
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
  const industryKey = industry.trim().toLowerCase().replace(/\s+/g, " ");
  const iconConfig = industryIconStyles[industryKey];
  const Icon = iconConfig?.icon || LayoutGrid;

  return (
    <Icon
      size={iconConfig?.size || 12}
      strokeWidth={1.75}
      className={`shrink-0 ${iconConfig?.className || "text-[#86868B]"}`}
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

function createDashboardStats({
  assessments,
  statuses,
  summary,
  totalAssessments,
}: {
  assessments: RecentAssessment[];
  statuses: PipelineStatus[];
  summary?: DashboardSummary;
  totalAssessments: number;
}): DashboardStat[] {
  const activePipelineCount = isFiniteDashboardNumber(summary?.activePipelineCount)
    ? Math.round(summary.activePipelineCount)
    : statuses.reduce((sum, status) => {
        const key = normalizeStatusKey(status.key || status.label);

        return key === "closed-won" || key === "closed-lost"
          ? sum
          : sum + status.count;
      }, 0);
  const closedWonCount = isFiniteDashboardNumber(summary?.closedWonCount)
    ? Math.round(summary.closedWonCount)
    : getPipelineStatusCount(statuses, "Closed Won");
  const totalCost = isFiniteDashboardNumber(summary?.totalCostAed)
    ? summary.totalCostAed
    : sumAssessmentMetric(assessments, "cost");
  const totalSavings = isFiniteDashboardNumber(summary?.totalSavingsAed)
    ? summary.totalSavingsAed
    : sumAssessmentMetric(assessments, "savings");
  const averageScore = isFiniteDashboardNumber(summary?.averageDigitizationIndex)
    ? Math.round(summary.averageDigitizationIndex)
    : getAverageScore(assessments);

  return [
    {
      label: "Total Assessments",
      value: String(totalAssessments),
      helper: `${activePipelineCount} active in pipeline`,
      tone: "neutral",
    },
    {
      label: "Avg. Digitization Index",
      value: averageScore === null ? "--" : `${averageScore}%`,
      helper: "Across all submitted orgs",
      tone: "blue",
    },
    {
      label: "Total Cost Analysed",
      value: formatCompactAed(totalCost),
      helper: "Combined annual process cost",
      tone: "neutral",
    },
    {
      label: "Total Potential Savings",
      value: formatCompactAed(totalSavings),
      helper: `${closedWonCount} deals closed-won`,
      tone: "green",
    },
  ];
}

function createIndustryBreakdown(assessments: RecentAssessment[]) {
  return getSortedCounts(
    assessments.map((assessment) => normalizeDashboardLabel(assessment.industry)),
  ).slice(0, 8);
}

function normalizeDashboardCounts(values?: DashboardCount[]) {
  if (!Array.isArray(values)) {
    return null;
  }

  return values
    .map((item) => ({
      count: Math.max(0, Math.round(Number(item.count) || 0)),
      label: normalizeDashboardLabel(item.label),
    }))
    .filter((item) => item.label)
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label));
}

function normalizeDashboardValues(values?: DashboardValue[]) {
  if (!Array.isArray(values)) {
    return null;
  }

  return values
    .map((item) => ({
      label: normalizeDashboardLabel(item.label),
      value: Math.max(0, Math.round(Number(item.value) || 0)),
    }))
    .filter((item) => item.label);
}

function normalizeDashboardTrend(values?: DashboardTrendPoint[]) {
  if (!Array.isArray(values)) {
    return null;
  }

  return values
    .map((item) => ({
      month: normalizeDashboardLabel(item.month),
      value: Math.max(0, Math.round(Number(item.value) || 0)),
    }))
    .filter((item) => item.month);
}

function createAssessmentTrend(assessments: RecentAssessment[]) {
  const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);

    return {
      key: `${date.getFullYear()}-${date.getMonth()}`,
      month: monthFormatter.format(date),
      value: 0,
    };
  });
  const monthByKey = new Map(months.map((month) => [month.key, month]));

  assessments.forEach((assessment) => {
    const assessmentDate = new Date(assessment.createdAt || assessment.updatedAt || "");

    if (Number.isNaN(assessmentDate.getTime())) {
      return;
    }

    const key = `${assessmentDate.getFullYear()}-${assessmentDate.getMonth()}`;
    const month = monthByKey.get(key);

    if (month) {
      month.value += 1;
    }
  });

  return months;
}

function createPipelineConversion(statuses: PipelineStatus[]) {
  const activeWonStatuses = statuses.filter((status) => {
    const key = normalizeStatusKey(status.key || status.label);

    return key !== "closed-lost";
  });
  const totalActiveWon = activeWonStatuses.reduce((sum, status) => sum + status.count, 0);

  return activeWonStatuses.map((status) => ({
    label: status.label,
    percent: totalActiveWon > 0 ? Math.round((status.count / totalActiveWon) * 100) : 0,
    deals: `${status.count} deals`,
  }));
}

function createCompanySizeDistribution(assessments: RecentAssessment[]) {
  return getSortedCounts(
    assessments.map((assessment) =>
      normalizeDashboardLabel(assessment.preferences?.companySize),
    ),
  )
    .map((item) => ({
      label: item.label.includes("employees") ? item.label : `${item.label}\nemployees`,
      value: item.count,
    }))
    .slice(0, 5);
}

function createSelectedProcesses(assessments: RecentAssessment[]) {
  const processNames = assessments.flatMap((assessment) =>
    (assessment.processes || [])
      .map((process) => getProcessDisplayName(process))
      .filter(Boolean),
  );

  return getSortedCounts(processNames)
    .map((item) => ({
      label: wrapChartLabel(item.label, 18),
      value: item.count,
    }))
    .slice(0, 8);
}

function calculateWeightedPipelineValue(
  statuses: PipelineStatus[],
  assessments: RecentAssessment[],
  summary?: DashboardSummary,
  totalAssessments?: number,
) {
  const aggregateAssessmentCount = Number(totalAssessments) || 0;
  const aggregateCost = isFiniteDashboardNumber(summary?.totalCostAed)
    ? summary.totalCostAed
    : 0;
  const averageCost =
    aggregateCost > 0 && aggregateAssessmentCount > 0
      ? aggregateCost / aggregateAssessmentCount
      : getAverageAssessmentCost(assessments);

  if (averageCost <= 0) {
    return 0;
  }

  return stageWeights.reduce((sum, stage) => {
    const statusCount = getPipelineStatusCount(statuses, stage.label);
    const weight = parseMetricNumber(stage.weight) / 100;

    return sum + statusCount * averageCost * weight;
  }, 0);
}

function isFiniteDashboardNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getPipelineStatusCount(statuses: PipelineStatus[], label: string) {
  const normalizedLabel = normalizeStatusLabel(label);
  const normalizedKey = normalizeStatusKey(label);
  const status = statuses.find(
    (item) =>
      normalizeStatusLabel(item.label) === normalizedLabel ||
      normalizeStatusKey(item.key || "") === normalizedKey,
  );

  return status?.count || 0;
}

function getSortedCounts(values: string[]) {
  const countByLabel = values.reduce((map, rawLabel) => {
    const label = normalizeDashboardLabel(rawLabel);

    if (label) {
      map.set(label, (map.get(label) || 0) + 1);
    }

    return map;
  }, new Map<string, number>());

  return Array.from(countByLabel, ([label, count]) => ({ count, label })).sort(
    (first, second) => second.count - first.count || first.label.localeCompare(second.label),
  );
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

function sumAssessmentMetric(
  assessments: RecentAssessment[],
  metric: "cost" | "savings",
) {
  return assessments.reduce(
    (sum, assessment) => sum + parseMetricNumber(assessment[metric]),
    0,
  );
}

function getAverageScore(assessments: RecentAssessment[]) {
  const scores = assessments
    .map((assessment) => parseMetricNumber(assessment.score))
    .filter((score) => score > 0);

  if (!scores.length) {
    return null;
  }

  return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
}

function getAverageAssessmentCost(assessments: RecentAssessment[]) {
  const costs = assessments
    .map((assessment) => parseMetricNumber(assessment.cost))
    .filter((cost) => cost > 0);

  if (!costs.length) {
    return 0;
  }

  return costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
}

function parseMetricNumber(value?: string) {
  const normalizedValue = String(value || "").replace(/[^0-9.-]/g, "");
  const parsedValue = Number(normalizedValue);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function formatCompactAed(value: number) {
  const amount = Math.round(Number(value) || 0);

  if (amount <= 0) {
    return "AED 0";
  }

  if (amount >= 1_000_000) {
    return `AED ${formatCompactNumber(amount / 1_000_000)}M`;
  }

  if (amount >= 1_000) {
    return `AED ${formatCompactNumber(amount / 1_000)}K`;
  }

  return `AED ${amount.toLocaleString("en-US")}`;
}

function formatCompactNumber(value: number) {
  return value >= 10
    ? Math.round(value).toLocaleString("en-US")
    : value.toFixed(1).replace(/\.0$/, "");
}

function getChartAxisMax(values: number[]) {
  const maxValue = Math.max(1, ...values);

  return Math.max(4, Math.ceil(maxValue / 4) * 4);
}

function createChartTicks(maxValue: number) {
  return Array.from({ length: 5 }, (_, index) => Math.round((maxValue / 4) * index));
}

function getProcessDisplayName(process: DashboardAssessmentProcess) {
  return (
    normalizeDashboardLabel(process.name) ||
    normalizeDashboardLabel(process.processId) ||
    normalizeDashboardLabel(process.id)
  );
}

function normalizeDashboardLabel(value?: string) {
  const normalizedValue = String(value || "").trim().replace(/\s+/g, " ");

  return normalizedValue === "--" ? "" : normalizedValue;
}

function wrapChartLabel(label: string, maxLineLength: number) {
  if (label.length <= maxLineLength) {
    return label;
  }

  const words = label.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  words.forEach((word) => {
    const nextLine = currentLine ? `${currentLine} ${word}` : word;

    if (nextLine.length > maxLineLength && currentLine) {
      lines.push(currentLine);
      currentLine = word;
      return;
    }

    currentLine = nextLine;
  });

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.slice(0, 2).join("\n");
}

function normalizeStatusKey(value: string) {
  return value.trim().toLowerCase().replace(/_+/g, "-").replace(/\s+/g, "-");
}

function normalizeStatusLabel(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getRecentlyUpdatedAssessments(assessments: RecentAssessment[]) {
  const latestAssessmentByCompany = new Map<
    string,
    { assessment: RecentAssessment; index: number; time: number }
  >();

  assessments.forEach((assessment, index) => {
    const companyKey = getRecentAssessmentCompanyKey(assessment);
    const time = getRecentAssessmentTime(assessment);
    const currentAssessment = latestAssessmentByCompany.get(companyKey);

    if (
      !currentAssessment ||
      time > currentAssessment.time ||
      (time === currentAssessment.time && index < currentAssessment.index)
    ) {
      latestAssessmentByCompany.set(companyKey, { assessment, index, time });
    }
  });

  return Array.from(latestAssessmentByCompany.values())
    .sort((first, second) => {
      if (first.time !== second.time) {
        return second.time - first.time;
      }

      return first.index - second.index;
    })
    .map((item) => item.assessment);
}

function getRecentAssessmentCompanyKey(assessment: RecentAssessment) {
  const company = normalizeDashboardLabel(assessment.company).toLowerCase();

  return company || `assessment:${assessment.id}`;
}

function getRecentAssessmentTime(assessment: RecentAssessment) {
  const time = new Date(assessment.updatedAt || assessment.createdAt || "").getTime();

  return Number.isFinite(time) ? time : 0;
}

function formatRecentAssessmentUpdatedAt(assessment: RecentAssessment) {
  const date = new Date(assessment.updatedAt || assessment.createdAt || "");

  if (Number.isNaN(date.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    hour12: true,
    minute: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/\b(am|pm)\b/i, (value) => value.toUpperCase());
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
