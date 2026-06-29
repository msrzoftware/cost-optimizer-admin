import { buildAdminApiUrl } from "@/api/api-url";

export type AdminAssessmentRow = {
  company: string;
  contact: string;
  cost: string;
  createdAt?: string;
  currencyConversionRate?: number;
  domain?: string;
  id: string;
  industry: string;
  owner?: string;
  preferences?: {
    aiPreference?: string;
    companySize?: string;
    deploymentPreference?: string;
    magicQuadrant?: string;
  };
  processCount?: number;
  processes?: AdminAssessmentProcess[];
  savings: string;
  score: string;
  selectedStackTools?: string[];
  status: string;
  statusKey?: string;
  updatedAt?: string;
};

export type AdminAssessmentProcess = {
  assessmentId?: string;
  automation?: string;
  automationLevel?: number;
  category?: string;
  costInputs?: {
    dedicatedFte?: {
      annualSalaryPerFte?: AdminCurrencyAmount;
      count?: number;
    };
    efficiencyPercent?: number;
    nonStaffingAnnualCost?: AdminCurrencyAmount;
    sharedFtePool?: {
      allocationPercent?: number;
      annualSalaryPerFte?: AdminCurrencyAmount;
      count?: number;
    };
  } | null;
  cost?: string;
  description?: string;
  estimatedCost?: {
    amount?: number;
    baseAmount?: {
      amount?: number;
      currency?: string;
    };
    currency?: string;
  };
  ftes?: string;
  hoursPerYear?: number;
  id?: string;
  name?: string;
  processId?: string;
  saving?: string;
  software?: string;
  source?: string;
  stack?: string[];
  tier?: string;
};

export type AdminCurrencyAmount = {
  amount?: number;
  currency?: string;
};

export type AdminAssessmentStatus = {
  count: number;
  key?: string;
  label: string;
  tone?: "gray" | "blueLight" | "blue" | "green" | "red";
};

export type AdminAssessmentsPayload = {
  assessments: AdminAssessmentRow[];
  pipelineByStatus: AdminAssessmentStatus[];
  totalAssessments: number;
};

type ApiResponse<T> = {
  data?: T;
  message?: string;
  status?: boolean;
  success?: boolean;
};

type DashboardPayload = {
  pipelineByStatus?: AdminAssessmentStatus[];
  recentAssessments?: AdminAssessmentRow[];
  totalAssessments?: number;
};

const assessmentsDashboardPath = "/adm/cos-process-management/dashboard";

export async function fetchAdminAssessments(): Promise<AdminAssessmentsPayload> {
  const headers = getRequestHeaders();

  if (!headers.Authorization) {
    throw new Error("Admin access token is required to load assessments");
  }

  const response = await fetch(buildAdminApiUrl(assessmentsDashboardPath, { limit: "250" }), {
    credentials: "include",
    headers,
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<DashboardPayload> | null;

  if (!response.ok || body?.success === false || body?.status === false) {
    throw new Error(body?.message || "Unable to load assessments");
  }

  const data = body?.data ?? {};
  const assessments = Array.isArray(data.recentAssessments)
    ? data.recentAssessments.map((assessment) => ({
        ...assessment,
        processes: (assessment.processes ?? []).map((process) => ({
          ...process,
          assessmentId: assessment.id,
        })),
      }))
    : [];

  return {
    assessments,
    pipelineByStatus: Array.isArray(data.pipelineByStatus) ? data.pipelineByStatus : [],
    totalAssessments: Number(data.totalAssessments) || assessments.length,
  };
}

export async function updateAdminAssessmentProcess(
  assessmentId: string,
  processId: string,
  payload: AdminAssessmentProcess,
) {
  const headers = getRequestHeaders();

  if (!headers.Authorization) {
    throw new Error("Admin access token is required to update assessments");
  }

  const response = await fetch(
    buildAdminApiUrl(
      `/adm/cos-process-management/assessments/${encodeURIComponent(assessmentId)}/processes/${encodeURIComponent(processId)}`,
    ),
    {
      body: JSON.stringify(payload),
      credentials: "include",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      method: "PATCH",
    },
  );
  const body = (await response.json().catch(() => null)) as ApiResponse<unknown> | null;

  if (!response.ok || body?.success === false || body?.status === false) {
    throw new Error(body?.message || "Unable to update assessment process");
  }
}

function getRequestHeaders() {
  const token = getStoredAccessToken();
  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers.accesstoken = `Bearer ${token}`;
  }

  return headers;
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
