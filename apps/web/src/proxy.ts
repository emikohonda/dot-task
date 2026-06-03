// apps/web/src/proxy.ts
export { auth as proxy } from "@/auth";

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|manifest.webmanifest|apple-touch-icon.png|icons/).*)",
  ],
};