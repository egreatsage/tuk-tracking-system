// src/proxy.js
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role; 

  const isAuthRoute = nextUrl.pathname === "/login";

  // 1. Root URL Redirect: Send visitors to login, or their dashboard if logged in
  if (nextUrl.pathname === "/") {
    return isLoggedIn 
      ? NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl))
      : NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 2. Auth Route (Login)
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }
    return null; 
  }

  // 3. Protect all other routes
  if (!isLoggedIn && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 4. Role-based Bouncer
  if (isLoggedIn) {
    const path = nextUrl.pathname;

    if (path.startsWith("/superadmin") && userRole !== "SUPERADMIN") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }
    if (path.startsWith("/teacher") && userRole !== "TEACHER") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }
    if (path.startsWith("/student") && userRole !== "STUDENT") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }
    if (path.startsWith("/parent") && userRole !== "PARENT") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }
  }

  return null; 
});

// 5. Configure the matcher to run proxy on specific paths
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};