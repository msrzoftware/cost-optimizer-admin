export const dashboardStats = [
  {
    label: "Total Assessments",
    value: "12",
    helper: "9 active in pipeline",
    tone: "neutral",
  },
  {
    label: "Avg. Digitization Index",
    value: "29%",
    helper: "Across all submitted orgs",
    tone: "blue",
  },
  {
    label: "Total Cost Analysed",
    value: "$2.9M",
    helper: "Combined annual process cost",
    tone: "neutral",
  },
  {
    label: "Total Potential Savings",
    value: "$1.2M",
    helper: "1 deals closed-won",
    tone: "green",
  },
] as const;

export type PipelineStatus = {
  count: number;
  key?: string;
  label: string;
  tone: "gray" | "blueLight" | "blue" | "green" | "red";
};

export type RecentAssessment = {
  company: string;
  contact: string;
  cost: string;
  id: string;
  industry: string;
  savings: string;
  score: string;
  status: string;
  statusKey?: string;
};

export const pipelineStatuses: PipelineStatus[] = [
  { key: "draft", label: "Draft", count: 0, tone: "gray" },
  { key: "processes-in-progress", label: "Processes In Progress", count: 0, tone: "gray" },
  { key: "due-diligence", label: "Due Diligence", count: 0, tone: "blueLight" },
  { key: "results-ready", label: "Results Ready", count: 0, tone: "blueLight" },
  { key: "expert-booked", label: "Expert Booked", count: 0, tone: "blue" },
  { key: "closed-won", label: "Closed Won", count: 0, tone: "green" },
  { key: "closed-lost", label: "Closed Lost", count: 0, tone: "red" },
];

export const industryBreakdown = [
  { label: "Retail", count: 3 },
  { label: "Banking", count: 2 },
  { label: "Healthcare", count: 2 },
  { label: "Public Sector", count: 2 },
  { label: "Insurance", count: 1 },
  { label: "Real Estate", count: 1 },
  { label: "Automotive", count: 1 },
] as const;

export const assessmentTrend = [
  { month: "Jan", value: 0 },
  { month: "Feb", value: 0 },
  { month: "Mar", value: 1 },
  { month: "Apr", value: 1 },
  { month: "May", value: 3 },
  { month: "Jun", value: 5 },
] as const;

export const stageWeights = [
  { label: "Draft", weight: "5% weight" },
  { label: "Processes In Progress", weight: "20% weight" },
  { label: "Due Diligence", weight: "40% weight" },
  { label: "Results Ready", weight: "60% weight" },
  { label: "Expert Booked", weight: "80% weight" },
] as const;

export const pipelineConversion = [
  { label: "Draft", percent: 100, deals: "11 deals" },
  { label: "Processes In Progress", percent: 91, deals: "10 deals" },
  { label: "Due Diligence", percent: 73, deals: "8 deals" },
  { label: "Results Ready", percent: 55, deals: "6 deals" },
  { label: "Expert Booked", percent: 27, deals: "3 deals" },
  { label: "Closed Won", percent: 9, deals: "1 deals" },
] as const;

export const companySizeDistribution = [
  { label: "5,001-20,000\nemployees", value: 2 },
  { label: "1,001-5,000\nemployees", value: 6 },
  { label: "201-1,000\nemployees", value: 1 },
  { label: "51-200\nemployees", value: 1 },
  { label: "20,000+\nemployees", value: 2 },
] as const;

export const selectedProcesses = [
  { label: "Customer Onboarding", value: 11 },
  { label: "Live Chat Support", value: 9 },
  { label: "Complaint Resolution", value: 7 },
  { label: "Ticket Triage &\nRouting", value: 6 },
  { label: "Voice / IVR Support", value: 6 },
  { label: "Case\nDocumentation", value: 6 },
  { label: "Account Updates &\nMaintenance", value: 4 },
  { label: "SLA Monitoring", value: 4 },
] as const;
