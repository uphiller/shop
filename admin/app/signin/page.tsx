import { auth, signIn } from "@/lib/auth";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { getTranslations } from "@/lib/i18n/translator";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

function safeCallbackUrl(raw: string | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return "/";
  }
  return raw;
}

export default async function SignInPage({ searchParams }: PageProps) {
  const session = await auth();
  const { t, locale } = await getTranslations();
  const { callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallbackUrl(rawCallback);

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center sm:px-6">
      <LocaleSwitcher
        currentLocale={locale}
        label={t("locale.label")}
        className="mb-8"
      />
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">
        {t("signIn.title")}
      </h1>
      <p className="mt-3 text-sm text-muted">{t("signIn.body")}</p>
      <form
        className="mt-8 w-full"
        action={async () => {
          "use server";
          await signIn("keycloak", { redirectTo: callbackUrl });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          {t("signIn.keycloak")}
        </button>
      </form>
    </div>
  );
}
