import { supabase } from "@/lib/supabase";

interface CustomerRow {
  id: number;
  email: string;
  name: string;
  phone: string;
  address: string;
}

export const CustomerRepository = {
  async upsert(params: {
    email: string;
    name: string;
    phone: string;
    address: string;
  }): Promise<CustomerRow> {
    const { data, error } = params.email
      ? await supabase
          .from("customers")
          .upsert(
            {
              email: params.email,
              name: params.name,
              phone: params.phone,
              address: params.address,
            },
            { onConflict: "email" },
          )
          .select()
          .single()
        : await supabase
            .from("customers")
            .insert({
              email: params.email || null,
              name: params.name,
              phone: params.phone,
              address: params.address,
            })
          .select()
          .single();

    if (error) throw error;
    return data;
  },
};
