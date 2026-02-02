"use client";

import { useRef, useState } from "react";
import { Share2 } from "lucide-react";

type Props = {
  className?: string;
};

export function ShareCurrentViewButton({ className }: Props) {
  const [msg, setMsg] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const show = (text: string) => {
    setMsg(text);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setMsg(null), 1800);
  };

  const copyText = async (text: string) => {
    // ✅ 基本：Clipboard API（HTTPS or localhost で動く）
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    // ✅ フォールバック（iOS/Safariなどで clipboard が死ぬケース用）
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    if (!ok) throw new Error("Copy failed");
  };

  const onClick = async () => {
    const url = window.location.href;

    // ✅ share を試す条件（iOS含めて安全）
    const canNativeShare =
      typeof navigator !== "undefined" &&
      "share" in navigator &&
      typeof (navigator as any).share === "function" &&
      (!("canShare" in navigator) || (navigator as any).canShare?.({ url }));

    if (canNativeShare) {
      try {
        await (navigator as any).share({
          title: "ページを共有",
          text: "今表示しているカレンダーです",
          url,
        });
        return; // 共有が開けたら終了（成功/キャンセルは問わない）
      } catch (e) {
        // ✅ iOSはキャンセルや権限系でも例外になることがある → コピーへフォールバック
      }
    }

    // ✅ フォールバック：コピー
    try {
      await copyText(url);
      show("URLをコピーしました");
    } catch {
      show("共有に失敗しました");
    }
  };

  return (
    <div className={`relative ${className ?? ""}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-2 rounded-full
             bg-emerald-600 px-4 py-2
             text-sm font-semibold text-white
             shadow-sm hover:bg-emerald-700
             active:scale-[0.99]"
      >
        <Share2 size={16} />
        ページを共有
      </button>

      {msg && (
        <div className="pointer-events-none absolute right-0 top-[calc(100%+8px)] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-sm">
          {msg}
        </div>
      )}
    </div>
  );
}