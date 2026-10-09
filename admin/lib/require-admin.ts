import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { isAdminSession } from "@/lib/admin";
import { auth } from "@/lib/auth";
import { shopOrigin } from "@/lib/hosts";

export async function requireAdmin(): Promise<
  Session & { user: { id: string; email: string } }
> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent("/")}`);
  }
  if (!isAdminSession(session)) {
    redirect(`${shopOrigin()}/?admin=denied`);
  }
  const email = session.user?.email;
  if (!email) {
    redirect(`${shopOrigin()}/?admin=denied`);
  }
  return session as Session & { user: { id: string; email: string } };
}
