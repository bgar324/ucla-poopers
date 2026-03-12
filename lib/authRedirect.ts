function getSafeNextPath(nextPath: string) {
  return nextPath.startsWith("/") ? nextPath : "/dashboard";
}

export function buildAuthCallbackUrl(nextPath = "/dashboard") {
  const callbackUrl = new URL(
    "/auth/callback",
    typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin,
  );

  callbackUrl.searchParams.set("next", getSafeNextPath(nextPath));

  return callbackUrl.toString();
}
