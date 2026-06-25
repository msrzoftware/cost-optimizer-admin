import { buildAdminApiUrl } from "@/api/api-url";
import type { PipelineStatus, RecentAssessment } from "@/components/admin-dashboard/dashboard-data";

type ApiResponse<T> = {
  data?: T;
  message?: string;
  status?: boolean;
  success?: boolean;
};

type DashboardPayload = {
  pipelineByStatus?: PipelineStatus[];
  recentAssessments?: RecentAssessment[];
};

const dashboardPath = "/adm/cos-process-management/dashboard";

export async function fetchDashboardData() {
  const headers = getRequestHeaders();

  if (!headers.Authorization) {
    throw new Error("Admin access token is required to load real pipeline counts");
  }

  const response = await fetch(buildAdminApiUrl(dashboardPath), {
    credentials: "include",
    headers,
  });
  const body = (await response.json().catch(() => null)) as ApiResponse<DashboardPayload> | null;

  if (!response.ok || body?.success === false || body?.status === false) {
    throw new Error(body?.message || "Unable to load dashboard data");
  }

  return body?.data ?? {};
}

export async function fetchDashboardPipelineStatuses() {
  const data = await fetchDashboardData();

  return data.pipelineByStatus ?? [];
}

export async function fetchDashboardRecentAssessments() {
  const data = await fetchDashboardData();

  return data.recentAssessments ?? [];
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
