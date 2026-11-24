"use client";

import { ErrorView } from "@/components/content/error-view";

export default function AdminError({ error, retry }: { error: unknown; retry: () => void }) {
  return <ErrorView error={error} retry={retry} scope="admin" />;
}
