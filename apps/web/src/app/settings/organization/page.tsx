// apps/web/src/app/settings/organization/page.tsx
import Link from "next/link";
import { getApiAuthHeaders } from "@/lib/apiAuth";
import { OrganizationSettingsForm } from "./OrganizationSettingsForm";
import { AccountDeleteSection } from "./AccountDeleteSection";

const API_BASE =
  process.env.API_BASE_URL?.replace(/\/+$/, "") ??
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "") ??
  "http://127.0.0.1:3001";

type OrganizationMe = {
  id: string;
  name: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
  };
};

async function fetchOrganizationMe(): Promise<OrganizationMe | null> {
  try {
    const res = await fetch(`${API_BASE}/organizations/me`, {
      cache: "no-store",
      headers: await getApiAuthHeaders(),
    });

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

function roleLabel(role: OrganizationMe["role"]) {
  switch (role) {
    case "OWNER":
      return "オーナー";
    case "ADMIN":
      return "管理者";
    case "MEMBER":
      return "メンバー";
    default:
      return role;
  }
}

export default async function OrganizationSettingsPage() {
  const organization = await fetchOrganizationMe();

  if (!organization) {
    return (
      <div className="space-y-4">
        <div className="space-y-2 px-1">
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
          >
            ◀︎ ホームに戻る
          </Link>
          <h1 className="text-2xl font-bold leading-snug text-slate-900">
            アカウント設定
          </h1>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
          アカウント情報を取得できませんでした。ログイン状態を確認してください。
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 px-1">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm font-medium text-sky-600 hover:text-sky-700"
        >
          ◀︎ ホームに戻る
        </Link>
        <h1 className="text-2xl font-bold leading-snug text-slate-900">
          アカウント設定
        </h1>
        <p className="text-sm leading-6 text-slate-600">
          ログイン中のアカウント情報と、会社・業者名を確認・変更できます。
        </p>
      </div>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            会社・業者情報
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            この名前は、今後の共有申請・招待・連携設定の表示名として使う予定です。
          </p>
        </div>

        <OrganizationSettingsForm organization={organization} />
      </section>

      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900">
            ログイン情報
          </h2>
        </div>

        <dl className="space-y-3 text-sm">
          <div>
            <dt className="font-medium text-slate-500">ユーザー名</dt>
            <dd className="mt-1 text-slate-900">
              {organization.user.name ?? "未設定"}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">メールアドレス</dt>
            <dd className="mt-1 break-all text-slate-900">
              {organization.user.email}
            </dd>
          </div>

          <div>
            <dt className="font-medium text-slate-500">権限</dt>
            <dd className="mt-1">
              <span className="inline-flex rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700">
                {roleLabel(organization.role)}
              </span>
            </dd>
          </div>
        </dl>
      </section>

      <section className="space-y-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <h2 className="text-base font-bold text-slate-900">今後追加予定</h2>
        <ul className="space-y-2 text-sm leading-6 text-slate-600">
          <li>・共有申請</li>
          <li>・メンバー招待</li>
          <li>・取引先・外注先との連携設定</li>
        </ul>
      </section>

      <AccountDeleteSection />
    </div>
  );
}