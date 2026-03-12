export const AUTH_CALLBACK_PATH = "/auth/callback";
export const DEFAULT_POST_AUTH_PATH = "/dashboard";

export function buildAuthCallbackUrl() {
  if (typeof window === "undefined") {
    return AUTH_CALLBACK_PATH;
  }

  return new URL(AUTH_CALLBACK_PATH, window.location.origin).toString();
}
