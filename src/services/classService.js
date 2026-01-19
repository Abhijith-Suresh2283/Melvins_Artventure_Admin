import { supabase } from "../lib/supabaseClient";

export const classService = {
  async getAll() {
    const { data, error } = await supabase
      .from("classes")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async create(payload) {
    const { data, error } = await supabase
      .from("classes")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async remove(id) {
    const { error } = await supabase.from("classes").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
