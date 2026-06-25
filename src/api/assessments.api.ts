import { buildAdminApiUrl } from "@/api/api-url";

export type AdminAssessmentRow = {
  company: string;
  contact: string;
  cost: string;
  id: string;
  industry: string;
  savings: string;
  score: string;
  status: string;
  statusKey?: string;
  updatedAt?: string;
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

  const response = await fetch(buildAdminApiUrl(assessmentsDashboardPath), {
    credentials: "include",
    headers,
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<DashboardPayload> | null;

  if (!response.ok || body?.success === false || body?.status === false) {
    throw new Error(body?.message || "Unable to load assessments");
  }

  const data = body?.data ?? {};
  const assessments = Array.isArray(data.recentAssessments) ? data.recentAssessments : [];

  return {
    assessments,
    pipelineByStatus: Array.isArray(data.pipelineByStatus) ? data.pipelineByStatus : [],
    totalAssessments: Number(data.totalAssessments) || assessments.length,
  };
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
