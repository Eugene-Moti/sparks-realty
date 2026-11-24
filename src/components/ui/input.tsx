import type { ComponentPropsWithRef, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/helpers/classname-helper";

export const controlClassName = cn(
  "w-full rounded-(--radius-control) border border-border bg-surface px-4 text-[0.95rem] text-foreground",
  "placeholder:text-muted/80 shadow-[inset_0_1px_0_rgb(255_255_255/0.03)]",
  "transition-[border-color,box-shadow] duration-200 ease-(--ease-out-brand)",
  "hover:border-foreground/25 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
  "disabled:cursor-not-allowed disabled:opacity-60",
  "aria-invalid:border-danger aria-invalid:focus-visible:ring-danger/25",
);

export function Input({ className, type = "text", ...props }: ComponentPropsWithRef<"input">) {
  return <input type={type} className={cn(controlClassName, "h-12", className)} {...props} />;
}

export function Textarea({ className, rows = 4, ...props }: ComponentPropsWithRef<"textarea">) {
  return (
    <textarea
      rows={rows}
      className={cn(controlClassName, "min-h-28 resize-y py-3 leading-relaxed", className)}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentPropsWithRef<"label">) {
  return <label className={cn("font-medium text-foreground text-sm", className)} {...props} />;
}

type FieldProps = {
  label: ReactNode;
  /** Render prop receives the ids to wire up the control accessibly. */
  children: (ids: {
    id: string;
    "aria-describedby"?: string;
    "aria-invalid"?: true;
  }) => ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
};

/** Label + control + hint/error with correct aria wiring. */
export function Field({ label, children, hint, error, required, className }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>
        {label}
        {required ? (
          <span aria-hidden="true" className="ml-0.5 text-accent">
            *
          </span>
        ) : null}
      </Label>
      {children({
        id,
        "aria-describedby": describedBy,
        ...(error ? { "aria-invalid": true as const } : {}),
      })}
      {hint ? (
        <p id={hintId} className="text-muted text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="font-medium text-danger text-xs" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
