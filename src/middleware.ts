import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Public routes
  const isPublicRoute = nextUrl.pathname === "/login";

  // Protected route patterns
  const isInstructorRoute = nextUrl.pathname.startsWith("/instructor");
  const isClientRoute = nextUrl.pathname.startsWith("/client");

  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // If logged in and on login page, redirect to appropriate default page
  if (isLoggedIn && isPublicRoute) {
    if (userRole === "INSTRUCTOR") {
      return NextResponse.redirect(new URL("/instructor/dashboard", nextUrl));
    }
    // Clients go to home/dashboard as default page
    return NextResponse.redirect(new URL("/client/dashboard", nextUrl));
  }

  // Role-based access control
  if (isLoggedIn) {
    // Instructor trying to access client routes
    if (isClientRoute && userRole === "INSTRUCTOR") {
      return NextResponse.redirect(new URL("/instructor/dashboard", nextUrl));
    }

    // Client trying to access instructor routes
    if (isInstructorRoute && userRole === "CLIENT") {
      return NextResponse.redirect(new URL("/client/dashboard", nextUrl));
    }

    // Root path redirect
    if (nextUrl.pathname === "/") {
      if (userRole === "INSTRUCTOR") {
        return NextResponse.redirect(new URL("/instructor/dashboard", nextUrl));
      }
      // Clients go to home/dashboard as default page
      return NextResponse.redirect(new URL("/client/dashboard", nextUrl));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
