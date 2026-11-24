import type { ComponentPropsWithRef, ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/helpers/classname-helper";

type CheckboxProps = Omit<ComponentPropsWithRef<"input">, "type"> & {
  label: ReactNode;
  description?: ReactNode;
  error?: string;
};

/**
 * Native checkbox (works with react-hook-form `register`) styled to brand,
 * with a large tap target and aria-described errors.
 */
export function Checkbox({ label, description, error, className, id, ...props }: CheckboxProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = description ? `${inputId}-desc` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={inputId} className="group flex cursor-pointer items-start gap-3 text-sm leading-snug">
        <span className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
          <input
            id={inputId}
            type="checkbox"
            aria-describedby={[descId, errorId].filter(Boolean).join(" ") || undefined}
            aria-invalid={error ? true : undefined}
            className={cn(
              "peer size-5 cursor-pointer appearance-none rounded-md border border-foreground/30 bg-surface",
              "transition-colors duration-150 checked:border-green-600 checked:bg-green-600",
              "group-hover:border-foreground/50 aria-invalid:border-danger",
            )}
            {...props}
          />
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="pointer-events-none absolute size-3.5 scale-75 text-ivory opacity-0 transition-[opacity,transform] duration-150 ease-(--ease-out-brand) peer-checked:scale-100 peer-checked:opacity-100"
          >
            <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <span className="text-foreground/90">{label}</span>
      </label>
      {description ? (
        <p id={descId} className="pl-8 text-muted text-xs">
          {description}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="pl-8 font-medium text-danger text-xs">
          {error}
        </p>
      ) : null}
    </div>
  );
}
