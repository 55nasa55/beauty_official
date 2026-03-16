import { cookies } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { supabasePublic } from '@/lib/supabase/public';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { Category, Brand, Collection } from '@/lib/database.types';

export default async function MyReviewsPage() {
  const cookieStore = cookies();
  const supabase = createSupabaseServerClient(cookieStore);
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes.user;

  if (!user) return <p className="p-4">Please log in to view your reviews.</p>;

  const [categoriesResult, brandsResult, collectionsResult] = await Promise.all([
    supabasePublic.from('categories').select('*').order('name'),
    supabasePublic.from('brands').select('*').order('name'),
    supabasePublic.from('collections').select('*').eq('display_on_home', true).order('sort_order'),
  ]);

  const categories: Category[] = categoriesResult.data || [];
  const brands: Brand[] = brandsResult.data || [];
  const collections: Collection[] = collectionsResult.data || [];

  const { data: reviews } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      body,
      images,
      created_at,
      review_subratings (
        subrating_id,
        value
      )
    `)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-screen flex flex-col">
      <Header categories={categories} brands={brands} collections={collections} />

      <main className="flex-1">
        <div className="p-6 space-y-6 max-w-xl mx-auto">
          <h1 className="text-xl font-semibold mb-4">My Reviews</h1>

      {(!reviews || reviews.length === 0) && (
        <p className="text-sm text-gray-500">You haven't written any reviews yet.</p>
      )}

      {reviews?.map((r) => (
        <div key={r.id} className="border p-4 rounded bg-gray-50">
          <p className="font-medium text-lg">
            {"★".repeat(r.rating)}
            {"☆".repeat(5 - r.rating)}
          </p>

          {r.review_subratings?.length > 0 && (
            <div className="space-y-1 text-sm mt-2">
              {r.review_subratings.map((s) => (
                <p key={s.subrating_id}>
                  Subrating {s.subrating_id}: {s.value}★
                </p>
              ))}
            </div>
          )}

          <p className="mt-3 text-sm text-gray-800">{r.body}</p>

          {r.images?.length > 0 && (
            <div className="flex gap-2 mt-3">
              {r.images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img}
                  className="w-20 h-20 object-cover rounded border"
                />
              ))}
            </div>
          )}

          <form method="POST" action="/api/reviews/delete" className="mt-4">
            <input type="hidden" name="reviewId" value={r.id} />
            <button className="text-red-500 text-sm underline">
              Delete Review
            </button>
          </form>
        </div>
      ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
