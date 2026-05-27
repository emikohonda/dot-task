// apps/web/src/app/logout/page.tsx
import { signOut } from "@/auth";

export default function LogoutPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-sky-600">.TASK</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          ログアウト
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          現在のアカウントからログアウトします。
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/login" });
        }}
      >
        <button
          type="submit"
          className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-700"
        >
          ログアウトする
        </button>
      </form>
    </main>
  );
}