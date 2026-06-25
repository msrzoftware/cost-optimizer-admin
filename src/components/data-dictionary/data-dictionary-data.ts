export type DictionaryIndustry = {
  id: string;
  isActive?: boolean;
  name: string;
  slug?: string;
};

export type DictionaryDomain = {
  id: string;
  industryIds: string[];
  isActive?: boolean;
  name: string;
  slug?: string;
};

export type DictionaryProcess = {
  category: string;
  code: string;
  cost: string;
  description: string;
  domain: string;
  domainId?: string;
  hours: string;
  id: string;
  industryLabel?: string;
  industryIds: string[];
  name: string;
  scope?: "industry-default" | "industry-domain";
  source: string;
  tier: ProcessTier;
};

export type ProcessTier = "Must-Have" | "Good-to-Have" | "Nice to Have" | "Future Enhancement";

export type ProcessOption = {
  label: string;
  value: string;
};

export type TechStackTool = {
  category: string;
  id: string;
  name: string;
  vendor: string;
};

export const automationLevels = [
  {
    level: 1,
    label: "Manual",
    description: "Fully manual, people-driven process",
    color: "#EF4444",
  },
  {
    level: 2,
    label: "Mostly Manual",
    description: "Some tools used but majority is manual work",
    color: "#F97316",
  },
  {
    level: 3,
    label: "Partial",
    description: "Mix of manual and automated steps",
    color: "#EAB308",
  },
  {
    level: 4,
    label: "Mostly Automated",
    description: "Largely automated with minimal human intervention",
    color: "#22C55E",
  },
  {
    level: 5,
    label: "Fully Automated",
    description: "End-to-end automation, minimal human touchpoints",
    color: "#10B981",
  },
] as const;

export const processTiers = [
  { label: "Must-Have", slug: "must-have" },
  { label: "Good-to-Have", slug: "good-to-have" },
  { label: "Nice to Have", slug: "tried-legacy" },
  { label: "Future Enhancement", slug: "future-enhancement" },
] as const satisfies readonly { label: ProcessTier; slug: string }[];

export const processCategories: ProcessOption[] = [
  { value: "lifecycle", label: "Lifecycle" },
  { value: "support", label: "Support" },
  { value: "insights", label: "Insights" },
  { value: "analytics", label: "Analytics" },
  { value: "strategy", label: "Strategy" },
  { value: "data", label: "Data" },
  { value: "engagement", label: "Engagement" },
  { value: "operations", label: "Operations" },
  { value: "compliance", label: "Compliance" },
];

export const benchmarkMetrics = [
  { value: "18%", label: "Bottom Quartile" },
  { value: "38%", label: "Median" },
  { value: "65%", label: "Top Quartile" },
  { value: "78%", label: "Best-in-Class" },
] as const;

export const initialIndustries: DictionaryIndustry[] = [
  { id: "banking", name: "Banking" },
  { id: "healthcare", name: "Healthcare" },
  { id: "insurance", name: "Insurance" },
  { id: "retail", name: "Retail" },
  { id: "public-sector", name: "Public Sector" },
  { id: "real-estate", name: "Real Estate" },
  { id: "automotive", name: "Automotive" },
];

export const initialDomains: DictionaryDomain[] = [
  {
    id: "customer-experience",
    name: "Customer Experience",
    industryIds: ["banking", "retail", "healthcare"],
  },
  { id: "human-resources", name: "Human Resources", industryIds: ["banking", "healthcare"] },
  {
    id: "finance-accounting",
    name: "Finance & Accounting",
    industryIds: ["banking", "insurance", "real-estate"],
  },
  { id: "sales", name: "Sales", industryIds: ["retail", "automotive"] },
  { id: "marketing", name: "Marketing", industryIds: ["retail", "automotive"] },
  { id: "it-operations", name: "IT Operations", industryIds: ["public-sector", "healthcare"] },
  {
    id: "admin-facilities",
    name: "Admin & Facilities",
    industryIds: ["public-sector", "real-estate"],
  },
  {
    id: "bpo-shared-services",
    name: "BPO / Shared Services",
    industryIds: ["banking", "insurance"],
  },
];

export const initialProcessRows: DictionaryProcess[] = [];

export const initialTechnologyRows: TechStackTool[] = [
  {
    id: "salesforce-service-cloud",
    name: "Salesforce Service Cloud",
    vendor: "Salesforce",
    category: "CRM / Support",
  },
  { id: "zendesk", name: "Zendesk", vendor: "Zendesk", category: "CRM / Support" },
  {
    id: "hubspot-service-hub",
    name: "HubSpot Service Hub",
    vendor: "HubSpot",
    category: "CRM / Support",
  },
  { id: "freshdesk", name: "Freshdesk", vendor: "Freshworks", category: "CRM / Support" },
  { id: "kustomer", name: "Kustomer", vendor: "Kustomer", category: "CRM / Support" },
  { id: "gorgias", name: "Gorgias", vendor: "Gorgias", category: "CRM / Support" },
  {
    id: "genesys-cloud-cx",
    name: "Genesys Cloud CX",
    vendor: "Genesys",
    category: "Contact Centre",
  },
  { id: "five9", name: "Five9", vendor: "Five9", category: "Contact Centre" },
  { id: "nice-cxone", name: "NICE CXone", vendor: "NICE", category: "Contact Centre" },
  { id: "talkdesk", name: "Talkdesk", vendor: "Talkdesk", category: "Contact Centre" },
  { id: "amazon-connect", name: "Amazon Connect", vendor: "AWS", category: "Contact Centre" },
  { id: "qualtrics-xm", name: "Qualtrics XM", vendor: "Qualtrics", category: "Survey / VoC" },
  { id: "medallia", name: "Medallia", vendor: "Medallia", category: "Survey / VoC" },
  { id: "surveymonkey", name: "SurveyMonkey", vendor: "Momentive", category: "Survey / VoC" },
  { id: "sprinklr", name: "Sprinklr", vendor: "Sprinklr", category: "Social / Engagement" },
  { id: "hootsuite", name: "Hootsuite", vendor: "Hootsuite", category: "Social / Engagement" },
  { id: "brandwatch", name: "Brandwatch", vendor: "Brandwatch", category: "Social / Engagement" },
  { id: "intercom", name: "Intercom", vendor: "Intercom", category: "Messaging / Support" },
  { id: "drift", name: "Drift", vendor: "Drift", category: "Messaging / Support" },
  {
    id: "whatsapp-business-platform",
    name: "WhatsApp Business Platform",
    vendor: "Meta",
    category: "Messaging / Support",
  },
];
