"use client";

import { CircleNotchIcon } from "@phosphor-icons/react";
import type { EmailOtpType } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Finishes every email link Supabase sends:
 * - `?code=` (PKCE: sign-in links and resets started on this browser),
 * - `?token_hash=&type=` (custom email templates),
 * - `#access_token=…` (invitations sent by an admin).
 * Then continues to `next` (an /admin path only).
 */
export function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const nextParam = params.get("next") ?? "/admin";
    const next = nextParam.startsWith("/admin") && !nextParam.startsWith("//") ? nextParam : "/admin";
    const supabase = createClient();

    async function finish() {
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type") as EmailOtpType | null;
      const hash = new URLSearchParams(window.location.hash.slice(1));
      const hashType = hash.get("type");

      let error: unknown = null;
      if (code) {
        ({ error } = await supabase.auth.exchangeCodeForSession(code));
      } else if (tokenHash && type && OTP_TYPES.includes(type)) {
        ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
      } else if (hash.get("access_token") && hash.get("refresh_token")) {
        ({ error } = await supabase.auth.setSession({
          access_token: hash.get("access_token") as string,
          refresh_token: hash.get("refresh_token") as string,
        }));
      } else {
        error = new Error("No sign-in details in the link.");
      }

      if (error) {
        router.replace("/admin/login?reason=link-expired");
        return;
      }
      // New staff (invite) and resets choose a password first.
      const needsPassword = type === "invite" || type === "recovery" || hashType === "invite" || hashType === "recovery";
      router.replace(needsPassword ? "/admin/auth/set-password" : next);
      router.refresh();
    }

    void finish();
  }, [params, router]);

  return (
    <p role="status" className="flex items-center gap-3 text-muted">
      <CircleNotchIcon className="size-5 animate-spin motion-reduce:animate-none" /> Signing you in…
    </p>
  );
}
