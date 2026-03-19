// apps/web/src/lib/safeFetch.ts
export async function safeJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store", ...(init ?? {}) });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[safeJson] non-ok:", res.status, res.statusText, url, text);
      return null;
    }

    // JSONは素直に json() が一番堅い
    const contentType = res.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      return (await res.json()) as T;
    }

    // 念のため text→parse フォールバック
    const text = await res.text().catch(() => "");
    if (!text.trim()) return null;

    try {
      return JSON.parse(text) as T;
    } catch (e) {
      console.error("[safeJson] JSON.parse failed:", url, text);
      return null;
    }
  } catch (e) {
    // ✅ Abort は握りつぶさず上に投げる（StrictMode対策）
    if (e instanceof Error && e.name === "AbortError") throw e;

    console.error("[safeJson] fetch failed:", url, e);
    return null;
  }
}