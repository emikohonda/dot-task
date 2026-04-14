// apps/web/src/components/FloatingAddButton.tsx
import Link from "next/link";
import { Plus } from "lucide-react";

type Props = {
  href: string;
  label?: string;
};

export function FloatingAddButton({ href, label = "予定を追加" }: Props) {
  return (
    <Link
      href={href}
      className="fixed bottom-[72px] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-sky-700 active:scale-95 md:hidden"
      aria-label={label}
    >
      <Plus className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}