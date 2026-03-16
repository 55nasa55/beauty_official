import React from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FAQContent } from "@/components/faq/FAQContent";
import { supabasePublic } from "@/lib/supabase/public";

export default async function FAQPage() {
  const { data: categories } = await supabasePublic.from("categories").select("*");
  const { data: brands } = await supabasePublic.from("brands").select("*");
  const { data: collections } = await supabasePublic.from("collections").select("*");

  return (
    <>
      <Header categories={categories ?? []} brands={brands ?? []} collections={collections ?? []} />
      <main>
        <FAQContent />
      </main>
      <Footer />
    </>
  );
}
