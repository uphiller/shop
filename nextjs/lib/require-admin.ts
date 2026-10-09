import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { isAdminSession } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { isAdminHost, shopOrigin } from "@/lib/hosts";

export async function requireAdmin(
  callbackUrl?: string,
): Promise<Session & { user: { id: string; email: string } }> {
  const host = (await headers()).get("host") ?? "";
  const onAdminHost = isAdminHost(host);
  const loginCallback = callbackUrl ?? (onAdminHost ? "/" : "/admin");

  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(loginCallback)}`);
  }
  if (!isAdminSession(session)) {
    redirect(onAdminHost ? `${shopOrigin()}/?admin=denied` : "/?admin=denied");
  }
  const email = session.user?.email;
  if (!email) {
    redirect("/?admin=denied");
  }
  return session as Session & { user: { id: string; email: string } };
}
