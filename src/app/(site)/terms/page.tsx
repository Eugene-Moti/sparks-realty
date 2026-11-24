import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "The terms that apply when you use the Sparks Properties website, listings, enquiries and short-stay requests.",
  alternates: { canonical: "/terms" },
};

/** Renders content/legal/terms.md (staff edit that file). */
export default async function TermsPage() {
  return <LegalPage doc={await getLegalDoc("terms")} path="/terms" />;
}
