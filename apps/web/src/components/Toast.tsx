// apps/web/src/components/Toast.tsx
"use client";

import { useEffect, useState } from "react";

type ToastProps = {
  message: string;
  show: boolean;
  onClose: () => void;
};

export function Toast({ message, show, onClose }: ToastProps) {
  const [open, setOpen] = useState(show);

  // 親から show が変わったら同期
  useEffect(() => {
    setOpen(show);
  }, [show]);

  // 自動クローズ（3秒）
  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      setOpen(false);
      onClose();
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    // 画面上中央・最前面。背景操作は邪魔しない
    <div className="fixed inset-x-0 top-10 z-[100] flex justify-center px-4 pointer-events-none">
      <div
        className="
          pointer-events-auto
          flex items-center gap-3
          rounded-full bg-slate-800/95 px-6 py-3
          text-sm font-bold text-white
          shadow-2xl
        "
      >
        {/* 成功アイコン */}
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-[11px] text-white">
          ✓
        </span>

        {/* メッセージ */}
        <span>{message}</span>

        {/* 閉じる */}
        <button
          type="button"
          aria-label="閉じる"
          onClick={() => {
            setOpen(false);
            onClose();
          }}
          className="
            ml-2 inline-flex h-8 w-8 items-center justify-center
            border-l border-slate-700 pl-3
            text-slate-400 hover:text-white
            transition-colors
          "
        >
          ✕
        </button>
      </div>
    </div>
  );
}