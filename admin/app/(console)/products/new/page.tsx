import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { getTranslations } from "@/lib/i18n/translator";
import { isSupabaseConfigured } from "@/lib/supabase-server";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function NewProductPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const { t } = await getTranslations();

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <p className="text-sm text-muted">{t("products.notConfigured")}</p>
        <Link href="/products" className="mt-4 inline-block text-sm text-accent">
          {t("products.backList")}
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/products"
        className="text-sm text-accent hover:underline"
      >
        {t("products.backList")}
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        {t("products.newTitle")}
      </h1>
      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <ProductForm error={error} />
      </div>
    </div>
  );
}
