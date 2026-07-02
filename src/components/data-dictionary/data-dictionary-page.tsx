"use client";

import type { CSSProperties, DragEvent, FormEvent, KeyboardEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  Building2,
  Check,
  ChevronRight,
  Database,
  EyeOff,
  GripVertical,
  LayoutGrid,
  Plus,
  RotateCcw,
  Pencil,
  Search,
  Table2,
  Trash2,
  ChevronDown,
  X,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell/admin-shell";

import {
  automationLevels,
  benchmarkMetrics,
  processCategories,
  processTiers,
  type DictionaryDomain,
  type DictionaryIndustry,
  type DictionaryLibrary,
  type DictionaryProcess,
  type ProcessOption,
  type ProcessTier,
  type TechStackTool,
} from "./data-dictionary-data";
import type { NewProcessModalProps, ProcessFormState } from "./new-process-modal";
import {
  createDataDictionaryDomain,
  createDataDictionaryDomainProcess,
  createDataDictionaryIndustry,
  createDataDictionaryIndustryProcess,
  createDataDictionaryProcessLibrary,
  createDataDictionaryTechStack,
  deleteDataDictionaryProcess,
  deleteDataDictionaryIndustry,
  deleteDataDictionaryProcessLibrary,
  deleteDataDictionaryTechStack,
  fetchDataDictionary,
  reorderDataDictionaryDomains,
  reorderDataDictionaryIndustries,
  updateDataDictionaryCurrencyConversionRate,
  updateDataDictionaryTechStack,
  updateDataDictionaryProcess,
  updateDataDictionaryProcessStatus,
} from "@/api/data-dictionary.api";

const dataDictionaryQueryKey = ["data-dictionary"] as const;
const initialExpandedProcessId = "__initial_process__";
const industryDefaultDomainFilter = "industry-default";
const libraryPageSize = 20;
const emptyIndustries: DictionaryIndustry[] = [];
const emptyDomains: DictionaryDomain[] = [];
const emptyLibraries: DictionaryLibrary[] = [];
const emptyProcesses: DictionaryProcess[] = [];
const emptyTechStack: TechStackTool[] = [];
const NewProcessModal = dynamic<NewProcessModalProps>(
  () => import("./new-process-modal").then((module) => module.NewProcessModal),
  { ssr: false },
);

type ReorderToastState = {
  id: string;
  message: string;
  tone: "success" | "error" | "processing";
};

type MappedDictionaryDomain = DictionaryDomain & {
  key: string;
  processCount: number;
};

const tierStyles: Record<ProcessTier, { bg: string; text: string; dot: string }> = {
  "Must-Have": { bg: "bg-[#DFF8EE]", text: "text-[#10B981]", dot: "bg-[#10B981]" },
  "Good-to-Have": { bg: "bg-[#EAF3FF]", text: "text-[#3B82F6]", dot: "bg-[#3B82F6]" },
  "Nice to Have": { bg: "bg-[#F0F0F0]", text: "text-[#86868B]", dot: "bg-[#86868B]" },
  "Future Enhancement": { bg: "bg-[#F1EAFE]", text: "text-[#8B5CF6]", dot: "bg-[#8B5CF6]" },
};
const fallbackTierStyle = { bg: "bg-[#F5F5F7]", text: "text-[#555555]", dot: "bg-[#A1A1AA]" };

const fieldInputClass =
  "h-8 w-full rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none placeholder:text-[#A1A1AA] focus:border-[#007AFF]";
const usdToAedRate = 3.6725;

const mappingColumnStyle = {
  contain: "layout paint style",
  containIntrinsicSize: "320px",
  contentVisibility: "auto",
} satisfies CSSProperties;
const mappingGridClassName =
  "mt-6 grid min-h-[320px] items-start gap-4 xl:grid-cols-[350px_minmax(0,1fr)_320px]";
const mappingPanelClassName =
  "relative h-[320px] min-h-[320px] overflow-hidden rounded-md border border-black/[0.06] bg-white p-4";

type ToolFormState = {
  category: string;
  domainId: string;
  industryId: string;
  name: string;
  scope: "common" | "industry" | "domain";
  vendor: string;
};

const emptyToolForm: ToolFormState = {
  category: "CRM / Support",
  domainId: "",
  industryId: "",
  name: "",
  scope: "common",
  vendor: "",
};

function createEmptyProcessForm(industries: DictionaryIndustry[]): ProcessFormState {
  return {
    category: "",
    cost: "18000",
    costCurrency: "AED",
    description: "",
    domainId: "",
    hours: "1200",
    industryId: industries[0]?.id ?? "",
    name: "",
    tier: "",
  };
}

function createProcessFormFromProcess(
  process: DictionaryProcess,
  industries: DictionaryIndustry[],
): ProcessFormState {
  return {
    category: process.categoryValue || toSlug(process.category),
    cost: formatProcessAmountInput(process.costAmount ?? parseAmount(process.cost)),
    costCurrency: process.costCurrency || (process.cost.startsWith("$") ? "USD" : "AED"),
    description: process.description,
    domainId: process.scope === "industry-domain" ? process.domainId || "" : "",
    hours: process.hours === "Not set" ? "1200" : formatProcessAmountInput(parseAmount(process.hours)),
    industryId: process.industryIds[0] || industries[0]?.id || "",
    name: process.name,
    tier: process.tier,
  };
}

function createToolFormFromTool(tool: TechStackTool, industries: DictionaryIndustry[]): ToolFormState {
  const scope =
    tool.scope === "industry-domain" ? "domain" : tool.scope === "industry-default" ? "industry" : "common";

  return {
    category: tool.category,
    domainId: scope === "domain" ? tool.domainId || "" : "",
    industryId: scope === "common" ? "" : tool.industryId || industries[0]?.id || "",
    name: tool.name,
    scope,
    vendor: tool.vendor,
  };
}

export function DataDictionaryPage() {
  const queryClient = useQueryClient();
  const [industryName, setIndustryName] = useState("");
  const [domainName, setDomainName] = useState("");
  const [domainIndustryId, setDomainIndustryId] = useState("");
  const [mappingIndustryId, setMappingIndustryId] = useState("");
  const [isProcessFormOpen, setIsProcessFormOpen] = useState(false);
  const [isToolFormOpen, setIsToolFormOpen] = useState(false);
  const [processSearch, setProcessSearch] = useState("");
  const [processDomainFilter, setProcessDomainFilter] = useState("all");
  const [processIndustryFilter, setProcessIndustryFilter] = useState("all");
  const [processPage, setProcessPage] = useState(1);
  const [toolSearch, setToolSearch] = useState("");
  const [toolScopeFilter, setToolScopeFilter] = useState("all");
  const [toolPage, setToolPage] = useState(1);
  const [processForm, setProcessForm] = useState<ProcessFormState>(() =>
    createEmptyProcessForm([]),
  );
  const [editingProcess, setEditingProcess] = useState<DictionaryProcess | null>(null);
  const [processActionId, setProcessActionId] = useState("");
  const [processDeleteTarget, setProcessDeleteTarget] = useState<DictionaryProcess | null>(null);
  const [currencyRateInput, setCurrencyRateInput] = useState<string | null>(null);
  const [savedUsdToAedRateOverride, setSavedUsdToAedRateOverride] = useState<number | null>(null);
  const [toolForm, setToolForm] = useState<ToolFormState>(emptyToolForm);
  const [toolActionId, setToolActionId] = useState("");
  const [editingTool, setEditingTool] = useState<TechStackTool | null>(null);
  const [toolDeleteTarget, setToolDeleteTarget] = useState<TechStackTool | null>(null);
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
  const activateIndustryMutation = useMutation({
    mutationFn: createDataDictionaryIndustry,
  });
  const deleteIndustryMutation = useMutation({
    mutationFn: deleteDataDictionaryIndustry,
  });
  const createDomainMutation = useMutation({
    mutationFn: createDataDictionaryDomain,
  });
  const createProcessLibraryMutation = useMutation({
    mutationFn: createDataDictionaryProcessLibrary,
  });
  const deleteProcessLibraryMutation = useMutation({
    mutationFn: deleteDataDictionaryProcessLibrary,
  });
  const reorderIndustriesMutation = useMutation({
    mutationFn: reorderDataDictionaryIndustries,
  });
  const reorderDomainsMutation = useMutation({
    mutationFn: reorderDataDictionaryDomains,
  });
  const updateCurrencyConversionRateMutation = useMutation({
    mutationFn: updateDataDictionaryCurrencyConversionRate,
  });
  const createIndustryProcessMutation = useMutation({
    mutationFn: createDataDictionaryIndustryProcess,
  });
  const createDomainProcessMutation = useMutation({
    mutationFn: createDataDictionaryDomainProcess,
  });
  const updateProcessMutation = useMutation({
    mutationFn: updateDataDictionaryProcess,
  });
  const updateProcessStatusMutation = useMutation({
    mutationFn: updateDataDictionaryProcessStatus,
  });
  const deleteProcessMutation = useMutation({
    mutationFn: deleteDataDictionaryProcess,
  });
  const createTechStackMutation = useMutation({
    mutationFn: createDataDictionaryTechStack,
  });
  const updateTechStackMutation = useMutation({
    mutationFn: updateDataDictionaryTechStack,
  });
  const deleteTechStackMutation = useMutation({
    mutationFn: deleteDataDictionaryTechStack,
  });
  const industries = dictionaryData?.industries ?? emptyIndustries;
  const domains = dictionaryData?.domains ?? emptyDomains;
  const libraries = dictionaryData?.libraries ?? emptyLibraries;
  const inactiveIndustries = dictionaryData?.inactiveIndustries ?? emptyIndustries;
  const processes = dictionaryData?.processes ?? emptyProcesses;
  const tools = dictionaryData?.techStack ?? emptyTechStack;
  const categoryOptions = dictionaryData?.options.categories.length
    ? dictionaryData.options.categories
    : processCategories;
  const tierOptions = dictionaryData?.options.tiers.length
    ? dictionaryData.options.tiers
    : processTiers.map((tier) => ({ label: tier.label, value: tier.slug }));
  const activeExpandedProcessId =
    expandedProcessId === initialExpandedProcessId ? processes[0]?.id ?? "" : expandedProcessId;
  const isProcessSaving =
    createIndustryProcessMutation.isPending ||
    createDomainProcessMutation.isPending ||
    updateProcessMutation.isPending;
  const isToolSaving = createTechStackMutation.isPending || updateTechStackMutation.isPending;
  const dictionaryErrorMessage =
    dictionaryError || (dictionaryQueryError ? getErrorMessage(dictionaryQueryError) : "");
  const savedUsdToAedRate =
    savedUsdToAedRateOverride ?? dictionaryData?.options.currencyConversionRate ?? usdToAedRate;
  const currencyRateValue = currencyRateInput ?? formatConversionRateInput(savedUsdToAedRate);
  const domainIdentityById = useMemo(() => {
    const domainIdentityMap = new Map(domains.map((domain) => [domain.id, getDomainIdentity(domain)]));

    libraries.forEach((library) => {
      const domainKey =
        domainIdentityMap.get(library.domainId) ||
        toSlug(library.domainDisplayName || library.domainName);

      if (!domainKey) {
        return;
      }

      domainIdentityMap.set(library.id, domainKey);
      domainIdentityMap.set(library.domainId, domainKey);
    });

    return domainIdentityMap;
  }, [domains, libraries]);
  const selectedProcessDomainFilterKey =
    processDomainFilter === "all" || processDomainFilter === industryDefaultDomainFilter
      ? ""
      : domainIdentityById.get(processDomainFilter) || "";

  const filteredProcesses = useMemo(() => {
    const query = normalizeSearch(processSearch);

    return processes.filter((process) => {
      const matchesSearch =
        !query ||
        normalizeSearch(
          `${process.name} ${process.description} ${process.code} ${process.domain} ${process.category} ${process.source} ${process.industryLabel || ""}`,
        ).includes(query);
      const processDomainKey = process.domainId ? domainIdentityById.get(process.domainId) : "";
      const matchesDomain =
        processDomainFilter === "all" ||
        process.domainId === processDomainFilter ||
        Boolean(
          selectedProcessDomainFilterKey && processDomainKey === selectedProcessDomainFilterKey,
        );
      const matchesIndustry =
        processIndustryFilter === "all" || process.industryIds.includes(processIndustryFilter);

      return matchesSearch && matchesDomain && matchesIndustry;
    });
  }, [
    domainIdentityById,
    processDomainFilter,
    processIndustryFilter,
    processSearch,
    processes,
    selectedProcessDomainFilterKey,
  ]);

  const filteredTools = useMemo(() => {
    const query = normalizeSearch(toolSearch);
    return tools.filter((tool) => {
      const matchesSearch =
        !query ||
        normalizeSearch(
          `${tool.name} ${tool.vendor} ${tool.category} ${tool.industryName || ""} ${tool.domainName || ""}`,
        ).includes(query);
      const matchesScope =
        toolScopeFilter === "all" ||
        (toolScopeFilter === "common" && tool.scope === "common") ||
        (toolScopeFilter === "industry" && tool.scope === "industry-default") ||
        (toolScopeFilter === "domain" && tool.scope === "industry-domain");

      return matchesSearch && matchesScope;
    });
  }, [toolScopeFilter, toolSearch, tools]);

  async function handleAddIndustry() {
    const name = toDisplayName(industryName);
    if (!name) return false;

    const exists = industries.some(
      (industry) => normalizeSearch(industry.name) === normalizeSearch(name),
    );
    if (exists) {
      setIndustryName("");
      return false;
    }

    try {
      setDictionaryError("");
      const savedIndustry = await createIndustryMutation.mutateAsync({ name });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });

      if (savedIndustry) {
        setDomainIndustryId(savedIndustry.id);
        setMappingIndustryId(savedIndustry.id);
        setProcessForm((current) => ({
          ...current,
          industryId: savedIndustry.id,
        }));
      }
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }

    setIndustryName("");
    return true;
  }

  async function handleAddDomain() {
    const name = toDisplayName(domainName);
    if (!name) return false;

    const selectedIndustryId = mappingIndustryId || domainIndustryId || industries[0]?.id || "";

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
      setMappingIndustryId(selectedIndustryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }

    setDomainName("");
    return true;
  }

  async function handleMapDomain(domainId: string) {
    const selectedIndustryId = mappingIndustryId || industries[0]?.id || "";

    try {
      if (!selectedIndustryId) {
        throw new Error("Select an industry before mapping a domain");
      }

      if (!domainId) {
        throw new Error("Select a domain to map");
      }

      setDictionaryError("");
      await createProcessLibraryMutation.mutateAsync({
        domainId,
        industryId: selectedIndustryId,
      });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setDomainIndustryId(selectedIndustryId);
      setMappingIndustryId(selectedIndustryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleMapDomainToIndustry(industryId: string, domainId: string) {
    try {
      if (!industryId) {
        throw new Error("Select an industry before mapping a domain");
      }

      if (!domainId) {
        throw new Error("Select a domain to map");
      }

      setDictionaryError("");
      await createProcessLibraryMutation.mutateAsync({
        domainId,
        industryId,
      });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setDomainIndustryId(industryId);
      setMappingIndustryId(industryId);
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleDeleteIndustry(industryId: string, force = false) {
    try {
      if (!industryId) {
        throw new Error("Select an industry before deleting it");
      }

      setDictionaryError("");
      await deleteIndustryMutation.mutateAsync({ force, industryId });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setDomainIndustryId("");
      setMappingIndustryId("");
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleActivateIndustry(industry: DictionaryIndustry) {
    try {
      if (!industry.name) {
        throw new Error("Select an industry before activating it");
      }

      setDictionaryError("");
      const savedIndustry = await activateIndustryMutation.mutateAsync({ name: industry.name });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });

      if (savedIndustry) {
        setDomainIndustryId(savedIndustry.id);
        setMappingIndustryId(savedIndustry.id);
      }
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleDeleteDomain(domainId: string) {
    try {
      if (!domainId) {
        throw new Error("Select a domain before removing it");
      }

      setDictionaryError("");
      await deleteProcessLibraryMutation.mutateAsync(domainId);
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(message);
    }
  }

  async function handleReorderIndustries(industryIds: string[]) {
    if (industryIds.length === 0) return;

    try {
      setDictionaryError("");
      await reorderIndustriesMutation.mutateAsync({ industryIds });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
      throw error;
    }
  }

  async function handleReorderDomains(industryId: string, domainIds: string[]) {
    if (!industryId || domainIds.length === 0) return;

    try {
      setDictionaryError("");
      await reorderDomainsMutation.mutateAsync({ domainIds, industryId });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
      throw error;
    }
  }

  async function handleAddProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isProcessSaving) return;

    const name = toDisplayName(processForm.name);
    const industryId = processForm.industryId || industries[0]?.id || "";
    const category = processForm.category.trim();
    const tier = processForm.tier.trim();

    if (!name || !industryId || !category || !tier) return;

    const processPayload = {
      category,
      description:
        processForm.description.trim() || "Newly added process for assessment configuration",
      estimatedAnnualCost: {
        amount: parseAmount(processForm.cost),
        currency: processForm.costCurrency,
      },
      hoursPerYear: parseAmount(processForm.hours),
      name,
      tier,
    };

    try {
      setDictionaryError("");
      let createdProcessId = "";

      if (editingProcess) {
        createdProcessId = await updateProcessMutation.mutateAsync({
          process: editingProcess,
          values: processPayload,
        });
      } else if (processForm.domainId) {
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
      setEditingProcess(null);
      setProcessForm(createEmptyProcessForm(industries));
      setIsProcessFormOpen(false);
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    }
  }

  function handleOpenNewProcessForm() {
    setEditingProcess(null);
    setProcessForm(createEmptyProcessForm(industries));
    setIsProcessFormOpen(true);
  }

  function handleEditProcess(process: DictionaryProcess) {
    setEditingProcess(process);
    setProcessForm(createProcessFormFromProcess(process, industries));
    setIsProcessFormOpen(true);
  }

  async function handleToggleProcessStatus(process: DictionaryProcess) {
    const nextIsActive = process.isActive === false;

    try {
      setDictionaryError("");
      setProcessActionId(process.id);
      await updateProcessStatusMutation.mutateAsync({
        isActive: nextIsActive,
        process,
      });
      queryClient.setQueryData(dataDictionaryQueryKey, (currentData: typeof dictionaryData) => {
        if (!currentData) {
          return currentData;
        }

        return {
          ...currentData,
          processes: currentData.processes.map((item) =>
            item.id === process.id ? { ...item, isActive: nextIsActive } : item,
          ),
        };
      });
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setExpandedProcessId(process.id);
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    } finally {
      setProcessActionId("");
    }
  }

  function handleDeleteProcess(process: DictionaryProcess) {
    setProcessDeleteTarget(process);
  }

  async function confirmDeleteProcess() {
    const process = processDeleteTarget;

    if (!process || deleteProcessMutation.isPending) {
      return;
    }

    try {
      setDictionaryError("");
      setProcessActionId(process.id);
      await deleteProcessMutation.mutateAsync(process);
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setExpandedProcessId("");
      setProcessDeleteTarget(null);
      if (editingProcess?.id === process.id) {
        setEditingProcess(null);
        setIsProcessFormOpen(false);
      }
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    } finally {
      setProcessActionId("");
    }
  }

  async function handleAddTool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = toDisplayName(toolForm.name);
    const vendor = toDisplayName(toolForm.vendor);
    const category = toDisplayName(toolForm.category);
    const selectedIndustryId = toolForm.industryId || industries[0]?.id || "";
    if (!name || !vendor || !category) return;

    try {
      setDictionaryError("");

      if (editingTool) {
        setToolActionId(editingTool.id);
        await updateTechStackMutation.mutateAsync({
          tool: editingTool,
          values: {
            category,
            name,
            vendor,
          },
        });
        setEditingTool(null);
        setToolActionId("");
      } else if (toolForm.scope === "common") {
        await createTechStackMutation.mutateAsync({
          category,
          name,
          scope: "common",
          vendor,
        });
      } else if (toolForm.scope === "domain") {
        if (!selectedIndustryId || !toolForm.domainId) {
          throw new Error("Select an industry and domain for this tech stack tool");
        }

        await createTechStackMutation.mutateAsync({
          category,
          domainId: toolForm.domainId,
          industryId: selectedIndustryId,
          name,
          scope: "industry-domain",
          vendor,
        });
      } else {
        if (!selectedIndustryId) {
          throw new Error("Select an industry for this tech stack tool");
        }

        await createTechStackMutation.mutateAsync({
          category,
          industryId: selectedIndustryId,
          name,
          scope: "industry-default",
          vendor,
        });
      }

      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setToolForm(emptyToolForm);
      setIsToolFormOpen(false);
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
      setToolActionId("");
    }
  }

  function handleOpenNewToolForm() {
    setEditingTool(null);
    setToolForm(emptyToolForm);
    setIsToolFormOpen(true);
  }

  function handleCloseToolForm() {
    setEditingTool(null);
    setToolForm(emptyToolForm);
    setIsToolFormOpen(false);
  }

  function handleEditTool(tool: TechStackTool) {
    setEditingTool(tool);
    setToolForm(createToolFormFromTool(tool, industries));
    setIsToolFormOpen(true);
  }

  function handleDeleteTool(tool: TechStackTool) {
    setToolDeleteTarget(tool);
  }

  async function confirmDeleteTool() {
    const tool = toolDeleteTarget;

    if (!tool || deleteTechStackMutation.isPending) {
      return;
    }

    try {
      setDictionaryError("");
      setToolActionId(tool.id);
      await deleteTechStackMutation.mutateAsync(tool.id);
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
      setToolDeleteTarget(null);
      if (editingTool?.id === tool.id) {
        handleCloseToolForm();
      }
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    } finally {
      setToolActionId("");
    }
  }

  async function handleSaveCurrencyRate() {
    const nextRate = getUsdToAedRate(currencyRateValue);

    try {
      setDictionaryError("");
      const savedRate = await updateCurrencyConversionRateMutation.mutateAsync(nextRate);
      setSavedUsdToAedRateOverride(savedRate);
      setCurrencyRateInput(null);
      await queryClient.invalidateQueries({ queryKey: dataDictionaryQueryKey });
    } catch (error) {
      setDictionaryError(getErrorMessage(error));
    }
  }

  return (
    <AdminShell activeItem="Data Dictionary">
      <div>
        <PageHeader />
        <section className="mt-7 grid gap-5 xl:grid-cols-2" aria-label="Reference scales">
          <AutomationLevelsCard />
          <ProcessTiersCard />
        </section>
        <BenchmarkCard />
        <IndustryDomainManager
          domainName={domainName}
          domains={domains}
          industryName={industryName}
          industries={industries}
          isCatalogLoading={isCatalogLoading}
          isDomainSaving={createDomainMutation.isPending}
          isDeletingDomain={deleteProcessLibraryMutation.isPending}
          isDeletingIndustry={deleteIndustryMutation.isPending}
          isIndustrySaving={createIndustryMutation.isPending || activateIndustryMutation.isPending}
          isMappingDomain={createProcessLibraryMutation.isPending}
          libraries={libraries}
          inactiveIndustries={inactiveIndustries}
          mappingIndustryId={mappingIndustryId}
          processes={processes}
          setDomainIndustryId={setDomainIndustryId}
          setDomainName={setDomainName}
          setIndustryName={setIndustryName}
          setMappingIndustryId={setMappingIndustryId}
          onAddDomain={handleAddDomain}
          onAddIndustry={handleAddIndustry}
          onActivateIndustry={handleActivateIndustry}
          onDeleteDomain={handleDeleteDomain}
          onDeleteIndustry={handleDeleteIndustry}
          onMapDomain={handleMapDomain}
          onMapDomainToIndustry={handleMapDomainToIndustry}
          onReorderDomains={handleReorderDomains}
          onReorderIndustries={handleReorderIndustries}
        />
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
          tierOptions={tierOptions}
          editingProcess={editingProcess}
          processDomainFilter={processDomainFilter}
          processForm={processForm}
          processActionId={processActionId}
          processIndustryFilter={processIndustryFilter}
          processPage={processPage}
          processSearch={processSearch}
          processes={processes}
          setExpandedProcessId={setExpandedProcessId}
          setIsProcessFormOpen={setIsProcessFormOpen}
          setProcessDomainFilter={(value) => {
            setProcessPage(1);
            setProcessDomainFilter(value);
          }}
          setProcessForm={setProcessForm}
          setProcessIndustryFilter={(value) => {
            setProcessPage(1);
            setProcessIndustryFilter(value);
          }}
          setProcessPage={setProcessPage}
          setProcessSearch={(value) => {
            setProcessPage(1);
            setProcessSearch(value);
          }}
          onAddProcess={handleAddProcess}
          currencyRateInput={currencyRateValue}
          isCurrencyRateSaving={updateCurrencyConversionRateMutation.isPending}
          savedUsdToAedRate={savedUsdToAedRate}
          setCurrencyRateInput={setCurrencyRateInput}
          onSaveCurrencyRate={handleSaveCurrencyRate}
          onDeleteProcess={handleDeleteProcess}
          onEditProcess={handleEditProcess}
          onOpenNewProcessForm={handleOpenNewProcessForm}
          onToggleProcessStatus={handleToggleProcessStatus}
        />
        <TechnologyStackCard
          domains={domains}
          filteredTools={filteredTools}
          industries={industries}
          isCatalogLoading={isCatalogLoading}
          isToolDeleting={deleteTechStackMutation.isPending}
          isToolFormOpen={isToolFormOpen}
          isToolSaving={isToolSaving}
          setToolForm={setToolForm}
          setToolPage={setToolPage}
          setToolScopeFilter={(value) => {
            setToolPage(1);
            setToolScopeFilter(value);
          }}
          setToolSearch={(value) => {
            setToolPage(1);
            setToolSearch(value);
          }}
          toolForm={toolForm}
          toolActionId={toolActionId}
          toolPage={toolPage}
          toolScopeFilter={toolScopeFilter}
          toolSearch={toolSearch}
          tools={tools}
          editingTool={editingTool}
          onAddTool={handleAddTool}
          onCloseToolForm={handleCloseToolForm}
          onDeleteTool={handleDeleteTool}
          onEditTool={handleEditTool}
          onOpenNewToolForm={handleOpenNewToolForm}
        />
        {processDeleteTarget ? (
          <DeleteProcessConfirmationModal
            isDeleting={deleteProcessMutation.isPending && processActionId === processDeleteTarget.id}
            process={processDeleteTarget}
            onCancel={() => {
              if (!deleteProcessMutation.isPending) {
                setProcessDeleteTarget(null);
              }
            }}
            onConfirm={() => {
              void confirmDeleteProcess();
            }}
          />
        ) : null}
        {toolDeleteTarget ? (
          <DeleteToolConfirmationModal
            isDeleting={deleteTechStackMutation.isPending && toolActionId === toolDeleteTarget.id}
            tool={toolDeleteTarget}
            onCancel={() => {
              if (!deleteTechStackMutation.isPending) {
                setToolDeleteTarget(null);
              }
            }}
            onConfirm={() => {
              void confirmDeleteTool();
            }}
          />
        ) : null}
      </div>
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

function IndustryDomainManager({
  domainName,
  domains,
  industries,
  industryName,
  isCatalogLoading,
  inactiveIndustries,
  isDomainSaving,
  isDeletingDomain,
  isDeletingIndustry,
  isIndustrySaving,
  isMappingDomain,
  libraries,
  mappingIndustryId,
  processes,
  setDomainIndustryId,
  setDomainName,
  setIndustryName,
  setMappingIndustryId,
  onAddDomain,
  onAddIndustry,
  onActivateIndustry,
  onDeleteDomain,
  onDeleteIndustry,
  onMapDomain,
  onMapDomainToIndustry,
  onReorderDomains,
  onReorderIndustries,
}: {
  domainName: string;
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  industryName: string;
  inactiveIndustries: DictionaryIndustry[];
  isCatalogLoading: boolean;
  isDomainSaving: boolean;
  isDeletingDomain: boolean;
  isDeletingIndustry: boolean;
  isIndustrySaving: boolean;
  isMappingDomain: boolean;
  libraries: DictionaryLibrary[];
  mappingIndustryId: string;
  processes: DictionaryProcess[];
  setDomainIndustryId: (value: string) => void;
  setDomainName: (value: string) => void;
  setIndustryName: (value: string) => void;
  setMappingIndustryId: (value: string) => void;
  onAddDomain: () => Promise<boolean>;
  onAddIndustry: () => Promise<boolean>;
  onActivateIndustry: (industry: DictionaryIndustry) => Promise<void>;
  onDeleteDomain: (domainId: string) => Promise<void>;
  onDeleteIndustry: (industryId: string, force?: boolean) => Promise<void>;
  onMapDomain: (domainId: string) => Promise<void>;
  onMapDomainToIndustry: (industryId: string, domainId: string) => Promise<void>;
  onReorderDomains: (industryId: string, domainIds: string[]) => Promise<void>;
  onReorderIndustries: (industryIds: string[]) => Promise<void>;
}) {
  const [domainSearch, setDomainSearch] = useState("");
  const [draggedDomainKey, setDraggedDomainKey] = useState("");
  const [draggedIndustryId, setDraggedIndustryId] = useState("");
  const [industryDeleteImpact, setIndustryDeleteImpact] = useState<{
    defaultProcessCount: number;
    domainNames: string[];
    domainProcessCount: number;
    hasMappedData: boolean;
    industry: DictionaryIndustry;
  } | null>(null);
  const [mappingView, setMappingView] = useState<"manage" | "table">("manage");
  const [reorderToasts, setReorderToasts] = useState<ReorderToastState[]>([]);
  const [canScrollDomainLibraryDown, setCanScrollDomainLibraryDown] = useState(false);
  const [canScrollIndustriesDown, setCanScrollIndustriesDown] = useState(false);
  const [canScrollMappedDomainsDown, setCanScrollMappedDomainsDown] = useState(false);
  const industryListRef = useRef<HTMLDivElement | null>(null);
  const domainLibraryListRef = useRef<HTMLDivElement | null>(null);
  const mappedDomainListRef = useRef<HTMLDivElement | null>(null);
  const reorderToastIdRef = useRef(0);
  const reorderToastTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const [domainOrderByIndustryId, setDomainOrderByIndustryId] = useState<Record<string, string[]>>(
    {},
  );
  const [industryOrder, setIndustryOrder] = useState<string[]>([]);
  const selectedIndustryId = industries.some((industry) => industry.id === mappingIndustryId)
    ? mappingIndustryId
    : industries[0]?.id || "";
  const selectedIndustry = industries.find((industry) => industry.id === selectedIndustryId);
  const selectedIndustryName = selectedIndustry?.name || "Selected industry";
  const orderedIndustries = useMemo(
    () => orderItemsByKey(industries, industryOrder, (industry) => industry.id),
    [industries, industryOrder],
  );
  const orderedInactiveIndustries = useMemo(
    () => orderItemsByDisplayOrder(inactiveIndustries),
    [inactiveIndustries],
  );
  const displayedIndustries = useMemo(
    () => [...orderedIndustries, ...orderedInactiveIndustries],
    [orderedInactiveIndustries, orderedIndustries],
  );
  const activeIndustryCount = industries.length;
  const totalIndustryCount = displayedIndustries.length;
  const normalizedIndustrySearch = normalizeSearch(industryName);
  const exactActiveIndustryMatch = orderedIndustries.some(
    (industry) => normalizeSearch(industry.name) === normalizedIndustrySearch,
  );
  const exactInactiveIndustryMatch = orderedInactiveIndustries.some(
    (industry) => normalizeSearch(industry.name) === normalizedIndustrySearch,
  );
  const filteredOrderedIndustries = displayedIndustries.filter(
    (industry) =>
      !normalizedIndustrySearch ||
      normalizeSearch(industry.name).includes(normalizedIndustrySearch),
  );
  const uniqueDomains = useMemo(() => getUniqueDomains(domains), [domains]);
  const industryUsageByDomainKey = useMemo(
    () => getIndustryUsageByDomainKey(domains, libraries),
    [domains, libraries],
  );
  const domainCountByIndustryId = useMemo(
    () => getDomainCountByIndustry(industries, domains, libraries),
    [domains, industries, libraries],
  );
  const mappedDomains = useMemo(
    () => getMappedDomainsForIndustry(selectedIndustryId, domains, libraries),
    [domains, libraries, selectedIndustryId],
  );
  const orderedMappedDomains = useMemo(
    () =>
      orderItemsByKey(
        mappedDomains,
        domainOrderByIndustryId[selectedIndustryId] ?? [],
        (domain) => domain.id,
      ),
    [domainOrderByIndustryId, mappedDomains, selectedIndustryId],
  );
  const normalizedMappedDomainSearch = normalizeSearch(domainName);
  const exactMappedDomainMatch = orderedMappedDomains.some(
    (domain) =>
      normalizeSearch(domain.name) === normalizedMappedDomainSearch ||
      normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedMappedDomainSearch,
  );
  const exactGlobalDomainMatch = uniqueDomains.some(
    (domain) =>
      normalizeSearch(domain.name) === normalizedMappedDomainSearch ||
      normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedMappedDomainSearch,
  );
  const filteredOrderedMappedDomains = orderedMappedDomains.filter(
    (domain) =>
      !normalizedMappedDomainSearch ||
      normalizeSearch(domain.name).includes(normalizedMappedDomainSearch) ||
      normalizeSearch(getDomainDisplayTitle(domain.name)).includes(normalizedMappedDomainSearch),
  );
  const mappedDomainKeys = new Set(mappedDomains.map((domain) => domain.key));
  const normalizedDomainSearch = normalizeSearch(domainSearch);
  const filteredGlobalDomains = uniqueDomains.filter(
    (domain) => !normalizedDomainSearch || normalizeSearch(domain.name).includes(normalizedDomainSearch),
  );
  const isDeletingMapping = isDeletingDomain || isDeletingIndustry;
  const industryFieldHint = !normalizedIndustrySearch
    ? "Search or create"
    : exactActiveIndustryMatch
      ? "Enter to select"
      : exactInactiveIndustryMatch
        ? "Inactive"
        : "Enter to create";
  const domainFieldHint = !selectedIndustryId
    ? "Select industry"
    : !normalizedMappedDomainSearch
      ? "Search or create"
      : exactMappedDomainMatch
        ? "Already mapped"
        : exactGlobalDomainMatch
          ? "Enter to map"
          : "Enter to create";
  const isIndustryFieldBusy = isIndustrySaving;
  const isDomainFieldBusy = isDomainSaving || isMappingDomain;

  useEffect(() => {
    const toastTimeouts = reorderToastTimeoutsRef.current;

    return () => {
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();
    };
  }, []);

  useEffect(() => {
    updateScrollDownState(industryListRef, setCanScrollIndustriesDown);
  }, [filteredOrderedIndustries, mappingView]);

  useEffect(() => {
    updateScrollDownState(domainLibraryListRef, setCanScrollDomainLibraryDown);
  }, [domainSearch, filteredGlobalDomains, mappingView]);

  useEffect(() => {
    updateScrollDownState(mappedDomainListRef, setCanScrollMappedDomainsDown);
  }, [filteredOrderedMappedDomains, mappingView, selectedIndustryId]);

  function clearReorderToastTimeout(toastId: string) {
    const toastTimeout = reorderToastTimeoutsRef.current.get(toastId);

    if (toastTimeout) {
      clearTimeout(toastTimeout);
      reorderToastTimeoutsRef.current.delete(toastId);
    }
  }

  function scheduleReorderToastDismiss(toastId: string, tone: ReorderToastState["tone"]) {
    clearReorderToastTimeout(toastId);

    if (tone === "processing") {
      return;
    }

    const toastTimeout = setTimeout(() => {
      setReorderToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== toastId),
      );
      reorderToastTimeoutsRef.current.delete(toastId);
    }, 4400);

    reorderToastTimeoutsRef.current.set(toastId, toastTimeout);
  }

  function showReorderToast(message: string, tone: ReorderToastState["tone"]) {
    reorderToastIdRef.current += 1;
    const toastId = `mapping-toast-${reorderToastIdRef.current}`;

    setReorderToasts((currentToasts) =>
      [{ id: toastId, message, tone }, ...currentToasts].slice(0, 3),
    );
    scheduleReorderToastDismiss(toastId, tone);

    return toastId;
  }

  function updateReorderToast(
    toastId: string,
    message: string,
    tone: ReorderToastState["tone"],
  ) {
    setReorderToasts((currentToasts) => {
      const toastExists = currentToasts.some((toast) => toast.id === toastId);
      const nextToast = { id: toastId, message, tone };

      if (!toastExists) {
        return [nextToast, ...currentToasts].slice(0, 3);
      }

      return currentToasts.map((toast) => (toast.id === toastId ? nextToast : toast));
    });
    scheduleReorderToastDismiss(toastId, tone);
  }

  function selectIndustry(industryId: string) {
    setDomainIndustryId(industryId);
    setMappingIndustryId(industryId);
  }

  async function mapDomain(domainId: string) {
    const domain = uniqueDomains.find((item) => item.id === domainId);

    try {
      await onMapDomain(domainId);
      showReorderToast(`${domain?.name || "Domain"} mapped to ${selectedIndustryName}`, "success");
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function mapDomainToIndustry(industryId: string, domainId: string) {
    const domain = uniqueDomains.find((item) => item.id === domainId);
    const industry = orderedIndustries.find((item) => item.id === industryId);

    try {
      await onMapDomainToIndustry(industryId, domainId);
      showReorderToast(
        `${domain?.name || "Domain"} mapped to ${industry?.name || "selected industry"}`,
        "success",
      );
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function createIndustryFromSearch() {
    const industryLabel = toDisplayName(industryName);

    try {
      const wasAdded = await onAddIndustry();

      if (wasAdded) {
        showReorderToast(`${industryLabel} industry added`, "success");
      }
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function createDomainFromSearch() {
    const domainLabel = toDisplayName(domainName);

    try {
      const wasAdded = await onAddDomain();

      if (wasAdded) {
        showReorderToast(`${domainLabel} added to ${selectedIndustryName}`, "success");
      }
    } catch (error) {
      showReorderToast(`${getErrorMessage(error)}: ${selectedIndustryName}`, "error");
    }
  }

  function handleIndustrySearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const normalizedSearch = normalizeSearch(industryName);
    if (!normalizedSearch || isIndustrySaving) {
      return;
    }

    const existingIndustry = orderedIndustries.find(
      (industry) => normalizeSearch(industry.name) === normalizedSearch,
    );

    if (existingIndustry) {
      selectIndustry(existingIndustry.id);
      setIndustryName("");
      return;
    }

    const inactiveIndustry = orderedInactiveIndustries.find(
      (industry) => normalizeSearch(industry.name) === normalizedSearch,
    );

    if (inactiveIndustry) {
      showReorderToast(`${inactiveIndustry.name} is inactive and hidden from users`, "error");
      return;
    }

    void createIndustryFromSearch();
  }

  function handleDomainSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const normalizedSearch = normalizeSearch(domainName);
    if (!normalizedSearch || isDomainSaving || isMappingDomain) {
      return;
    }

    if (!selectedIndustryId) {
      showReorderToast("Select an industry before adding a domain", "error");
      return;
    }

    const existingMappedDomain = orderedMappedDomains.find(
      (domain) =>
        normalizeSearch(domain.name) === normalizedSearch ||
        normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedSearch,
    );

    if (existingMappedDomain) {
      showReorderToast(`${getDomainDisplayTitle(existingMappedDomain.name)} is already mapped to ${selectedIndustryName}`, "success");
      setDomainName("");
      return;
    }

    const existingGlobalDomain = uniqueDomains.find(
      (domain) =>
        normalizeSearch(domain.name) === normalizedSearch ||
        normalizeSearch(getDomainDisplayTitle(domain.name)) === normalizedSearch,
    );

    if (existingGlobalDomain) {
      void mapDomain(existingGlobalDomain.id).then(() => setDomainName(""));
      return;
    }

    void createDomainFromSearch();
  }

  function getIndustryDeleteImpact(industryId: string) {
    const industry = orderedIndustries.find((item) => item.id === industryId);

    if (!industry) {
      return null;
    }

    const industryMappedDomains = getMappedDomainsForIndustry(industryId, domains, libraries);
    const defaultProcessCount = processes.filter(
      (process) =>
        process.scope === "industry-default" && process.industryIds.includes(industryId),
    ).length;
    const domainProcessCount = industryMappedDomains.reduce(
      (count, domain) => count + domain.processCount,
      0,
    );

    return {
      defaultProcessCount,
      domainNames: industryMappedDomains.map((domain) => getDomainDisplayTitle(domain.name)),
      domainProcessCount,
      hasMappedData:
        industryMappedDomains.length > 0 || defaultProcessCount > 0 || domainProcessCount > 0,
      industry,
    };
  }

  async function deleteIndustry(industryId: string, force = false) {
    const industry = orderedIndustries.find((item) => item.id === industryId);

    try {
      await onDeleteIndustry(industryId, force);
      setIndustryDeleteImpact(null);
      showReorderToast(`${industry?.name || "Industry"} deactivated`, "success");
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  async function activateIndustry(industry: DictionaryIndustry) {
    try {
      await onActivateIndustry(industry);
      setIndustryName("");
      showReorderToast(`${industry.name} activated`, "success");
    } catch (error) {
      showReorderToast(getErrorMessage(error), "error");
    }
  }

  function requestDeleteIndustry(industryId: string) {
    const deleteImpact = getIndustryDeleteImpact(industryId);

    if (!deleteImpact) {
      showReorderToast("Industry not found", "error");
      return;
    }

    if (deleteImpact.hasMappedData) {
      setIndustryDeleteImpact(deleteImpact);
      return;
    }

    void deleteIndustry(industryId);
  }

  async function deleteMappedDomain(domain: MappedDictionaryDomain) {
    const domainTitle = getDomainDisplayTitle(domain.name);

    try {
      await onDeleteDomain(domain.id);
      showReorderToast(`${domainTitle} removed from ${selectedIndustryName}`, "success");
    } catch (error) {
      showReorderToast(`${getErrorMessage(error)}: ${selectedIndustryName}`, "error");
    }
  }

  function allowDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }

  function persistIndustryOrder(nextOrder: string[]) {
    const toastId = showReorderToast("Saving industry order...", "processing");

    setIndustryOrder(nextOrder);
    void onReorderIndustries(nextOrder).then(
      () => {
        setIndustryOrder([]);
        updateReorderToast(toastId, "Industry order updated", "success");
      },
      () => {
        setIndustryOrder([]);
        updateReorderToast(toastId, "Industry order could not be saved", "error");
      },
    );
  }

  function persistDomainOrder(nextOrder: string[]) {
    const toastId = showReorderToast("Saving domain order...", "processing");

    setDomainOrderByIndustryId((currentOrderByIndustryId) => ({
      ...currentOrderByIndustryId,
      [selectedIndustryId]: nextOrder,
    }));
    void onReorderDomains(selectedIndustryId, nextOrder).then(
      () => {
        setDomainOrderByIndustryId((currentOrderByIndustryId) => ({
          ...currentOrderByIndustryId,
          [selectedIndustryId]: [],
        }));
        updateReorderToast(toastId, "Domain order updated", "success");
      },
      () => {
        setDomainOrderByIndustryId((currentOrderByIndustryId) => ({
          ...currentOrderByIndustryId,
          [selectedIndustryId]: [],
        }));
        updateReorderToast(toastId, "Domain order could not be saved", "error");
      },
    );
  }

  function reorderKeyByOffset(itemKeys: string[], itemKey: string, offset: number) {
    const currentIndex = itemKeys.indexOf(itemKey);
    const targetIndex = currentIndex + offset;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= itemKeys.length) {
      return [];
    }

    const nextOrder = [...itemKeys];
    const [movedKey] = nextOrder.splice(currentIndex, 1);

    if (!movedKey) {
      return [];
    }

    nextOrder.splice(targetIndex, 0, movedKey);

    return nextOrder;
  }

  function moveIndustry(targetIndustryId: string) {
    if (!draggedIndustryId || draggedIndustryId === targetIndustryId) {
      return;
    }

    const nextOrder = reorderItemKeys(
      orderedIndustries.map((industry) => industry.id),
      [],
      draggedIndustryId,
      targetIndustryId,
    );

    persistIndustryOrder(nextOrder);
  }

  function moveIndustryByKeyboard(industryId: string, offset: number) {
    const nextOrder = reorderKeyByOffset(
      orderedIndustries.map((industry) => industry.id),
      industryId,
      offset,
    );

    if (nextOrder.length > 0) {
      persistIndustryOrder(nextOrder);
    }
  }

  function moveMappedDomain(targetDomainId: string) {
    if (!draggedDomainKey || draggedDomainKey === targetDomainId) {
      return;
    }

    const nextOrder = reorderItemKeys(
      orderedMappedDomains.map((domain) => domain.id),
      [],
      draggedDomainKey,
      targetDomainId,
    );

    persistDomainOrder(nextOrder);
  }

  function moveMappedDomainByKeyboard(domainId: string, offset: number) {
    const nextOrder = reorderKeyByOffset(
      orderedMappedDomains.map((domain) => domain.id),
      domainId,
      offset,
    );

    if (nextOrder.length > 0) {
      persistDomainOrder(nextOrder);
    }
  }

  function handleIndustryKeyDown(event: KeyboardEvent<HTMLButtonElement>, industryId: string) {
    if (!event.altKey) {
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      moveIndustryByKeyboard(industryId, -1);
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      moveIndustryByKeyboard(industryId, 1);
    }
  }

  function handleMappedDomainKeyDown(event: KeyboardEvent<HTMLElement>, domainId: string) {
    if (!event.altKey) {
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      moveMappedDomainByKeyboard(domainId, -1);
    }

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      moveMappedDomainByKeyboard(domainId, 1);
    }
  }

  function scrollListDown(listRef: React.RefObject<HTMLDivElement | null>) {
    listRef.current?.scrollBy({ behavior: "smooth", top: 140 });
  }

  function handleListScroll(
    listRef: React.RefObject<HTMLDivElement | null>,
    setCanScrollDown: (value: boolean) => void,
  ) {
    updateScrollDownState(listRef, setCanScrollDown);
  }

  return (
    <Panel
      actionSlot={
        <div
          aria-label="Industry and domain mapping view"
          className="inline-flex h-8 items-center rounded-md border border-black/[0.08] bg-[#F5F5F7] p-0.5"
          role="group"
        >
          <button
            type="button"
            onClick={() => setMappingView("manage")}
            aria-pressed={mappingView === "manage"}
            title="Manage industries and mapped domains"
            className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-[11px] font-bold transition ${
              mappingView === "manage"
                ? "bg-white text-[#007AFF] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                : "text-[#86868B] hover:text-[#171717]"
            }`}
          >
            <LayoutGrid size={12} aria-hidden="true" />
            Manage
          </button>
          <button
            type="button"
            onClick={() => setMappingView("table")}
            aria-pressed={mappingView === "table"}
            title="View industry and domain relationships as a table"
            className={`inline-flex h-7 items-center gap-1.5 rounded-[5px] px-3 text-[11px] font-bold transition ${
              mappingView === "table"
                ? "bg-white text-[#007AFF] shadow-[0_1px_2px_rgba(15,23,42,0.08)]"
                : "text-[#86868B] hover:text-[#171717]"
            }`}
          >
            <Table2 size={12} aria-hidden="true" />
            Relations
          </button>
        </div>
      }
      className="mt-5"
      title="Industry and domain mapping"
    >
      {isCatalogLoading ? (
        <IndustryDomainSkeleton />
      ) : mappingView === "table" ? (
        <IndustryDomainRelationTable
          domains={uniqueDomains}
          industries={orderedIndustries}
          isMappingDomain={isMappingDomain}
          libraries={libraries}
          onMapDomain={mapDomainToIndustry}
        />
      ) : (
        <div className={mappingGridClassName}>
          <section
            className={mappingPanelClassName}
            style={mappingColumnStyle}
          >
            <div className="min-h-8 border-b border-black/[0.06]">
              <div className="flex min-h-5 items-center justify-between gap-3">
                <p className="min-w-0 text-[11px] leading-4 font-bold tracking-[0.08em] text-[#86868B] uppercase">
                  Industries
                </p>
                <p className="shrink-0 text-xs leading-4 font-semibold text-[#A1A1AA]">
                  {activeIndustryCount} active / {totalIndustryCount} total
                </p>
              </div>
            </div>
            <div className="mt-2 h-9">
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-[#007AFF]">
                <Search size={14} className="shrink-0 text-[#A1A1AA]" aria-hidden="true" />
                <input
                  value={industryName}
                  onChange={(event) => setIndustryName(event.target.value)}
                  onKeyDown={handleIndustrySearchKeyDown}
                  disabled={isIndustrySaving}
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[#555555] outline-none placeholder:text-[#A1A1AA] disabled:cursor-wait"
                  placeholder="Search industry or type new name"
                  title="Search industries, select an existing match, or press Enter to create a new industry"
                />
                {isIndustryFieldBusy ? (
                  <FieldSpinner label="Saving industry" />
                ) : (
                  <span className="shrink-0 rounded-[4px] bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-bold text-[#86868B]">
                    {industryFieldHint}
                  </span>
                )}
              </label>
            </div>
            <div className="relative mt-4">
              <div
                ref={industryListRef}
                onScroll={() => handleListScroll(industryListRef, setCanScrollIndustriesDown)}
                className="scrollbar-hidden max-h-[216px] space-y-1 overflow-y-auto pr-1"
              >
                {filteredOrderedIndustries.map((industry) => {
                  const isSelected = industry.id === selectedIndustryId;
                  const domainCount = domainCountByIndustryId.get(industry.id) ?? 0;
                  const isInactiveIndustry = industry.isActive === false;

                  return (
                    <div
                      key={industry.id}
                      draggable={!isInactiveIndustry}
                      onDragEnd={() => setDraggedIndustryId("")}
                      onDragOver={allowDrop}
                      onDragStart={(event) => {
                        if (isInactiveIndustry) {
                          return;
                        }

                        setDraggedIndustryId(industry.id);
                        event.dataTransfer.effectAllowed = "move";
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (!isInactiveIndustry) {
                          moveIndustry(industry.id);
                        }
                      }}
                      title={
                        isInactiveIndustry
                          ? `${industry.name} is inactive and hidden from users.`
                          : `${industry.name}: ${domainCount} mapped ${
                              domainCount === 1 ? "domain" : "domains"
                            }. Select or drag to reorder.`
                      }
                      className={`grid min-h-10 w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border-l-2 px-2 text-left transition ${
                        isSelected && !isInactiveIndustry
                          ? "border-[#007AFF] bg-[#EAF3FF] text-[#171717]"
                          : isInactiveIndustry
                            ? "border-transparent bg-[#FAFAFA] text-[#A1A1AA]"
                            : "cursor-grab border-transparent text-[#555555] hover:bg-[#FAFAFA] active:cursor-grabbing"
                      }`}
                    >
                      <button
                        type="button"
                        onKeyDown={(event) => handleIndustryKeyDown(event, industry.id)}
                        onClick={() => selectIndustry(industry.id)}
                        disabled={isInactiveIndustry}
                        aria-current={isSelected && !isInactiveIndustry ? "true" : undefined}
                        aria-label={
                          isInactiveIndustry
                            ? `${industry.name} is inactive and hidden from users.`
                            : `${industry.name}. ${domainCount} mapped ${
                                domainCount === 1 ? "domain" : "domains"
                              }. Press Enter to select. Press Alt Arrow Up or Alt Arrow Down to reorder.`
                        }
                        className="grid min-w-0 grid-cols-[24px_minmax(0,1fr)_auto_auto] items-center gap-2 text-left"
                      >
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#F0F0F0] text-[#86868B]">
                          <Building2 size={13} aria-hidden="true" />
                        </span>
                        <span className="truncate text-xs font-bold">{industry.name}</span>
                        <GripVertical
                          size={14}
                          className={isInactiveIndustry ? "text-[#D1D5DB]" : "text-[#A1A1AA]"}
                          aria-hidden="true"
                        />
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isInactiveIndustry
                              ? "bg-white text-[#A1A1AA]"
                              : isSelected
                                ? "bg-white text-[#007AFF]"
                                : "bg-[#F5F5F7] text-[#86868B]"
                          }`}
                        >
                          {isInactiveIndustry ? "Hidden" : domainCount}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          isInactiveIndustry
                            ? void activateIndustry(industry)
                            : requestDeleteIndustry(industry.id)
                        }
                        disabled={isDeletingMapping || isIndustrySaving}
                        className={`flex size-7 items-center justify-center rounded-md transition disabled:cursor-not-allowed disabled:text-[#C7C7CC] ${
                          isInactiveIndustry
                            ? "text-[#007AFF] hover:bg-[#EAF3FF]"
                            : "text-[#A1A1AA] hover:bg-[#FFF7F7] hover:text-[#EF4444]"
                        }`}
                        aria-label={
                          isInactiveIndustry
                            ? `Activate ${industry.name} industry`
                            : `Deactivate ${industry.name} industry`
                        }
                        title={
                          isInactiveIndustry
                            ? `Activate ${industry.name} industry`
                            : `Deactivate ${industry.name} industry`
                        }
                      >
                        {isInactiveIndustry ? (
                          <RotateCcw size={14} aria-hidden="true" />
                        ) : (
                          <EyeOff size={14} aria-hidden="true" />
                        )}
                      </button>
                    </div>
                  );
                })}
                {filteredOrderedIndustries.length === 0 ? (
                  <EmptyState
                    className="mt-0"
                    label={
                      industryName.trim()
                        ? "No industries match. Press Enter to create this industry."
                        : "No industries yet. Search and press Enter to create the first industry."
                    }
                  />
                ) : null}
              </div>
              {canScrollIndustriesDown ? (
                <ScrollDownButton
                  label="Scroll industries down"
                  onClick={() => scrollListDown(industryListRef)}
                />
              ) : null}
            </div>
          </section>

          <section
            className={mappingPanelClassName}
            style={mappingColumnStyle}
          >
            <div className="min-h-8 border-b border-black/[0.06]">
              <div className="flex min-h-5 items-center justify-between gap-3">
                <p className="min-w-0 text-[11px] leading-4 font-bold tracking-[0.08em] text-[#86868B] uppercase">
                  Mapped Domains
                </p>
                <p className="shrink-0 truncate text-xs leading-4 font-semibold text-[#A1A1AA]">
                  {selectedIndustryName} · {mappedDomains.length} mapped
                </p>
              </div>
            </div>
            <div className="mt-2 h-9">
              <label className="flex h-9 min-w-0 items-center gap-2 rounded-md border border-black/[0.08] bg-white px-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)] focus-within:border-[#007AFF]">
                <Search size={14} className="shrink-0 text-[#A1A1AA]" aria-hidden="true" />
                <input
                  value={domainName}
                  onChange={(event) => {
                    setDomainIndustryId(selectedIndustryId);
                    setDomainName(event.target.value);
                  }}
                  onKeyDown={handleDomainSearchKeyDown}
                  disabled={!selectedIndustryId || isDomainSaving || isMappingDomain}
                  className="min-w-0 flex-1 bg-transparent text-xs font-bold text-[#555555] outline-none placeholder:text-[#A1A1AA] disabled:cursor-not-allowed disabled:text-[#A1A1AA]"
                  placeholder={selectedIndustryId ? "Search domain or type new name" : "Select an industry first"}
                  title={
                    selectedIndustryId
                      ? `Search mapped domains, map an existing global domain, or press Enter to create under ${selectedIndustryName}`
                      : "Select an industry before adding a domain"
                  }
                />
                {isDomainFieldBusy ? (
                  <FieldSpinner label="Saving domain" />
                ) : (
                  <span className="shrink-0 rounded-[4px] bg-[#F5F5F7] px-1.5 py-0.5 text-[10px] font-bold text-[#86868B]">
                    {domainFieldHint}
                  </span>
                )}
              </label>
            </div>
            {filteredOrderedMappedDomains.length > 0 ? (
              <div className="relative mt-4">
                <div
                  ref={mappedDomainListRef}
                  aria-describedby="mapped-domain-keyboard-help"
                  aria-label={`${selectedIndustryName} mapped domains`}
                  onScroll={() =>
                    handleListScroll(mappedDomainListRef, setCanScrollMappedDomainsDown)
                  }
                  className="scrollbar-hidden max-h-[196px] overflow-y-auto overscroll-contain pr-1"
                  role="list"
                >
                  <div className="grid gap-2 md:grid-cols-2">
                    <p id="mapped-domain-keyboard-help" className="sr-only">
                      Press Alt Arrow Left or Alt Arrow Up to move a domain earlier. Press Alt Arrow
                      Right or Alt Arrow Down to move a domain later.
                    </p>
                    {filteredOrderedMappedDomains.map((domain) => (
                      <MappedDomainCard
                        key={domain.id}
                        domain={domain}
                        industryName={selectedIndustryName}
                        isDeleting={isDeletingDomain}
                        isDragging={draggedDomainKey === domain.id}
                        onDelete={() => void deleteMappedDomain(domain)}
                        onDragEnd={() => setDraggedDomainKey("")}
                        onDragOver={allowDrop}
                        onDragStart={(event) => {
                          setDraggedDomainKey(domain.id);
                          event.dataTransfer.effectAllowed = "move";
                        }}
                        onKeyDown={(event) => handleMappedDomainKeyDown(event, domain.id)}
                        onDrop={(event) => {
                          event.preventDefault();
                          moveMappedDomain(domain.id);
                        }}
                      />
                    ))}
                  </div>
                </div>
                {canScrollMappedDomainsDown ? (
                  <ScrollDownButton
                    label="Scroll mapped domains down"
                    onClick={() => scrollListDown(mappedDomainListRef)}
                  />
                ) : null}
              </div>
            ) : (
              <EmptyState
                label={
                  domainName.trim()
                    ? "No mapped domains match. Press Enter to create or map this domain."
                    : "No domains mapped yet. Search and press Enter to create one, or map from the global library."
                }
              />
            )}
          </section>

          <section
            className={mappingPanelClassName}
            style={mappingColumnStyle}
          >
            <ColumnHeader label="Domain Library" meta={`${uniqueDomains.length} unique libraries`}>
              <span
                className="rounded-full bg-[#F5F5F7] px-2 py-1 text-[10px] font-bold text-[#86868B]"
                title="Duplicate domain names are grouped into one library item"
              >
                Deduped
              </span>
            </ColumnHeader>
            <SearchInput
              value={domainSearch}
              onChange={setDomainSearch}
              placeholder="Search domains..."
              title="Search global domains by name"
              className="mt-4 w-full"
            />
            <div className="relative mt-4">
              <div
                ref={domainLibraryListRef}
                onScroll={() =>
                  handleListScroll(domainLibraryListRef, setCanScrollDomainLibraryDown)
                }
                className="scrollbar-hidden max-h-[172px] space-y-2 overflow-y-auto overscroll-contain pr-1"
              >
                {filteredGlobalDomains.map((domain) => {
                  const domainKey = getDomainIdentity(domain);
                  const isMapped = mappedDomainKeys.has(domainKey);

                  return (
                    <div
                      key={domain.id}
                      title={`${getDomainDisplayTitle(domain.name)} is used in ${
                        industryUsageByDomainKey.get(domainKey) ?? 0
                      } ${(industryUsageByDomainKey.get(domainKey) ?? 0) === 1 ? "industry" : "industries"}`}
                      className="grid min-h-10 grid-cols-[24px_minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-black/[0.06] bg-[#FAFAFA] px-2"
                    >
                      <span className="flex size-6 items-center justify-center rounded-full bg-white text-[#86868B]">
                        <Database size={13} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-[#555555]">
                          {domain.name}
                        </span>
                        <span className="block truncate text-[11px] font-semibold text-[#A1A1AA]">
                          Used in {industryUsageByDomainKey.get(domainKey) ?? 0}{" "}
                          {(industryUsageByDomainKey.get(domainKey) ?? 0) === 1
                            ? "industry"
                            : "industries"}
                        </span>
                      </span>
                      {isMapped ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full bg-[#EAF3FF] px-2 py-1 text-[10px] font-bold text-[#007AFF]"
                          title={`${getDomainDisplayTitle(domain.name)} is already mapped to ${selectedIndustryName}`}
                        >
                          <Check size={11} aria-hidden="true" />
                          Mapped
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => mapDomain(domain.id)}
                          disabled={!selectedIndustryId || isMappingDomain}
                          className="inline-flex h-7 items-center gap-1 rounded-md bg-white px-2 text-[10px] font-bold text-[#007AFF] disabled:cursor-not-allowed disabled:text-[#A1A1AA]"
                          title={
                            selectedIndustryId
                              ? `Map ${getDomainDisplayTitle(domain.name)} to ${selectedIndustryName}`
                              : "Select an industry before mapping a domain"
                          }
                        >
                          <Plus size={11} aria-hidden="true" />
                          Map
                        </button>
                      )}
                    </div>
                  );
                })}
                {filteredGlobalDomains.length === 0 ? (
                  <EmptyState label="No domains match this search." />
                ) : null}
              </div>
              {canScrollDomainLibraryDown ? (
                <ScrollDownButton
                  label="Scroll domain library down"
                  onClick={() => scrollListDown(domainLibraryListRef)}
                />
              ) : null}
            </div>
          </section>
        </div>
      )}
      {industryDeleteImpact ? (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/20 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-industry-title"
        >
          <div className="w-full max-w-[520px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  id="delete-industry-title"
                  className="text-sm font-bold text-[#171717]"
                >
                  Deactivate {industryDeleteImpact.industry.name}
                </p>
                <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
                  This will hide the industry and its mapped data from customer process
                  options. You can activate the industry again from this list.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIndustryDeleteImpact(null)}
                disabled={isDeletingIndustry}
                className="flex size-8 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed"
                aria-label="Close deactivate industry confirmation"
                title="Close confirmation"
              >
                <X size={14} aria-hidden="true" />
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <DeleteImpactMetric label="Mapped domains" value={industryDeleteImpact.domainNames.length} />
              <DeleteImpactMetric label="Default processes" value={industryDeleteImpact.defaultProcessCount} />
              <DeleteImpactMetric label="Domain processes" value={industryDeleteImpact.domainProcessCount} />
            </div>
            {industryDeleteImpact.domainNames.length > 0 ? (
              <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
                <p className="text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
                  Domains that will be hidden
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {industryDeleteImpact.domainNames.slice(0, 8).map((domainName) => (
                    <span
                      key={domainName}
                      className="rounded-md bg-[#EAF3FF] px-2 py-1 text-[11px] font-bold text-[#007AFF]"
                    >
                      {domainName}
                    </span>
                  ))}
                  {industryDeleteImpact.domainNames.length > 8 ? (
                    <span className="rounded-md bg-[#F5F5F7] px-2 py-1 text-[11px] font-bold text-[#86868B]">
                      +{industryDeleteImpact.domainNames.length - 8} more
                    </span>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
              <button
                type="button"
                onClick={() => setIndustryDeleteImpact(null)}
                disabled={isDeletingIndustry}
                className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  void deleteIndustry(industryDeleteImpact.industry.id, true)
                }
                disabled={isDeletingIndustry}
                className="h-9 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
              >
                {isDeletingIndustry ? "Deactivating..." : "Confirm deactivate"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
      <ReorderToastStack toasts={reorderToasts} />
    </Panel>
  );
}

function DeleteImpactMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
      <p className="text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
        {label}
      </p>
      <p className="mt-1 text-xl font-bold text-[#171717]">{value}</p>
    </div>
  );
}

function DeleteProcessConfirmationModal({
  isDeleting,
  onCancel,
  onConfirm,
  process,
}: {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  process: DictionaryProcess;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-process-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#FEF2F2] text-[#EF4444]">
              <Trash2 size={18} aria-hidden="true" />
            </div>
            <p id="delete-process-title" className="mt-4 text-sm font-bold text-[#171717]">
              Delete process
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This removes the process from the admin process library.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close delete process confirmation"
            title="Close confirmation"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
          <p className="truncate text-sm font-bold text-[#171717]">{process.name}</p>
          <p className="mt-1 text-xs font-semibold text-[#86868B]">
            {[process.code, process.tier, process.industryLabel || process.domain]
              .filter(Boolean)
              .join(" - ")}
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : null}
            {isDeleting ? "Deleting..." : "Delete process"}
          </button>
        </div>
      </div>
    </div>
  );
}

function DeleteToolConfirmationModal({
  isDeleting,
  onCancel,
  onConfirm,
  tool,
}: {
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  tool: TechStackTool;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 px-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-tool-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onCancel();
        }
      }}
    >
      <div className="w-full max-w-[460px] rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex size-10 items-center justify-center rounded-md bg-[#FEF2F2] text-[#EF4444]">
              <Trash2 size={18} aria-hidden="true" />
            </div>
            <p id="delete-tool-title" className="mt-4 text-sm font-bold text-[#171717]">
              Delete technology tool
            </p>
            <p className="mt-2 text-xs leading-5 font-semibold text-[#86868B]">
              This removes the tool from available technology stack options in the admin library.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="flex size-8 shrink-0 items-center justify-center rounded-md border border-black/[0.08] text-[#86868B] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Close delete tool confirmation"
            title="Close confirmation"
          >
            <X size={14} aria-hidden="true" />
          </button>
        </div>

        <div className="mt-4 rounded-md border border-black/[0.06] bg-[#FAFAFA] p-3">
          <p className="truncate text-sm font-bold text-[#171717]">{tool.name}</p>
          <p className="mt-1 text-xs font-semibold text-[#86868B]">
            {tool.vendor} - {tool.category} - {getTechStackScopeLabel(tool)}
          </p>
        </div>

        <div className="mt-5 flex justify-end gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            className="h-9 rounded-md border border-black/[0.08] bg-white px-3 text-xs font-bold text-[#555555] transition hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#EF4444] px-3 text-xs font-bold text-white transition hover:bg-[#DC2626] disabled:cursor-wait disabled:opacity-70"
          >
            {isDeleting ? (
              <span className="size-3 animate-spin rounded-full border border-white/40 border-t-white" />
            ) : null}
            {isDeleting ? "Deleting..." : "Delete tool"}
          </button>
        </div>
      </div>
    </div>
  );
}

function FieldSpinner({ label }: { label: string }) {
  return (
    <span
      className="flex size-4 shrink-0 animate-spin rounded-full border-2 border-[#D1D5DB] border-t-[#007AFF]"
      aria-label={label}
      role="status"
      title={label}
    />
  );
}

function MappedDomainCard({
  domain,
  industryName,
  isDeleting,
  isDragging,
  onDelete,
  onDragEnd,
  onDragOver,
  onDragStart,
  onKeyDown,
  onDrop,
}: {
  domain: MappedDictionaryDomain;
  industryName: string;
  isDeleting: boolean;
  isDragging: boolean;
  onDelete: () => void;
  onDragEnd: () => void;
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}) {
  const domainTitle = getDomainDisplayTitle(domain.name);
  const processLabel = domain.processCount === 1 ? "process" : "processes";

  return (
    <article
      draggable
      aria-label={`${domainTitle} mapped to ${industryName}. ${domain.processCount} ${processLabel}. Press Alt Arrow Left or Alt Arrow Up to move earlier. Press Alt Arrow Right or Alt Arrow Down to move later.`}
      title={`${domainTitle}: ${domain.processCount} ${processLabel} mapped to ${industryName}. Drag or use Alt Arrow keys to reorder.`}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDragStart={onDragStart}
      onKeyDown={onKeyDown}
      onDrop={onDrop}
      role="listitem"
      tabIndex={0}
      className={`flex min-h-[58px] cursor-grab items-center justify-between gap-3 rounded-md border border-black/[0.08] bg-[#FAFAFA] px-4 py-2 transition hover:border-[#B8D8FF] hover:bg-[#F8FBFF] active:cursor-grabbing ${
        isDragging ? "opacity-60" : ""
      }`}
    >
      <div className="min-w-0">
        <p className="truncate text-sm leading-5 font-bold text-[#171717]">
          {domainTitle}
        </p>
        <p className="text-xs leading-4 font-semibold text-[#86868B]">
          {domain.processCount} processes
        </p>
      </div>
      <div className="h-full flex shrink-0 items-center gap-1.5 text-[#A1A1AA]">
        <span title={`Drag ${domainTitle} to reorder it within ${industryName}`}>
          <GripVertical size={16} aria-hidden="true" />
        </span>
        <button
          type="button"
          onClick={onDelete}
          disabled={isDeleting}
          title={`Remove ${domainTitle} from ${industryName}`}
          className="flex size-4 items-center justify-center rounded-md text-[#A1A1AA] transition hover:text-[#EF4444] disabled:cursor-not-allowed disabled:text-[#C7C7CC]"
          aria-label={`Remove ${domainTitle} from ${industryName}`}
        >
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>
    </article>
  );
}

function ReorderToastStack({ toasts }: { toasts: ReorderToastState[] }) {
  const visibleToasts = toasts.slice(0, 3);

  if (visibleToasts.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-5 bottom-5 z-50 h-[112px] w-[min(380px,calc(100vw-40px))]"
      aria-label="Industry and domain mapping notifications"
    >
      <style>
        {`
          @keyframes mapping-toast-enter {
            from {
              opacity: 0;
              transform: translate3d(0, 18px, 0) scale(0.96);
            }
            to {
              opacity: 1;
              transform: translate3d(0, 0, 0) scale(1);
            }
          }
        `}
      </style>
      {visibleToasts.map((toast, index) => {
        const isFrontToast = index === 0;
        const isError = toast.tone === "error";
        const isProcessing = toast.tone === "processing";
        const toastDescription = isProcessing
          ? "Changes are being saved."
          : isError
            ? "Please retry this action."
            : "Industry and domain mapping";

        return (
          <div
            key={toast.id}
            aria-hidden={!isFrontToast}
            aria-live={isError ? "assertive" : "polite"}
            className="absolute right-0 bottom-0 min-h-[72px] w-full overflow-hidden rounded-[11px] border border-black/[0.08] bg-white px-5 py-4 shadow-[0_18px_45px_rgba(15,23,42,0.16)]"
            role={isFrontToast ? (isError ? "alert" : "status") : undefined}
            style={{
              animation: isFrontToast ? "mapping-toast-enter 180ms ease-out" : undefined,
              opacity: 1 - index * 0.14,
              transform: `translateY(${index * 15}px) scale(${1 - index * 0.035})`,
              transition: "transform 180ms ease, opacity 180ms ease, box-shadow 180ms ease",
              zIndex: visibleToasts.length - index,
            }}
          >
            {isFrontToast ? (
              <div className="flex items-center gap-3">
                {isProcessing ? (
                  <span
                    className="size-3 shrink-0 animate-spin rounded-full border-2 border-[#D1D5DB] border-t-[#007AFF]"
                    aria-hidden="true"
                  />
                ) : (
                  <span
                    className={`size-2.5 shrink-0 rounded-full ${
                      isError ? "bg-[#EF4444]" : "bg-[#10B981]"
                    }`}
                    aria-hidden="true"
                  />
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm leading-5 font-bold text-[#171717]">
                    {toast.message}
                  </span>
                  <span className="mt-0.5 block truncate text-xs leading-4 font-semibold text-[#86868B]">
                    {toastDescription}
                  </span>
                </span>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function ScrollDownButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute bottom-2 left-1/2 flex size-8 -translate-x-1/2 items-center justify-center rounded-full border border-black/[0.08] bg-white text-[#86868B] shadow-[0_4px_14px_rgba(15,23,42,0.12)] transition hover:border-[#007AFF]/30 hover:text-[#007AFF]"
      aria-label={label}
      title={label}
    >
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  );
}

function updateScrollDownState(
  listRef: React.RefObject<HTMLDivElement | null>,
  setCanScrollDown: (value: boolean) => void,
) {
  window.requestAnimationFrame(() => {
    const listElement = listRef.current;

    if (!listElement) {
      setCanScrollDown(false);
      return;
    }

    const remainingScroll =
      listElement.scrollHeight - listElement.clientHeight - listElement.scrollTop;

    setCanScrollDown(remainingScroll > 2);
  });
}

function ColumnHeader({
  children,
  label,
  meta,
}: {
  children?: ReactNode;
  label: string;
  meta?: string;
}) {
  return (
    <div className="min-h-12 border-b border-black/[0.06]">
      <div className="flex min-h-5 items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] leading-4 font-bold tracking-[0.08em] text-[#86868B] uppercase">
          {label}
        </p>
        {children ? <div className="flex shrink-0 items-center">{children}</div> : null}
      </div>
      {meta ? <p className="mt-1 text-xs leading-4 font-semibold text-[#A1A1AA]">{meta}</p> : null}
    </div>
  );
}

function IndustryDomainRelationTable({
  domains,
  industries,
  isMappingDomain,
  libraries,
  onMapDomain,
}: {
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  isMappingDomain: boolean;
  libraries: DictionaryLibrary[];
  onMapDomain: (industryId: string, domainId: string) => Promise<void>;
}) {
  const [mappingCellKey, setMappingCellKey] = useState("");
  const mappedDomainsByIndustryId = useMemo(() => {
    const mappings = new Map<
      string,
      Map<string, DictionaryDomain & { key: string; processCount: number }>
    >();

    industries.forEach((industry) => {
      mappings.set(
        industry.id,
        new Map(
          getMappedDomainsForIndustry(industry.id, domains, libraries).map((domain) => [
            domain.key,
            domain,
          ]),
        ),
      );
    });

    return mappings;
  }, [domains, industries, libraries]);

  async function mapRelationDomain(industryId: string, domainId: string) {
    const cellKey = getRelationCellKey(industryId, domainId);

    try {
      setMappingCellKey(cellKey);
      await onMapDomain(industryId, domainId);
    } finally {
      setMappingCellKey("");
    }
  }

  if (industries.length === 0 || domains.length === 0) {
    return (
      <EmptyState
        label="Add industries and domains to see the relation table."
      />
    );
  }

  return (
    <div
      className="mt-6 overflow-hidden rounded-md border border-black/[0.08] bg-white"
      style={mappingColumnStyle}
    >
      <div className="max-h-[420px] overflow-auto">
        <table
          aria-label="Industry and domain relationship table"
          title="Industry and domain relationship table"
          className="min-w-[920px] w-full border-collapse text-left"
        >
          <thead className="sticky top-0 z-10 bg-[#FAFAFA]">
            <tr>
              <th className="sticky left-0 z-30 w-[220px] min-w-[220px] border border-black/[0.1] bg-[#FAFAFA] px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
                Industry
              </th>
              {domains.map((domain) => (
                <th
                  key={domain.id}
                  title={`Domain column: ${getDomainDisplayTitle(domain.name)}`}
                  className="min-w-[190px] border border-black/[0.1] bg-[#FAFAFA] px-4 py-3 text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase"
                >
                  {getDomainDisplayTitle(domain.name)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {industries.map((industry) => {
              const mappedDomains = mappedDomainsByIndustryId.get(industry.id) ?? new Map();

              return (
                <tr key={industry.id}>
                  <th
                    className="sticky left-0 z-20 w-[220px] min-w-[220px] border border-black/[0.1] bg-white px-4 py-3 align-top"
                    title={`${industry.name}: ${mappedDomains.size} mapped ${mappedDomains.size === 1 ? "domain" : "domains"}`}
                  >
                    <p className="text-sm leading-5 font-bold text-[#171717]">{industry.name}</p>
                    <p className="text-xs leading-4 font-semibold text-[#86868B]">
                      {mappedDomains.size} domains
                    </p>
                  </th>
                  {domains.map((domain) => {
                    const mappedDomain = mappedDomains.get(getDomainIdentity(domain));
                    const isMappingCell =
                      mappingCellKey === getRelationCellKey(industry.id, domain.id);

                    return (
                      <td
                        key={`${industry.id}-${domain.id}`}
                        title={
                          mappedDomain
                            ? `${getDomainDisplayTitle(mappedDomain.name)} is mapped to ${industry.name}`
                            : `Map ${getDomainDisplayTitle(domain.name)} to ${industry.name}`
                        }
                        className={`h-[74px] min-w-[190px] border border-black/[0.1] px-4 py-3 align-top transition ${
                          isMappingCell ? "bg-[#EAF3FF]" : "bg-white"
                        }`}
                      >
                        {mappedDomain ? (
                          <div>
                            <span
                              className="inline-flex max-w-full items-center rounded-full bg-[#EAF3FF] px-2.5 py-1 text-[11px] font-bold text-[#007AFF]"
                              title={`${getDomainDisplayTitle(mappedDomain.name)} is mapped to ${industry.name}`}
                            >
                              <span className="truncate">
                                {getDomainDisplayTitle(mappedDomain.name)}
                              </span>
                            </span>
                            <p className="mt-1 text-xs font-semibold text-[#86868B]">
                              {mappedDomain.processCount} processes
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void mapRelationDomain(industry.id, domain.id)}
                            disabled={isMappingDomain}
                            className="flex size-8 items-center justify-center rounded-md text-lg leading-none font-bold text-[#86868B] transition hover:bg-[#F0F8FF] disabled:cursor-not-allowed disabled:text-[#C7C7CC]"
                            aria-label={`Map ${getDomainDisplayTitle(domain.name)} to ${industry.name}`}
                            title={`Map ${getDomainDisplayTitle(domain.name)} to ${industry.name}`}
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function IndustryDomainSkeleton() {
  return (
    <div className={mappingGridClassName}>
      {[0, 1, 2].map((section) => (
        <div key={section} className={mappingPanelClassName}>
          <div className="min-h-8 border-b border-black/[0.06]">
            <div className="flex min-h-5 items-center justify-between gap-3">
              <div className="h-3 w-28 animate-pulse rounded bg-[#F0F0F0]" />
              <div className="h-3 w-20 animate-pulse rounded bg-[#F5F5F7]" />
            </div>
          </div>
          <div className="mt-2 h-9">
            <div className="h-9 animate-pulse rounded-md border border-black/[0.06] bg-[#F8F8FA]" />
          </div>
          <div className="mt-4 space-y-2">
            {[0, 1, 2, 3, 4].map((item) => (
              <div key={item} className="h-10 animate-pulse rounded-md bg-[#F5F5F7]" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ className = "mt-4", label }: { className?: string; label: string }) {
  return (
    <div
      className={`flex min-h-[120px] items-center justify-center rounded-md border border-dashed border-black/[0.08] bg-[#FAFAFA] px-4 text-center text-xs font-semibold text-[#86868B] ${className}`}
    >
      {label}
    </div>
  );
}

function ProcessLibraryCard({
  categoryOptions,
  tierOptions,
  currencyRateInput,
  domains,
  dictionaryError,
  editingProcess,
  expandedProcessId,
  filteredProcesses,
  industries,
  isCatalogLoading,
  isCurrencyRateSaving,
  isProcessSaving,
  isProcessFormOpen,
  processDomainFilter,
  processForm,
  processActionId,
  processIndustryFilter,
  processPage,
  processSearch,
  processes,
  savedUsdToAedRate,
  setExpandedProcessId,
  setCurrencyRateInput,
  setIsProcessFormOpen,
  setProcessDomainFilter,
  setProcessForm,
  setProcessIndustryFilter,
  setProcessPage,
  setProcessSearch,
  onAddProcess,
  onDeleteProcess,
  onEditProcess,
  onOpenNewProcessForm,
  onSaveCurrencyRate,
  onToggleProcessStatus,
}: {
  categoryOptions: readonly ProcessOption[];
  tierOptions: readonly ProcessOption[];
  currencyRateInput: string;
  domains: DictionaryDomain[];
  dictionaryError: string;
  editingProcess: DictionaryProcess | null;
  expandedProcessId: string;
  filteredProcesses: DictionaryProcess[];
  industries: DictionaryIndustry[];
  isCatalogLoading: boolean;
  isCurrencyRateSaving: boolean;
  isProcessSaving: boolean;
  isProcessFormOpen: boolean;
  processDomainFilter: string;
  processForm: ProcessFormState;
  processActionId: string;
  processIndustryFilter: string;
  processPage: number;
  processSearch: string;
  processes: DictionaryProcess[];
  savedUsdToAedRate: number;
  setExpandedProcessId: (value: string) => void;
  setCurrencyRateInput: (value: string) => void;
  setIsProcessFormOpen: (value: boolean) => void;
  setProcessDomainFilter: (value: string) => void;
  setProcessForm: (
    value: ProcessFormState | ((current: ProcessFormState) => ProcessFormState),
  ) => void;
  setProcessIndustryFilter: (value: string) => void;
  setProcessPage: (value: number) => void;
  setProcessSearch: (value: string) => void;
  onAddProcess: (event: FormEvent<HTMLFormElement>) => void;
  onDeleteProcess: (process: DictionaryProcess) => void;
  onEditProcess: (process: DictionaryProcess) => void;
  onOpenNewProcessForm: () => void;
  onSaveCurrencyRate: () => void;
  onToggleProcessStatus: (process: DictionaryProcess) => void;
}) {
  const totalProcessPages = Math.ceil(filteredProcesses.length / libraryPageSize);
  const safeProcessPage = Math.min(Math.max(processPage, 1), Math.max(totalProcessPages, 1));
  const processStartIndex = (safeProcessPage - 1) * libraryPageSize;
  const visibleProcesses = filteredProcesses.slice(
    processStartIndex,
    processStartIndex + libraryPageSize,
  );
  const domainFilterOptions = useMemo(() => getUniqueDomains(domains), [domains]);
  const hasProcessFilters =
    processSearch.trim() ||
    processIndustryFilter !== "all" ||
    processDomainFilter !== "all";

  return (
    <Panel
      className="mt-5"
      title={`Process Library (${processes.length})`}
      actionLabel="Add Process"
      onAction={onOpenNewProcessForm}
    >
      <div className="mt-7 flex flex-wrap gap-2">
        <SearchInput
          value={processSearch}
          onChange={setProcessSearch}
          placeholder="Search processes..."
          className="w-full sm:w-[280px]"
        />
        <label
          className="relative flex h-10 w-full min-w-[210px] items-center sm:w-[224px]"
          title="Filter processes by industry"
        >
          <Building2
            size={14}
            className="pointer-events-none absolute left-3 text-[#A1A1AA]"
            aria-hidden="true"
          />
          <select
            value={processIndustryFilter}
            onChange={(event) => {
              const nextIndustryFilter = event.target.value;
              setProcessIndustryFilter(nextIndustryFilter);
              if (nextIndustryFilter !== "all") {
                setProcessDomainFilter(industryDefaultDomainFilter);
              }
            }}
            aria-label="Filter processes by industry"
            className="h-10 w-full appearance-none rounded-lg border border-[#D9E3F0] bg-white pr-9 pl-9 text-sm font-semibold text-[#333333] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#B8D8FF] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10"
          >
            <option value="all">All industries</option>
            {industries.map((industry) => (
              <option key={industry.id} value={industry.id}>
                {industry.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 text-[#86868B]"
            aria-hidden="true"
          />
        </label>
        <label
          className="relative flex h-10 w-full min-w-[210px] items-center sm:w-[224px]"
          title="Filter processes by domain"
        >
          <Database
            size={14}
            className="pointer-events-none absolute left-3 text-[#A1A1AA]"
            aria-hidden="true"
          />
          <select
            value={processDomainFilter}
            onChange={(event) => setProcessDomainFilter(event.target.value)}
            aria-label="Filter processes by domain"
            className="h-10 w-full appearance-none rounded-lg border border-[#D9E3F0] bg-white pr-9 pl-9 text-sm font-semibold text-[#333333] shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition hover:border-[#B8D8FF] focus:border-[#007AFF] focus:ring-2 focus:ring-[#007AFF]/10"
          >
            <option value="all">All domains</option>
            <option value={industryDefaultDomainFilter}>Industry default</option>
            {domainFilterOptions.map((domain) => (
              <option key={getDomainIdentity(domain)} value={domain.id}>
                {getDomainDisplayTitle(domain.name)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="pointer-events-none absolute right-3 text-[#86868B]"
            aria-hidden="true"
          />
        </label>
        <button
          type="button"
          onClick={() => {
            setProcessSearch("");
            setProcessIndustryFilter("all");
            setProcessDomainFilter("all");
            setProcessPage(1);
          }}
          disabled={!hasProcessFilters}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#D9E3F0] bg-white px-3 text-xs font-bold text-[#555555] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#B8D8FF] hover:text-[#007AFF] disabled:cursor-not-allowed disabled:border-black/[0.06] disabled:bg-[#F5F5F7] disabled:text-[#A1A1AA]"
          aria-label="Reset process filters"
          title="Reset process filters"
        >
          <RotateCcw size={13} aria-hidden="true" />
          Reset filters
        </button>
      </div>
      {isProcessFormOpen ? (
        <NewProcessModal
          domains={domains}
          industries={industries}
          isCurrencyRateSaving={isCurrencyRateSaving}
          isEditing={Boolean(editingProcess)}
          isProcessSaving={isProcessSaving}
          categoryOptions={categoryOptions}
          tierOptions={tierOptions}
          currencyRateInput={currencyRateInput}
          processForm={processForm}
          savedUsdToAedRate={savedUsdToAedRate}
          setCurrencyRateInput={setCurrencyRateInput}
          setIsProcessFormOpen={setIsProcessFormOpen}
          setProcessForm={setProcessForm}
          submitLabel={editingProcess ? "Save Changes" : "Add Process"}
          onAddProcess={onAddProcess}
          onSaveCurrencyRate={onSaveCurrencyRate}
        />
      ) : null}
      <div className="mt-4 min-h-[170px] overflow-x-auto rounded-md border border-black/[0.06] bg-white">
        <div className="min-w-[1040px]">
          {isCatalogLoading ? <ProcessRowsSkeleton /> : null}
          {!isCatalogLoading && filteredProcesses.length === 0 ? (
            <ProcessListState label={dictionaryError || "No mapped processes found."} />
          ) : null}
          {!isCatalogLoading
            ? visibleProcesses.map((process) => (
                <ProcessRow
                  key={process.id}
                  expanded={expandedProcessId === process.id}
                  industries={industries}
                  isBusy={processActionId === process.id}
                  process={process}
                  onDelete={() => onDeleteProcess(process)}
                  onEdit={() => onEditProcess(process)}
                  onToggle={() =>
                    setExpandedProcessId(expandedProcessId === process.id ? "" : process.id)
                  }
                  onToggleStatus={() => onToggleProcessStatus(process)}
                />
              ))
            : null}
        </div>
      </div>
      <PaginationSummary
        currentPage={safeProcessPage}
        label={
          filteredProcesses.length
            ? `Showing ${processStartIndex + 1}-${Math.min(
                processStartIndex + libraryPageSize,
                filteredProcesses.length,
              )} of ${filteredProcesses.length}`
            : "Showing 0 of 0"
        }
        onPageChange={setProcessPage}
        pages={getPaginationPages(totalProcessPages, safeProcessPage)}
      />
    </Panel>
  );
}

function ProcessRow({
  expanded,
  industries,
  isBusy,
  process,
  onDelete,
  onEdit,
  onToggle,
  onToggleStatus,
}: {
  expanded: boolean;
  industries: DictionaryIndustry[];
  isBusy: boolean;
  process: DictionaryProcess;
  onDelete: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onToggleStatus: () => void;
}) {
  const industryLabel =
    process.industryIds.length === industries.length
      ? "All industries"
      : process.industryLabel || `${process.industryIds.length} industries`;
  const isActive = process.isActive !== false;

  return (
    <article
      className={`border-b border-black/[0.05] bg-white last:border-b-0 ${
        isActive ? "" : "opacity-75"
      }`}
    >
      <div className="flex min-h-[46px] w-full items-center gap-3 border-b border-black/[0.05] bg-white px-4 transition hover:bg-[#FAFAFA]">
        <button
          type="button"
          onClick={onToggle}
          className="grid min-w-0 flex-1 grid-cols-[32px_78px_minmax(240px,1fr)] items-center gap-2 text-left outline-none focus-visible:ring-0"
        >
          <span className="flex items-center justify-center">
            <ChevronRight
              size={14}
              className={`text-[#B8C0CC] transition ${expanded ? "rotate-90" : ""}`}
              aria-hidden="true"
            />
          </span>
          <span className="text-[11px] font-bold tracking-[0.02em] text-[#AAAAAA]">
            {process.code}
          </span>
          <span className="truncate text-[13px] font-bold text-[#333333]">
            {process.name}
          </span>
        </button>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-10">
          <div className="flex shrink-0 items-center justify-end gap-4">
            <span className="text-right text-[11px] font-semibold text-[#86868B]">
              {getDomainCode(process.domain)}
            </span>
            <TierPill compact tier={process.tier} />
            <span className="max-w-[120px] truncate text-right text-[11px] font-semibold text-[#AAAAAA]">
              {industryLabel}
            </span>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              disabled={isBusy}
              className="inline-flex size-7 items-center justify-center rounded-md border border-black/[0.08] bg-white text-[#007AFF] transition hover:border-[#007AFF] hover:bg-[#F4FAFF] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Edit process"
              title="Edit process"
            >
              <svg className="pointer-events-none size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M15.8226 9.83829C16.0429 9.61805 16.1667 9.31932 16.1668 9.00781C16.1668 8.69631 16.0431 8.39754 15.8228 8.17725C15.6026 7.95695 15.3039 7.83317 14.9924 7.83313C14.6809 7.83309 14.3821 7.9568 14.1618 8.17704L8.60097 13.7391C8.50423 13.8356 8.43268 13.9543 8.39264 14.085L7.84222 15.8983C7.83145 15.9343 7.83064 15.9726 7.83987 16.0091C7.84909 16.0455 7.86802 16.0788 7.89463 16.1054C7.92125 16.1319 7.95456 16.1508 7.99103 16.16C8.02751 16.1692 8.06579 16.1683 8.1018 16.1575L9.91555 15.6075C10.046 15.5678 10.1648 15.4967 10.2614 15.4004L15.8226 9.83829Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
              disabled={isBusy}
              className="inline-flex size-7 items-center justify-center rounded-md border border-[#FECACA] bg-white text-[#EF4444] transition hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
              aria-label="Delete process"
              title="Delete process"
            >
              <Trash2 size={12} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleStatus();
              }}
              disabled={isBusy}
              className={`w-[72px] rounded-full py-1 text-right text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
                isActive
                  ? "text-[#10B981]"
                  : "text-[#86868B] hover:text-[#555555]"
              }`}
              title={isActive ? "Deactivate process" : "Activate process"}
              aria-label={isActive ? "Deactivate process" : "Activate process"}
            >
              {isBusy ? "Saving" : isActive ? "Active" : "Inactive"}
            </button>
          </div>
        </div>
      </div>
      {expanded ? (
        <div className="min-h-[124px] bg-[#FAFAFA] ps-14 pe-8 pt-2 pb-5">
          <p className="max-w-[620px] text-[11px] leading-5 font-semibold text-[#86868B]">
            {process.description || "Process details are available for this mapped COS process."}
          </p>
          <div className="mt-4 grid gap-6 text-xs font-semibold text-[#86868B] md:grid-cols-[210px_190px_190px_140px]">
            <Metric label="Domain" value={process.domain} />
            <Metric label="Default Cost / Yr" value={process.cost} />
            <Metric label="Default Hours / Yr" value={process.hours} />
            <Metric label="Source" value={process.source} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ProcessRowsSkeleton() {
  return (
    <div className="animate-pulse bg-white" aria-label="Loading mapped COS processes">
      <div className="flex min-h-[46px] w-full items-center gap-3 px-4">
        <div className="grid min-w-0 flex-1 grid-cols-[32px_78px_minmax(240px,1fr)] items-center gap-2">
          <div className="mx-auto size-3 rounded-full bg-[#EEF0F3]" />
          <div className="h-3 w-10 rounded bg-[#EEF0F3]" />
          <div className="h-4 w-40 rounded bg-[#EEF0F3]" />
        </div>
        <div className="ml-auto flex shrink-0 items-center justify-end gap-10">
          <div className="flex shrink-0 items-center justify-end gap-2">
            <div className="h-3 w-5 rounded bg-[#EEF0F3]" />
            <div className="h-6 w-28 rounded-full bg-[#E8F6EF]" />
            <div className="h-3 w-16 rounded bg-[#EEF0F3]" />
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2.5">
            <div className="size-7 rounded-md bg-[#EEF0F3]" />
            <div className="size-7 rounded-md bg-[#EEF0F3]" />
            <div className="h-4 w-12 rounded bg-[#EEF0F3]" />
          </div>
        </div>
      </div>
      <div className="min-h-[124px] bg-[#FAFAFA] ps-14 pe-8 pt-4 pb-5">
        <div className="h-3 w-56 rounded bg-[#EEF0F3]" />
        <div className="mt-7 grid gap-6 md:grid-cols-[210px_190px_190px_140px]">
          {[0, 1, 2, 3].map((item) => (
            <div key={item}>
              <div className="h-3 w-24 rounded bg-[#EEF0F3]" />
              <div className="mt-3 h-4 w-28 rounded bg-[#EEF0F3]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProcessListState({ label }: { label: string }) {
  return (
    <div className="flex min-h-[170px] items-center justify-center bg-white px-4 py-8 text-center text-sm font-semibold text-[#86868B]">
      {label}
    </div>
  );
}

function TechnologyStackCard({
  domains,
  filteredTools,
  industries,
  isCatalogLoading,
  isToolDeleting,
  isToolFormOpen,
  isToolSaving,
  setToolForm,
  setToolPage,
  setToolScopeFilter,
  setToolSearch,
  toolForm,
  toolActionId,
  toolPage,
  toolScopeFilter,
  toolSearch,
  tools,
  editingTool,
  onAddTool,
  onCloseToolForm,
  onDeleteTool,
  onEditTool,
  onOpenNewToolForm,
}: {
  domains: DictionaryDomain[];
  filteredTools: TechStackTool[];
  industries: DictionaryIndustry[];
  isCatalogLoading: boolean;
  isToolDeleting: boolean;
  isToolFormOpen: boolean;
  isToolSaving: boolean;
  setToolForm: (value: ToolFormState | ((current: ToolFormState) => ToolFormState)) => void;
  setToolPage: (value: number) => void;
  setToolScopeFilter: (value: string) => void;
  setToolSearch: (value: string) => void;
  toolForm: ToolFormState;
  toolActionId: string;
  toolPage: number;
  toolScopeFilter: string;
  toolSearch: string;
  tools: TechStackTool[];
  editingTool: TechStackTool | null;
  onAddTool: (event: FormEvent<HTMLFormElement>) => void;
  onCloseToolForm: () => void;
  onDeleteTool: (tool: TechStackTool) => void;
  onEditTool: (tool: TechStackTool) => void;
  onOpenNewToolForm: () => void;
}) {
  const totalToolPages = Math.ceil(filteredTools.length / libraryPageSize);
  const safeToolPage = Math.min(Math.max(toolPage, 1), Math.max(totalToolPages, 1));
  const toolStartIndex = (safeToolPage - 1) * libraryPageSize;
  const visibleTools = filteredTools.slice(toolStartIndex, toolStartIndex + libraryPageSize);
  const selectedToolIndustryId = toolForm.industryId || industries[0]?.id || "";
  const toolDomains = domains.filter((domain) =>
    selectedToolIndustryId ? domain.industryIds.includes(selectedToolIndustryId) : true,
  );
  const isEditingTool = Boolean(editingTool);
  const canAddTool = Boolean(
    toolForm.name.trim() &&
      toolForm.vendor.trim() &&
      toolForm.category.trim() &&
      (isEditingTool ||
        toolForm.scope === "common" ||
        (toolForm.scope === "industry" && selectedToolIndustryId) ||
        (toolForm.scope === "domain" && selectedToolIndustryId && toolForm.domainId)),
  );

  return (
    <Panel
      className="mt-5 min-h-[313px]"
      title={`Technology Stack Library (${tools.length} of 50)`}
      actionLabel="Add Tool"
      onAction={onOpenNewToolForm}
    >
      {isCatalogLoading ? (
        <TechnologyStackSkeleton />
      ) : (
        <>
          <div className="mt-7 flex flex-wrap gap-2">
            <SearchInput
              value={toolSearch}
              onChange={setToolSearch}
              placeholder="Search tools or vendors..."
              className="w-full sm:w-[280px]"
            />
            <select
              value={toolScopeFilter}
              onChange={(event) => setToolScopeFilter(event.target.value)}
              className="h-9 w-[180px] rounded-md border border-black/[0.08] bg-white px-3 text-xs font-semibold text-[#555555] outline-none focus:border-[#007AFF]"
            >
              <option value="all">All tools</option>
              <option value="common">Global tools</option>
              <option value="industry">Industry default</option>
              <option value="domain">Industry + domain</option>
            </select>
          </div>
          {isToolFormOpen ? (
            <TechStackToolModal
              canAddTool={canAddTool}
              domains={toolDomains}
              industries={industries}
              isToolSaving={isToolSaving}
              editingTool={editingTool}
              selectedIndustryId={selectedToolIndustryId}
              onClose={onCloseToolForm}
              setToolForm={setToolForm}
              toolForm={toolForm}
              onAddTool={onAddTool}
            />
          ) : null}
          <div className="mt-5 grid min-h-[82px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {visibleTools.map((tool) => (
              <article
                key={tool.id}
                className="relative min-h-[82px] rounded-md border border-black/[0.08] bg-white px-4 py-3 pr-20"
              >
                <p className="text-sm font-bold">{tool.name}</p>
                <p className="mt-1 text-xs font-semibold text-[#86868B]">
                  {tool.vendor} - {tool.category} - {getTechStackScopeLabel(tool)}
                </p>
                <button
                  type="button"
                  aria-label={`Edit ${tool.name}`}
                  title={`Edit ${tool.name}`}
                  disabled={isToolDeleting || isToolSaving}
                  onClick={() => onEditTool(tool)}
                  className="absolute top-3 right-11 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#007AFF] focus-visible:bg-[#F5F5F7] focus-visible:text-[#007AFF] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {toolActionId === tool.id && isToolSaving ? (
                    <span className="size-3 animate-spin rounded-full border border-[#86868B]/30 border-t-[#007AFF]" />
                  ) : (
                    <Pencil size={14} aria-hidden="true" />
                  )}
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${tool.name}`}
                  title={`Delete ${tool.name}`}
                  disabled={isToolDeleting || isToolSaving}
                  onClick={() => onDeleteTool(tool)}
                  className="absolute top-3 right-3 inline-flex size-7 cursor-pointer items-center justify-center rounded-md text-[#86868B] transition hover:bg-[#F5F5F7] hover:text-[#EF4444] focus-visible:bg-[#F5F5F7] focus-visible:text-[#EF4444] focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {toolActionId === tool.id ? (
                    <span className="size-3 animate-spin rounded-full border border-[#86868B]/30 border-t-[#EF4444]" />
                  ) : (
                    <Trash2 size={14} aria-hidden="true" />
                  )}
                </button>
              </article>
            ))}
          </div>
          <PaginationSummary
            currentPage={safeToolPage}
            label={
              filteredTools.length
                ? `Showing ${toolStartIndex + 1}-${Math.min(
                    toolStartIndex + libraryPageSize,
                    filteredTools.length,
                  )} of ${filteredTools.length}`
                : "Showing 0 of 0"
            }
            onPageChange={setToolPage}
            pages={getPaginationPages(totalToolPages, safeToolPage)}
          />
        </>
      )}
    </Panel>
  );
}

function TechnologyStackSkeleton() {
  return (
    <div className="animate-pulse" aria-label="Loading technology stack library">
      <div className="mt-7 flex flex-wrap gap-2">
        <div className="h-9 w-full rounded-md border border-black/[0.06] bg-[#F8F8FA] sm:w-[280px]" />
        <div className="h-9 w-[180px] rounded-md border border-black/[0.06] bg-[#F8F8FA]" />
      </div>
      <div className="mt-5 grid min-h-[82px] gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div
            key={item}
            className="min-h-[82px] rounded-md border border-black/[0.06] bg-white px-4 py-3"
          >
            <div className="h-4 w-32 rounded bg-[#EEF0F3]" />
            <div className="mt-3 h-3 w-52 max-w-full rounded bg-[#EEF0F3]" />
          </div>
        ))}
      </div>
      <div className="mt-5 h-4 w-28 rounded bg-[#EEF0F3]" />
    </div>
  );
}

function TechStackToolModal({
  canAddTool,
  domains,
  industries,
  isToolSaving,
  editingTool,
  selectedIndustryId,
  onClose,
  setToolForm,
  toolForm,
  onAddTool,
}: {
  canAddTool: boolean;
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  isToolSaving: boolean;
  editingTool: TechStackTool | null;
  selectedIndustryId: string;
  onClose: () => void;
  setToolForm: (value: ToolFormState | ((current: ToolFormState) => ToolFormState)) => void;
  toolForm: ToolFormState;
  onAddTool: (event: FormEvent<HTMLFormElement>) => void;
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  function closeToolForm() {
    if (!isToolSaving) {
      onClose();
    }
  }
  const isEditingTool = Boolean(editingTool);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 px-4 py-6 backdrop-blur-[1px]"
      role="presentation"
      onClick={closeToolForm}
    >
      <form
        onSubmit={onAddTool}
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-tech-stack-title"
        className="w-full max-w-[760px] rounded-md border border-[#B3D7FF] bg-[#F0F9FF] px-4 py-4 shadow-[0_24px_70px_rgba(15,23,42,0.22)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <p id="new-tech-stack-title" className="text-sm font-bold text-[#171717]">
            {isEditingTool ? "Edit Tool" : "Add Tool"}
          </p>
          <button
            type="button"
            onClick={closeToolForm}
            className="text-[#A1A1AA] transition hover:text-[#555555]"
            aria-label="Close tool form"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <Field label="Tool Name" required>
            <input
              value={toolForm.name}
              onChange={(event) =>
                setToolForm((current) => ({ ...current, name: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. Salesforce Service Cloud"
            />
          </Field>
          <Field label="Vendor" required>
            <input
              value={toolForm.vendor}
              onChange={(event) =>
                setToolForm((current) => ({ ...current, vendor: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. Salesforce"
            />
          </Field>
          <Field label="Category" required>
            <input
              value={toolForm.category}
              onChange={(event) =>
                setToolForm((current) => ({ ...current, category: event.target.value }))
              }
              className={fieldInputClass}
              placeholder="e.g. CRM / Support"
            />
          </Field>
          <Field label="Scope" required>
            <select
              value={toolForm.scope}
              disabled={isEditingTool}
              onChange={(event) =>
                setToolForm((current) => ({
                  ...current,
                  domainId: "",
                  scope: event.target.value as ToolFormState["scope"],
                }))
              }
              className={fieldInputClass}
            >
              <option value="common">Global tool</option>
              <option value="industry">Industry default</option>
              <option value="domain">Industry + domain</option>
            </select>
          </Field>
          {toolForm.scope !== "common" ? (
            <Field label="Industry" required>
              <select
                value={selectedIndustryId}
                disabled={isEditingTool}
                onChange={(event) =>
                  setToolForm((current) => ({
                    ...current,
                    domainId: "",
                    industryId: event.target.value,
                  }))
                }
                className={fieldInputClass}
              >
                <option value="">Select industry</option>
                {industries.map((industry) => (
                  <option key={industry.id} value={industry.id}>
                    {industry.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          {toolForm.scope === "domain" ? (
            <Field label="Domain" required>
              <select
                value={toolForm.domainId}
                disabled={isEditingTool}
                onChange={(event) =>
                  setToolForm((current) => ({ ...current, domainId: event.target.value }))
                }
                className={fieldInputClass}
              >
                <option value="">Select domain</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {getDomainDisplayTitle(domain.name)}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={closeToolForm}
            disabled={isToolSaving}
            className="h-8 rounded-md border border-black/[0.08] bg-white px-4 text-xs font-semibold text-[#86868B] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canAddTool || isToolSaving}
            className={`inline-flex h-8 items-center gap-2 rounded-md px-4 text-xs font-bold transition ${
              canAddTool && !isToolSaving
                ? "bg-[#007AFF] text-white hover:bg-[#0063CC]"
                : "cursor-not-allowed bg-[#E5E5E7] text-[#86868B]"
            }`}
          >
            {isEditingTool ? <Check size={13} aria-hidden="true" /> : <Plus size={13} aria-hidden="true" />}
            {isToolSaving ? "Saving..." : isEditingTool ? "Save Changes" : "Add Tool"}
          </button>
        </div>
      </form>
    </div>
  );
}

function getTechStackScopeLabel(tool: TechStackTool) {
  if (tool.scope === "common") {
    return "Global tool";
  }

  if (tool.scope === "industry-domain") {
    return `${tool.industryName || "Industry"} / ${tool.domainName || "Domain"}`;
  }

  return tool.industryName || "Industry default";
}

function Field({
  children,
  label,
  required = false,
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
        {label}
        {required ? <span className="ml-1 text-[#EF4444]">*</span> : null}
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
  title,
  value,
}: {
  className?: string;
  onChange: (value: string) => void;
  placeholder: string;
  title?: string;
  value: string;
}) {
  const inputTitle = title || placeholder.replace("...", "");

  return (
    <label
      className={`flex h-9 items-center gap-2 rounded-md border border-black/[0.08] px-3 ${className}`}
      title={inputTitle}
    >
      <Search size={14} className="text-[#A1A1AA]" aria-hidden="true" />
      <input
        aria-label={placeholder.replace("...", "")}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 text-xs font-semibold outline-none placeholder:text-[#A1A1AA]"
        placeholder={placeholder}
        title={inputTitle}
        type="search"
      />
    </label>
  );
}

function PaginationSummary({
  currentPage,
  label,
  onPageChange,
  pages,
}: {
  currentPage: number;
  label: string;
  onPageChange: (page: number) => void;
  pages: readonly number[];
}) {
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = pages.length > 0 && currentPage < pages[pages.length - 1];

  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4 text-xs font-semibold text-[#86868B]">
      <span>{label}</span>
      {pages.length ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={!hasPreviousPage}
            className="flex size-7 items-center justify-center rounded-md border border-black/[0.05] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
            aria-label="Previous page"
          >
            &lt;
          </button>
          {pages.map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              aria-current={page === currentPage ? "page" : undefined}
              className={`flex size-7 items-center justify-center rounded-md border text-xs font-bold ${page === currentPage ? "border-[#007AFF] bg-[#007AFF] text-white" : "border-black/[0.08] bg-white text-[#555555]"}`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={!hasNextPage}
            className="flex size-7 items-center justify-center rounded-md border border-black/[0.08] text-[#555555] disabled:cursor-not-allowed disabled:text-[#C1C7D0]"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      ) : null}
    </div>
  );
}

function TierPill({ compact = false, tier }: { compact?: boolean; tier: ProcessTier }) {
  const styles = tierStyles[tier] ?? fallbackTierStyle;

  return (
    <span
      className={`inline-flex w-fit items-center justify-center gap-1.5 rounded-full font-bold ${
        compact ? "h-[25px] px-3 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${styles.bg} ${styles.text}`}
    >
      <span className={`size-1.5 rounded-full ${styles.dot}`} />
      {tier}
    </span>
  );
}

function Panel({
  actionLabel,
  actionSlot,
  children,
  className = "",
  onAction,
  title,
}: {
  actionLabel?: string;
  actionSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  onAction?: () => void;
  title?: string;
}) {
  return (
    <section
      className={`min-w-0 rounded-md border border-black/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.05)] ${className}`}
    >
      {title || actionLabel || actionSlot ? (
        <div className="flex items-center justify-between gap-4">
          {title ? (
            <p className="text-[11px] font-bold tracking-[0.08em] text-[#86868B] uppercase">
              {title}
            </p>
          ) : (
            <span />
          )}
          {actionSlot ?? (actionLabel ? (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#007AFF]"
            >
              <Plus size={12} aria-hidden="true" />
              {actionLabel}
            </button>
          ) : null)}
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

function formatProcessAmountInput(value: number) {
  if (!Number.isFinite(value)) {
    return "";
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

function formatConversionRateInput(value: number) {
  if (!Number.isFinite(value) || value <= 0) {
    return String(usdToAedRate);
  }

  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

function getPaginationPages(totalPages: number, currentPage: number) {
  if (totalPages <= 1) {
    return [];
  }

  const pageCount = Math.min(totalPages, 5);
  const startPage = Math.max(
    1,
    Math.min(currentPage - 2, totalPages - pageCount + 1),
  );

  return Array.from({ length: pageCount }, (_, index) => startPage + index);
}

function getUsdToAedRate(value: string) {
  const rate = parseAmount(value);
  return rate > 0 ? rate : usdToAedRate;
}

function getDomainCode(domain: string) {
  if (domain === "CX") return "CX";
  if (domain === "Customer Experience") return "CX";
  if (domain === "HR") return "HR";
  if (domain === "Human Resources") return "HR";
  if (domain === "IT Operations") return "IT";
  if (domain === "IT Ops") return "IT";

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

function getDomainIdentity(domain: DictionaryDomain) {
  return domain.slug || toSlug(domain.name);
}

function getRelationCellKey(industryId: string, domainId: string) {
  return `${industryId}:${domainId}`;
}

function getDomainDisplayTitle(name: string) {
  const normalizedName = toSlug(name);
  const expandedNames: Record<string, string> = {
    cx: "Customer Experience (CX)",
    hr: "Human Resources (HR)",
    "it-ops": "IT Operations (IT Ops)",
    mktg: "Marketing (Mktg)",
  };

  return expandedNames[normalizedName] || name;
}

function orderItemsByKey<T>(items: T[], order: string[], getKey: (item: T) => string) {
  const itemByKey = new Map(items.map((item) => [getKey(item), item]));
  const orderedItems = order
    .map((key) => itemByKey.get(key))
    .filter((item): item is T => Boolean(item));
  const orderedKeys = new Set(order);
  const unorderedItems = items.filter((item) => !orderedKeys.has(getKey(item)));

  return [...orderedItems, ...unorderedItems];
}

function orderItemsByDisplayOrder<T extends { displayOrder?: number }>(items: T[]) {
  return items
    .map((item, index) => ({ item, index }))
    .sort((firstItem, secondItem) => {
      const firstOrder = getPositiveDisplayOrder(firstItem.item.displayOrder);
      const secondOrder = getPositiveDisplayOrder(secondItem.item.displayOrder);

      if (firstOrder !== secondOrder) {
        return firstOrder - secondOrder;
      }

      return firstItem.index - secondItem.index;
    })
    .map(({ item }) => item);
}

function getPositiveDisplayOrder(displayOrder?: number) {
  const value = Number(displayOrder);

  return Number.isFinite(value) && value > 0 ? value : Number.MAX_SAFE_INTEGER;
}

function reorderItemKeys(
  itemKeys: string[],
  currentOrder: string[],
  draggedKey: string,
  targetKey: string,
) {
  const nextOrder = orderItemsByKey(itemKeys, currentOrder, (key) => key);
  const draggedIndex = nextOrder.indexOf(draggedKey);
  const targetIndex = nextOrder.indexOf(targetKey);

  if (draggedIndex < 0 || targetIndex < 0) {
    return currentOrder;
  }

  nextOrder.splice(draggedIndex, 1);
  nextOrder.splice(targetIndex, 0, draggedKey);

  return nextOrder;
}

function isUsableLibrary(library: DictionaryLibrary | null | undefined): library is DictionaryLibrary {
  return Boolean(library?.industryId && library?.domainId);
}

function getLibraryIdentity(library: DictionaryLibrary | null | undefined) {
  if (!library) {
    return "";
  }

  return toSlug(library.domainName || "") || library.domainId || "";
}

function getUniqueDomains(domains: DictionaryDomain[]) {
  const domainByKey = new Map<string, DictionaryDomain>();

  domains.forEach((domain) => {
    const domainKey = getDomainIdentity(domain);
    const existingDomain = domainByKey.get(domainKey);

    if (!domainKey) {
      return;
    }

    if (!existingDomain) {
      domainByKey.set(domainKey, { ...domain, industryIds: [...domain.industryIds] });
      return;
    }

    domainByKey.set(domainKey, {
      ...existingDomain,
      industryIds: Array.from(new Set([...existingDomain.industryIds, ...domain.industryIds])),
    });
  });

  return orderItemsByDisplayOrder(Array.from(domainByKey.values()));
}

function getDomainCountByIndustry(
  industries: DictionaryIndustry[],
  domains: DictionaryDomain[],
  libraries: DictionaryLibrary[],
) {
  const counts = new Map<string, number>();

  industries.forEach((industry) => {
    const domainKeys = new Set<string>();
    libraries
      .filter(
        (library) =>
          isUsableLibrary(library) && library.industryId === industry.id && library.isActive !== false,
      )
      .forEach((library) => {
        const domainKey = getLibraryIdentity(library);

        if (domainKey) {
          domainKeys.add(domainKey);
        }
      });

    if (domainKeys.size === 0) {
      domains
        .filter((domain) => domain.industryIds.includes(industry.id))
        .forEach((domain) => domainKeys.add(getDomainIdentity(domain)));
    }

    counts.set(industry.id, domainKeys.size);
  });

  return counts;
}

function getIndustryUsageByDomainKey(
  domains: DictionaryDomain[],
  libraries: DictionaryLibrary[],
) {
  const industryIdsByDomainKey = new Map<string, Set<string>>();

  domains.forEach((domain) => {
    const domainKey = getDomainIdentity(domain);

    if (!domainKey) {
      return;
    }

    const industryIds = industryIdsByDomainKey.get(domainKey) ?? new Set<string>();
    domain.industryIds.forEach((industryId) => industryIds.add(industryId));
    industryIdsByDomainKey.set(domainKey, industryIds);
  });

  libraries
    .filter((library) => isUsableLibrary(library) && library.isActive !== false)
    .forEach((library) => {
      const domainKey = getLibraryIdentity(library);

      if (!domainKey) {
        return;
      }

      const industryIds = industryIdsByDomainKey.get(domainKey) ?? new Set<string>();
      industryIds.add(library.industryId);
      industryIdsByDomainKey.set(domainKey, industryIds);
    });

  return new Map(
    Array.from(industryIdsByDomainKey.entries()).map(([domainKey, industryIds]) => [
      domainKey,
      industryIds.size,
    ]),
  );
}

function getMappedDomainsForIndustry(
  industryId: string,
  domains: DictionaryDomain[],
  libraries: DictionaryLibrary[],
) {
  if (!industryId) {
    return [];
  }

  const mappedLibraries = libraries.filter(
    (library) =>
      isUsableLibrary(library) && library.industryId === industryId && library.isActive !== false,
  );
  const libraryByKey = new Map<string, DictionaryLibrary>();
  mappedLibraries.forEach((library) => {
    const domainKey = getLibraryIdentity(library);

    if (domainKey) {
      libraryByKey.set(domainKey, library);
    }
  });
  const domainByKey = new Map<string, DictionaryDomain>();
  domains
    .filter((domain) => domain.industryIds.includes(industryId))
    .forEach((domain) => {
      const domainKey = getDomainIdentity(domain);

      if (!domainKey || domainByKey.has(domainKey)) {
        return;
      }

      domainByKey.set(domainKey, domain);
    });

  const mappedDomainByKey = new Map<string, MappedDictionaryDomain>();
  mappedLibraries.forEach((library) => {
    const domainKey = getLibraryIdentity(library);
    const domain = domainByKey.get(domainKey);

    if (!domainKey || mappedDomainByKey.has(domainKey)) {
      return;
    }

    mappedDomainByKey.set(domainKey, {
      ...(domain ?? {
        id: library.domainId,
        industryIds: [industryId],
        isActive: library.isActive,
        name: library.domainDisplayName || library.domainName,
        slug: domainKey,
      }),
      displayOrder: library.displayOrder || domain?.displayOrder || 0,
      id: library.domainId || domain?.id || domainKey,
      industryIds: domain?.industryIds.includes(industryId)
        ? domain.industryIds
        : [...(domain?.industryIds ?? []), industryId],
      isActive: domain?.isActive ?? library.isActive,
      key: domainKey,
      name: domain?.name || library.domainDisplayName || library.domainName,
      processCount: library.processCount ?? 0,
      slug: domain?.slug || domainKey,
    });
  });

  domainByKey.forEach((domain, domainKey) => {
    if (mappedDomainByKey.has(domainKey)) {
      return;
    }

    mappedDomainByKey.set(domainKey, {
      ...domain,
      key: domainKey,
      processCount: libraryByKey.get(domainKey)?.processCount ?? 0,
    });
  });

  return orderItemsByDisplayOrder(Array.from(mappedDomainByKey.values()));
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
