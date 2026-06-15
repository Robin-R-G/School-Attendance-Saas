import { NextResponse } from "next/server";
import { authConfig } from "./auth.config";
import NextAuth from "next-auth";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const user = req.auth?.user;

  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isAuthRoute = nextUrl.pathname === "/login";
  const isAdminRoute = nextUrl.pathname.startsWith("/admin");
  const isSchoolRoute = nextUrl.pathname.startsWith("/schools");

  // Allow access to auth API routes or public assets
  if (isApiRoute && nextUrl.pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Redirect logged-in users away from login page
  if (isAuthRoute) {
    if (isLoggedIn && user) {
      if (user.role === "SUPER_ADMIN") {
        return NextResponse.redirect(new URL("/admin", nextUrl));
      } else if (user.schoolCode) {
        const roleLower = user.role.toLowerCase().replace("school_", ""); // admin, teacher, student, parent
        return NextResponse.redirect(new URL(`/schools/${user.schoolCode}/${roleLower}`, nextUrl));
      }
    }
    return NextResponse.next();
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn && (isAdminRoute || isSchoolRoute)) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Super Admin routes restriction
  if (isAdminRoute) {
    if (user?.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }
    return NextResponse.next();
  }

  // School tenant & role restriction
  if (isSchoolRoute) {
    const pathSegments = nextUrl.pathname.split("/").filter(Boolean); // ["schools", "schoolCode", "role", ...]
    const pathSchoolCode = pathSegments[1];
    const pathRole = pathSegments[2];

    if (!pathSchoolCode) {
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Tenant isolation: block users from other schools (unless Super Admin)
    if (user?.role !== "SUPER_ADMIN" && user?.schoolCode !== pathSchoolCode) {
      if (user?.schoolCode) {
        const roleLower = user.role.toLowerCase().replace("school_", "");
        return NextResponse.redirect(new URL(`/schools/${user.schoolCode}/${roleLower}`, nextUrl));
      }
      return NextResponse.redirect(new URL("/login", nextUrl));
    }

    // Role-based access control (RBAC) on sub-routes
    if (pathRole) {
      const allowedRoles: Record<string, string[]> = {
        admin: ["SCHOOL_ADMIN"],
        teacher: ["TEACHER"],
        student: ["STUDENT"],
        parent: ["PARENT"],
      };

      const matchedRoles = allowedRoles[pathRole.toLowerCase()];
      if (matchedRoles && user && !matchedRoles.includes(user.role) && user.role !== "SUPER_ADMIN") {
        const roleLower = user.role.toLowerCase().replace("school_", "");
        return NextResponse.redirect(new URL(`/schools/${pathSchoolCode}/${roleLower}`, nextUrl));
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public).*)"],
};
