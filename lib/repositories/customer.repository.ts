import { supabase } from "@/lib/supabase";

interface CustomerRow {
  id: number;
  email: string | null;
  name: string;
  phone: string;
  address: string;
}

function normalizeEmail(email: string): string | null {
  const trimmed = (email ?? "").trim();
  return trimmed === "" ? null : trimmed;
}

export const CustomerRepository = {
  async upsert(params: {
    email: string;
    name: string;
    phone: string;
    address: string;
  }): Promise<CustomerRow> {
    const { data, error } = await supabase
      .from("customers")
      .upsert(
        {
          email: normalizeEmail(params.email),
          name: params.name,
          phone: params.phone,
          address: params.address,
        },
        { onConflict: "email" },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
