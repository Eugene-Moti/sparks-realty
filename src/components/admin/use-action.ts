"use client";

import { useCallback, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/admin/auth";

/**
 * Run a server action with a pending flag and toasts.
 * `run(() => saveThing(values), { success: "Saved" })` → resolves to the result.
 */
export function useAction() {
  const [pending, startTransition] = useTransition();

  const run = useCallback(
    <T,>(
      fn: () => Promise<ActionResult<T>>,
      opts: { success?: string; onSuccess?: (data: T) => void; onError?: (r: Extract<ActionResult<T>, { ok: false }>) => void } = {},
    ) =>
      new Promise<ActionResult<T>>((resolve) => {
        startTransition(async () => {
          let result: ActionResult<T>;
          try {
            result = await fn();
          } catch {
            result = { ok: false, error: "Couldn't reach the server. Check your connection and try again." };
          }
          if (result.ok) {
            if (opts.success) toast.success(opts.success);
            opts.onSuccess?.(result.data);
          } else {
            toast.error(result.error);
            opts.onError?.(result);
          }
          resolve(result);
        });
      }),
    [],
  );

  return { pending, run };
}
