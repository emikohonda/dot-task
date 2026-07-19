// apps/web/src/auth.ts
import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { Session } from "next-auth";
import type { JWT } from "next-auth/jwt";

const AUTH_SECRET = process.env.AUTH_SECRET;
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

async function syncUser(params: {
  email: string;
  name?: string | null;
  image?: string | null;
}): Promise<{ userId: string }> {
  if (!AUTH_SECRET) {
    throw new Error("AUTH_SECRET is not set");
  }

  const res = await fetch(`${API_BASE}/auth/sync-user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-bootstrap-secret": AUTH_SECRET,
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "ユーザー同期に失敗しました");
  }

  const data: unknown = await res.json();

  if (
    typeof data !== "object" ||
    data === null ||
    !("userId" in data) ||
    typeof (data as { userId: unknown }).userId !== "string"
  ) {
    throw new Error("ユーザー同期のレスポンスが不正です");
  }

  return { userId: (data as { userId: string }).userId };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;

      const isLoggedIn = !!auth?.user;

      const isPublicPath =
        pathname === "/login" ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/_next") ||
        pathname === "/favicon.ico" ||
        pathname === "/manifest.webmanifest" ||
        pathname === "/apple-touch-icon.png" ||
        pathname.startsWith("/icons/");

      if (isPublicPath) {
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (!token.userId) {
        const email = user?.email ?? token.email;

        if (!email) {
          throw new Error("ログインユーザーのメールアドレスを取得できませんでした");
        }

        const result = await syncUser({
          email,
          name: user?.name ?? token.name ?? null,
          image: user?.image ?? token.picture ?? null,
        });

        token.userId = result.userId;
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (!token.userId) {
        throw new Error("DBユーザーIDを取得できませんでした");
      }

      session.user.userId = token.userId;
      return session;
    },
  },
});
