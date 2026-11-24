"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const password = String(data.get("password") ?? "");
    const confirm = String(data.get("confirm") ?? "");
    if (password.length < 10) return setError("Use at least 10 characters.");
    if (password !== confirm) return setError("The two passwords don't match.");

    setPending(true);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (err) {
      setError(
        err.message.toLowerCase().includes("session")
          ? "Your link has expired. Ask for a new one from the sign-in page."
          : "Couldn't save that password. Try a different one.",
      );
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <Field label="New password" required>
        {(ids) => <Input {...ids} name="password" type="password" autoComplete="new-password" minLength={10} required className="h-12" />}
      </Field>
      <Field label="Type it again" required>
        {(ids) => <Input {...ids} name="confirm" type="password" autoComplete="new-password" minLength={10} required className="h-12" />}
      </Field>
      {error ? (
        <p role="alert" className="font-medium text-danger text-sm">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="green-solid" size="lg" disabled={pending}>
        {pending ? "Saving…" : "Save and continue"}
      </Button>
    </form>
  );
}
