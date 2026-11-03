export function getSafeReturnTo(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return "/";
  }

  const target = new URL(value, "http://studiospace.local");
  if (target.origin !== "http://studiospace.local") return "/";
  if (target.pathname === "/login" || target.pathname === "/register") return "/";
  return `${target.pathname}${target.search}${target.hash}`;
}
