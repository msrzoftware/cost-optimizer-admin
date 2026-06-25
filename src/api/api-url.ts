function getRequiredEnvValue(name: string, value: string | undefined) {
  const normalizedValue = value?.trim().replace(/\/$/, "") || "";

  if (!normalizedValue) {
    throw new Error(`${name} is required. Configure it in .env.development for local admin runs.`);
  }

  return normalizedValue;
}

function assertAbsoluteHttpUrl(name: string, value: string) {
  if (!/^https?:\/\//i.test(value)) {
    throw new Error(`${name} must be an absolute HTTP(S) URL.`);
  }

  return value;
}

export function getAdminApiBaseUrl() {
  return assertAbsoluteHttpUrl(
    "NEXT_PUBLIC_API_URL",
    getRequiredEnvValue("NEXT_PUBLIC_API_URL", process.env.NEXT_PUBLIC_API_URL),
  );
}

export function buildAdminApiUrl(path: string, params?: Record<string, string | undefined>) {
  const url = new URL(`${getAdminApiBaseUrl()}${path}`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url.toString();
}
