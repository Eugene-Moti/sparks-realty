"use client";

import { ArrowLeftIcon, FloppyDiskIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormSection } from "@/components/admin/form-fields";
import { ImageUpload } from "@/components/admin/image-upload";
import { PageHeader, Switch } from "@/components/admin/ui";
import { useAction } from "@/components/admin/use-action";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { updateProfile } from "@/lib/admin/actions/team";
import { roleDescriptions, roleLabels, STAFF_ROLES, type StaffRole } from "@/lib/admin/roles";
import type { ProfileRow } from "@/types/db";

export function ProfileEditor({ profile, isSelf, isAdmin }: { profile: ProfileRow; isSelf: boolean; isAdmin: boolean }) {
  const router = useRouter();
  const { pending, run } = useAction();
  const [name, setName] = useState(profile.full_name ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [whatsapp, setWhatsapp] = useState(profile.whatsapp ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [avatar, setAvatar] = useState<string | null>(profile.avatar_url);
  const [isPublic, setIsPublic] = useState(profile.is_public);
  const [role, setRole] = useState<StaffRole>(profile.role);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  async function save() {
    await run(
      () =>
        updateProfile(profile.id, {
          full_name: name,
          phone,
          whatsapp,
          bio,
          avatar_url: avatar,
          is_public: isPublic,
          ...(isAdmin ? { role } : {}),
        }),
      {
        success: "Profile saved.",
        onSuccess: () => {
          setErrors({});
          router.refresh();
        },
        onError: (r) => setErrors(Object.fromEntries(Object.entries(r.fieldErrors ?? {}).map(([k, v]) => [k, v?.[0]]))),
      },
    );
  }

  return (
    <>
      <Link href="/admin/team" className="inline-flex w-fit items-center gap-1.5 text-muted text-sm hover:text-foreground">
        <ArrowLeftIcon /> Team
      </Link>
      <PageHeader
        eyebrow={isSelf ? "Your profile" : "Team member"}
        title={name || "Profile"}
        description="Your photo, phone and WhatsApp appear on the listings you're assigned to."
        actions={
          <Button variant="green-solid" onClick={() => void save()} disabled={pending}>
            <FloppyDiskIcon /> {pending ? "Saving…" : "Save"}
          </Button>
        }
      />

      <FormSection title="Photo" description="A friendly, well-lit head-and-shoulders photo. You'll crop it to a circle.">
        <ImageUpload value={avatar} onChange={setAvatar} folder="team" label="Agent photo" square hint="Saved as an 800×800 WebP." />
      </FormSection>

      <FormSection title="Details" description="Phone numbers in international format.">
        <Field label="Full name" required error={errors.full_name}>
          {(ids) => <Input {...ids} value={name} onChange={(e) => setName(e.target.value)} className="h-11 text-sm" />}
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" hint="e.g. +254712345678" error={errors.phone}>
            {(ids) => <Input {...ids} type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="h-11 font-mono text-sm" />}
          </Field>
          <Field label="WhatsApp" hint="Leave blank to use the phone number" error={errors.whatsapp}>
            {(ids) => <Input {...ids} type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="h-11 font-mono text-sm" />}
          </Field>
        </div>
        <Field label="Short bio" hint={`${bio.length}/800 · areas you know, languages, what clients love about you`} error={errors.bio}>
          {(ids) => <Textarea {...ids} rows={4} value={bio} onChange={(e) => setBio(e.target.value)} className="text-sm" />}
        </Field>
        <Switch
          checked={isPublic}
          onCheckedChange={setIsPublic}
          label="Show on “Our Team”"
          description="Lists this person on the website with their photo and bio."
        />
      </FormSection>

      {isAdmin ? (
        <FormSection title="Role" description="Controls what they can see and change in the admin.">
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
          {isSelf && role !== "admin" ? (
            <p role="alert" className="text-danger text-sm">
              You&apos;re removing your own admin access. You won&apos;t be able to undo this yourself.
            </p>
          ) : null}
        </FormSection>
      ) : null}
    </>
  );
}
