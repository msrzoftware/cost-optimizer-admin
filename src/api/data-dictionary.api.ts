import { buildAdminApiUrl } from "@/api/api-url";

import {
  processCategories,
  type ProcessOption,
  DictionaryDomain,
  DictionaryIndustry,
  DictionaryProcess,
  ProcessTier,
} from "@/components/data-dictionary/data-dictionary-data";

type ApiEntity = {
  _id?: string;
  displayName?: string;
  id?: string;
  isActive?: boolean;
  name?: string;
  slug?: string;
};

type ApiMapping = {
  domainId?: ApiEntity | string;
  id?: string;
  industryId?: ApiEntity | string;
  isActive?: boolean;
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
  industryDomainId?: string;
  industryId?: string;
  isActive?: boolean;
  name?: string;
  scope?: "industry-default" | "industry-domain";
  slug?: string;
  tier?: string;
};

type ApiCatalogPayload = {
  domains?: ApiEntity[];
  industries?: ApiEntity[];
  libraries?: ApiMapping[];
  options?: ApiProcessOptions;
};

type ApiProcessOptions = {
  categories?: string[];
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
  name: string;
  tier: string;
};

export type DataDictionaryCatalog = {
  domains: DictionaryDomain[];
  industries: DictionaryIndustry[];
  options: {
    categories: ProcessOption[];
  };
};

export type DataDictionaryPayload = DataDictionaryCatalog & {
  processes: DictionaryProcess[];
};

const adminBasePath = "/adm/cos-process-management";
const publicBasePath = "/cos-process-management";

export async function fetchDataDictionary(): Promise<DataDictionaryPayload> {
  const catalog = await fetchDataDictionaryCatalog();
  const processes = await fetchMappedProcesses(catalog);

  return {
    ...catalog,
    processes,
  };
}

export async function fetchDataDictionaryCatalog() {
  const catalog = await fetchWithPublicFallback<ApiCatalogPayload>(
    `${adminBasePath}/catalog`,
    `${publicBasePath}/catalog`,
    { includeInactive: "true" },
  );

  return mapCatalog(catalog);
}

