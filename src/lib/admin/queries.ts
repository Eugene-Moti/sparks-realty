import "server-only";

import type { requireStaff } from "./auth";

type Client = Awaited<ReturnType<typeof requireStaff>>["supabase"];

export type Option = { value: string; label: string };

/** Areas for selects, in the staff-defined order. */
export async function areaOptions(supabase: Client): Promise<Option[]> {
  const { data } = await supabase.from("areas").select("id, name").order("sort_order").order("name");
  return (data ?? []).map((a) => ({ value: a.id as string, label: a.name as string }));
}

/** Staff who can be assigned listings and leads. */
export async function agentOptions(supabase: Client): Promise<Option[]> {
  const { data } = await supabase.from("profiles").select("id, full_name, role").in("role", ["admin", "agent"]).order("full_name");
  return (data ?? []).map((p) => ({ value: p.id as string, label: (p.full_name as string | null) || "Unnamed team member" }));
}
