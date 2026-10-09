import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCartItemCount } from "@/lib/cart";
import { getTranslations } from "@/lib/i18n/translator";
import { getAppUserIdForSession } from "@/lib/users";

export async function CartNavLink() {
  const session = await auth();
  const { t } = await getTranslations();
  let count = 0;
  if (session?.user?.id) {
    const userId = await getAppUserIdForSession(session);
    if (userId) {
      count = await getCartItemCount(userId);
    }
  }

  return (
    <Link
      href="/cart"
      className="relative rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
    >
      {t("nav.cart")}
      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-0.5 text-[10px] font-bold text-white">
        {count > 99 ? "99+" : count}
      </span>
    </Link>
  );
}
