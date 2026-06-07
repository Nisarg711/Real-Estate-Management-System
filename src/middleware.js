import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req) {
 const token = await getToken({ 
    req, 
    secret: process.env.AUTH_SECRET,
    cookieName: req.url.startsWith("https") 
      ? "__Secure-authjs.session-token"  // production (Vercel)
      : "authjs.session-token",           // local
  });

  const { pathname } = req.nextUrl;

  const protectedRoutes = [
    "/dashboard",
    "/properties",
    "/wishlist",
    "/appointments",
    "/profile",
  ];

  const authRoutes = ["/login", "/register"];

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};