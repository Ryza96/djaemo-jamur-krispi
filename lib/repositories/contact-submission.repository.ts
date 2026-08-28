import { supabase } from "@/lib/supabase";

export const ContactSubmissionRepository = {
  async countRecent(identifier: string, sinceIso: string): Promise<number> {
    const { count, error } = await supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .eq("identifier", identifier)
      .gte("submitted_at", sinceIso);

    if (error) throw error;
    return count ?? 0;
  },

  async record(identifier: string): Promise<void> {
    const { error } = await supabase
      .from("contact_submissions")
      .insert({ identifier });

    if (error) throw error;
  },

  async deleteExpired(beforeIso: string): Promise<void> {
    const { error } = await supabase
      .from("contact_submissions")
      .delete()
      .lt("submitted_at", beforeIso);

    if (error) throw error;
  },
};
