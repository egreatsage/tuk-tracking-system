// src/middleware.js
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role; // e.g., 'SUPERADMIN', 'TEACHER', etc.

  // 1. Define route categories
  const isAuthRoute = nextUrl.pathname === "/login";
  const isPublicRoute = nextUrl.pathname === "/"; // Add any other public pages here

  // 2. If the user is on the login page but ALREADY logged in, redirect them to their dashboard
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }
    return null; // Let them see the login page
  }

  // 3. If the user is NOT logged in and trying to access a protected route, send to login
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // 4. Role-based Route Protection (The Bouncer)
  if (isLoggedIn) {
    const path = nextUrl.pathname;

    // If a non-SuperAdmin tries to access /superadmin/*
    if (path.startsWith("/superadmin") && userRole !== "SUPERADMIN") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }

    // If a non-Teacher tries to access /teacher/*
    if (path.startsWith("/teacher") && userRole !== "TEACHER") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }

    // If a non-Student tries to access /student/*
    if (path.startsWith("/student") && userRole !== "STUDENT") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }

    // If a non-Parent tries to access /parent/*
    if (path.startsWith("/parent") && userRole !== "PARENT") {
      return NextResponse.redirect(new URL(`/${userRole.toLowerCase()}`, nextUrl));
    }
  }

  return null; // Let the request proceed normally
});

// 5. Configure the matcher to run middleware on specific paths
export const config = {
  // Run on all routes EXCEPT API routes, static files, Next.js internals, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.svg$).*)'],
};