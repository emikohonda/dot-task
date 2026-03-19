// apps/web/src/app/employees/ToastHandler.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toast } from "@/components/Toast";

export function ToastHandler({ basePath }: { basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    const toast = searchParams.get("toast");
    if (toast === "deleted") {
      setToastMessage("削除しました");
      setToastOpen(true);
    } else if (toast === "updated") {
      setToastMessage("更新しました");
      setToastOpen(true);
    } else if (toast === "created") {
      setToastMessage("追加しました");
      setToastOpen(true);
    }

    if (toast) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      router.replace(`${basePath}${params.toString() ? `?${params}` : ""}`);
    }
  }, [searchParams, router, basePath]);

  return (
    <Toast
      show={toastOpen}
      message={toastMessage}
      onClose={() => setToastOpen(false)}
    />
  );
}
