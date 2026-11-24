"use client";

import { EyeIcon, PaperPlaneTiltIcon, PencilSimpleIcon, UserMinusIcon } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";
import { RelativeTime } from "@/components/admin/relative-time";
import { PageHeader, Pill, useConfirm } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { inviteStaff, removeStaff } from "@/lib/admin/actions/team";
import { roleDescriptions, roleLabels, STAFF_ROLES, type StaffRole } from "@/lib/admin/roles";
import { formatPhoneDisplay } from "@/lib/format";
import type { ProfileRow } from "@/types/db";

export type TeamMember = ProfileRow & { email: string | null; lastSignIn: string | null };

const roleTone = { admin: "ink", agent: "gold", editor: "muted" } as const;

export function TeamList({ members, meId, isAdmin }: { members: TeamMember[]; meId: string; isAdmin: boolean }) {
  const router = useRouter();
  const confirm = useConfirm();
  const { run } = useAction();
  const [inviteOpen, setInviteOpen] = useState(false);

  async function remove(m: TeamMember) {
    const yes = await confirm({
      title: `Remove ${m.full_name ?? "this person"}'s access?`,
      description: "They're signed out and can no longer open the admin. Their listings and leads stay; reassign them afterwards.",
      confirmLabel: "Remove access",
      destructive: true,
    });
    if (yes) await run(() => removeStaff(m.id), { success: "Access removed.", onSuccess: () => router.refresh() });
  }

  return (
    <>
      <PageHeader
        eyebrow="Company"
        title="Team"
        description="Everyone with access to the admin. Turn on “Show on Our Team” to list someone on the website with their photo and bio."
        actions={
          <>
            <Button asChild variant="ghost" className="border border-border">
              <Link href="/admin/team/me">
                <PencilSimpleIcon /> Edit my profile
              </Link>
            </Button>
            {isAdmin ? (
              <Button variant="green-solid" onClick={() => setInviteOpen(true)}>
                <PaperPlaneTiltIcon weight="bold" /> Invite
              </Button>
            ) : null}
          </>
        }
      />

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {members.map((m) => (
          <li key={m.id} className="flex flex-col gap-4 rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft">
            <div className="flex items-center gap-4">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-full bg-ink">
                {m.avatar_url ? (
                  <Image src={m.avatar_url} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="grid size-full place-items-center font-display text-2xl text-gold">{(m.full_name ?? "?").slice(0, 1)}</span>
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-xl">
                  {m.full_name ?? "Unnamed"}
                  {m.id === meId ? <span className="ml-2 font-sans text-muted text-xs">(you)</span> : null}
                </p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Pill tone={roleTone[m.role]}>{roleLabels[m.role]}</Pill>
                  {m.is_public ? (
                    <Pill tone="green">
                      <EyeIcon /> On website
                    </Pill>
                  ) : null}
                </div>
              </div>
            </div>
            <dl className="grid gap-1 text-sm">
              {m.email ? <dd className="truncate text-muted">{m.email}</dd> : null}
              {m.phone ? <dd className="font-mono text-muted text-xs">{formatPhoneDisplay(m.phone)}</dd> : null}
              {isAdmin ? (
                <dd className="text-muted text-xs">
                  {m.lastSignIn ? (
                    <>
                      Last signed in <RelativeTime iso={m.lastSignIn} />
                    </>
                  ) : (
                    "Hasn't signed in yet"
                  )}
                </dd>
              ) : null}
            </dl>
            {isAdmin || m.id === meId ? (
              <div className="mt-auto flex gap-2 border-hairline border-t pt-3">
                <Button asChild size="sm" variant="ghost" className="border border-border">
                  <Link href={`/admin/team/${m.id}`}>
                    <PencilSimpleIcon /> Edit
                  </Link>
                </Button>
                {isAdmin && m.id !== meId ? (
                  <Button size="sm" variant="ghost" className="text-danger hover:bg-danger/8" onClick={() => void remove(m)}>
                    <UserMinusIcon /> Remove
                  </Button>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ul>

      {isAdmin ? <InviteDialog open={inviteOpen} onOpenChange={setInviteOpen} onInvited={() => router.refresh()} /> : null}
    </>
  );
}

function InviteDialog({ open, onOpenChange, onInvited }: { open: boolean; onOpenChange: (o: boolean) => void; onInvited: () => void }) {
  const { pending, run } = useAction();
  const [role, setRole] = useState<StaffRole>("agent");
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    await run(() => inviteStaff({ email: d.get("email"), full_name: d.get("full_name"), role }), {
      onSuccess: ({ existing }) => {
        setErrors({});
        form.reset();
        onOpenChange(false);
        onInvited();
        toast.success(existing ? "They already had an account — access granted. They can sign in now." : "Invitation sent. The link expires in 24 hours.");
      },
      onError: (r) => setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a team member</DialogTitle>
          <DialogDescription>They get an email to set a password, then land in the admin.</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
          <Field label="Name" required error={errors.full_name}>
            {(ids) => <Input {...ids} name="full_name" autoComplete="off" className="h-11 text-sm" />}
          </Field>
          <Field label="Work email" required error={errors.email}>
            {(ids) => <Input {...ids} name="email" type="email" autoComplete="off" className="h-11 text-sm" />}
          </Field>
          <Field label="Role" hint={roleDescriptions[role]}>
            {(ids) => (
              <Select
                {...ids}
                value={role}
                onChange={(e) => setRole(e.target.value as StaffRole)}
                options={STAFF_ROLES.map((r) => ({ value: r, label: roleLabels[r] }))}
                className="[&_select]:h-11 [&_select]:text-sm"
              />
            )}
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="green-solid" disabled={pending}>
              {pending ? "Sending…" : "Send invitation"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
