const DEFAULT_POST_AUTH_PATH = "/dashboard";

function getSafeNextPath(nextPath: string) {
  return nextPath.startsWith("/") ? nextPath : DEFAULT_POST_AUTH_PATH;
}

export const AUTH_CALLBACK_PATH = "/auth/callback";
export { DEFAULT_POST_AUTH_PATH };

export function buildAuthCallbackUrl(nextPath = DEFAULT_POST_AUTH_PATH) {
  const callbackUrl = new URL(
    AUTH_CALLBACK_PATH,
    typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin
  );

  const safeNextPath = getSafeNextPath(nextPath);

  if (safeNextPath !== DEFAULT_POST_AUTH_PATH) {
    callbackUrl.searchParams.set("next", safeNextPath);
  }

  return callbackUrl.toString();
}