import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/helpers/classname-helper";
import { controlClassName } from "./input";

export type SelectOption = { value: string; label: string; disabled?: boolean };

type SelectProps = ComponentPropsWithRef<"select"> & {
  options?: readonly SelectOption[];
  placeholder?: string;
  /** Borderless, transparent variant for use inside a styled field (hero search). */
  bare?: boolean;
};

/**
 * Native select styled to brand: best on phones (OS picker), fully accessible,
 * works with react-hook-form `register` and plain forms.
 */
export function Select({ className, options, placeholder, bare, children, ...props }: SelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        className={cn(
          bare
            ? "h-10 w-full cursor-pointer appearance-none bg-transparent pr-8 text-[0.95rem] text-current outline-none [&>option]:bg-ink-2 [&>option]:text-ivory"
            : cn(controlClassName, "h-12 cursor-pointer appearance-none pr-11"),
        )}
        {...props}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options?.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
        {children}
      </select>
      <CaretDownIcon
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 size-4 -translate-y-1/2",
          bare ? "right-0 text-current/60" : "right-4 text-muted",
        )}
        weight="bold"
      />
    </div>
  );
}
