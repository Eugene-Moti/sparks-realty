import type { Metadata } from "next";
import { LegalPage } from "@/components/content/legal-page";
import { getLegalDoc } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Sparks Properties collects, uses and protects your personal data under Kenya's Data Protection Act, 2019.",
  alternates: { canonical: "/privacy" },
};

/** Renders content/legal/privacy-policy.md (staff edit that file). */
export default async function PrivacyPage() {
  return <LegalPage doc={await getLegalDoc("privacy-policy")} path="/privacy" />;
}
