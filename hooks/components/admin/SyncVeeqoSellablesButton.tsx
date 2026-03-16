"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function SyncVeeqoSellablesButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runSync() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/admin/sync-veeqo-sellables", {
        method: "POST",
        credentials: "include"
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setResult(
        `Synced: ${data.synced} | Updated: ${data.updated} | Skipped: ${data.skipped}`
      );
    } catch (err: any) {
      setResult(err.message || "Sync failed");
    }

    setLoading(false);
  }

  return (
    <div className="flex items-center gap-4">
      <Button onClick={runSync} disabled={loading}>
        {loading ? "Syncing Veeqo…" : "Sync Veeqo SKUs"}
      </Button>

      {result && (
        <span className="text-sm text-gray-600">{result}</span>
      )}
    </div>
  );
}
