import Link from "next/link";
import {
  createProductAction,
  updateProductAction,
} from "@/app/actions/products";
import { getTranslations } from "@/lib/i18n/translator";
import type { AdminProduct } from "@/types/product";

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none ring-accent/30 focus:ring-2";
const labelClass = "block text-xs font-medium uppercase tracking-wider text-muted";

type ProductFormProps = {
  product?: AdminProduct;
  error?: string;
};

export async function ProductForm({ product, error }: ProductFormProps) {
  const { t } = await getTranslations();
  const isEdit = Boolean(product);
  const action = isEdit ? updateProductAction : createProductAction;

  return (
    <form action={action} className="space-y-5">
      {product ? <input type="hidden" name="id" value={product.id} /> : null}

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="name">
            {t("products.form.name")}
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={product?.name ?? ""}
            className={inputClass}
          />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="description">
            {t("products.form.description")}
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={product?.description ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="price">
            {t("products.form.price")}
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={product?.price ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="stock">
            {t("products.form.stock")}
          </label>
          <input
            id="stock"
            name="stock"
            type="number"
            min={0}
            step={1}
            required
            defaultValue={product?.stock ?? 0}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="category">
            {t("products.form.category")}
          </label>
          <input
            id="category"
            name="category"
            defaultValue={product?.category ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="badge">
            {t("products.form.badge")}
          </label>
          <select
            id="badge"
            name="badge"
            defaultValue={product?.badge ?? ""}
            className={inputClass}
          >
            <option value="">{t("products.badgeNone")}</option>
            <option value="new">new</option>
            <option value="sale">sale</option>
            <option value="bestseller">bestseller</option>
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass} htmlFor="imageUrl">
            {t("products.form.imageUrl")}
          </label>
          <input
            id="imageUrl"
            name="imageUrl"
            type="url"
            placeholder="https://..."
            defaultValue={product?.imageUrl ?? ""}
            className={inputClass}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <button
          type="submit"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          {isEdit ? t("products.form.save") : t("products.form.create")}
        </button>
        <Link
          href="/products"
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
        >
          {t("products.form.cancel")}
        </Link>
      </div>
    </form>
  );
}
