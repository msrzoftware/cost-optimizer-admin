import { buildAdminApiUrl } from "@/api/api-url";
import { getAccessToken, type AdminUser } from "@/lib/auth/storage";

type LoginPayload = {
  email_id: string;
  password: string;
};

type LoginResponse = {
  data?: AdminUser & {
    atoken?: string;
  };
  message?: string;
};

type UserInfoResponse = {
  data?: AdminUser;
  message?: string;
};

export async function loginAdmin(payload: LoginPayload) {
  const response = await fetch(buildAdminApiUrl("/adm/user/login"), {
    body: JSON.stringify(payload),
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const body = (await response.json().catch(() => null)) as LoginResponse | null;

  if (!response.ok || !body?.data?.atoken || !body.data._id) {
    throw new Error(body?.message || "Unable to log in");
  }

  return body.data;
}

export async function getAdminUserInfo(userId: string) {
  const token = getAccessToken();
  const response = await fetch(buildAdminApiUrl(`/adm/user/get-user-info/${userId}`), {
    credentials: "include",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      accesstoken: `Bearer ${token}`,
    },
  });
  const body = (await response.json().catch(() => null)) as UserInfoResponse | null;

  if (!response.ok || !body?.data) {
    throw new Error(body?.message || "Session expired, please login again");
  }

  return body.data;
}
