import Link from "next/link";
import { DeleteProductButton } from "@/components/delete-product-button";
import { getTranslations } from "@/lib/i18n/translator";
import { formatPrice, listProducts } from "@/lib/products";
import { isSupabaseConfigured } from "@/lib/supabase-server";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const { t } = await getTranslations();

  if (!isSupabaseConfigured()) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("products.title")}
        </h1>
        <p className="mt-4 rounded-2xl border border-border bg-surface p-6 text-sm leading-relaxed text-muted">
          {t("products.supabaseMissing")}
        </p>
      </div>
    );
  }

  const products = await listProducts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("products.title")}
          </h1>
          <p className="mt-2 text-sm text-muted">{t("products.hint")}</p>
        </div>
        <Link
          href="/products/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {t("products.newProduct")}
        </Link>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="mt-8 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wider text-muted">
              <th className="px-4 py-3 font-medium">{t("products.colProduct")}</th>
              <th className="px-4 py-3 font-medium">{t("products.colCategory")}</th>
              <th className="px-4 py-3 font-medium">{t("products.colPrice")}</th>
              <th className="px-4 py-3 font-medium">{t("products.colStock")}</th>
              <th className="px-4 py-3 font-medium">{t("products.colBadge")}</th>
              <th className="px-4 py-3 font-medium">{t("products.colActions")}</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-muted"
                >
                  {t("products.empty")}
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={product.imageUrl}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background text-xs text-muted">
                          —
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-foreground">
                          {product.name}
                        </p>
                        <p className="max-w-xs truncate text-xs text-muted">
                          {product.description || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {product.category || "—"}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-4 py-3">{product.stock}</td>
                  <td className="px-4 py-3 text-muted">
                    {product.badge ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/products/${product.id}/edit`}
                        className="text-sm text-accent hover:underline"
                      >
                        {t("products.edit")}
                      </Link>
                      <DeleteProductButton
                        productId={product.id}
                        confirmMessage={t("products.deleteConfirm", {
                          name: product.name,
                        })}
                        label={t("products.delete")}
                      />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
