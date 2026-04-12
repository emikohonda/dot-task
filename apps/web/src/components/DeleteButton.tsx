// apps/web/src/components/DeleteButton.tsx
"use client";

import * as React from "react";
import { Trash2, X } from "lucide-react";

type Props = {
    label: string;
    loading: boolean;
    disabled?: boolean;
    onConfirm: () => void;
};

function ConfirmDialog({
    label,
    loading,
    onConfirm,
    onCancel,
}: {
    label: string;
    loading: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}) {
    React.useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !loading) onCancel();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [loading, onCancel]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => !loading && onCancel()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
        >
            <div
                className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between">
                    <h2
                        id="delete-dialog-title"
                        className="text-base font-bold text-slate-900"
                    >
                        この{label}を削除しますか？
                    </h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="ml-2 rounded-lg p-1 text-slate-400 hover:text-slate-600 disabled:opacity-40"
                        aria-label="閉じる"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <p className="mt-2 text-sm text-slate-600">
                    削除すると元に戻せません。
                    <br />
                    本当に削除しますか？
                </p>

                <div className="mt-5 flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="flex-1 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                    >
                        キャンセル
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (loading) return;
                            onCancel();
                            onConfirm();
                        }}
                        disabled={loading}
                        className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-40"
                    >
                        {loading ? "削除中…" : "削除する"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function DeleteButton({
    label,
    loading,
    disabled = false,
    onConfirm,
}: Props) {
    const [dialogOpen, setDialogOpen] = React.useState(false);

    return (
        <>
            <button
                type="button"
                onClick={() => {
                    if (!disabled && !loading) setDialogOpen(true);
                }}
                disabled={disabled || loading}
                className="min-h-[44px] inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <Trash2 className="h-4 w-4" />
                {label}を削除
            </button>

            {dialogOpen && (
                <ConfirmDialog
                    label={label}
                    loading={loading}
                    onConfirm={onConfirm}
                    onCancel={() => !loading && setDialogOpen(false)}
                />
            )}
        </>
    );
}