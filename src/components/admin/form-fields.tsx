"use client";

import type { ComponentProps, ReactNode } from "react";
import { Controller, type FieldValues, type Path, useFormContext, useWatch } from "react-hook-form";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select, type SelectOption } from "@/components/ui/select";
import { Chip, ToggleGroup } from "@/components/ui/toggle-group";
import { cn } from "@/helpers/classname-helper";
import { Switch } from "./ui";

type Common<T extends FieldValues> = {
  name: Path<T>;
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  className?: string;
};

function useFieldError<T extends FieldValues>(name: Path<T>): string | undefined {
  const { formState } = useFormContext<T>();
  const parts = String(name).split(".");
  let node: unknown = formState.errors;
  for (const p of parts) node = (node as Record<string, unknown> | undefined)?.[p];
  return (node as { message?: string } | undefined)?.message;
}

export function TextField<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  className,
  ...input
}: Common<T> & Omit<ComponentProps<"input">, "name">) {
  const { register } = useFormContext<T>();
  const error = useFieldError<T>(name);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(ids) => <Input {...ids} {...input} {...register(name)} className="h-11 text-sm" />}
    </Field>
  );
}

const kes = new Intl.NumberFormat("en-KE", { maximumFractionDigits: 2 });

/** Number input that shows the amount formatted underneath ("KES 35,000,000"). */
export function AmountField<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  className,
  prefix = "KES",
  placeholder,
}: Common<T> & { prefix?: string; placeholder?: string }) {
  const { register, control } = useFormContext<T>();
  const value = useWatch({ control, name });
  const error = useFieldError<T>(name);
  const n = Number(String(value ?? "").replace(/[,\s]/g, ""));
  const formatted = value && Number.isFinite(n) ? `${prefix} ${kes.format(n)}` : null;
  return (
    <Field label={label} hint={formatted ?? hint} error={error} required={required} className={className}>
      {(ids) => (
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 font-mono text-muted text-xs">{prefix}</span>
          <Input {...ids} inputMode="decimal" placeholder={placeholder} {...register(name)} className="h-11 pl-14 font-mono text-sm" />
        </div>
      )}
    </Field>
  );
}

export function TextAreaField<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  className,
  rows = 4,
  placeholder,
  maxLength,
}: Common<T> & { rows?: number; placeholder?: string; maxLength?: number }) {
  const { register, control } = useFormContext<T>();
  const value = useWatch({ control, name }) as string | undefined;
  const error = useFieldError<T>(name);
  const counter = maxLength ? (
    <span className={cn((value?.length ?? 0) > maxLength && "text-danger")}>
      {value?.length ?? 0} / {maxLength}
    </span>
  ) : null;
  return (
    <Field
      label={label}
      hint={
        hint || counter ? (
          <span className="flex justify-between gap-3">
            <span>{hint}</span>
            {counter}
          </span>
        ) : undefined
      }
      error={error}
      required={required}
      className={className}
    >
      {(ids) => <Textarea {...ids} rows={rows} placeholder={placeholder} {...register(name)} className="text-sm" />}
    </Field>
  );
}

export function SelectField<T extends FieldValues>({
  name,
  label,
  hint,
  required,
  className,
  options,
  placeholder,
}: Common<T> & { options: readonly SelectOption[]; placeholder?: string }) {
  const { register } = useFormContext<T>();
  const error = useFieldError<T>(name);
  return (
    <Field label={label} hint={hint} error={error} required={required} className={className}>
      {(ids) => (
        <Select
          {...ids}
          {...register(name)}
          options={options}
          placeholder={placeholder}
          className="[&_select]:h-11 [&_select]:text-sm"
        />
      )}
    </Field>
  );
}

export function SwitchField<T extends FieldValues>({ name, label, hint }: Omit<Common<T>, "required">) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} label={label} description={hint} />}
    />
  );
}

/** Multi-select as chips (amenities, tags). Unknown existing values are kept and shown. */
export function ChipsField<T extends FieldValues>({
  name,
  label,
  hint,
  options,
}: Omit<Common<T>, "required"> & { options: readonly { value: string; label: string }[] }) {
  const { control } = useFormContext<T>();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const value = (field.value as string[]) ?? [];
        const extra = value.filter((v) => !options.some((o) => o.value === v)).map((v) => ({ value: v, label: v.replace(/_/g, " ") }));
        return (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 font-medium text-sm">{label}</legend>
            {hint ? <p className="-mt-2 text-muted text-xs">{hint}</p> : null}
            <ToggleGroup type="multiple" value={value} onValueChange={field.onChange} aria-label={typeof label === "string" ? label : undefined}>
              {[...options, ...extra].map((o) => (
                <Chip key={o.value} value={o.value} className="h-9 text-sm">
                  {o.label}
                </Chip>
              ))}
            </ToggleGroup>
          </fieldset>
        );
      }}
    />
  );
}

export function FormSection({ title, description, children, className }: { title: string; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-6 rounded-(--radius-card) border border-hairline bg-surface p-5 shadow-soft sm:p-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10", className)}>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-xl">{title}</h2>
        {description ? <p className="text-muted text-sm leading-relaxed">{description}</p> : null}
      </div>
      <div className="flex min-w-0 flex-col gap-5">{children}</div>
    </section>
  );
}
