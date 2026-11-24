"use client";

import { ArrowLeftIcon, EnvelopeSimpleIcon, SignInIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import {
  type AuthFormState,
  sendMagicLink,
  sendPasswordReset,
  signInWithPassword,
  signOut,
} from "@/lib/admin/actions/auth";

type Mode = "password" | "link" | "reset";

const REASONS: Record<string, string> = {
  "not-staff": "This account isn't set up as Sparks Properties staff yet. Ask an admin to invite you, or sign in with another account.",
  "link-expired": "That link has expired or was already used. Request a new one below.",
};

export function LoginForm() {
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";
  const reason = params.get("reason");
  const [mode, setMode] = useState<Mode>("password");
  const [email, setEmail] = useState("");

  const [pwState, pwAction, pwPending] = useActionState<AuthFormState, FormData>(signInWithPassword, {});
  const [linkState, linkAction, linkPending] = useActionState<AuthFormState, FormData>(sendMagicLink, {});
  const [resetState, resetAction, resetPending] = useActionState<AuthFormState, FormData>(sendPasswordReset, {});

  const state = mode === "password" ? pwState : mode === "link" ? linkState : resetState;
  const pending = pwPending || linkPending || resetPending;

  return (
    <div className="flex flex-col gap-6">
      {reason && REASONS[reason] ? (
        <div role="status" className="flex flex-col gap-3 rounded-2xl border border-gold-600/30 bg-gold-100/60 p-4 text-sm">
          <p>{REASONS[reason]}</p>
          {reason === "not-staff" ? (
            <form action={signOut}>
              <Button type="submit" variant="link" size="sm">
                Sign out of this account
              </Button>
            </form>
          ) : null}
        </div>
      ) : null}

      <form
        action={mode === "password" ? pwAction : mode === "link" ? linkAction : resetAction}
        className="flex flex-col gap-5"
        noValidate
      >
        <input type="hidden" name="next" value={next} />
        <Field label="Work email" required>
          {(ids) => (
            <Input
              {...ids}
              name="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12"
            />
          )}
        </Field>

        {mode === "password" ? (
          <Field label="Password" required>
            {(ids) => <Input {...ids} name="password" type="password" autoComplete="current-password" required className="h-12" />}
          </Field>
        ) : null}

        {state.error ? (
          <p role="alert" className="font-medium text-danger text-sm">
            {state.error}
          </p>
        ) : null}
        {state.message ? (
          <p role="status" className="rounded-2xl bg-green-50 p-4 text-green-800 text-sm">
            {state.message}
          </p>
        ) : null}

        <Button type="submit" variant={mode === "password" ? "solid" : "green-solid"} size="lg" disabled={pending} className="w-full">
          {mode === "password" ? <SignInIcon weight="bold" /> : <EnvelopeSimpleIcon weight="bold" />}
          {pending ? "Please wait…" : mode === "password" ? "Sign in" : mode === "link" ? "Email me a sign-in link" : "Email me a reset link"}
        </Button>
      </form>

      <div className="flex flex-col items-start gap-2 border-hairline border-t pt-5 text-sm">
        {mode === "password" ? (
          <>
            <button type="button" onClick={() => setMode("link")} className="text-accent underline-offset-4 hover:underline">
              Email me a sign-in link instead
            </button>
            <button type="button" onClick={() => setMode("reset")} className="text-muted underline-offset-4 hover:text-foreground hover:underline">
              Forgot your password?
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => setMode("password")}
            className="inline-flex items-center gap-1.5 text-accent underline-offset-4 hover:underline"
          >
            <ArrowLeftIcon /> Sign in with a password
          </button>
        )}
        <Link href="/" className="mt-3 text-muted text-xs hover:text-foreground">
          ← Back to the Sparks Properties website
        </Link>
      </div>
    </div>
  );
}
