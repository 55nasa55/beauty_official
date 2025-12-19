import { useSupabase } from "@/app/providers";

export const supabaseClientComponent = () => {
  return useSupabase();
};
