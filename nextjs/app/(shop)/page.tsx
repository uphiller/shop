import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { getTranslations } from "@/lib/i18n/translator";
import { getFeaturedProducts } from "@/lib/products";

const categories = [
  { name: "Apparel", emoji: "🧥", blurbKey: "apparel" as const },
  { name: "Home", emoji: "🏠", blurbKey: "home" as const },
  { name: "Bags", emoji: "👜", blurbKey: "bags" as const },
  { name: "Footwear", emoji: "👟", blurbKey: "footwear" as const },
];

export default async function HomePage() {
  const { t } = await getTranslations();
  const products = await getFeaturedProducts();

  return (
    <>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -right-24 top-0 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full bg-foreground/5 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:py-24">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent">
              {t("home.heroEyebrow")}
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
              {t("home.heroTitleLine1")}
              <br />
              {t("home.heroTitleLine2")}
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-muted">
              {t("home.heroBody")}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="#products"
                className="inline-flex items-center rounded-full bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                {t("home.shopCollection")}
              </Link>
              <Link
                href="#about"
                className="inline-flex items-center rounded-full border border-border px-6 py-3 text-sm font-semibold transition-colors hover:border-foreground/30"
              >
                {t("home.ourStory")}
              </Link>
            </div>
          </div>
          <div className="relative mx-auto aspect-square w-full max-w-md lg:max-w-none">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#e8dfd6] to-[#f5f0eb]" />
            <div className="absolute inset-6 rounded-2xl border border-white/60 bg-white/40 p-8 shadow-2xl shadow-foreground/10 backdrop-blur-sm">
              <p className="font-mono text-xs uppercase tracking-widest text-muted">
                {t("home.featuredDrop")}
              </p>
              <p className="mt-4 text-2xl font-semibold">{t("home.winterEdit")}</p>
              <ul className="mt-6 space-y-3 text-sm text-muted">
                <li className="flex justify-between border-b border-border/60 pb-2">
                  <span>{t("home.freeShipping")}</span>
                  <span className="text-foreground">{t("home.shippingThreshold")}</span>
                </li>
                <li className="flex justify-between border-b border-border/60 pb-2">
                  <span>{t("home.easyReturns")}</span>
                  <span className="text-foreground">{t("home.days30")}</span>
                </li>
                <li className="flex justify-between">
                  <span>{t("home.secureCheckout")}</span>
                  <span className="text-foreground">{t("home.secureProviders")}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="categories" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-semibold tracking-tight">{t("home.shopByMood")}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((cat) => (
            <div
              key={cat.name}
              className="rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-accent/40"
            >
              <span className="text-2xl" aria-hidden>
                {cat.emoji}
              </span>
              <p className="mt-4 font-semibold">{cat.name}</p>
              <p className="mt-1 text-sm text-muted">
                {t(`home.categoryBlurbs.${cat.blurbKey}`)}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="products"
        className="mx-auto max-w-6xl px-4 pb-8 sm:px-6"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {t("home.featuredProducts")}
            </h2>
            <p className="mt-2 text-muted">{t("home.featuredHint")}</p>
          </div>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <li key={product.id}>
              <ProductCard product={product} />
            </li>
          ))}
        </ul>
      </section>

      <section
        id="about"
        className="mx-auto max-w-6xl px-4 py-20 sm:px-6"
      >
        <div className="rounded-3xl bg-foreground px-8 py-12 text-background sm:px-12 sm:py-16">
          <p className="text-sm font-medium uppercase tracking-[0.15em] text-background/70">
            {t("home.aboutEyebrow")}
          </p>
          <p className="mt-4 max-w-2xl text-2xl font-semibold leading-snug sm:text-3xl">
            {t("home.aboutBody")}
          </p>
        </div>
      </section>
    </>
  );
}
