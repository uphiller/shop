export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/",
    "/products/:path*",
    "/orders/:path*",
    "/signin",
    "/signin/:path*",
  ],
};
