"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ChevronRight, Database, Plus, Search, X } from "lucide-react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

import {
  automationLevels,
  benchmarkMetrics,
  initialTechnologyRows,
  processCategories,
  processTiers,
  type DictionaryDomain,
  type DictionaryIndustry,
  type DictionaryProcess,
  type ProcessOption,
  type ProcessTier,
  type TechStackTool,
} from "./data-dictionary-data";
import {
  createDataDictionaryDomain,
  createDataDictionaryDomainProcess,
  createDataDictionaryIndustry,
  createDataDictionaryIndustryProcess,
  fetchDataDictionary,
} from "@/api/data-dictionary.api";

const dataDictionaryQueryKey = ["data-dictionary"] as const;
const initialExpandedProcessId = "__initial_process__";
const industryDefaultDomainFilter = "industry-default";
const emptyIndustries: DictionaryIndustry[] = [];
const emptyDomains: DictionaryDomain[] = [];
const emptyProcesses: DictionaryProcess[] = [];

const tierStyles: Record<ProcessTier, { bg: string; text: string; dot: string }> = {
  "Must-Have": { bg: "bg-[#DFF8EE]", text: "text-[#10B981]", dot: "bg-[#10B981]" },
  "Good-to-Have": { bg: "bg-[#EAF3FF]", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  "Nice to Have": { bg: "bg-[#F0F0F0]", text: "text-[#86868B]", dot: "bg-[#86868B]" },
  "Future Enhancement": { bg: "bg-[#F1EAFE]", text: "text-[#8B5CF6]", dot: "bg-[#8B5CF6]" },
};

const fieldInputClass =
  "h-8 w-full rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF]";

type ProcessFormState = {
  category: string;
  cost: string;
  description: string;
  domainId: string;
  hours: string;
  industryId: string;
  name: string;
  tier: ProcessTier | "";
};

type ToolFormState = {
  category: string;
  name: string;
  vendor: string;
};

const emptyToolForm: ToolFormState = {
  category: "CRM / Support",
  name: "",
  vendor: "",
};

function createEmptyProcessForm(industries: DictionaryIndustry[]): ProcessFormState {
  return {
    category: "",
    cost: "18000",
    description: "",
    domainId: "",
    hours: "1200",
    industryId: industries[0]?.id ?? "",
    name: "",
    tier: "",
  };
}

export function DataDictionaryPage() {
  const queryClient = useQueryClient();
  const [tools, setTools] = useState<TechStackTool[]>(initialTechnologyRows);
  const [industryName, setIndustryName] = useState("");
  const [domainName, setDomainName] = useState("");
  const [domainIndustryId, setDomainIndustryId] = useState("");
  const [isIndustryFormOpen, setIsIndustryFormOpen] = useState(false);
  const [isDomainFormOpen, setIsDomainFormOpen] = useState(false);
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(true);
  const [isToolFormOpen, setIsToolFormOpen] = useState(false);
  const [processSearch, setProcessSearch] = useState("");
  const [processDomainFilter, setProcessDomainFilter] = useState("all");
  const [processIndustryFilter, setProcessIndustryFilter] = useState("all");
  const [toolSearch, setToolSearch] = useState("");
  const [processForm, setProcessForm] = useState<ProcessFormState>(() =>
    createEmptyProcessForm([]),
  );
  const [toolForm, setToolForm] = useState<ToolFormState>(emptyToolForm);
  const [expandedProcessId, setExpandedProcessId] = useState(initialExpandedProcessId);
  const [dictionaryError, setDictionaryError] = useState("");
  const {
    data: dictionaryData,
    error: dictionaryQueryError,
    isLoading: isCatalogLoading,
  } = useQuery({
    queryKey: dataDictionaryQueryKey,
    queryFn: fetchDataDictionary,
  });
  const createIndustryMutation = useMutation({
    mutationFn: createDataDictionaryIndustry,
  });
  const createDomainMutation = useMutation({
    mutationFn: createDataDictionaryDomain,
  });
  const createIndustryProcessMutation = useMutation({
    mutationFn: createDataDictionaryIndustryProcess,
  });
  const createDomainProcessMutation = useMutation({
    mutationFn: createDataDictionaryDomainProcess,
  });
  const industries = dictionaryData?.industries ?? emptyIndustries;
  const domains = dictionaryData?.domains ?? emptyDomains;
  const processes = dictionaryData?.processes ?? emptyProcesses;
  const categoryOptions = dictionaryData?.options.categories.length
    ? dictionaryData.options.categories
    : processCategories;
  const activeExpandedProcessId =
    expandedProcessId === initialExpandedProcessId ? processes[0]?.id ?? "" : expandedProcessId;
  const selectedDomainIndustryId = domainIndustryId || industries[0]?.id || "";
  const isProcessSaving =
    createIndustryProcessMutation.isPending || createDomainProcessMutation.isPending;
  const dictionaryErrorMessage =
    dictionaryError || (dictionaryQueryError ? getErrorMessage(dictionaryQueryError) : "");

  const filteredProcesses = useMemo(() => {
    const query = normalizeSearch(processSearch);

    return processes.filter((process) => {
      const matchesSearch =
        !query ||
        normalizeSearch(
          `${process.name} ${process.description} ${process.code} ${process.domain} ${process.category} ${process.source} ${process.industryLabel || ""}`,
        ).includes(query);
      const matchesDomain =
        processDomainFilter === "all" || process.domainId === processDomainFilter;
      const matchesIndustry =
        processIndustryFilter === "all" || process.industryIds.includes(processIndustryFilter);

      return matchesSearch && matchesDomain && matchesIndustry;
    });
  }, [processDomainFilter, processIndustryFilter, processSearch, processes]);

  const filteredTools = useMemo(() => {
    const query = normalizeSearch(toolSearch);
    return tools.filter(
      (tool) =>
        !query || normalizeSearch(`${tool.name} ${tool.vendor} ${tool.category}`).includes(query),
    );
  }, [toolSearch, tools]);

  async function handleAddIndustry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = toDisplayName(industryName);
    if (!name) return;

    const exists = industries.some(
      (industry) => normalizeSearch(industry.name) === normalizeSearch(name),
    );
    if (exists) {
      setIndustryName("");
      setIsIndustryFormOpen(false);
      return;
    }

    try {
      setDictionaryError("");
      const savedIndustry = await createIndustryMutation.mutateAsync({ name });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });

      if (savedIndustry) {
        setDomainIndustryId(savedIndustry.id);
        setProcessForm((current) => ({
          ...current,
          industryId: savedIndustry.id,
        }));
      }
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
      return;
    }

    setIndustryName("");
    setIsIndustryFormOpen(false);
  }

  async function handleAddDomain(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = toDisplayName(domainName);
    if (!name) return;

    const selectedIndustryId = domainIndustryId || industries[0]?.id || "";

    try {
      if (!selectedIndustryId) {
        throw new Error("Select an industry before adding a domain");
      }

      setDictionaryError("");
      await createDomainMutation.mutateAsync({
        industryId: selectedIndustryId,
        name,
      });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setDomainIndustryId(selectedIndustryId);
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
      return;
    }

    setDomainName("");
    setIsDomainFormOpen(false);
  }

  async function handleAddProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProcessSaving) return;

    const name = toDisplayName(processForm.name);
    const industryId = processForm.industryId || industries[0]?.id || "";
    const category = categoryOptions.some((option) => option.value === processForm.category)
      ? processForm.category
      : "";
    const tier = processForm.tier;

    if (!name || !industryId || !category || !tier) return;

    const processPayload = {
      category,
      description:
        processForm.description.trim() || "Newly added process for assessment configuration",
      estimatedAnnualCost: {
        amount: parseAmount(processForm.cost),
        currency: "USD" as const,
      },
      name,
      tier,
    };

    try {
      setDictionaryError("");
      let createdProcessId = "";

      if (processForm.domainId) {
        const selectedDomain = domains.find(
          (domain) =>
            domain.id === processForm.domainId && domain.industryIds.includes(industryId),
        );

        if (!selectedDomain) {
          throw new Error("Select a domain mapped to the selected industry");
        }

        createdProcessId = await createDomainProcessMutation.mutateAsync({
          ...processPayload,
          industryDomainId: selectedDomain.id,
        });
      } else {
        createdProcessId = await createIndustryProcessMutation.mutateAsync({
          ...processPayload,
          industryId,
        });
      }

      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setExpandedProcessId(createdProcessId);
      setProcessForm(createEmptyProcessForm(industries));
      setIsProcessFormOpen(false);
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    }
  }

  function handleAddTool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = toDisplayName(toolForm.name);
    const vendor = toDisplayName(toolForm.vendor);
    const category = toDisplayName(toolForm.category);
    if (!name || !vendor || !category) return;

    setTools((current) => [
      { id: `${toSlug(name)}-${Date.now()}`, name, vendor, category },
      ...current,
    ]);
    setToolForm(emptyToolForm);
    setIsToolFormOpen(false);
  }

  return (
    <AdminShell activeItem="Data Dictionary">
      <PageHeader />
      <section className="mt-7 grid gap-5 xl:grid-cols-2" aria-label="Reference scales">
        <AutomationLevelsCard />
        <ProcessTiersCard />
      </section>
      <BenchmarkCard />
      <section className="mt-5 grid gap-5 xl:grid-cols-2" aria-label="Dictionary lists">
        <DictionaryListCard
          addForm={
            isIndustryFormOpen ? (
              <form onSubmit={handleAddIndustry} className="mt-5 flex gap-2">
                <input
                  value={industryName}
                  onChange={(event) => setIndustryName(event.target.value)}
                  className="h-8 min-w-0 flex-1 rounded-md border border-black/[0.08] px-3 text-xs font-semibold outline-none focus:border-[#007AFF]"
                  placeholder="Industry name"
                />
                <button
                  type="submit"
                  className="h-8 rounded-md bg-[#007AFF] px-3 text-xs font-bold text-white"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsIndustryFormOpen(false)}
                  className="h-8 rounded-md border border-black/[0.08] px-3 text-xs font-bold text-[#86868B]"
                >
                  Cancel
                </button>
              </form>
            ) : null
          }
          count={industries.length}
          items={industries.map((industry) => ({ id: industry.id, name: industry.name }))}
          onAdd={() => setIsIndustryFormOpen(true)}
          title="Industries"
          variant="industry"
        />
        <DictionaryListCard
          addForm={
            isDomainFormOpen ? (
              <form
                onSubmit={handleAddDomain}
                className="mt-5 grid gap-2 sm:grid-cols-[minmax(0,1fr)_180px_auto_auto]"
              >
                <input
                  value={domainName}
                  onChange={(event) => setDomainName(event.target.value)}
                  className="h-8 rounded-md border border-black/[0.08] px-3 text-xs font-semibold outline-none focus:border-[#007AFF]"
                  placeholder="Domain name"
                />
                <select
                  value={selectedDomainIndustryId}
                  onChange={(event) => setDomainIndustryId(event.target.value)}
                  className="h-8 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none focus:border-[#007AFF]"
                >
                  {industries.map((industry) => (
                    <option key={industry.id} value={industry.id}>
                      {industry.name}
                    </option>
                  ))}
                </select>
                <button
                  type="submit"
                  className="h-8 rounded-md bg-[#007AFF] px-3 text-xs font-bold text-white"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => setIsDomainFormOpen(false)}
                  className="h-8 rounded-md border border-black/[0.08] px-3 text-xs font-bold text-[#86868B]"
                >
                  Cancel
                </button>
              </form>
            ) : null
          }
          count={domains.length}
          items={domains.map((domain) => ({ id: domain.id, name: domain.name }))}
          onAdd={() => setIsDomainFormOpen(true)}
          title="Domains"
          variant="domain"
        />
      </section>
      <ProcessLibraryCard
        domains={domains}
        dictionaryError={dictionaryErrorMessage}
        expandedProcessId={activeExpandedProcessId}
        filteredProcesses={filteredProcesses}
        industries={industries}
        isCatalogLoading={isCatalogLoading}
        isProcessSaving={isProcessSaving}
        isProcessFormOpen={isProcessFormOpen}
        categoryOptions={categoryOptions}
        processDomainFilter={processDomainFilter}
        processForm={processForm}
        processIndustryFilter={processIndustryFilter}
        processSearch={processSearch}
        processes={processes}
        setExpandedProcessId={setExpandedProcessId}
        setIsProcessFormOpen={setIsProcessFormOpen}
        setProcessDomainFilter={setProcessDomainFilter}
        setProcessForm={setProcessForm}
        setProcessIndustryFilter={setProcessIndustryFilter}
        setProcessSearch={setProcessSearch}
        onAddProcess={handleAddProcess}
      />
      <TechnologyStackCard
        filteredTools={filteredTools}
        isToolFormOpen={isToolFormOpen}
        setIsToolFormOpen={setIsToolFormOpen}
        setToolForm={setToolForm}
        setToolSearch={setToolSearch}
        toolForm={toolForm}
        toolSearch={toolSearch}
        tools={tools}
        onAddTool={handleAddTool}
      />
    </AdminShell>
  );
}

