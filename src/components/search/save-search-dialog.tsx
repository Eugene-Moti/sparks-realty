"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BellRingingIcon } from "@phosphor-icons/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { DynamicButton, type DynamicButtonState } from "@/components/motion/dynamic-button";
import { ConsentFields } from "@/components/privacy/consent-fields";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { consentDefaults, HONEYPOT_FIELD } from "@/lib/validation/consent";
import { track } from "@/lib/analytics";
import { type SavedSearchValues, savedSearchSchema } from "@/lib/validation/saved-search";

type FormValues = SavedSearchValues & { [HONEYPOT_FIELD]?: string };

/** "Save this search" → email alerts when a matching home is listed. */
export function SaveSearchDialog({
  summary,
  triggerVariant = "ghost",
  triggerLabel = "Save search",
}: {
  summary: string;
  triggerVariant?: "ghost" | "gold-outline" | "green-solid";
  triggerLabel?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<DynamicButtonState>("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(savedSearchSchema),
    defaultValues: { email: "", query: "", path: "/", ...consentDefaults, [HONEYPOT_FIELD]: "" },
  });
  const emailError = form.formState.errors.email?.message;

  async function onSubmit(values: FormValues) {
    setState("loading");
    setServerError(null);
    try {
      const res = await fetch("/api/saved-searches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data: { ok: boolean; error?: string } = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Something went wrong.");
      setState("success");
      track("saved_search", { page_path: window.location.pathname });
      window.setTimeout(() => {
        setOpen(false);
        setState("idle");
        form.reset();
      }, 1800);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong.");
      setState("error");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          form.setValue("query", searchParams.toString());
          form.setValue("path", pathname);
        }
        setOpen(o);
      }}
    >
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="md">
          <BellRingingIcon />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Get alerts for this search</DialogTitle>
          <DialogDescription>
            We&apos;ll email you when a new home matches: <span className="text-foreground">{summary}</span>.
          </DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="relative flex flex-col gap-5">
            <Field label="Email" required error={emailError}>
              {(ids) => <Input {...ids} type="email" autoComplete="email" inputMode="email" {...form.register("email")} />}
            </Field>
            <ConsentFields />
            {serverError ? (
              <p role="alert" className="text-danger text-sm">
                {serverError}
              </p>
            ) : null}
            <div>
              <DynamicButton
                state={state}
                labels={{ idle: "Save search", loading: "Saving…", success: "Saved", error: "Try again" }}
              />
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
