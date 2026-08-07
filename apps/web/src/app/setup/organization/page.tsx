// apps/web/src/app/setup/organization/page.tsx
import Link from "next/link";
import { OrganizationSetupForm } from "./OrganizationSetupForm";

export default function OrganizationSetupPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="space-y-5 px-1 text-center">
        <h1 className="text-3xl font-bold leading-snug text-sky-600">
          .TASKにようこそ
        </h1>
        <p className="text-2xl font-semibold text-slate-900">
          新規登録
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <OrganizationSetupForm />
      </section>

      <div className="text-center">
        <Link
          href="/logout"
          className="text-sm font-medium text-slate-500 underline-offset-4 hover:text-slate-700 hover:underline"
        >
          ログアウト
        </Link>
      </div>
    </div>
  );
}
