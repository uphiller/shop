import { redirect } from "next/navigation";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";

export async function requireSession(
  callbackUrl = "/cart",
): Promise<Session & { user: { id: string } }> {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }
  return session as Session & { user: { id: string } };
}
