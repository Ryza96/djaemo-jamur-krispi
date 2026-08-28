import { supabase } from "@/lib/supabase";

export interface LoginAttemptRow {
  id: string;
  identifier: string;
  username: string | null;
  attempted_at: string;
}

export const AdminLoginAttemptRepository = {
  async countRecent(identifier: string, sinceIso: string): Promise<number> {
    const { count, error } = await supabase
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("identifier", identifier)
      .gte("attempted_at", sinceIso);

    if (error) throw error;
    return count ?? 0;
  },

  async record(identifier: string, username: string | null): Promise<void> {
    const { error } = await supabase
      .from("admin_login_attempts")
      .insert({ identifier, username });

    if (error) throw error;
  },

  async deleteByIdentifier(identifier: string): Promise<void> {
    const { error } = await supabase
      .from("admin_login_attempts")
      .delete()
      .eq("identifier", identifier);

    if (error) throw error;
  },

  async deleteExpired(beforeIso: string): Promise<void> {
    const { error } = await supabase
      .from("admin_login_attempts")
      .delete()
      .lt("attempted_at", beforeIso);

    if (error) throw error;
  },
};