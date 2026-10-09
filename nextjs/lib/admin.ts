import type { Session } from "next-auth";

function adminAllowlist(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isAdminSession(session: Session | null): boolean {
  const email = session?.user?.email?.trim().toLowerCase();
  if (!email) {
    return false;
  }
  const allowlist = adminAllowlist();
  if (allowlist.size === 0) {
    return false;
  }
  return allowlist.has(email);
}
