import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { adminOrigin } from "@/lib/hosts";

function redirectShopAdminPath(pathname: string): string {
  const base = adminOrigin();
  if (pathname === "/admin" || pathname === "/admin/") {
    return `${base}/`;
  }
  if (pathname.startsWith("/admin/")) {
    return `${base}${pathname.slice("/admin".length)}`;
  }
  return `${base}/`;
}

export default auth((request) => {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith("/admin")) {
    return NextResponse.redirect(redirectShopAdminPath(pathname));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
