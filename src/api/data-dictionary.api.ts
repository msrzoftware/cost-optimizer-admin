import { buildAdminApiUrl } from "@/api/api-url";

import {
  processCategories,
  type ProcessOption,
  DictionaryDomain,
  DictionaryIndustry,
  DictionaryLibrary,
  DictionaryProcess,
  ProcessTier,
  TechStackTool,
} from "@/components/data-dictionary/data-dictionary-data";

type ApiEntity = {
  _id?: string;
  displayOrder?: number;
  displayName?: string;
  id?: string;
  isActive?: boolean;
  name?: string;
  slug?: string;
};

type ApiMapping = {
  domainDisplayName?: string;
  displayOrder?: number;
  domainName?: string;
  domainId?: ApiEntity | string;
  domainSlug?: string;
  id?: string;
  industryId?: ApiEntity | string;
  industryName?: string;
  industrySlug?: string;
  isActive?: boolean;
  processCount?: number;
};

type ApiProcess = {
  _id?: string;
  category?: string;
  description?: string;
  estimatedAnnualCost?: {
    amount?: number;
    currency?: "AED" | "USD";
  };
  id?: string;
  hoursPerYear?: number;
  industryDomainId?: string;
  industryId?: string;
  isActive?: boolean;
  name?: string;
  scope?: "industry-default" | "industry-domain";
  slug?: string;
  tier?: string;
};

type ApiTechStack = {
  _id?: string;
  company?: string;
  createdAt?: string;
  description?: string;
  id?: string;
  industryDomainId?: string;
  industryId?: string;
  isActive?: boolean;
  scope?: "common" | "industry-default" | "industry-domain";
  title?: string;
  updatedAt?: string;
};

type ApiCatalogPayload = {
  domains?: ApiEntity[];
  industries?: ApiEntity[];
  libraries?: ApiMapping[];
  options?: ApiProcessOptions;
};

type ApiProcessOptions = {
  categories?: string[];
  currencyConversionRate?: number;
  currencies?: Array<"AED" | "USD">;
  tiers?: string[];
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
  pagination?: {
    totalCount?: number;
  };
  status?: boolean;
  success?: boolean;
};

type ApiListPayload<T> = {
  data?: T[];
  pagination?: {
    totalCount?: number;
  };
};

type DataDictionaryProcessPayload = {
  category: string;
  description: string;
  estimatedAnnualCost: {
    amount: number;
    currency: "AED" | "USD";
  };
  hoursPerYear: number;
  name: string;
  tier: string;
};

type DataDictionaryTechStackPayload = {
  category: string;
  domainId?: string;
  industryId?: string;
  name: string;
  scope?: "common" | "industry-default" | "industry-domain";
  vendor: string;
};

export type DataDictionaryCatalog = {
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  inactiveIndustries: DictionaryIndustry[];
  libraries: DictionaryLibrary[];
  options: {
    categories: ProcessOption[];
    currencyConversionRate: number;
    tiers: ProcessOption[];
  };
};

export type DataDictionaryPayload = DataDictionaryCatalog & {
  processes: DictionaryProcess[];
  techStack: TechStackTool[];
};

const adminBasePath = "/adm/cos-process-management";

export async function fetchDataDictionary(): Promise<DataDictionaryPayload> {
  const catalog = await fetchDataDictionaryCatalog();
  const [processes, techStack] = await Promise.all([
    fetchMappedProcesses(catalog),
    fetchMappedTechStack(catalog),
  ]);

  return {
    ...catalog,
    processes,
    techStack,
  };
}

export async function fetchDataDictionaryCatalog() {
  const catalog = await fetchApi<ApiCatalogPayload>(`${adminBasePath}/catalog`, {
    params: { includeInactive: "true" },
  });

  return mapCatalog(catalog);
}

export async function fetchMappedProcesses(catalog: DataDictionaryCatalog) {
  const [industryProcesses, domainProcesses] = await Promise.all([
    fetchListApi<ApiProcess>(`${adminBasePath}/industry-processes`, {
      params: { includeInactive: "true", limit: "500" },
    }),
    fetchListApi<ApiProcess>(`${adminBasePath}/processes`, {
      params: { includeInactive: "true", limit: "500" },
    }),
  ]);

  const rows = [
    ...(industryProcesses.data ?? []).map((process) =>
      mapProcess(process, "industry-default", catalog),
    ),
    ...(domainProcesses.data ?? []).map((process) =>
      mapProcess(process, "industry-domain", catalog),
    ),
  ].filter((process): process is DictionaryProcess => Boolean(process));

  return addProcessCodes(rows);
}

