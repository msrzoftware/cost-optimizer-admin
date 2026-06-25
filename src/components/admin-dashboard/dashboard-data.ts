export const navigationItems = [
  { label: "Dashboard", href: "#dashboard", icon: "LayoutDashboard" },
  { label: "Assessments", href: "#assessments", icon: "ClipboardCheck" },
  { label: "Search", href: "#search", icon: "Search" },
  { label: "Data Dictionary", href: "#dictionary", icon: "BookOpen" },
  { label: "Experts", href: "#experts", icon: "Users" },
  { label: "Team", href: "#team", icon: "UserRound" },
  { label: "Trash", href: "#trash", icon: "Trash2" },
  { label: "Settings", href: "#settings", icon: "Settings" },
] as const;

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
  { label: "Must-Have", slug: "must-have", color: "#10B981" },
  { label: "Good-to-Have", slug: "good-to-have", color: "#3B82F6" },
  { label: "Nice to Have", slug: "tried-legacy", color: "#A3A3A3" },
  { label: "Future Enhancement", slug: "future-enhancement", color: "#8B5CF6" },
] as const;

export const benchmarkMetrics = [
  { value: "18%", label: "Bottom Quartile" },
  { value: "38%", label: "Median" },
  { value: "65%", label: "Top Quartile" },
  { value: "78%", label: "Best-in-Class" },
] as const;

export const industries = [
  "Banking",
  "Healthcare",
  "Insurance",
  "Retail",
  "Public Sector",
  "Real Estate",
  "Automotive",
] as const;

export const domains = [
  "Customer Experience",
  "Human Resources",
  "Finance & Accounting",
  "Sales",
  "Marketing",
  "IT Operations",
  "Admin & Facilities",
  "BPO / Shared Services",
] as const;

export const processRows = [
  { code: "CX-01", name: "Customer Onboarding", domain: "CX", tier: "Must-Have" },
  { code: "CX-02", name: "Ticket Triage & Routing", domain: "CX", tier: "Must-Have" },
  { code: "CX-03", name: "Proactive Outreach", domain: "CX", tier: "Future Enhancement" },
  { code: "CX-04", name: "Complaint Resolution", domain: "CX", tier: "Must-Have" },
  { code: "CX-05", name: "NPS / CSAT Surveys", domain: "CX", tier: "Good-to-Have" },
  { code: "CX-06", name: "Knowledge Base Maintenance", domain: "CX", tier: "Good-to-Have" },
  { code: "CX-08", name: "Live Chat Support", domain: "CX", tier: "Must-Have" },
  { code: "CX-09", name: "Voice / IVR Support", domain: "CX", tier: "Must-Have" },
  { code: "CX-10", name: "Account Updates & Maintenance", domain: "CX", tier: "Must-Have" },
  { code: "CX-11", name: "Loyalty Programme Management", domain: "CX", tier: "Good-to-Have" },
  { code: "CX-12", name: "Returns & Refunds Processing", domain: "CX", tier: "Good-to-Have" },
  { code: "CX-14", name: "Win-Back Campaigns", domain: "CX", tier: "Future Enhancement" },
  { code: "CX-15", name: "Case Documentation", domain: "CX", tier: "Must-Have" },
  { code: "CX-20", name: "VoC Analysis & Reporting", domain: "CX", tier: "Good-to-Have" },
  { code: "CX-22", name: "SLA Monitoring", domain: "CX", tier: "Must-Have" },
  { code: "CX-26", name: "Cross-sell / Upsell Support", domain: "CX", tier: "Good-to-Have" },
  { code: "CX-28", name: "Social Media Support", domain: "CX", tier: "Good-to-Have" },
  { code: "CX-31", name: "Fraud & Risk Flagging", domain: "CX", tier: "Must-Have" },
  { code: "CX-34", name: "Regulatory Reporting", domain: "CX", tier: "Must-Have" },
  { code: "CX-35", name: "Quality Assurance Reviews", domain: "CX", tier: "Good-to-Have" },
] as const;

export const technologyRows = [
  { name: "Salesforce Service Cloud", category: "Salesforce - CRM / Support" },
  { name: "Zendesk", category: "Zendesk - CRM / Support" },
  { name: "HubSpot Service Hub", category: "HubSpot - CRM / Support" },
  { name: "Freshdesk", category: "Freshworks - CRM / Support" },
  { name: "Kustomer", category: "Kustomer - CRM / Support" },
  { name: "Gorgias", category: "Gorgias - CRM / Support" },
  { name: "Genesys Cloud CX", category: "Genesys - Contact Centre" },
  { name: "Five9", category: "Five9 - Contact Centre" },
  { name: "NICE CXone", category: "NICE - Contact Centre" },
  { name: "Talkdesk", category: "Talkdesk - Contact Centre" },
  { name: "Amazon Connect", category: "AWS - Contact Centre" },
  { name: "Qualtrics XM", category: "Qualtrics - Survey / VoC" },
  { name: "Medallia", category: "Medallia - Survey / VoC" },
  { name: "SurveyMonkey", category: "Momentive - Survey / VoC" },
  { name: "Sprinklr", category: "Sprinklr - Social / Engagement" },
  { name: "Hootsuite", category: "Hootsuite - Social / Engagement" },
  { name: "Brandwatch", category: "Brandwatch - Social / Engagement" },
  { name: "Intercom", category: "Intercom - Messaging / Support" },
  { name: "Drift", category: "Drift - Messaging / Support" },
  { name: "WhatsApp Business Platform", category: "Meta - Messaging / Support" },
] as const;