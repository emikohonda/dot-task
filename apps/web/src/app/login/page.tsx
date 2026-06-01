// apps/web/src/app/login/page.tsx
import { signIn } from "@/auth";
import { LoginButton } from "./LoginButton";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="text-sm font-semibold text-sky-600">.TASK</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          ログイン
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Googleアカウントでログインして、.TASKを利用します。
        </p>
      </div>

      <form
        action={async () => {
          "use server";
          await signIn("google", { redirectTo: "/" });
        }}
      >
        <LoginButton />
      </form>
    </main>
  );
}