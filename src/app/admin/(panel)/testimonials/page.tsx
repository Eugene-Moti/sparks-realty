import type { Metadata } from "next";
import { TestimonialManager } from "@/components/admin/content/testimonial-manager";
import { requireStaff } from "@/lib/admin/auth";
import type { AdminTestimonial } from "@/lib/admin/labels";

export const metadata: Metadata = { title: "Testimonials" };

export default async function TestimonialsAdminPage() {
  const { supabase } = await requireStaff();
  const { data } = await supabase
    .from("testimonials")
    .select("id, author, role, quote, rating, avatar_url, published, sort_order")
    .order("sort_order")
    .order("created_at", { ascending: false });
  return <TestimonialManager items={(data ?? []) as AdminTestimonial[]} />;
}
