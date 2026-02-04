import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { maskEmail } from "@/lib/mask";
import { Button } from "@/components/ui/button";

export default async function MyReviewsPage() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const userRes = await supabase.auth.getUser();
  const user = userRes.data.user;

  if (!user) {
    return <p className="p-6">Please log in to view your reviews.</p>;
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-medium">My Reviews</h1>

      {(!reviews || reviews.length === 0) && (
        <p className="text-gray-500">You have not written any reviews yet.</p>
      )}

      {reviews && reviews.map((r: any) => (
        <div key={r.id} className="border rounded p-4 bg-white">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">{maskEmail(r.user_email)}</p>
              <p className="text-sm text-gray-500">
                {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>

            {/* Delete */}
            <form action="/api/reviews/delete" method="POST">
              <input type="hidden" name="reviewId" readOnly value={r.id} />
              <Button
                variant="destructive"
                size="sm"
                type="submit"
              >
                Delete
              </Button>
            </form>
          </div>

          <p className="mt-2 text-sm">{r.body}</p>

          {r.images?.length > 0 && (
            <div className="flex gap-2 mt-3">
              {r.images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  className="w-16 h-16 rounded object-cover"
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
