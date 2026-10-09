import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "@/lib/i18n/translator";
import { formatPrice } from "@/lib/products";
import type { Product } from "@/types/product";

type ProductCardProps = {
  product: Product;
};

export async function ProductCard({ product }: ProductCardProps) {
  const { t } = await getTranslations();
  const badgeLabel = product.badge
    ? t(`badge.${product.badge}`)
    : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface transition-shadow hover:shadow-lg hover:shadow-foreground/5">
      <Link href={`/products/${product.id}`} className="relative block aspect-[4/5] overflow-hidden bg-border/30">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {badgeLabel ? (
          <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
            {badgeLabel}
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4 sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">
          {product.category}
        </p>
        <Link href={`/products/${product.id}`}>
          <h3 className="text-base font-semibold leading-snug transition-colors group-hover:text-accent">
            {product.name}
          </h3>
        </Link>
        <p className="line-clamp-2 text-sm text-muted">{product.description}</p>
        <p className="mt-auto pt-2 text-lg font-semibold tabular-nums">
          {formatPrice(product.price)}
        </p>
      </div>
    </article>
  );
}
