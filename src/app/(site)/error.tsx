"use client";

import { ErrorView } from "@/components/content/error-view";

export default function SiteError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />;
}
