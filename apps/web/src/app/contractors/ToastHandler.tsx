"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toast } from "@/components/Toast";

export function ToastHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("toast") === "deleted") {
      setToastOpen(true);

      // URLからtoastを消す（履歴を汚さない）
      const params = new URLSearchParams(searchParams.toString());
      params.delete("toast");
      router.replace(`/contractors${params.toString() ? `?${params}` : ""}`);
    }
  }, [searchParams, router]);

  return (
    <Toast
      show={toastOpen}
      message="削除しました"
      onClose={() => setToastOpen(false)}
    />
  );
}