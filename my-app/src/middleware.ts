/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_request: NextRequest) {
  // Temporary bypass while backend auth is unavailable
  return NextResponse.next();
}

export const config = {
  matcher: ["/discover/:path*", "/profile/:path*", "/settings/:path*"],
};



// // ####### It is intended to be used for authentication middleware ####### 
// import { NextResponse } from "next/server";
// import type { NextRequest } from "next/server";

// // Routes that require the user to be authenticated
// const PROTECTED_PREFIXES = ["/discover", "/profile", "/settings"];

// export function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   const isProtected = PROTECTED_PREFIXES.some(
//     (prefix) => pathname === prefix || pathname.startsWith(prefix + "/"),
//   );

//   if (!isProtected) {
//     return NextResponse.next();
//   }
//   // The backend sets an httpOnly `access_token` cookie.
//   // Middleware runs server-side so it CAN read httpOnly cookies from the
//   // incoming request headers — this does NOT expose them to browser JS.
//   const hasToken = request.cookies.has("access_token");

//   if (!hasToken) {
//     const redirectUrl = request.nextUrl.clone();
//     redirectUrl.pathname = "/";
//     return NextResponse.redirect(redirectUrl);
//   }

//   return NextResponse.next();
// }

// export const config = {
//   // Only run middleware on protected paths — skip static assets and API routes
//   matcher: ["/discover/:path*", "/profile/:path*", "/settings/:path*"],
// };