export async function fetchMappedTechStack(catalog: DataDictionaryCatalog) {
  const [industryTools, domainToolLists] = await Promise.all([
    fetchListApi<ApiTechStack>(`${adminBasePath}/tech-stack`, {
      params: { limit: "500" },
    }),
    Promise.all(
      catalog.domains.map((domain) =>
        fetchListApi<ApiTechStack>(`${adminBasePath}/tech-stack`, {
          params: { domainId: domain.id, limit: "500" },
        }),
      ),
    ),
  ]);

  return [
    ...(industryTools.data ?? []),
    ...domainToolLists.flatMap((result) => result.data ?? []),
  ]
    .map((tool) => mapTechStackTool(tool, catalog))
    .filter((tool): tool is TechStackTool => Boolean(tool));
}

export async function createDataDictionaryIndustry(payload: { name: string }) {
  const industry = await fetchApi<ApiEntity>(`${adminBasePath}/industries`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return mapIndustry(industry);
}

export async function deleteDataDictionaryIndustry(payload: {
  force?: boolean;
  industryId: string;
}) {
  const industry = await fetchApi<ApiEntity>(`${adminBasePath}/industries/${payload.industryId}`, {
    method: "DELETE",
    params: payload.force ? { force: "true" } : undefined,
  });

  return mapIndustry(industry);
}

export async function createDataDictionaryDomain(payload: { industryId: string; name: string }) {
  const domain = await fetchApi<ApiEntity>(`${adminBasePath}/domains`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return mapDomain(domain, [payload.industryId]);
}

export async function deleteDataDictionaryProcessLibrary(libraryId: string) {
  const domain = await fetchApi<ApiEntity>(`${adminBasePath}/libraries/${libraryId}`, {
    method: "DELETE",
  });

  return mapDomain(domain, []);
}

export async function createDataDictionaryProcessLibrary(payload: {
  domainId: string;
  industryId: string;
}) {
  const library = await fetchApi<ApiMapping>(`${adminBasePath}/libraries`, {
    body: JSON.stringify(payload),
    method: "POST",
  });

  return mapLibrary(library);
}

export async function reorderDataDictionaryIndustries(payload: { industryIds: string[] }) {
  const industries = await fetchApi<ApiEntity[]>(`${adminBasePath}/industries/reorder`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });

  return industries.map(mapIndustry).filter((industry): industry is DictionaryIndustry => Boolean(industry));
}

export async function reorderDataDictionaryDomains(payload: {
  domainIds: string[];
  industryId: string;
}) {
  const libraries = await fetchApi<ApiMapping[]>(`${adminBasePath}/domains/reorder`, {
    body: JSON.stringify(payload),
    method: "PUT",
  });

  return libraries
    .map((library) => mapLibrary(library))
    .filter((library): library is DictionaryLibrary => Boolean(library));
}

export async function createDataDictionaryIndustryProcess(
  payload: DataDictionaryProcessPayload & { industryId: string },
) {
  const process = await fetchApi<ApiProcess>(`${adminBasePath}/industry-processes`, {
    body: JSON.stringify(toApiProcessPayload(payload)),
    method: "POST",
  });

  return getId(process);
}

export async function createDataDictionaryDomainProcess(
  payload: DataDictionaryProcessPayload & { industryDomainId: string },
) {
  const process = await fetchApi<ApiProcess>(`${adminBasePath}/processes`, {
    body: JSON.stringify(toApiProcessPayload(payload)),
    method: "POST",
  });

  return getId(process);
}

export async function createDataDictionaryTechStack(payload: {
  category: string;
  domainId?: string;
  industryId?: string;
  name: string;
  scope?: "common" | "industry-default" | "industry-domain";
  vendor: string;
}): Promise<string> {
  const tool = await fetchApi<ApiTechStack>(`${adminBasePath}/tech-stack`, {
    body: JSON.stringify(toApiTechStackPayload(payload)),
    method: "POST",
  });

  return getId(tool);
}

export async function updateDataDictionaryTechStack(payload: {
  tool: TechStackTool;
  values: DataDictionaryTechStackPayload;
}) {
  const tool = await fetchApi<ApiTechStack>(`${adminBasePath}/tech-stack/${payload.tool.id}`, {
    body: JSON.stringify(toApiTechStackPayload(payload.values)),
    method: "PUT",
  });

  return getId(tool);
}

export async function deleteDataDictionaryTechStack(toolId: string) {
  const tool = await fetchApi<ApiTechStack>(`${adminBasePath}/tech-stack/${toolId}`, {
    method: "DELETE",
  });

  return getId(tool);
}

export async function updateDataDictionaryProcess(payload: {
  process: DictionaryProcess;
  values: DataDictionaryProcessPayload;
}) {
  const process = await fetchApi<ApiProcess>(getProcessPath(payload.process), {
    body: JSON.stringify(toApiProcessPayload(payload.values)),
    method: "PUT",
  });

  return getId(process);
}

export async function updateDataDictionaryProcessStatus(payload: {
  isActive: boolean;
  process: DictionaryProcess;
}) {
  const process = await fetchApi<ApiProcess>(`${getProcessPath(payload.process)}/status`, {
    body: JSON.stringify({ isActive: payload.isActive }),
    method: "PATCH",
  });

  return getId(process);
}

export async function deleteDataDictionaryProcess(process: DictionaryProcess) {
  const deletedProcess = await fetchApi<ApiProcess>(getProcessPath(process), {
    method: "DELETE",
  });

  return getId(deletedProcess);
}

export async function updateDataDictionaryCurrencyConversionRate(rate: number) {
  const result = await fetchApi<{ currencyConversionRate?: number }>(
    `${adminBasePath}/settings/currency-conversion-rate`,
    {
      body: JSON.stringify({ currencyConversionRate: rate }),
      method: "PUT",
    },
  );

  const savedRate = Number(result.currencyConversionRate);
  return Number.isFinite(savedRate) && savedRate > 0 ? savedRate : rate;
}

function toApiTechStackPayload(payload: DataDictionaryTechStackPayload) {
  return {
    company: payload.vendor.trim(),
    description: payload.category.trim(),
    industryDomainId: payload.domainId,
    industryId: payload.industryId,
    scope: payload.scope,
    title: payload.name.trim(),
  };
}

function mapCatalog(payload: ApiCatalogPayload = {}): DataDictionaryCatalog {
  const mappedIndustries = (payload.industries ?? [])
    .map(mapIndustry)
    .filter((industry): industry is DictionaryIndustry => Boolean(industry));
  const industries = mappedIndustries.filter((industry) => industry.isActive !== false);
  const inactiveIndustries = mappedIndustries.filter((industry) => industry.isActive === false);
  const industryIds = new Set(industries.map((industry) => industry.id));
  const industryById = new Map(industries.map((industry) => [industry.id, industry]));
  const domainById = new Map<string, DictionaryDomain>();
  const libraries: DictionaryLibrary[] = [];

  (payload.domains ?? []).forEach((domain) => {
    const mappedDomain = mapDomain(domain, []);

    if (mappedDomain) {
      domainById.set(mappedDomain.id, mappedDomain);
    }
  });

  (payload.libraries ?? []).forEach((mapping) => {
    if (!mapping) {
      return;
    }

    const industryId = getId(mapping.industryId);
    const domainId = getId(mapping.domainId);
    const rawDomain = typeof mapping.domainId === "object" ? mapping.domainId : undefined;
    const existingDomain = domainById.get(domainId);
    const library = mapLibrary(mapping, {
      domainDisplayName: existingDomain?.name,
      domainName: existingDomain?.name,
      industryName: industryById.get(industryId)?.name,
    });

    if (!library || !industryIds.has(industryId)) {
      return;
    }

    libraries.push(library);

    const domain =
      mapDomain(rawDomain, industryId ? [industryId] : []) ||
      existingDomain ||
      mapDomain(
        {
          _id: library.domainId,
          displayName: library.domainDisplayName || library.domainName,
          displayOrder: library.displayOrder,
          isActive: library.isActive,
          name: library.domainName,
          slug: toSlug(library.domainName),
        },
        [industryId],
      );

    if (!domain) {
      return;
    }

    const currentDomain = domainById.get(domain.id);
    if (!currentDomain) {
      domainById.set(domain.id, domain);
      return;
    }

    if (!currentDomain.industryIds.includes(industryId)) {
      currentDomain.industryIds.push(industryId);
    }
  });

  return {
    domains: sortByDisplayOrder(
      Array.from(domainById.values()).filter((domain) => domain.industryIds.length > 0),
    ),
    industries: sortByDisplayOrder(industries),
    inactiveIndustries: sortByDisplayOrder(inactiveIndustries),
    libraries: sortByDisplayOrder(libraries),
    options: {
      categories: mapProcessOptions(payload.options?.categories),
      currencyConversionRate: getCurrencyConversionRate(payload.options?.currencyConversionRate),
      tiers: mapProcessOptions(payload.options?.tiers, getStaticTierOptions()),
    },
  };
}

function getCurrencyConversionRate(value: unknown) {
  const rate = Number(value);

  return Number.isFinite(rate) && rate > 0 ? rate : 3.6725;
}

function mapIndustry(industry?: ApiEntity): DictionaryIndustry | null {
  const id = getId(industry);
  const name = toDisplayName(industry?.name || industry?.slug || "");

  if (!id || !name) {
    return null;
  }

  return {
    displayOrder: Number(industry?.displayOrder) || 0,
    id,
    isActive: industry?.isActive !== false,
    name,
    slug: industry?.slug || toSlug(name),
  };
}

function mapDomain(domain: ApiEntity | undefined, industryIds: string[]): DictionaryDomain | null {
  const id = getId(domain);
  const name = toDomainLabel(domain);

  if (!id || !name || domain?.isActive === false) {
    return null;
  }

  return {
    displayOrder: Number(domain?.displayOrder) || 0,
    id,
    industryIds,
    isActive: true,
    name,
    slug: domain?.slug || toSlug(name),
  };
}

function mapLibrary(
  mapping?: ApiMapping,
  fallbackNames: { domainDisplayName?: string; domainName?: string; industryName?: string } = {},
): DictionaryLibrary | null {
  const domainId = getId(mapping?.domainId);
  const industryId = getId(mapping?.industryId);
  const domain = typeof mapping?.domainId === "object" ? mapping.domainId : undefined;
  const industry = typeof mapping?.industryId === "object" ? mapping.industryId : undefined;

  if (!domainId || !industryId || mapping?.isActive === false) {
    return null;
  }

  return {
    displayOrder: Number(mapping?.displayOrder) || 0,
    id: mapping?.id || domainId,
    domainId,
    domainDisplayName:
      toDisplayName(mapping?.domainDisplayName || "") ||
      toDomainLabel(domain) ||
      fallbackNames.domainDisplayName ||
      fallbackNames.domainName ||
      "Mapped Domain",
    domainName:
      toDisplayName(mapping?.domainName || "") ||
      toDomainLabel(domain) ||
      fallbackNames.domainName ||
      "Mapped Domain",
    industryId,
    industryName:
      toDisplayName(mapping?.industryName || "") ||
      toDisplayName(industry?.name || industry?.slug || "") ||
      fallbackNames.industryName ||
      "Mapped Industry",
    isActive: true,
    processCount: Math.max(0, Number(mapping?.processCount) || 0),
  };
}

function mapProcess(
  process: ApiProcess,
  fallbackScope: "industry-default" | "industry-domain",
  catalog: DataDictionaryCatalog,
): DictionaryProcess | null {
  const id = getId(process);
  const name = toDisplayName(process.name || process.slug || "");
  const scope = process.scope || fallbackScope;
  const industryId = process.industryId || "";
  const domainId = process.industryDomainId || "";
  const domainLibrary = catalog.libraries.find(
    (item) =>
      item.id === domainId ||
      item.domainId === domainId ||
      Boolean(industryId && item.industryId === industryId && item.domainId === domainId),
  );
  const domain = catalog.domains.find((item) => item.id === (domainLibrary?.domainId || domainId));
  const industry = [...catalog.industries, ...catalog.inactiveIndustries].find(
    (item) => item.id === (industryId || domainLibrary?.industryId),
  );

  if (!id || !name) {
    return null;
  }

  const costAmount = Number(process.estimatedAnnualCost?.amount) || 0;
  const costCurrency = process.estimatedAnnualCost?.currency || "AED";

  return {
    category: getOptionLabel(catalog.options.categories, process.category || ""),
    categoryValue: toSlug(process.category || ""),
    code: "",
    cost: formatCost(process.estimatedAnnualCost),
    costAmount,
    costCurrency,
    description: String(process.description || "").trim(),
    domain:
      scope === "industry-domain"
        ? domain?.name || domainLibrary?.domainDisplayName || domainLibrary?.domainName || "Mapped Domain"
        : "Industry Default",
    domainId: scope === "industry-domain" ? domain?.id || domainLibrary?.domainId || domainId : "industry-default",
    hours: formatHours(process.hoursPerYear),
    id,
    industryIds: industry?.id ? [industry.id] : [],
    isActive: process.isActive !== false,
    name,
    scope,
    source: scope === "industry-domain" ? "Industry x Domain" : "Industry Default",
    tier: toTierLabel(process.tier),
    tierValue: process.tier || "",
    industryLabel: industry?.name || domainLibrary?.industryName,
  };
}

function mapTechStackTool(
  tool: ApiTechStack,
  catalog: DataDictionaryCatalog,
): TechStackTool | null {
  const id = getId(tool);
  const name = toDisplayName(tool.title || "");
  const scope = tool.scope || "industry-default";
  const industryId = tool.industryId || "";
  const domainId = tool.industryDomainId || "";
  const industry = [...catalog.industries, ...catalog.inactiveIndustries].find(
    (item) => item.id === industryId,
  );
  const domain = catalog.domains.find((item) => item.id === domainId);

  if (!id || !name || tool.isActive === false) {
    return null;
  }

  return {
    category: toDisplayName(tool.description || "") || "General",
    domainId: scope === "industry-domain" ? domainId : undefined,
    domainName: scope === "industry-domain" ? domain?.name || "Mapped Domain" : undefined,
    id,
    industryId: scope === "common" ? undefined : industryId,
    industryName: scope === "common" ? "Global" : industry?.name || "Mapped Industry",
    isActive: true,
    name,
    scope,
    vendor: toDisplayName(tool.company || "") || "Unassigned",
  };
}

function mapProcessOptions(
  values?: string[],
  fallbackOptions: readonly ProcessOption[] = processCategories,
): ProcessOption[] {
  const options = (values ?? [])
    .map((value) => toProcessOption(value, fallbackOptions))
    .filter((option): option is ProcessOption => Boolean(option));

  return options.length ? options : [...fallbackOptions];
}

function toProcessOption(
  value: string,
  fallbackOptions: readonly ProcessOption[] = processCategories,
): ProcessOption | null {
  const normalizedValue = toSlug(value);

  if (!normalizedValue) {
    return null;
  }

  return {
    value: normalizedValue,
    label:
      fallbackOptions.find((option) => option.value === normalizedValue)?.label ||
      toDisplayName(normalizedValue),
  };
}

function getStaticTierOptions(): ProcessOption[] {
  return [
    { label: "Must-Have", value: "must-have" },
    { label: "Good-to-Have", value: "good-to-have" },
    { label: "Nice to Have", value: "nice-to-have" },
    { label: "Future Enhancement", value: "future-enhancement" },
  ];
}

function getOptionLabel(options: readonly ProcessOption[], value: string) {
  const normalizedValue = toSlug(value);

  if (!normalizedValue) {
    return "";
  }

  return (
    options.find((option) => option.value === normalizedValue)?.label ||
    toDisplayName(normalizedValue)
  );
}

function addProcessCodes(processes: DictionaryProcess[]) {
  const counters = new Map<string, number>();

  return processes.map((process) => {
    const prefix =
      process.scope === "industry-domain"
        ? getDomainCode(process.domain)
        : getDomainCode(process.industryLabel || "Default");
    const nextCount = (counters.get(prefix) ?? 0) + 1;

    counters.set(prefix, nextCount);

    const codeNumber =
      process.scope === "industry-domain" ? String(nextCount) : String(nextCount).padStart(2, "0");

    return {
      ...process,
      code: `${prefix}-${codeNumber}`,
    };
  });
}

function toApiProcessPayload<T extends DataDictionaryProcessPayload>(payload: T) {
  return {
    ...payload,
    category: toSlug(payload.category),
    estimatedAnnualCost: {
      amount: Math.max(0, Number(payload.estimatedAnnualCost.amount) || 0),
      currency: payload.estimatedAnnualCost.currency,
    },
    hoursPerYear: Math.max(0, Math.round(Number(payload.hoursPerYear) || 0)),
    name: payload.name.trim(),
    tier: toBackendTier(payload.tier),
  };
}

function getProcessPath(process: DictionaryProcess) {
  const collectionPath =
    process.scope === "industry-default" ? "industry-processes" : "processes";

  return `${adminBasePath}/${collectionPath}/${process.id}`;
}

function toBackendTier(value: string) {
  const normalizedValue = toSlug(value);
  const tiers: Record<string, string> = {
    future: "future",
    "future-enhancement": "future",
    "future-enhancements": "future",
    "good-to-have": "good-to-have",
    "must-have": "must-have",
    "nice-to-have": "nice-to-have",
  };

  return tiers[normalizedValue] || normalizedValue;
}

async function fetchApi<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
) {
  const body = await fetchApiResponse<T>(path, options);

  if (!body?.data) {
    throw new Error("COS data dictionary response is empty");
  }

  return body.data;
}

