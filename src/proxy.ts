import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE_NAME, verifySessionCookieValue } from "@/lib/adminAuth";

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();

  const cookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  const valid = await verifySessionCookieValue(cookie);
  if (!valid) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
