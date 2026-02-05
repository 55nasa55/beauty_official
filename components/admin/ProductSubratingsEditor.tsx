"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProductSubratingsEditor({ productId }: { productId: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    const res = await fetch("/api/reviews/subratings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });

    const data = await res.json();
    setSubs(data.subratings || []);
  };

  useEffect(() => {
    load();
  }, [productId]);

  const add = async () => {
    if (!newName.trim()) return;

    setLoading(true);

    await fetch("/api/admin/review-subratings/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, name: newName }),
    });

    setNewName("");
    await load();
    setLoading(false);
  };

  const remove = async (id: string) => {
    setLoading(true);

    await fetch("/api/admin/review-subratings/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    await load();
    setLoading(false);
  };

  const move = async (id: string, direction: "up" | "down") => {
    setLoading(true);

    await fetch("/api/admin/review-subratings/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, id, direction }),
    });

    await load();
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded border space-y-4">
      <h4 className="font-medium mb-2">Subrating Criteria</h4>

      {subs.length === 0 && (
        <p className="text-sm text-gray-500">No subrating criteria yet.</p>
      )}

      <div className="space-y-2">
        {subs.map((s, idx) => (
          <div
            key={s.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded border"
          >
            <span>{s.name}</span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={idx === 0 || loading}
                onClick={() => move(s.id, "up")}
              >
                ↑
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={idx === subs.length - 1 || loading}
                onClick={() => move(s.id, "down")}
              >
                ↓
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => remove(s.id)}
                disabled={loading}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="New subrating name (e.g., Scent, Texture)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button onClick={add} disabled={loading || !newName.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
