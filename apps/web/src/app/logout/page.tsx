// apps/web/src/app/logout/page.tsx
import { signOut } from "@/auth";
import { LogoutButton } from "./LogoutButton";

export default function LogoutPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100svh-9rem)] max-w-md flex-col items-center justify-center gap-6 px-6 pb-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900">
          ログアウト
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          現在のアカウントからログアウトします。
          <br />
          よろしいですか？
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <LogoutButton />
      </form>
    </main>
  );
}