function PageHeader() {
  return (
    <header>
      <h1 className="text-[26px] leading-tight font-bold tracking-normal">Data Dictionary</h1>
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
              <p className="text-sm leading-none font-bold">{level.label}</p>
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
          <div
            key={tier.label}
            className="flex items-center justify-between gap-5 text-xs font-bold"
          >
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
        <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
          GCC / MENA CX Benchmark
        </p>
        <button type="button" className="text-xs font-bold text-[#007AFF]">
          Edit in Settings -&gt;
        </button>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-4">
        {benchmarkMetrics.map((metric) => (
          <div key={metric.label}>
            <p className="text-2xl leading-none font-bold">{metric.value}</p>
            <p className="mt-2 text-xs font-semibold text-[#86868B]">{metric.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function DictionaryListCard({
  addForm,
  count,
  items,
  onAdd,
  title,
  variant,
}: {
  addForm?: ReactNode;
  count: number;
  items: readonly { id: string; name: string }[];
  onAdd: () => void;
  title: string;
  variant: "domain" | "industry";
}) {
  return (
    <Panel
      className="min-h-[238px]"
      title={`${title} (${count})`}
      actionLabel="Add"
      onAction={onAdd}
    >
      <div className="mt-7 grid gap-x-12 gap-y-5 sm:grid-cols-2">
        {items.map((item, index) => (
          <div key={item.id || `${item.name}-${index}`} className="flex min-w-0 items-center gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-[#F0F0F0] text-[#86868B]">
              {variant === "industry" ? (
                <Building2 size={13} aria-hidden="true" />
              ) : index % 2 === 0 ? (
                <Database size={13} aria-hidden="true" />
              ) : (
                <Plus size={12} aria-hidden="true" />
              )}
            </span>
            <span className="truncate text-sm font-bold text-[#555555]">{item.name}</span>
          </div>
        ))}
      </div>
      {addForm}
    </Panel>
  );
}

function ProcessLibraryCard({
  categoryOptions,
  domains,
  dictionaryError,
  expandedProcessId,
  filteredProcesses,
  industries,
  isCatalogLoading,
  isProcessSaving,
  isProcessFormOpen,
  processDomainFilter,
  processForm,
  processIndustryFilter,
  processSearch,
  processes,
  setExpandedProcessId,
  setIsProcessFormOpen,
  setProcessDomainFilter,
  setProcessForm,
  setProcessIndustryFilter,
  setProcessSearch,
  onAddProcess,
}: {
  categoryOptions: readonly ProcessOption[];
  domains: DictionaryDomain[];
  dictionaryError: string;
  expandedProcessId: string;
  filteredProcesses: DictionaryProcess[];
  industries: DictionaryIndustry[];
  isCatalogLoading: boolean;
  isProcessSaving: boolean;
  isProcessFormOpen: boolean;
  processDomainFilter: string;
  processForm: ProcessFormState;
  processIndustryFilter: string;
  processSearch: string;
  processes: DictionaryProcess[];
  setExpandedProcessId: (value: string) => void;
  setIsProcessFormOpen: (value: boolean) => void;
  setProcessDomainFilter: (value: string) => void;
  setProcessForm: (
    value: ProcessFormState | ((current: ProcessFormState) => ProcessFormState),
  ) => void;
  setProcessIndustryFilter: (value: string) => void;
  setProcessSearch: (value: string) => void;
  onAddProcess: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel
      className="mt-5"
      title={`Process Library (${processes.length})`}
      actionLabel="Add Process"
      onAction={() => setIsProcessFormOpen(true)}
    >
      <div className="mt-7 flex flex-wrap gap-2">
        <SearchInput
          value={processSearch}
          onChange={setProcessSearch}
          placeholder="Search processes..."
          className="w-full sm:w-[280px]"
        />
        <select
          value={processDomainFilter}
          onChange={(event) => setProcessDomainFilter(event.target.value)}
          className="h-9 w-[180px] rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none focus:border-[#007AFF]"
        >
          <option value="all">All domains</option>
          <option value={industryDefaultDomainFilter}>Industry default</option>
          {domains.map((domain) => (
            <option key={domain.id} value={domain.id}>
              {domain.name}
            </option>
          ))}
        </select>
        <select
          value={processIndustryFilter}
          onChange={(event) => setProcessIndustryFilter(event.target.value)}
          className="h-9 w-[180px] rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none focus:border-[#007AFF]"
        >
          <option value="all">All industries</option>
          {industries.map((industry) => (
            <option key={industry.id} value={industry.id}>
              {industry.name}
            </option>
          ))}
        </select>
      </div>
      {isProcessFormOpen ? (
        <ProcessForm
          domains={domains}
          industries={industries}
          isProcessSaving={isProcessSaving}
          categoryOptions={categoryOptions}
          processForm={processForm}
          setIsProcessFormOpen={setIsProcessFormOpen}
          setProcessForm={setProcessForm}
          onAddProcess={onAddProcess}
        />
      ) : null}
      <div className="mt-4 overflow-hidden rounded-md border border-black/[0.05]">
        {isCatalogLoading ? <ProcessListState label="Loading mapped COS processes..." /> : null}
        {!isCatalogLoading && filteredProcesses.length === 0 ? (
          <ProcessListState label={dictionaryError || "No mapped processes found."} />
        ) : null}
        {!isCatalogLoading
          ? filteredProcesses.map((process) => (
              <ProcessRow
                key={process.id}
                expanded={expandedProcessId === process.id}
                industries={industries}
                process={process}
                onToggle={() =>
                  setExpandedProcessId(expandedProcessId === process.id ? "" : process.id)
                }
              />
            ))
          : null}
      </div>
      <PaginationSummary
        label={
          filteredProcesses.length
            ? `Showing 1-${Math.min(filteredProcesses.length, 20)} of ${processes.length}`
            : "Showing 0 of 0"
        }
        pages={processes.length ? [1, 2, 3, 4, 5] : []}
      />
    </Panel>
  );
}

function ProcessForm({
  categoryOptions,
  domains,
  industries,
  isProcessSaving,
  processForm,
  setIsProcessFormOpen,
  setProcessForm,
  onAddProcess,
}: {
  categoryOptions: readonly ProcessOption[];
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  isProcessSaving: boolean;
  processForm: ProcessFormState;
  setIsProcessFormOpen: (value: boolean) => void;
  setProcessForm: (
    value: ProcessFormState | ((current: ProcessFormState) => ProcessFormState),
  ) => void;
  onAddProcess: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const selectedIndustryId = processForm.industryId || industries[0]?.id || "";
  const availableDomains = domains.filter((domain) =>
    selectedIndustryId ? domain.industryIds.includes(selectedIndustryId) : true,
  );
  const canAddProcess = Boolean(
    processForm.name.trim() &&
      selectedIndustryId &&
      categoryOptions.some((option) => option.value === processForm.category) &&
      processForm.tier,
  );

  return (
    <form
      onSubmit={onAddProcess}
      className="mt-5 rounded-md border border-[#B3D7FF] bg-[#F0F9FF] px-4 py-4"
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-[#171717]">New Process</p>
        <button
          type="button"
          onClick={() => setIsProcessFormOpen(false)}
          className="text-[#A1A1AA]"
          aria-label="Close new process form"
        >
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-4 grid gap-[10px]">
        <Field label="Process Name *">
          <input
            value={processForm.name}
            onChange={(event) =>
              setProcessForm((current) => ({ ...current, name: event.target.value }))
            }
            className={fieldInputClass}
            placeholder="e.g. Chargeback Dispute Handling"
          />
        </Field>
        <Field label="Description">
          <input
            value={processForm.description}
            onChange={(event) =>
              setProcessForm((current) => ({ ...current, description: event.target.value }))
            }
            className={fieldInputClass}
            placeholder="What does this process involve?"
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Industry *">
            <select
              value={selectedIndustryId}
              onChange={(event) => {
                const industryId = event.target.value;
                setProcessForm((current) => {
                  const hasSelectedDomain = domains.some(
                    (domain) =>
                      domain.id === current.domainId && domain.industryIds.includes(industryId),
                  );

                  return {
                    ...current,
                    domainId: hasSelectedDomain ? current.domainId : "",
                    industryId,
                  };
                });
              }}
              className={fieldInputClass}
            >
              <option value="" aria-label="Select industry" />
              {industries.map((industry) => (
                <option key={industry.id} value={industry.id}>
                  {industry.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Domain (optional)">
            <select
              value={processForm.domainId}
              onChange={(event) =>
                setProcessForm((current) => ({ ...current, domainId: event.target.value }))
              }
              className={fieldInputClass}
            >
              <option value="">Industry default process</option>
              {availableDomains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Category">
            <select
              value={
                categoryOptions.some((option) => option.value === processForm.category)
                  ? processForm.category
                  : ""
              }
              onChange={(event) =>
                setProcessForm((current) => ({ ...current, category: event.target.value }))
              }
              className={fieldInputClass}
            >
              <option value="" aria-label="Select category" />
              {categoryOptions.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Tier">
            <select
              value={processForm.tier}
              onChange={(event) =>
                setProcessForm((current) => ({
                  ...current,
                  tier: event.target.value as ProcessTier,
                }))
              }
              className={fieldInputClass}
            >
              <option value="" aria-label="Select tier" />
              {processTiers.map((tier) => (
                <option key={tier.label} value={tier.label}>
                  {tier.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Default Cost / Yr (USD)">
            <input
              value={processForm.cost}
              onChange={(event) =>
                setProcessForm((current) => ({ ...current, cost: event.target.value }))
              }
              className={fieldInputClass}
              inputMode="numeric"
            />
          </Field>
        </div>
        <Field label="Default Hours / Yr">
          <input
            value={processForm.hours}
            onChange={(event) =>
              setProcessForm((current) => ({ ...current, hours: event.target.value }))
            }
            className={fieldInputClass}
            inputMode="numeric"
          />
        </Field>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          onClick={() => setIsProcessFormOpen(false)}
          className="h-8 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-semibold text-[#86868B]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!canAddProcess || isProcessSaving}
          className="inline-flex h-8 items-center gap-2 rounded-md bg-[#E5E5E7] px-4 text-xs font-bold text-[#86868B] enabled:hover:bg-[#007AFF] enabled:hover:text-white disabled:cursor-not-allowed"
        >
          <Plus size={13} aria-hidden="true" />
          {isProcessSaving ? "Saving..." : "Add Process"}
        </button>
      </div>
    </form>
  );
}

function ProcessRow({
  expanded,
  industries,
  process,
  onToggle,
}: {
  expanded: boolean;
  industries: DictionaryIndustry[];
  process: DictionaryProcess;
  onToggle: () => void;
}) {
  const industryLabel =
    process.industryIds.length === industries.length
      ? "All industries"
      : process.industryLabel || `${process.industryIds.length} industries`;

  return (
    <article className="border-b border-black/[0.05] last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="grid w-full grid-cols-[26px_64px_minmax(220px,1fr)_48px_148px_110px] items-center gap-2 bg-white px-4 py-3 text-left text-sm hover:bg-[#FAFAFA]"
      >
        <ChevronRight
          size={14}
          className={`text-[#A1A1AA] transition ${expanded ? "rotate-90" : ""}`}
          aria-hidden="true"
        />
        <span className="text-xs font-bold text-[#C1C7D0]">{process.code}</span>
        <span className="font-bold text-[#333333]">{process.name}</span>
        <span className="text-xs font-bold text-[#86868B]">{getDomainCode(process.domain)}</span>
        <TierPill tier={process.tier} />
        <span className="text-right text-xs font-bold text-[#C1C7D0]">{industryLabel}</span>
      </button>
      {expanded ? (
        <div className="grid gap-5 bg-white px-[88px] pb-5 text-xs font-semibold text-[#86868B] md:grid-cols-[minmax(0,1.5fr)_140px_140px_140px]">
          <div>
            <p>{process.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <Metric label="Domain" value={process.domain} />
              <Metric label="Category" value={process.category} />
            </div>
          </div>
          <Metric label="Default Cost / Yr" value={process.cost} />
          <Metric label="Default Hours / Yr" value={process.hours} />
          <Metric label="Source" value={process.source} />
        </div>
      ) : null}
    </article>
  );
}

function ProcessListState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[96px] items-center justify-center bg-white px-4 py-8 text-center text-sm font-semibold text-[#86868B]">
      {label}
    </div>
  );
}

function TechnologyStackCard({
  filteredTools,
  isToolFormOpen,
  setIsToolFormOpen,
  setToolForm,
  setToolSearch,
  toolForm,
  toolSearch,
  tools,
  onAddTool,
}: {
  filteredTools: TechStackTool[];
  isToolFormOpen: boolean;
  setIsToolFormOpen: (value: boolean) => void;
  setToolForm: (value: ToolFormState | ((current: ToolFormState) => ToolFormState)) => void;
  setToolSearch: (value: string) => void;
  toolForm: ToolFormState;
  toolSearch: string;
  tools: TechStackTool[];
  onAddTool: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Panel
      className="mt-5"
      title={`Technology Stack Library (${tools.length} of 50)`}
      actionLabel="Add Tool"
      onAction={() => setIsToolFormOpen(true)}
    >
      <div className="mt-7 flex flex-wrap gap-2">
        <SearchInput
          value={toolSearch}
          onChange={setToolSearch}
          placeholder="Search tools or vendors..."
          className="w-full sm:w-[280px]"
        />
        <div className="h-9 w-[180px] rounded-md border border-black/[0.08] bg-white" />
      </div>
      {isToolFormOpen ? (
        <form
          onSubmit={onAddTool}
          className="mt-4 grid gap-2 rounded-md border border-[#B8E0FF] bg-[#EEF9FF] p-4 md:grid-cols-[minmax(0,1fr)_180px_180px_auto_auto]"
        >
          <input
            value={toolForm.name}
            onChange={(event) =>
              setToolForm((current) => ({ ...current, name: event.target.value }))
            }
            className={fieldInputClass}
            placeholder="Tool name"
          />
          <input
            value={toolForm.vendor}
            onChange={(event) =>
              setToolForm((current) => ({ ...current, vendor: event.target.value }))
            }
            className={fieldInputClass}
            placeholder="Vendor"
          />
          <input
            value={toolForm.category}
            onChange={(event) =>
              setToolForm((current) => ({ ...current, category: event.target.value }))
            }
            className={fieldInputClass}
            placeholder="Category"
          />
          <button
            type="submit"
            className="h-9 rounded-md bg-[#007AFF] px-4 text-xs font-bold text-white"
          >
            Add
          </button>
          <button
            type="button"
            onClick={() => setIsToolFormOpen(false)}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-bold text-[#86868B]"
          >
            Cancel
          </button>
        </form>
      ) : null}
      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {filteredTools.map((tool) => (
          <article
            key={tool.id}
            className="rounded-md border border-black/[0.08] bg-white px-4 py-3"
          >
            <p className="text-sm font-bold">{tool.name}</p>
            <p className="mt-1 text-xs font-semibold text-[#86868B]">
              {tool.vendor} - {tool.category}
            </p>
          </article>
        ))}
      </div>
      <PaginationSummary
        label={`Showing 1-${Math.min(filteredTools.length, 20)} of ${tools.length}`}
        pages={[1, 2, 3]}
      />
    </Panel>
  );
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
        {label}
      </span>
      {children}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold tracking-[0.08em] text-[#C1C7D0] uppercase">{label}</p>
      <p className="mt-1 font-bold text-[#555555]">{value}</p>
    </div>
  );
}

function SearchInput({
  className = "",
  onChange,
  placeholder,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <label
      className={`flex h-9 items-center gap-2 rounded-md border border-black/[0.08] px-3 ${className}`}
    >
      <Search size={14} className="text-[#A1A1AA]" aria-hidden="true" />
      <input
        aria-label={placeholder.replace("...", "")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 text-xs font-semibold outline-none placeholder:text-[#A1A1AA]"
        placeholder={placeholder}
        type="search"
      />
    </label>
  );
}

function PaginationSummary({ label, pages }: { label: string; pages: readonly number[] }) {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#86868B]">
      <span>{label}</span>
      {pages.length ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md border border-black/[0.05] text-[#C1C7D0]"
            aria-label="Previous page"
          >
            &lt;
          </button>
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${page === 1 ? "border-[#007AFF] bg-[#007AFF] text-white" : "border-black/[0.08] bg-white text-[#555555]"}`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555]"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TierPill({ tier }: { tier: ProcessTier }) {
  const styles = tierStyles[tier];

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${styles.bg} ${styles.text}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {tier}
    </span>
  );
}

function Panel({
  actionLabel,
  children,
  className = "",
  onAction,
  title,
}: {
  actionLabel?: string;
  children: ReactNode;
  className?: string;
  onAction?: () => void;
  title?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}
    >
      {title || actionLabel ? (
        <div className="flex items-center justify-between gap-4">
          {title ? (
            <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
              {title}
            </p>
          ) : (
            <span />
          )}
          {actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#007AFF]"
            >
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

function parseAmount(value: string) {
  const numericValue = Number(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(numericValue) ? Math.max(0, numericValue) : 0;
}

function getDomainCode(domain: string) {
  if (domain === "Customer Experience") return "CX";
  if (domain === "Human Resources") return "HR";
  if (domain === "IT Operations") return "IT";

  return domain
    .replace(/&/g, "")
    .split(/\s+|\//)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unable to load COS data dictionary";
}

function toDisplayName(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