export async function fetchMappedProcesses(catalog: DataDictionaryCatalog) {
  const [industryProcesses, domainProcesses] = await Promise.all([
    fetchListWithPublicFallback<ApiProcess>(
      `${adminBasePath}/industry-processes`,
      `${publicBasePath}/industry-processes`,
      { includeInactive: "true", limit: "500" },
    ),
    fetchListWithPublicFallback<ApiProcess>(
      `${adminBasePath}/processes`,
      `${publicBasePath}/processes`,
      { includeInactive: "true", limit: "500" },
    ),
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

export async function createDataDictionaryIndustry(payload: { name: string }) {
  const industry = await fetchApi<ApiEntity>(`${adminBasePath}/industries`, {
    body: JSON.stringify(payload),
    method: "POST",
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

function mapCatalog(payload: ApiCatalogPayload = {}): DataDictionaryCatalog {
  const industries = (payload.industries ?? [])
    .map(mapIndustry)
    .filter((industry): industry is DictionaryIndustry => Boolean(industry));
  const industryIds = new Set(industries.map((industry) => industry.id));
  const domainById = new Map<string, DictionaryDomain>();

  (payload.libraries ?? []).forEach((mapping) => {
    const industryId = getId(mapping.industryId);
    const rawDomain = typeof mapping.domainId === "object" ? mapping.domainId : undefined;
    const domain = mapDomain(rawDomain, industryId ? [industryId] : []);

    if (!domain || !industryIds.has(industryId)) {
      return;
    }

    const existingDomain = domainById.get(domain.id);
    if (!existingDomain) {
      domainById.set(domain.id, domain);
      return;
    }

    if (!existingDomain.industryIds.includes(industryId)) {
      existingDomain.industryIds.push(industryId);
    }
  });

  if (domainById.size === 0) {
    (payload.domains ?? []).forEach((domain) => {
      const mappedDomain = mapDomain(domain, []);

      if (mappedDomain) {
        domainById.set(mappedDomain.id, mappedDomain);
      }
    });
  }

  return {
    domains: Array.from(domainById.values()),
    industries,
    options: {
      categories: mapProcessOptions(payload.options?.categories),
    },
  };
}

function mapIndustry(industry?: ApiEntity): DictionaryIndustry | null {
  const id = getId(industry);
  const name = toDisplayName(industry?.name || industry?.slug || "");

  if (!id || !name) {
    return null;
  }

  return {
    id,
    isActive: industry?.isActive !== false,
    name,
    slug: industry?.slug || toSlug(name),
  };
}

function mapDomain(domain: ApiEntity | undefined, industryIds: string[]): DictionaryDomain | null {
  const id = getId(domain);
  const name = toDomainLabel(domain);

  if (!id || !name) {
    return null;
  }

  return {
    id,
    industryIds,
    isActive: domain?.isActive !== false,
    name,
    slug: domain?.slug || toSlug(name),
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
  const domain = catalog.domains.find((item) => item.id === domainId);
  const industry = catalog.industries.find((item) => item.id === industryId);

  if (!id || !name || process.isActive === false) {
    return null;
  }

  return {
    category: getOptionLabel(catalog.options.categories, process.category || ""),
    code: "",
    cost: formatCost(process.estimatedAnnualCost),
    description: String(process.description || "").trim(),
    domain: scope === "industry-domain" ? domain?.name || "Mapped Domain" : "Industry Default",
    domainId: scope === "industry-domain" ? domainId : "industry-default",
    hours: "Not set",
    id,
    industryIds: industryId ? [industryId] : [],
    name,
    scope,
    source: scope === "industry-domain" ? "Industry x Domain" : "Industry Default",
    tier: toTierLabel(process.tier),
    industryLabel: industry?.name,
  };
}

function mapProcessOptions(values?: string[]): ProcessOption[] {
  const options = (values ?? [])
    .map(toProcessOption)
    .filter((option): option is ProcessOption => Boolean(option));

  return options.length ? options : processCategories;
}

function toProcessOption(value: string): ProcessOption | null {
  const normalizedValue = toSlug(value);

  if (!normalizedValue) {
    return null;
  }

  return {
    value: normalizedValue,
    label:
      processCategories.find((option) => option.value === normalizedValue)?.label ||
      toDisplayName(normalizedValue),
  };
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

    return {
      ...process,
      code: `${prefix}-${String(nextCount).padStart(2, "0")}`,
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
    name: payload.name.trim(),
    tier: toBackendTier(payload.tier),
  };
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

async function fetchWithPublicFallback<T>(
  adminPath: string,
  publicPath: string,
  params?: Record<string, string>,
) {
  try {
    return await fetchApi<T>(adminPath, { params });
  } catch (error) {
    if (isMissingAuthError(error)) {
      throw error;
    }

    return fetchApi<T>(publicPath, { params });
  }
}

async function fetchListWithPublicFallback<T>(
  adminPath: string,
  publicPath: string,
  params?: Record<string, string>,
) {
  try {
    return await fetchListApi<T>(adminPath, { params });
  } catch (error) {
    if (isMissingAuthError(error)) {
      throw error;
    }

    return fetchListApi<T>(publicPath, { params });
  }
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

function isMissingAuthError(error: unknown) {
  return error instanceof Error && error.message.includes("Admin access token");
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

  return labels[normalizedValue] || "Must-Have";
}

function formatCost(cost?: ApiProcess["estimatedAnnualCost"]) {
  const amount = Number(cost?.amount) || 0;
  const currency = cost?.currency || "AED";
  const formattedAmount = amount.toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

  return currency === "USD" ? `$${formattedAmount}` : `${currency} ${formattedAmount}`;
}

function getDomainCode(value: string) {
  const normalizedValue = toSlug(value);
  const knownCodes: Record<string, string> = {
    "customer-experience": "CX",
    default: "DEF",
    "industry-default": "DEF",
    "it-operations": "IT",
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
