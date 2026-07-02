import { BriefcaseBusiness, Plus, Star } from "lucide-react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

type Expert = {
  accounts: string[];
  lifetimeAssessments: string;
  name: string;
  pipelineCount: string;
  rating: string;
  role: string;
  subtitle: string;
};

const experts: Expert[] = [
  {
    accounts: [
      "Emirates NBD Retail Banking",
      "Qatar Insurance Company",
      "First Abu Dhabi Bank -- SME Division",
    ],
    lifetimeAssessments: "80+",
    name: "Tejas Shah",
    pipelineCount: "3",
    rating: "4.9",
    role: "ISV Partner",
    subtitle: "SAP - Workday - Oracle certified",
  },
  {
    accounts: ["Dubai Land Department"],
    lifetimeAssessments: "64+",
    name: "Monika Sikka",
    pipelineCount: "1",
    rating: "4.8",
    role: "Senior Consultant",
    subtitle: "ISO 9000 - 20000 - 27000 practitioner",
  },
  {
    accounts: [
      "Noon.com Marketplace Ops",
      "Talabat Customer Care",
      "Etisalat by e& -- Enterprise Support",
    ],
    lifetimeAssessments: "92+",
    name: "Harsh Gaur",
    pipelineCount: "3",
    rating: "4.9",
    role: "AI Specialist",
    subtitle: "Automation Anywhere - Claude API",
  },
];

export function ExpertsPage() {
  return (
    <AdminShell activeItem="Experts">
      <div>
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] leading-tight font-bold tracking-normal text-[#171717]">
              Experts
            </h1>
            <p className="mt-2 text-sm leading-none font-semibold text-[#86868B]">
              Consultants available for booking from the Expert tab.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-md bg-[#007AFF] px-4 text-xs font-bold text-white shadow-[0_1px_2px_rgba(0,122,255,0.18)] transition hover:bg-[#006FE8]"
          >
            <Plus size={13} strokeWidth={2.2} aria-hidden="true" />
            Add Expert
          </button>
        </header>

        <section
          aria-label="Expert consultants"
          className="mt-[31px] grid gap-5 xl:grid-cols-3"
        >
          {experts.map((expert) => (
            <ExpertCard expert={expert} key={expert.name} />
          ))}
        </section>
      </div>
    </AdminShell>
  );
}

function ExpertCard({ expert }: { expert: Expert }) {
  return (
    <article className="min-h-[290px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.08),0_1px_3px_rgba(15,23,42,0.1)]">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-5 items-center rounded bg-black px-2 text-[8px] leading-none font-bold text-white">
          {expert.role}
        </span>
        <span className="inline-flex items-center gap-1 text-[11px] leading-none font-bold text-[#171717]">
          <Star
            size={11}
            className="fill-[#007AFF] text-[#007AFF]"
            strokeWidth={2}
            aria-hidden="true"
          />
          {expert.rating}
        </span>
      </div>

      <div className="mt-[22px]">
        <h2 className="text-[13px] leading-none font-bold text-[#171717]">{expert.name}</h2>
        <p className="mt-2 text-[10px] leading-none font-semibold text-[#86868B]">
          {expert.subtitle}
        </p>
      </div>

      <div className="mt-[22px] grid grid-cols-2 border-b border-black/[0.08] pb-4">
        <ExpertMetric label="Lifetime assessments" value={expert.lifetimeAssessments} />
        <ExpertMetric label="In this pipeline" value={expert.pipelineCount} tone="blue" />
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness size={11} className="text-[#A1A1AA]" aria-hidden="true" />
          <p className="text-[9px] leading-none font-bold tracking-[0.12em] text-[#86868B] uppercase">
            Assigned accounts ({expert.accounts.length} confirmed)
          </p>
        </div>

        <ul className="mt-[14px] space-y-[9px]">
          {expert.accounts.map((account) => (
            <li
              className="truncate text-[11px] leading-none font-semibold text-[#171717]"
              key={account}
              title={account}
            >
              {account}
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function ExpertMetric({
  label,
  tone = "default",
  value,
}: {
  label: string;
  tone?: "blue" | "default";
  value: string;
}) {
  return (
    <div>
      <p
        className={`text-[23px] leading-none font-bold ${
          tone === "blue" ? "text-[#007AFF]" : "text-[#171717]"
        }`}
      >
        {value}
      </p>
      <p className="mt-[7px] text-[10px] leading-none font-semibold text-[#86868B]">
        {label}
      </p>
    </div>
  );
}
