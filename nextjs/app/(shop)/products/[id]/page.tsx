import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCartForm } from "@/components/add-to-cart-form";
import { auth } from "@/lib/auth";
import { getTranslations } from "@/lib/i18n/translator";
import { formatPrice, getProductById } from "@/lib/products";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  const session = await auth();
  const { t } = await getTranslations();
  const signInHref = `/signin?callbackUrl=${encodeURIComponent(`/products/${id}`)}`;

  const labels = {
    quantity: t("product.quantity"),
    addToCart: t("product.addToCart"),
    added: t("product.added"),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        {t("product.back")}
      </Link>
      <div className="mt-10 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-border/30">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted">
            {product.category}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl font-semibold tabular-nums">
            {formatPrice(product.price)}
          </p>
          <p className="mt-6 text-muted leading-relaxed">{product.description}</p>
          {session?.user ? (
            <AddToCartForm productId={product.id} labels={labels} />
          ) : (
            <Link
              href={signInHref}
              className="mt-8 inline-flex rounded-full bg-foreground px-8 py-3 text-sm font-semibold text-background"
            >
              {t("product.signInToAdd")}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