async function fetchListApi<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
): Promise<ApiListPayload<T>> {
  const body = await fetchApiResponse<T[]>(path, options);

  return {
    data: Array.isArray(body?.data) ? body.data : [],
    pagination: body?.pagination,
  };
}

async function fetchApiResponse<T>(
  path: string,
  options: RequestInit & { params?: Record<string, string> } = {},
) {
  const { params, headers: inputHeaders, ...requestOptions } = options;
  const headers = new Headers(inputHeaders);
  const authHeaders = getAuthHeaders();

  if (!authHeaders.Authorization) {
    throw new Error("Admin access token is required to load mapped COS data");
  }

  headers.set("Accept", "application/json");
  headers.set("Content-Type", "application/json");
  Object.entries(authHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });

  const response = await fetch(buildAdminApiUrl(path, params), {
    ...requestOptions,
    credentials: "include",
    headers,
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<T> | null;

  if (!response.ok || body?.success === false || body?.status === false) {
    throw new Error(body?.message || "Unable to load COS data dictionary");
  }

  return body;
}

function getAuthHeaders() {
  const token = getStoredAccessToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
    accesstoken: `Bearer ${token}`,
  };
}

function getStoredAccessToken() {
  if (typeof window === "undefined") {
    return "";
  }

  return (
    window.sessionStorage.getItem("access_token") ||
    window.localStorage.getItem("access_token") ||
    window.sessionStorage.getItem("auth_token") ||
    window.localStorage.getItem("auth_token") ||
    ""
  );
}

