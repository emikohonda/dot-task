// apps/web/src/app/contractors/page.tsx
import Link from "next/link";

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {action ? <div className="sm:shrink-0">{action}</div> : null}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      {children}
    </div>
  );
}

function EmptyState({
  title,
  description,
  cta,
}: {
  title: string;
  description: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <p className="text-base font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
      {cta ? <div className="mt-5 flex justify-center">{cta}</div> : null}
    </div>
  );
}

export default function Page() {
  const contractors: Array<{ id: string; name: string }> = []; // ✅次のステップで API から取ってくる

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <PageHeader
        title="外注先"
        description="外注先の情報をまとめて管理します。"
        action={
          <Link
            href="/contractors/new"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-medium text-white hover:bg-slate-800 active:bg-slate-900"
          >
            追加する
          </Link>
        }
      />

      {contractors.length === 0 ? (
        <EmptyState
          title="まだ外注先が登録されていません"
          description="最初の外注先を登録しておくと、人員・単価・請求の入力がラクになります。"
          cta={
            <Link
              href="/contractors/new"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              最初の1社を登録
            </Link>
          }
        />
      ) : (
        <Card>
          <div className="text-sm text-slate-700">（ここに一覧UIが入ります）</div>
        </Card>
      )}
    </div>
  );
}