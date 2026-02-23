import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

// 1. Specify protected and public routes
const protectedRoutes = [
  "/dashboard",
  "/movies",
  "/tickets",
  "/user-management",
];
const publicRoutes = ["/login/admin", "/"];

// Routes restricted to admin role only
const adminOnlyRoutes = ["/movies", "/user-management"];

export default async function middleware(req: NextRequest) {
  // 2. Check if the current route is protected or public
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((route) =>
    path.startsWith(route),
  );
  const isPublicRoute = publicRoutes.includes(path);

  // 3. Decrypt the session from the cookie
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  // 4. Redirect to /login/admin if the user is not authenticated
  if (isProtectedRoute && !session?.adminId) {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // 5. Role-based access control: block cashiers from admin-only routes
  if (isProtectedRoute && session?.adminId) {
    const isAdminOnly = adminOnlyRoutes.some((route) => path.startsWith(route));
    if (isAdminOnly && session.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
    }
  }

  // 6. Redirect to /dashboard if the user is authenticated
  if (
    isPublicRoute &&
    session?.adminId &&
    !req.nextUrl.pathname.startsWith("/dashboard")
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

// Routes Middleware should not run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