function getId(entity?: ApiEntity | string | null) {
  if (!entity) {
    return "";
  }

  return typeof entity === "string" ? entity : entity.id || entity._id || "";
}

function toDomainLabel(domain?: ApiEntity) {
  return toDisplayName(domain?.displayName || domain?.name || domain?.slug || "");
}

function toDisplayName(value: string) {
  return value
    .trim()
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/\b[a-z]/g, (character) => character.toUpperCase())
    .replace(/\b(Cx|Hr|It|Bpo|Uae|Usa|Uk)\b/g, (match) => match.toUpperCase());
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTierLabel(value?: string): ProcessTier {
  const normalizedValue = toSlug(value || "");
  const labels: Record<string, ProcessTier> = {
    future: "Future Enhancement",
    "future-enhancement": "Future Enhancement",
    "future-enhancements": "Future Enhancement",
    "good-to-have": "Good-to-Have",
    "must-have": "Must-Have",
    "nice-to-have": "Nice to Have",
  };

  if (!normalizedValue) {
    return "Must-Have";
  }

  return labels[normalizedValue] || toDisplayName(normalizedValue);
}

function sortByDisplayOrder<T extends { displayOrder?: number }>(items: T[]) {
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

function formatCost(cost?: ApiProcess["estimatedAnnualCost"]) {
  const amount = Number(cost?.amount) || 0;
  const currency = cost?.currency || "AED";
  const formattedAmount = amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

  return currency === "USD" ? `$${formattedAmount}` : `${currency} ${formattedAmount}`;
}

function formatHours(value?: number) {
  const hours = Math.max(0, Math.round(Number(value) || 0));

  return hours > 0 ? hours.toLocaleString("en-US") : "Not set";
}

function getDomainCode(value: string) {
  const normalizedValue = toSlug(value);
  const knownCodes: Record<string, string> = {
    admin: "ADM",
    "customer-experience": "CX",
    cx: "CX",
    default: "DEF",
    hr: "HR",
    "industry-default": "DEF",
    "it-operations": "IT",
    "it-ops": "IT",
    mktg: "MKT",
  };

  if (knownCodes[normalizedValue]) {
    return knownCodes[normalizedValue];
  }

  return value
    .replace(/&/g, "")
    .split(/\s+|\//)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase())
    .join("")
    .slice(0, 3);
}
