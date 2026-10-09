import { auth, signIn, signOut } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/translator";

export async function AuthButtons() {
  const session = await auth();
  const { t } = await getTranslations();
  const displayName =
    session?.user?.name ?? session?.user?.email ?? t("nav.account");

  if (session?.user) {
    return (
      <div className="flex items-center gap-2 sm:gap-3">
        <a
          href="/account"
          className="hidden max-w-[10rem] truncate text-sm text-muted transition-colors hover:text-foreground sm:inline"
        >
          {displayName}
        </a>
        <a
          href="/orders"
          className="hidden text-sm text-muted transition-colors hover:text-foreground md:inline"
        >
          {t("nav.orders")}
        </a>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
          >
            {t("nav.signOut")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <form
      action={async () => {
        "use server";
        await signIn("keycloak", { redirectTo: "/account" });
      }}
    >
      <button
        type="submit"
        className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent/40 hover:text-accent"
      >
        {t("nav.signIn")}
      </button>
    </form>
  );
}
