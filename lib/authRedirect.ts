const DEFAULT_NEXT_PATH = "/dashboard";

function getSafeNextPath(nextPath: string) {
  return nextPath.startsWith("/") ? nextPath : "/dashboard";
}

export function buildAuthCallbackUrl(nextPath = DEFAULT_NEXT_PATH) {
  const callbackUrl = new URL(
    "/auth/callback",
    typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin,
  );

  const safeNextPath = getSafeNextPath(nextPath);
  if (safeNextPath !== DEFAULT_NEXT_PATH) {
    callbackUrl.searchParams.set("next", safeNextPath);
  }

  return callbackUrl.toString();
}
