"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isLocale, localeCookieName } from "@/lib/i18n/config";

export async function setLocaleAction(formData: FormData) {
  const locale = String(formData.get("locale") ?? "");
  const returnTo = String(formData.get("returnTo") ?? "/");

  if (!isLocale(locale)) {
    redirect(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/");
  }

  const safeReturn =
    returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";

  (await cookies()).set(localeCookieName, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  redirect(safeReturn);
}
